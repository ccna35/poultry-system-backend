import rateLimit, { Options } from 'express-rate-limit';

import { RateLimitConfig } from '../config/app.config';

const RATE_LIMIT_MESSAGE = 'Too many requests, please try again later.';

type RateLimitOptions = {
    skip?: Options['skip'];
};

export const createRateLimitMiddleware = (
    config: RateLimitConfig,
    options: RateLimitOptions = {},
) => {
    return rateLimit({
        windowMs: config.windowMs,
        max: config.max,
        standardHeaders: true,
        legacyHeaders: false,
        skip: options.skip,
        handler: (_req, res) => {
            res.status(429).json({
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: RATE_LIMIT_MESSAGE,
                },
            });
        },
    });
};
