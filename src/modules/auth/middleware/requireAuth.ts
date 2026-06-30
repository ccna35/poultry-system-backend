import { RequestHandler } from 'express';

import { ForbiddenError } from '../../../shared/errors/ForbiddenError';
import { UnauthorizedError } from '../../../shared/errors/UnauthorizedError';
import { asyncHandler } from '../../../shared/http/asyncHandler';
import { UserRepository } from '../repositories/UserRepository';
import { AuthTokenService } from '../services/AuthTokenService';

export const createRequireAuthMiddleware = (
    accessTokenCookieName: string,
    authTokenService: AuthTokenService,
    userRepository: UserRepository,
): RequestHandler => {
    return asyncHandler(async (req, _res, next) => {
        const accessToken = req.cookies?.[accessTokenCookieName];
        if (!accessToken) {
            throw new UnauthorizedError('Authentication required');
        }

        const payload = authTokenService.verifyAccessToken(accessToken);
        const user = await userRepository.findById(payload.sub);
        if (!user) {
            throw new UnauthorizedError('Authenticated user not found');
        }

        if (user.role !== 'ADMIN') {
            throw new ForbiddenError('Admin access required');
        }

        req.auth = {
            userId: user.id,
            role: user.role,
            sessionId: payload.sessionId,
        };

        next();
    });
};
