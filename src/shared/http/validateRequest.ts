import { NextFunction, Request, RequestHandler, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';

import { ValidationError } from '../errors/ValidationError';

type ValidationSchemas = {
    body?: AnyZodObject;
    params?: AnyZodObject;
    query?: AnyZodObject;
};

export const validateRequest = ({
    body,
    params,
    query,
}: ValidationSchemas): RequestHandler => {
    return (req: Request, _res: Response, next: NextFunction) => {
        try {
            if (body) {
                req.body = body.parse(req.body);
            }

            if (params) {
                req.params = params.parse(req.params);
            }

            if (query) {
                req.query = query.parse(req.query);
            }

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const details = error.issues
                    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
                    .join('; ');

                next(new ValidationError(details || 'بيانات الطلب غير صالحة'));
                return;
            }

            next(error);
        }
    };
};