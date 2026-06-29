import { Router, RequestHandler } from 'express';
import { z } from 'zod';

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
        authController.login,
    );
    router.post('/refresh', authController.refresh);

    router.use(requireAuth);
    router.post('/logout', authController.logout);
    router.get('/me', authController.me);

    return router;
};
