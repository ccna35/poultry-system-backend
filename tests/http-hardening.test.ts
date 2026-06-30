import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';

import { Router } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../src/app';
import { AppConfig } from '../src/shared/config/app.config';
import { errorHandler } from '../src/shared/http/errorHandler';
import { serializeRequestForLog } from '../src/shared/http/requestLogger';

const createTestConfig = (): AppConfig => ({
    server: {
        port: 3000,
        trustProxy: false,
    },
    logging: {
        environment: 'test',
        level: 'info',
    },
    database: {
        url: 'postgresql://postgres:postgres@localhost:5432/poultry',
    },
    cors: {
        allowedOrigins: ['http://localhost:5173'],
    },
    security: {
        rateLimit: {
            global: {
                windowMs: 60_000,
                max: 1,
            },
            auth: {
                windowMs: 60_000,
                max: 1,
            },
        },
    },
    auth: {
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
    },
});

const createTestRouter = (): Router => {
    const router = Router();

    router.post('/auth/login', (_req, res) => {
        res.status(200).json({ success: true, data: { ok: true } });
    });

    router.get('/cycles', (_req, res) => {
        res.status(200).json({ success: true, data: [] });
    });

    router.get('/log-check', (req, res) => {
        res.status(200).json({
            success: true,
            data: {
                hasLog: Boolean(req.log),
                requestId: req.id,
            },
        });
    });

    router.get('/boom', () => {
        throw new Error('boom');
    });

    return router;
};

const createTestApp = async (config: AppConfig) => {
    return createApp(
        config,
        async () => ({
            apiRouter: createTestRouter(),
            dispose: async () => undefined,
        }),
    );
};

const startServer = async (config: AppConfig): Promise<{ baseUrl: string; close: () => Promise<void> }> => {
    const appInstance = await createTestApp(config);
    const server = createServer(appInstance.app);

    await new Promise<void>((resolve) => {
        server.listen(0, '127.0.0.1', resolve);
    });

    const address = server.address() as AddressInfo;

    return {
        baseUrl: `http://127.0.0.1:${address.port}`,
        close: () => closeServer(server),
    };
};

const closeServer = async (server: Server): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
};

describe('HTTP hardening', () => {
    const closers: Array<() => Promise<void>> = [];

    afterEach(async () => {
        while (closers.length > 0) {
            const close = closers.pop();
            if (close) {
                await close();
            }
        }
    });

    it('does not rate limit /health', async () => {
        const server = await startServer(createTestConfig());
        closers.push(server.close);

        const responses = await Promise.all([
            fetch(`${server.baseUrl}/health`),
            fetch(`${server.baseUrl}/health`),
            fetch(`${server.baseUrl}/health`),
        ]);

        expect(responses.map((response) => response.status)).toEqual([200, 200, 200]);
    });

    it('rate limits non-auth API routes with the global limiter', async () => {
        const server = await startServer(createTestConfig());
        closers.push(server.close);

        const firstResponse = await fetch(`${server.baseUrl}/api/cycles`);
        const secondResponse = await fetch(`${server.baseUrl}/api/cycles`);

        expect(firstResponse.status).toBe(200);
        expect(secondResponse.status).toBe(429);
        await expect(secondResponse.json()).resolves.toMatchObject({
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
            },
        });
    });

    it('uses the stricter auth limiter for /api/auth routes', async () => {
        const config = createTestConfig();
        config.security.rateLimit.global.max = 5;
        config.security.rateLimit.auth.max = 1;

        const server = await startServer(config);
        closers.push(server.close);

        const firstResponse = await fetch(`${server.baseUrl}/api/auth/login`, {
            method: 'POST',
        });
        const secondResponse = await fetch(`${server.baseUrl}/api/auth/login`, {
            method: 'POST',
        });

        expect(firstResponse.status).toBe(200);
        expect(secondResponse.status).toBe(429);
    });

    it('allows configured cors origins and rejects others', async () => {
        const server = await startServer(createTestConfig());
        closers.push(server.close);

        const allowedResponse = await fetch(`${server.baseUrl}/health`, {
            headers: {
                Origin: 'http://localhost:5173',
            },
        });
        const blockedResponse = await fetch(`${server.baseUrl}/health`, {
            headers: {
                Origin: 'http://malicious.example.com',
            },
        });

        expect(allowedResponse.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
        expect(allowedResponse.headers.get('access-control-allow-credentials')).toBe('true');
        expect(blockedResponse.status).toBe(403);
        await expect(blockedResponse.json()).resolves.toMatchObject({
            success: false,
            error: {
                code: 'FORBIDDEN',
            },
        });
    });

    it('attaches the request logger and exposes a request id', async () => {
        const server = await startServer(createTestConfig());
        closers.push(server.close);

        const response = await fetch(`${server.baseUrl}/api/log-check`);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.data.hasLog).toBe(true);
        expect(body.data.requestId).toBeTruthy();
        expect(response.headers.get('x-request-id')).toBeTruthy();
    });

    it('logs errors via req.log and preserves the error payload shape', () => {
        const request = {
            log: {
                error: vi.fn(),
            },
        } as any;
        const response = createMockResponse();

        errorHandler(new Error('boom'), request, response as any, vi.fn());

        expect(request.log.error).toHaveBeenCalledTimes(1);
        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.json).toHaveBeenCalledWith({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occurred',
            },
        });
    });

    it('does not serialize sensitive request headers or cookies', () => {
        const serialized = serializeRequestForLog({
            id: 'request-1',
            method: 'GET',
            originalUrl: '/api/log-check',
            url: '/api/log-check',
            headers: {
                authorization: 'Bearer token',
                cookie: 'access_token=secret',
            },
            cookies: {
                access_token: 'secret',
            },
        } as any);

        expect(serialized).toEqual({
            id: 'request-1',
            method: 'GET',
            url: '/api/log-check',
        });
        expect(serialized).not.toHaveProperty('headers');
        expect(serialized).not.toHaveProperty('cookies');
    });
});

const createMockResponse = () => {
    const response = {
        status: vi.fn(),
        json: vi.fn(),
    };

    response.status.mockReturnValue(response);
    response.json.mockReturnValue(response);

    return response;
};
