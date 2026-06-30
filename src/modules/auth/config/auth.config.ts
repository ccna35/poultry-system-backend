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
