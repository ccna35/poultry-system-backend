import { NextFunction, Request, Response } from 'express';

import { AppError } from '../errors/AppError';

export const errorHandler = (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    if (res.headersSent) {
        next(err);
        return;
    }

    logRequestError(req, err);

    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
            },
        });
        return;
    }

    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
        },
    });
};

const logRequestError = (req: Request, err: unknown): void => {
    if (req.log) {
        req.log.error({ err }, 'Request failed');
        return;
    }

    console.error(err);
};
