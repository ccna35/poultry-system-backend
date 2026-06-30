import cors, { CorsOptions } from 'cors';
import cookieParser from 'cookie-parser';
import express, { Express, Router } from 'express';
import helmet from 'helmet';

import { createCompositionRoot } from './composition-root';
import { AppConfig } from './shared/config/app.config';
import { ForbiddenError } from './shared/errors/ForbiddenError';
import { errorHandler } from './shared/http/errorHandler';
import { notFoundHandler } from './shared/http/notFoundHandler';
import { createRateLimitMiddleware } from './shared/http/rateLimit';
import { createRequestLogger } from './shared/http/requestLogger';

export type AppInstance = {
    app: Express;
    dispose: () => Promise<void>;
};

type CompositionRootLike = {
    apiRouter: Router;
    dispose: () => Promise<void>;
};

type CompositionRootFactory = (
    config: AppConfig,
) => Promise<CompositionRootLike>;

export const createApp = async (
    config: AppConfig,
    compositionRootFactory: CompositionRootFactory = createCompositionRoot,
): Promise<AppInstance> => {
    const app = express();
    const { apiRouter, dispose } = await compositionRootFactory(config);

    app.disable('x-powered-by');
    app.set('trust proxy', config.server.trustProxy);

    app.use(createRequestLogger(config.logging));
    app.use(helmet());
    app.use(cors(createCorsOptions(config.cors.allowedOrigins)));
    app.use(createRateLimitMiddleware(config.security.rateLimit.global, {
        skip: (req) => req.path === '/health',
    }));
    app.use(cookieParser());
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));

    app.get('/health', (_req, res) => {
        res.status(200).json({ success: true, data: { status: 'ok' } });
    });

    app.use('/api/auth', createRateLimitMiddleware(config.security.rateLimit.auth));
    app.use('/api', apiRouter);
    app.use(notFoundHandler);
    app.use(errorHandler);

    return {
        app,
        dispose,
    };
};

export const createCorsOptions = (allowedOrigins: string[]): CorsOptions => {
    return {
        credentials: true,
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }

            callback(new ForbiddenError('Origin not allowed'));
        },
    };
};
