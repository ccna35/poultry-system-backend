import 'express-async-errors';
import express, { Express } from 'express';
import cors from 'cors';

import { createCompositionRoot } from './composition-root';
import { errorHandler } from './shared/http/errorHandler';

export const createApp = async (): Promise<Express> => {
    const app = express();
    const { apiRouter } = await createCompositionRoot();

    app.use(cors({
        origin: ['http://localhost:5173'],
        credentials: true,
    }));

    app.use(express.json());

    app.get('/health', (_req, res) => {
        res.status(200).json({ success: true, data: { status: 'ok' } });
    });

    app.use('/api', apiRouter);
    app.use(errorHandler);

    return app;
};