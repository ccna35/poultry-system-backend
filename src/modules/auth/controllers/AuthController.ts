import { Request, Response } from 'express';

import { AuthConfig } from '../config/auth.config';
import { AuthCookieService } from '../services/AuthCookieService';
import { AuthService } from '../services/AuthService';

type LoginRequestBody = {
    email: string;
    password: string;
};

export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly authCookieService: AuthCookieService,
        private readonly authConfig: AuthConfig,
    ) { }

    login = async (req: Request, res: Response): Promise<void> => {
        const body = req.body as LoginRequestBody;
        const result = await this.authService.login({
            email: body.email,
            password: body.password,
            userAgent: req.get('user-agent') ?? null,
            ipAddress: req.ip ?? null,
        });

        this.authCookieService.setAuthCookies(
            res,
            result.accessToken,
            result.refreshToken,
        );

        res.status(200).json({
            success: true,
            data: {
                user: result.user,
            },
        });
    };

    refresh = async (req: Request, res: Response): Promise<void> => {
        const refreshToken = req.cookies?.[this.authConfig.refreshTokenCookieName];

        try {
            const result = await this.authService.refresh({
                refreshToken,
                userAgent: req.get('user-agent') ?? null,
                ipAddress: req.ip ?? null,
            });

            this.authCookieService.setAuthCookies(
                res,
                result.accessToken,
                result.refreshToken,
            );

            res.status(200).json({
                success: true,
                data: {
                    user: result.user,
                },
            });
        } catch (error) {
            this.authCookieService.clearAuthCookies(res);
            throw error;
        }
    };

    logout = async (req: Request, res: Response): Promise<void> => {
        await this.authService.logout({
            refreshToken: req.cookies?.[this.authConfig.refreshTokenCookieName] ?? null,
        });

        this.authCookieService.clearAuthCookies(res);

        res.status(200).json({
            success: true,
            data: null,
        });
    };

    me = async (req: Request, res: Response): Promise<void> => {
        const user = await this.authService.getAuthenticatedUser(req.auth!.userId);

        res.status(200).json({
            success: true,
            data: {
                user,
            },
        });
    };
};
