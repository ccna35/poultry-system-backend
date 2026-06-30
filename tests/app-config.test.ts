import { describe, expect, it } from 'vitest';

import { loadAppConfig } from '../src/shared/config/app.config';

const createValidEnv = (): NodeJS.ProcessEnv => ({
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/poultry',
    JWT_ACCESS_SECRET: 'access-secret',
    JWT_REFRESH_SECRET: 'refresh-secret',
});

describe('loadAppConfig', () => {
    it('accepts valid env and applies defaults', () => {
        const config = loadAppConfig(createValidEnv());

        expect(config.server.port).toBe(3000);
        expect(config.server.trustProxy).toBe(false);
        expect(config.logging.environment).toBe('development');
        expect(config.logging.level).toBe('info');
        expect(config.cors.allowedOrigins).toEqual(['http://localhost:5173']);
        expect(config.auth.accessTokenTtlMinutes).toBe(5);
        expect(config.auth.refreshTokenTtlDays).toBe(7);
        expect(config.auth.accessTokenCookieName).toBe('access_token');
        expect(config.auth.refreshTokenCookieName).toBe('refresh_token');
        expect(config.auth.cookieSecure).toBe(false);
        expect(config.auth.cookieSameSite).toBe('lax');
    });

    it('rejects missing DATABASE_URL', () => {
        const env = createValidEnv();
        delete env.DATABASE_URL;

        expect(() => loadAppConfig(env)).toThrow(/DATABASE_URL/);
    });

    it('rejects missing JWT_ACCESS_SECRET', () => {
        const env = createValidEnv();
        delete env.JWT_ACCESS_SECRET;

        expect(() => loadAppConfig(env)).toThrow(/JWT_ACCESS_SECRET/);
    });

    it('rejects missing JWT_REFRESH_SECRET', () => {
        const env = createValidEnv();
        delete env.JWT_REFRESH_SECRET;

        expect(() => loadAppConfig(env)).toThrow(/JWT_REFRESH_SECRET/);
    });

    it('rejects invalid PORT values', () => {
        expect(() => loadAppConfig({
            ...createValidEnv(),
            PORT: 'invalid',
        })).toThrow(/PORT/);
    });

    it('rejects invalid CORS origins', () => {
        expect(() => loadAppConfig({
            ...createValidEnv(),
            CORS_ALLOWED_ORIGINS: 'not-a-url',
        })).toThrow(/CORS origin/);
    });

    it('rejects invalid booleans', () => {
        expect(() => loadAppConfig({
            ...createValidEnv(),
            TRUST_PROXY: 'maybe',
        })).toThrow(/TRUST_PROXY/);
    });

    it('rejects invalid same-site values', () => {
        expect(() => loadAppConfig({
            ...createValidEnv(),
            AUTH_COOKIE_SAME_SITE: 'sideways',
        })).toThrow(/AUTH_COOKIE_SAME_SITE/);
    });

    it('rejects same-site none without secure cookies', () => {
        expect(() => loadAppConfig({
            ...createValidEnv(),
            AUTH_COOKIE_SAME_SITE: 'none',
            AUTH_COOKIE_SECURE: 'false',
        })).toThrow(/AUTH_COOKIE_SECURE must be true/);
    });

    it('parses provided port and cors origins', () => {
        const config = loadAppConfig({
            ...createValidEnv(),
            PORT: '4100',
            CORS_ALLOWED_ORIGINS: 'http://localhost:5173, https://farm.example.com',
        });

        expect(config.server.port).toBe(4100);
        expect(config.cors.allowedOrigins).toEqual([
            'http://localhost:5173',
            'https://farm.example.com',
        ]);
    });
});
