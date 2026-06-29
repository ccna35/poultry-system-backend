import jwt from 'jsonwebtoken';

import { AuthConfig } from '../config/auth.config';
import { Role } from '../domain/User';
import { UnauthorizedError } from '../../../shared/errors/UnauthorizedError';

export type AccessTokenPayload = {
    sub: string;
    role: Role;
    sessionId: string;
    type: 'access';
    iat: number;
    exp: number;
};

export type RefreshTokenPayload = {
    sub: string;
    role: Role;
    sessionId: string;
    familyId: string;
    type: 'refresh';
    iat: number;
    exp: number;
};

export class AuthTokenService {
    constructor(private readonly config: AuthConfig) { }

    signAccessToken(input: {
        userId: string;
        role: Role;
        sessionId: string;
    }): string {
        return jwt.sign(
            {
                sub: input.userId,
                role: input.role,
                sessionId: input.sessionId,
                type: 'access',
            },
            this.config.accessTokenSecret,
            {
                expiresIn: `${this.config.accessTokenTtlMinutes}m`,
            },
        );
    }

    signRefreshToken(input: {
        userId: string;
        role: Role;
        sessionId: string;
        familyId: string;
    }): string {
        return jwt.sign(
            {
                sub: input.userId,
                role: input.role,
                sessionId: input.sessionId,
                familyId: input.familyId,
                type: 'refresh',
            },
            this.config.refreshTokenSecret,
            {
                expiresIn: `${this.config.refreshTokenTtlDays}d`,
            },
        );
    }

    verifyAccessToken(token: string): AccessTokenPayload {
        return this.verifyToken(token, this.config.accessTokenSecret, 'access');
    }

    verifyRefreshToken(token: string): RefreshTokenPayload {
        return this.verifyToken(token, this.config.refreshTokenSecret, 'refresh');
    }

    private verifyToken(
        token: string,
        secret: string,
        expectedType: 'access',
    ): AccessTokenPayload;
    private verifyToken(
        token: string,
        secret: string,
        expectedType: 'refresh',
    ): RefreshTokenPayload;
    private verifyToken(
        token: string,
        secret: string,
        expectedType: 'access' | 'refresh',
    ): AccessTokenPayload | RefreshTokenPayload {
        try {
            const decoded = jwt.verify(token, secret);
            if (typeof decoded === 'string' || !decoded) {
                throw new UnauthorizedError('Invalid token');
            }

            const role = decoded.role;
            const sessionId = decoded.sessionId;
            const tokenType = decoded.type;
            const subject = decoded.sub;
            const issuedAt = decoded.iat;
            const expiresAt = decoded.exp;

            if (subject === undefined || typeof subject !== 'string') {
                throw new UnauthorizedError('Invalid token subject');
            }

            if (role !== 'ADMIN') {
                throw new UnauthorizedError('Invalid token role');
            }

            if (typeof sessionId !== 'string' || tokenType !== expectedType) {
                throw new UnauthorizedError('Invalid token payload');
            }

            if (typeof issuedAt !== 'number' || typeof expiresAt !== 'number') {
                throw new UnauthorizedError('Invalid token timestamps');
            }

            if (expectedType === 'refresh') {
                const familyId = decoded.familyId;
                if (typeof familyId !== 'string') {
                    throw new UnauthorizedError('Invalid refresh token payload');
                }

                return {
                    sub: subject,
                    role,
                    sessionId,
                    familyId,
                    type: 'refresh',
                    iat: issuedAt,
                    exp: expiresAt,
                };
            }

            return {
                sub: subject,
                role,
                sessionId,
                type: 'access',
                iat: issuedAt,
                exp: expiresAt,
            };
        } catch (error) {
            if (error instanceof UnauthorizedError) {
                throw error;
            }

            const message = expectedType === 'access'
                ? 'Invalid access token'
                : 'Invalid refresh token';

            throw new UnauthorizedError(message);
        }
    }
}
