import { beforeEach, describe, expect, it } from 'vitest';

import { AuthConfig } from '../src/modules/auth/config/auth.config';
import { InMemoryRefreshSessionRepository } from '../src/modules/auth/repositories/InMemoryRefreshSessionRepository';
import { InMemoryUserRepository } from '../src/modules/auth/repositories/InMemoryUserRepository';
import { AuthService } from '../src/modules/auth/services/AuthService';
import { AuthTokenService } from '../src/modules/auth/services/AuthTokenService';
import { PasswordService } from '../src/modules/auth/services/PasswordService';
import { User } from '../src/modules/auth/domain/User';
import { UnauthorizedError } from '../src/shared/errors/UnauthorizedError';
import { nowIso } from '../src/shared/utils/date';
import { generateId } from '../src/shared/utils/id';

const authConfig: AuthConfig = {
    accessTokenSecret: 'access-secret',
    refreshTokenSecret: 'refresh-secret',
    accessTokenTtlMinutes: 5,
    refreshTokenTtlDays: 7,
    accessTokenCookieName: 'access_token',
    refreshTokenCookieName: 'refresh_token',
    cookieSecure: false,
    cookieSameSite: 'lax',
    cookieDomain: null,
    adminEmail: 'admin@example.com',
    adminPassword: 'super-secret-password',
};

describe('AuthService', () => {
    let userRepository: InMemoryUserRepository;
    let refreshSessionRepository: InMemoryRefreshSessionRepository;
    let passwordService: PasswordService;
    let authTokenService: AuthTokenService;
    let authService: AuthService;

    beforeEach(() => {
        userRepository = new InMemoryUserRepository();
        refreshSessionRepository = new InMemoryRefreshSessionRepository();
        passwordService = new PasswordService();
        authTokenService = new AuthTokenService(authConfig);
        authService = new AuthService({
            authConfig,
            userRepository,
            refreshSessionRepository,
            authTokenService,
            passwordService,
        });
    });

    it('logs in with valid credentials and rejects invalid credentials', async () => {
        const adminUser = await seedAdminUser();

        const result = await authService.login({
            email: adminUser.email,
            password: 'super-secret-password',
        });

        expect(result.user.email).toBe(adminUser.email);
        expect(result.accessToken).toBeTruthy();
        expect(result.refreshToken).toBeTruthy();

        await expect(
            authService.login({
                email: adminUser.email,
                password: 'wrong-password',
            }),
        ).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it('rotates refresh tokens and revokes the whole family on token reuse', async () => {
        const adminUser = await seedAdminUser();
        const loginResult = await authService.login({
            email: adminUser.email,
            password: 'super-secret-password',
        });
        const firstRefreshPayload = authTokenService.verifyRefreshToken(loginResult.refreshToken);

        const refreshResult = await authService.refresh({
            refreshToken: loginResult.refreshToken,
        });
        const secondRefreshPayload = authTokenService.verifyRefreshToken(refreshResult.refreshToken);

        expect(secondRefreshPayload.sessionId).not.toBe(firstRefreshPayload.sessionId);

        const firstSession = await refreshSessionRepository.findById(firstRefreshPayload.sessionId);
        const secondSession = await refreshSessionRepository.findById(secondRefreshPayload.sessionId);

        expect(firstSession?.revokedAt).not.toBeNull();
        expect(firstSession?.replacedBySessionId).toBe(secondRefreshPayload.sessionId);
        expect(secondSession?.revokedAt).toBeNull();

        await expect(
            authService.refresh({
                refreshToken: loginResult.refreshToken,
            }),
        ).rejects.toBeInstanceOf(UnauthorizedError);

        const rotatedSessionAfterReuse = await refreshSessionRepository.findById(secondRefreshPayload.sessionId);
        expect(rotatedSessionAfterReuse?.revokedAt).not.toBeNull();
    });

    it('revokes the active refresh session on logout', async () => {
        const adminUser = await seedAdminUser();
        const loginResult = await authService.login({
            email: adminUser.email,
            password: 'super-secret-password',
        });
        const refreshPayload = authTokenService.verifyRefreshToken(loginResult.refreshToken);

        await authService.logout({
            refreshToken: loginResult.refreshToken,
        });

        const session = await refreshSessionRepository.findById(refreshPayload.sessionId);
        expect(session?.revokedAt).not.toBeNull();
    });

    it('bootstraps the first admin only when the user store is empty', async () => {
        await authService.bootstrapAdmin();
        await authService.bootstrapAdmin();

        expect(await userRepository.count()).toBe(1);

        const bootstrappedUser = await userRepository.findByEmail('admin@example.com');
        expect(bootstrappedUser).not.toBeNull();
        expect(bootstrappedUser?.role).toBe('ADMIN');
    });

    const seedAdminUser = async (): Promise<User> => {
        const timestamp = nowIso();
        const user: User = {
            id: generateId(),
            email: 'admin@example.com',
            passwordHash: await passwordService.hash('super-secret-password'),
            role: 'ADMIN',
            passwordChangedAt: timestamp,
            lastLoginAt: null,
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        return userRepository.create(user);
    };
});
