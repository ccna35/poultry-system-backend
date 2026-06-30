import { Router, RequestHandler } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../../shared/http/asyncHandler';
import { validateRequest } from '../../../shared/http/validateRequest';
import { AuthController } from '../controllers/AuthController';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const createAuthRouter = (
    authController: AuthController,
    requireAuth: RequestHandler,
): Router => {
    const router = Router();

    router.post(
        '/login',
        validateRequest({ body: loginSchema }),
        asyncHandler(authController.login),
    );
    router.post('/refresh', asyncHandler(authController.refresh));

    router.use(requireAuth);
    router.post('/logout', asyncHandler(authController.logout));
    router.get('/me', asyncHandler(authController.me));

    return router;
};
