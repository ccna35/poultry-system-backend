import { nowIso } from '../../../shared/utils/date';
import { generateId } from '../../../shared/utils/id';
import { UnauthorizedError } from '../../../shared/errors/UnauthorizedError';
import { ValidationError } from '../../../shared/errors/ValidationError';
import { User, PublicUser, toPublicUser } from '../domain/User';
import { RefreshSession } from '../domain/RefreshSession';
import { AuthConfig } from '../config/auth.config';
import { RefreshSessionRepository } from '../repositories/RefreshSessionRepository';
import { UserRepository } from '../repositories/UserRepository';
import { hashToken } from '../utils/hashToken';
import { AuthTokenService } from './AuthTokenService';
import { PasswordService } from './PasswordService';

export type LoginInput = {
    email: string;
    password: string;
    userAgent?: string | null;
    ipAddress?: string | null;
};

export type RefreshInput = {
    refreshToken: string;
    userAgent?: string | null;
    ipAddress?: string | null;
};

export type LogoutInput = {
    refreshToken?: string | null;
};

export type AuthResult = {
    user: PublicUser;
    accessToken: string;
    refreshToken: string;
};

type AuthServiceDependencies = {
    authConfig: AuthConfig;
    userRepository: UserRepository;
    refreshSessionRepository: RefreshSessionRepository;
    authTokenService: AuthTokenService;
    passwordService: PasswordService;
};

export class AuthService {
    private readonly authConfig: AuthConfig;
    private readonly userRepository: UserRepository;
    private readonly refreshSessionRepository: RefreshSessionRepository;
    private readonly authTokenService: AuthTokenService;
    private readonly passwordService: PasswordService;

    constructor({
        authConfig,
        userRepository,
        refreshSessionRepository,
        authTokenService,
        passwordService,
    }: AuthServiceDependencies) {
        this.authConfig = authConfig;
        this.userRepository = userRepository;
        this.refreshSessionRepository = refreshSessionRepository;
        this.authTokenService = authTokenService;
        this.passwordService = passwordService;
    }

    async bootstrapAdmin(): Promise<void> {
        const existingUsersCount = await this.userRepository.count();
        if (existingUsersCount > 0) {
            return;
        }

        if (!this.authConfig.adminEmail && !this.authConfig.adminPassword) {
            console.warn('No admin bootstrap credentials found. Skipping initial admin creation.');
            return;
        }

        if (!this.authConfig.adminEmail || !this.authConfig.adminPassword) {
            throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must both be provided to bootstrap the initial admin');
        }

        const timestamp = nowIso();
        const user: User = {
            id: generateId(),
            email: normalizeEmail(this.authConfig.adminEmail),
            passwordHash: await this.passwordService.hash(this.authConfig.adminPassword),
            role: 'ADMIN',
            passwordChangedAt: timestamp,
            lastLoginAt: null,
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        await this.userRepository.create(user);
    }

    async login(input: LoginInput): Promise<AuthResult> {
        const email = normalizeEmail(input.email);
        const user = await this.userRepository.findByEmail(email);

        if (!user) {
            throw new UnauthorizedError('Invalid email or password');
        }

        const isPasswordValid = await this.passwordService.verify(
            input.password,
            user.passwordHash,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedError('Invalid email or password');
        }

        const updatedUser = await this.markUserAsActive(user);
        const tokens = await this.issueSession(updatedUser, {
            userAgent: input.userAgent,
            ipAddress: input.ipAddress,
        });

        return {
            user: toPublicUser(updatedUser),
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    }

    async refresh(input: RefreshInput): Promise<AuthResult> {
        const payload = this.authTokenService.verifyRefreshToken(input.refreshToken);
        const session = await this.refreshSessionRepository.findById(payload.sessionId);
        const providedTokenHash = hashToken(input.refreshToken);
        const timestamp = nowIso();

        if (!session || session.userId !== payload.sub || session.familyId !== payload.familyId) {
            await this.refreshSessionRepository.revokeFamily(payload.sub, payload.familyId, timestamp);
            throw new UnauthorizedError('Refresh token reuse detected');
        }

        if (
            session.revokedAt
            || session.replacedBySessionId
            || session.tokenHash !== providedTokenHash
        ) {
            await this.refreshSessionRepository.revokeFamily(payload.sub, payload.familyId, timestamp);
            throw new UnauthorizedError('Refresh token reuse detected');
        }

        if (isExpired(session.expiresAt, timestamp)) {
            await this.refreshSessionRepository.revoke(session.id, timestamp);
            throw new UnauthorizedError('Refresh token expired');
        }

        const user = await this.userRepository.findById(payload.sub);
        if (!user) {
            await this.refreshSessionRepository.revokeFamily(payload.sub, payload.familyId, timestamp);
            throw new UnauthorizedError('Authenticated user not found');
        }

        const updatedUser = await this.markUserAsActive(user);
        const newTokens = await this.issueSession(updatedUser, {
            familyId: session.familyId,
            userAgent: input.userAgent,
            ipAddress: input.ipAddress,
        });

        await this.refreshSessionRepository.revoke(
            session.id,
            timestamp,
            newTokens.sessionId,
        );

        return {
            user: toPublicUser(updatedUser),
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
        };
    }

    async logout({ refreshToken }: LogoutInput): Promise<void> {
        if (!refreshToken) {
            return;
        }

        try {
            const payload = this.authTokenService.verifyRefreshToken(refreshToken);
            await this.refreshSessionRepository.revoke(payload.sessionId, nowIso());
        } catch (error) {
            if (error instanceof UnauthorizedError) {
                return;
            }

            throw error;
        }
    }

    async getAuthenticatedUser(userId: string): Promise<PublicUser> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new UnauthorizedError('Authenticated user not found');
        }

        return toPublicUser(user);
    }

    async revokeAllSessionsForUser(userId: string): Promise<void> {
        await this.refreshSessionRepository.revokeAllForUser(userId, nowIso());
    }

    private async markUserAsActive(user: User): Promise<User> {
        const timestamp = nowIso();
        return this.userRepository.update({
            ...user,
            lastLoginAt: timestamp,
            updatedAt: timestamp,
        });
    }

    private async issueSession(
        user: User,
        options: {
            familyId?: string;
            userAgent?: string | null;
            ipAddress?: string | null;
        },
    ): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> {
        const sessionId = generateId();
        const familyId = options.familyId ?? generateId();
        const timestamp = nowIso();
        const refreshToken = this.authTokenService.signRefreshToken({
            userId: user.id,
            role: user.role,
            sessionId,
            familyId,
        });

        const session: RefreshSession = {
            id: sessionId,
            userId: user.id,
            familyId,
            tokenHash: hashToken(refreshToken),
            expiresAt: addDays(timestamp, this.authConfig.refreshTokenTtlDays),
            revokedAt: null,
            replacedBySessionId: null,
            lastUsedAt: timestamp,
            userAgent: options.userAgent ?? null,
            ipAddress: options.ipAddress ?? null,
            createdAt: timestamp,
        };

        await this.refreshSessionRepository.create(session);

        return {
            sessionId,
            accessToken: this.authTokenService.signAccessToken({
                userId: user.id,
                role: user.role,
                sessionId,
            }),
            refreshToken,
        };
    }
}

const normalizeEmail = (email: string): string => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
        throw new ValidationError('Email is required');
    }

    return normalized;
};

const addDays = (timestamp: string, days: number): string => {
    const date = new Date(timestamp);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString();
};

const isExpired = (expiresAt: string, currentTimestamp: string): boolean => {
    return new Date(expiresAt).getTime() <= new Date(currentTimestamp).getTime();
};
