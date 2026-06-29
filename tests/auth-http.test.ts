import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Request, Response } from 'express';

import { AuthConfig } from '../src/modules/auth/config/auth.config';
import { AuthController } from '../src/modules/auth/controllers/AuthController';
import { User } from '../src/modules/auth/domain/User';
import { createRequireAuthMiddleware } from '../src/modules/auth/middleware/requireAuth';
import { InMemoryRefreshSessionRepository } from '../src/modules/auth/repositories/InMemoryRefreshSessionRepository';
import { InMemoryUserRepository } from '../src/modules/auth/repositories/InMemoryUserRepository';
import { AuthCookieService } from '../src/modules/auth/services/AuthCookieService';
import { AuthService } from '../src/modules/auth/services/AuthService';
import { AuthTokenService } from '../src/modules/auth/services/AuthTokenService';
import { PasswordService } from '../src/modules/auth/services/PasswordService';
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
    adminEmail: null,
    adminPassword: null,
};

describe('Auth HTTP behavior', () => {
    let userRepository: InMemoryUserRepository;
    let refreshSessionRepository: InMemoryRefreshSessionRepository;
    let passwordService: PasswordService;
    let authTokenService: AuthTokenService;
    let authService: AuthService;
    let authCookieService: AuthCookieService;
    let authController: AuthController;

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
        authCookieService = new AuthCookieService(authConfig);
        authController = new AuthController(authService, authCookieService, authConfig);
    });

    it('rejects missing access cookies in auth middleware', async () => {
        const middleware = createRequireAuthMiddleware(
            authConfig.accessTokenCookieName,
            authTokenService,
            userRepository,
        );
        const next = vi.fn();
        const req = { cookies: {} } as Request;

        await middleware(req, {} as Response, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
    });

    it('accepts a valid access cookie and attaches auth context', async () => {
        const user = await seedAdminUser();
        const middleware = createRequireAuthMiddleware(
            authConfig.accessTokenCookieName,
            authTokenService,
            userRepository,
        );
        const accessToken = authTokenService.signAccessToken({
            userId: user.id,
            role: user.role,
            sessionId: 'session-1',
        });
        const req = {
            cookies: {
                [authConfig.accessTokenCookieName]: accessToken,
            },
        } as Request;
        const next = vi.fn();

        await middleware(req, {} as Response, next);

        expect(next).toHaveBeenCalledWith();
        expect(req.auth).toEqual({
            userId: user.id,
            role: 'ADMIN',
            sessionId: 'session-1',
        });
    });

    it('sets auth cookies with the expected flags on login and refresh', async () => {
        const user = await seedAdminUser();
        const loginResponse = createMockResponse();

        await authController.login({
            body: {
                email: user.email,
                password: 'super-secret-password',
            },
            get: vi.fn().mockReturnValue('vitest'),
            ip: '127.0.0.1',
        } as unknown as Request, loginResponse as unknown as Response);

        expect(loginResponse.cookie).toHaveBeenCalledTimes(2);
        expect(loginResponse.cookie.mock.calls[0][0]).toBe('access_token');
        expect(loginResponse.cookie.mock.calls[0][2]).toMatchObject({
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            path: '/',
            maxAge: 5 * 60 * 1000,
        });
        expect(loginResponse.cookie.mock.calls[1][0]).toBe('refresh_token');
        expect(loginResponse.cookie.mock.calls[1][2]).toMatchObject({
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            path: '/api/auth',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        const refreshResponse = createMockResponse();
        await authController.refresh({
            cookies: {
                refresh_token: loginResponse.cookie.mock.calls[1][1],
            },
            get: vi.fn().mockReturnValue('vitest'),
            ip: '127.0.0.1',
        } as unknown as Request, refreshResponse as unknown as Response);

        expect(refreshResponse.cookie).toHaveBeenCalledTimes(2);
        expect(refreshResponse.cookie.mock.calls[0][2]).toMatchObject({
            path: '/',
            httpOnly: true,
        });
        expect(refreshResponse.cookie.mock.calls[1][2]).toMatchObject({
            path: '/api/auth',
            httpOnly: true,
        });
    });

    it('clears auth cookies on logout', async () => {
        const user = await seedAdminUser();
        const loginResult = await authService.login({
            email: user.email,
            password: 'super-secret-password',
        });
        const response = createMockResponse();

        await authController.logout({
            cookies: {
                refresh_token: loginResult.refreshToken,
            },
            auth: {
                userId: user.id,
                role: 'ADMIN',
                sessionId: 'session-1',
            },
        } as unknown as Request, response as unknown as Response);

        expect(response.clearCookie).toHaveBeenCalledTimes(2);
        expect(response.clearCookie.mock.calls[0]).toEqual([
            'access_token',
            expect.objectContaining({ path: '/', httpOnly: true }),
        ]);
        expect(response.clearCookie.mock.calls[1]).toEqual([
            'refresh_token',
            expect.objectContaining({ path: '/api/auth', httpOnly: true }),
        ]);
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

const createMockResponse = () => {
    const response = {
        cookie: vi.fn(),
        clearCookie: vi.fn(),
        status: vi.fn(),
        json: vi.fn(),
    };

    response.status.mockReturnValue(response);
    response.json.mockReturnValue(response);

    return response;
};
