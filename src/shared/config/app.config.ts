import { z } from 'zod';

import { AuthConfig, CookieSameSite } from '../../modules/auth/config/auth.config';

const DEFAULT_PORT = 3000;
const DEFAULT_TRUST_PROXY = false;
const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173'];
const DEFAULT_ACCESS_TOKEN_TTL_MINUTES = 5;
const DEFAULT_REFRESH_TOKEN_TTL_DAYS = 7;
const DEFAULT_ACCESS_COOKIE_NAME = 'access_token';
const DEFAULT_REFRESH_COOKIE_NAME = 'refresh_token';
const DEFAULT_COOKIE_SAME_SITE: CookieSameSite = 'lax';
const DEFAULT_GLOBAL_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_GLOBAL_RATE_LIMIT_MAX = 300;
const DEFAULT_AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_AUTH_RATE_LIMIT_MAX = 20;
const DEFAULT_NODE_ENV = 'development';
const DEFAULT_LOG_LEVEL: LogLevel = 'info';

const logLevelSchema = z.enum([
    'fatal',
    'error',
    'warn',
    'info',
    'debug',
    'trace',
    'silent',
]);

export type LogLevel = z.infer<typeof logLevelSchema>;

export type RateLimitConfig = {
    windowMs: number;
    max: number;
};

export type AppConfig = {
    server: {
        port: number;
        trustProxy: boolean;
    };
    logging: {
        environment: string;
        level: LogLevel;
    };
    database: {
        url: string;
    };
    cors: {
        allowedOrigins: string[];
    };
    security: {
        rateLimit: {
            global: RateLimitConfig;
            auth: RateLimitConfig;
        };
    };
    auth: AuthConfig;
};

const envSchema = z.object({
    NODE_ENV: z.string().optional(),
    LOG_LEVEL: logLevelSchema.optional(),
    PORT: z.string().optional(),
    TRUST_PROXY: z.string().optional(),
    DATABASE_URL: z.string().trim().min(1, 'DATABASE_URL is required'),
    CORS_ALLOWED_ORIGINS: z.string().optional(),
    JWT_ACCESS_SECRET: z.string().trim().min(1, 'JWT_ACCESS_SECRET is required'),
    JWT_REFRESH_SECRET: z.string().trim().min(1, 'JWT_REFRESH_SECRET is required'),
    ACCESS_TOKEN_TTL_MINUTES: z.string().optional(),
    REFRESH_TOKEN_TTL_DAYS: z.string().optional(),
    AUTH_ACCESS_COOKIE_NAME: z.string().optional(),
    AUTH_REFRESH_COOKIE_NAME: z.string().optional(),
    AUTH_COOKIE_SECURE: z.string().optional(),
    AUTH_COOKIE_SAME_SITE: z.string().optional(),
    AUTH_COOKIE_DOMAIN: z.string().optional(),
    ADMIN_EMAIL: z.string().optional(),
    ADMIN_PASSWORD: z.string().optional(),
    RATE_LIMIT_GLOBAL_WINDOW_MS: z.string().optional(),
    RATE_LIMIT_GLOBAL_MAX: z.string().optional(),
    RATE_LIMIT_AUTH_WINDOW_MS: z.string().optional(),
    RATE_LIMIT_AUTH_MAX: z.string().optional(),
});

export const loadAppConfig = (env: NodeJS.ProcessEnv = process.env): AppConfig => {
    const parsedEnv = envSchema.safeParse(env);
    if (!parsedEnv.success) {
        throw new Error(formatZodError(parsedEnv.error));
    }

    const rawEnv = parsedEnv.data;
    const cookieSameSite = parseCookieSameSite(
        rawEnv.AUTH_COOKIE_SAME_SITE,
        DEFAULT_COOKIE_SAME_SITE,
    );
    const cookieSecure = parseBoolean(
        rawEnv.AUTH_COOKIE_SECURE,
        false,
        'AUTH_COOKIE_SECURE',
    );

    if (cookieSameSite === 'none' && !cookieSecure) {
        throw new Error('AUTH_COOKIE_SECURE must be true when AUTH_COOKIE_SAME_SITE is none');
    }

    return {
        server: {
            port: parsePort(rawEnv.PORT, DEFAULT_PORT),
            trustProxy: parseBoolean(
                rawEnv.TRUST_PROXY,
                DEFAULT_TRUST_PROXY,
                'TRUST_PROXY',
            ),
        },
        logging: {
            environment: normalizeOptional(rawEnv.NODE_ENV) ?? DEFAULT_NODE_ENV,
            level: rawEnv.LOG_LEVEL ?? DEFAULT_LOG_LEVEL,
        },
        database: {
            url: rawEnv.DATABASE_URL,
        },
        cors: {
            allowedOrigins: parseAllowedOrigins(rawEnv.CORS_ALLOWED_ORIGINS),
        },
        security: {
            rateLimit: {
                global: {
                    windowMs: parsePositiveInt(
                        rawEnv.RATE_LIMIT_GLOBAL_WINDOW_MS,
                        DEFAULT_GLOBAL_RATE_LIMIT_WINDOW_MS,
                        'RATE_LIMIT_GLOBAL_WINDOW_MS',
                    ),
                    max: parsePositiveInt(
                        rawEnv.RATE_LIMIT_GLOBAL_MAX,
                        DEFAULT_GLOBAL_RATE_LIMIT_MAX,
                        'RATE_LIMIT_GLOBAL_MAX',
                    ),
                },
                auth: {
                    windowMs: parsePositiveInt(
                        rawEnv.RATE_LIMIT_AUTH_WINDOW_MS,
                        DEFAULT_AUTH_RATE_LIMIT_WINDOW_MS,
                        'RATE_LIMIT_AUTH_WINDOW_MS',
                    ),
                    max: parsePositiveInt(
                        rawEnv.RATE_LIMIT_AUTH_MAX,
                        DEFAULT_AUTH_RATE_LIMIT_MAX,
                        'RATE_LIMIT_AUTH_MAX',
                    ),
                },
            },
        },
        auth: {
            accessTokenSecret: rawEnv.JWT_ACCESS_SECRET,
            refreshTokenSecret: rawEnv.JWT_REFRESH_SECRET,
            accessTokenTtlMinutes: parsePositiveInt(
                rawEnv.ACCESS_TOKEN_TTL_MINUTES,
                DEFAULT_ACCESS_TOKEN_TTL_MINUTES,
                'ACCESS_TOKEN_TTL_MINUTES',
            ),
            refreshTokenTtlDays: parsePositiveInt(
                rawEnv.REFRESH_TOKEN_TTL_DAYS,
                DEFAULT_REFRESH_TOKEN_TTL_DAYS,
                'REFRESH_TOKEN_TTL_DAYS',
            ),
            accessTokenCookieName:
                normalizeOptional(rawEnv.AUTH_ACCESS_COOKIE_NAME)
                ?? DEFAULT_ACCESS_COOKIE_NAME,
            refreshTokenCookieName:
                normalizeOptional(rawEnv.AUTH_REFRESH_COOKIE_NAME)
                ?? DEFAULT_REFRESH_COOKIE_NAME,
            cookieSecure,
            cookieSameSite,
            cookieDomain: normalizeOptional(rawEnv.AUTH_COOKIE_DOMAIN),
            adminEmail: normalizeOptional(rawEnv.ADMIN_EMAIL),
            adminPassword: normalizeOptional(rawEnv.ADMIN_PASSWORD),
        },
    };
};

const formatZodError = (error: z.ZodError): string => {
    return error.issues
        .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
        .join('; ');
};

const parsePort = (value: string | undefined, fallback: number): number => {
    const port = parsePositiveInt(value, fallback, 'PORT');
    if (port > 65535) {
        throw new Error('PORT must be between 1 and 65535');
    }

    return port;
};

const parsePositiveInt = (
    value: string | undefined,
    fallback: number,
    key: string,
): number => {
    if (!value?.trim()) {
        return fallback;
    }

    const parsed = Number.parseInt(value.trim(), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`${key} must be a positive integer`);
    }

    return parsed;
};

const parseBoolean = (
    value: string | undefined,
    fallback: boolean,
    key: string,
): boolean => {
    if (!value?.trim()) {
        return fallback;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
        return true;
    }

    if (normalized === 'false') {
        return false;
    }

    throw new Error(`${key} must be true or false`);
};

const parseCookieSameSite = (
    value: string | undefined,
    fallback: CookieSameSite,
): CookieSameSite => {
    const normalized = value?.trim().toLowerCase() ?? fallback;

    if (normalized === 'lax' || normalized === 'strict' || normalized === 'none') {
        return normalized;
    }

    throw new Error('AUTH_COOKIE_SAME_SITE must be lax, strict, or none');
};

const parseAllowedOrigins = (value: string | undefined): string[] => {
    const rawOrigins = value?.trim()
        ? value.split(',').map((entry) => entry.trim()).filter(Boolean)
        : DEFAULT_ALLOWED_ORIGINS;

    if (rawOrigins.length === 0) {
        throw new Error('CORS_ALLOWED_ORIGINS must include at least one origin');
    }

    return Array.from(new Set(rawOrigins.map(normalizeOrigin)));
};

const normalizeOrigin = (value: string): string => {
    let url: URL;

    try {
        url = new URL(value);
    } catch {
        throw new Error(`Invalid CORS origin: ${value}`);
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error(`CORS origin must use http or https: ${value}`);
    }

    if (value !== url.origin) {
        throw new Error(`CORS origin must not include a path, query, or hash: ${value}`);
    }

    return url.origin;
};

const normalizeOptional = (value: string | undefined): string | null => {
    const normalized = value?.trim();
    return normalized ? normalized : null;
};
