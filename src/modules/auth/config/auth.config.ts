export type CookieSameSite = 'lax' | 'strict' | 'none';

export type AuthConfig = {
    accessTokenSecret: string;
    refreshTokenSecret: string;
    accessTokenTtlMinutes: number;
    refreshTokenTtlDays: number;
    accessTokenCookieName: string;
    refreshTokenCookieName: string;
    cookieSecure: boolean;
    cookieSameSite: CookieSameSite;
    cookieDomain: string | null;
    adminEmail: string | null;
    adminPassword: string | null;
};

const DEFAULT_ACCESS_TOKEN_TTL_MINUTES = 5;
const DEFAULT_REFRESH_TOKEN_TTL_DAYS = 7;
const DEFAULT_ACCESS_COOKIE_NAME = 'access_token';
const DEFAULT_REFRESH_COOKIE_NAME = 'refresh_token';
const DEFAULT_COOKIE_SAME_SITE: CookieSameSite = 'lax';

export const createAuthConfig = (
    env: NodeJS.ProcessEnv = process.env,
): AuthConfig => {
    const cookieSameSite = parseCookieSameSite(
        env.AUTH_COOKIE_SAME_SITE ?? DEFAULT_COOKIE_SAME_SITE,
    );
    const cookieSecure = parseBoolean(env.AUTH_COOKIE_SECURE, false);

    if (cookieSameSite === 'none' && !cookieSecure) {
        throw new Error('AUTH_COOKIE_SECURE must be true when AUTH_COOKIE_SAME_SITE is none');
    }

    return {
        accessTokenSecret: getRequiredEnv(env, 'JWT_ACCESS_SECRET'),
        refreshTokenSecret: getRequiredEnv(env, 'JWT_REFRESH_SECRET'),
        accessTokenTtlMinutes: parsePositiveInt(
            env.ACCESS_TOKEN_TTL_MINUTES,
            DEFAULT_ACCESS_TOKEN_TTL_MINUTES,
            'ACCESS_TOKEN_TTL_MINUTES',
        ),
        refreshTokenTtlDays: parsePositiveInt(
            env.REFRESH_TOKEN_TTL_DAYS,
            DEFAULT_REFRESH_TOKEN_TTL_DAYS,
            'REFRESH_TOKEN_TTL_DAYS',
        ),
        accessTokenCookieName:
            env.AUTH_ACCESS_COOKIE_NAME?.trim() || DEFAULT_ACCESS_COOKIE_NAME,
        refreshTokenCookieName:
            env.AUTH_REFRESH_COOKIE_NAME?.trim() || DEFAULT_REFRESH_COOKIE_NAME,
        cookieSecure,
        cookieSameSite,
        cookieDomain: env.AUTH_COOKIE_DOMAIN?.trim() || null,
        adminEmail: normalizeOptional(env.ADMIN_EMAIL),
        adminPassword: normalizeOptional(env.ADMIN_PASSWORD),
    };
};

const getRequiredEnv = (env: NodeJS.ProcessEnv, key: string): string => {
    const value = env[key]?.trim();
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }

    return value;
};

const parsePositiveInt = (
    value: string | undefined,
    fallback: number,
    key: string,
): number => {
    if (!value?.trim()) {
        return fallback;
    }

    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`${key} must be a positive integer`);
    }

    return parsed;
};

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
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

    throw new Error('AUTH_COOKIE_SECURE must be true or false');
};

const parseCookieSameSite = (value: string): CookieSameSite => {
    const normalized = value.trim().toLowerCase();

    if (normalized === 'lax' || normalized === 'strict' || normalized === 'none') {
        return normalized;
    }

    throw new Error('AUTH_COOKIE_SAME_SITE must be lax, strict, or none');
};

const normalizeOptional = (value: string | undefined): string | null => {
    const normalized = value?.trim();
    return normalized ? normalized : null;
};
