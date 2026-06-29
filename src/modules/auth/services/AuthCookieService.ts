import { CookieOptions, Response } from 'express';

import { AuthConfig } from '../config/auth.config';

export class AuthCookieService {
    constructor(private readonly config: AuthConfig) { }

    setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
        res.cookie(
            this.config.accessTokenCookieName,
            accessToken,
            {
                ...this.getAccessCookieBaseOptions(),
                maxAge: this.config.accessTokenTtlMinutes * 60 * 1000,
            },
        );
        res.cookie(
            this.config.refreshTokenCookieName,
            refreshToken,
            {
                ...this.getRefreshCookieBaseOptions(),
                maxAge: this.config.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
            },
        );
    }

    clearAuthCookies(res: Response): void {
        res.clearCookie(
            this.config.accessTokenCookieName,
            this.getAccessCookieBaseOptions(),
        );
        res.clearCookie(
            this.config.refreshTokenCookieName,
            this.getRefreshCookieBaseOptions(),
        );
    }

    private getAccessCookieBaseOptions(): CookieOptions {
        return {
            httpOnly: true,
            secure: this.config.cookieSecure,
            sameSite: this.config.cookieSameSite,
            domain: this.config.cookieDomain ?? undefined,
            path: '/',
        };
    }

    private getRefreshCookieBaseOptions(): CookieOptions {
        return {
            httpOnly: true,
            secure: this.config.cookieSecure,
            sameSite: this.config.cookieSameSite,
            domain: this.config.cookieDomain ?? undefined,
            path: '/api/auth',
        };
    }
}
