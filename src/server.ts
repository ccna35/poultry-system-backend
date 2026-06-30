import 'dotenv/config';
import { createServer, Server } from 'node:http';

import { createApp } from './app';
import { loadAppConfig } from './shared/config/app.config';

const SHUTDOWN_TIMEOUT_MS = 10_000;

let server: Server | null = null;
let dispose: (() => Promise<void>) | null = null;
let isShuttingDown = false;

const shutdown = async (
    reason: string,
    exitCode: number,
    error?: unknown,
): Promise<void> => {
    if (isShuttingDown) {
        return;
    }

    isShuttingDown = true;

    if (error) {
        console.error(reason, error);
    } else {
        console.log(reason);
    }

    try {
        const activeServer = server;

        if (activeServer) {
            await new Promise<void>((resolve, reject) => {
                const timer = setTimeout(() => {
                    reject(new Error('Timed out while waiting for the server to close'));
                }, SHUTDOWN_TIMEOUT_MS);

                timer.unref();

                activeServer.close((closeError) => {
                    clearTimeout(timer);

                    if (closeError) {
                        reject(closeError);
                        return;
                    }

                    resolve();
                });
            });
        }
    } catch (closeError) {
        console.error('Failed to close HTTP server cleanly', closeError);
    }

    try {
        await dispose?.();
    } catch (disposeError) {
        console.error('Failed to dispose application resources', disposeError);
    }

    process.exit(exitCode);
};

export const bootstrap = async (env: NodeJS.ProcessEnv = process.env): Promise<void> => {
    try {
        const config = loadAppConfig(env);
        const appInstance = await createApp(config);

        dispose = appInstance.dispose;
        server = createServer(appInstance.app);

        server.listen(config.server.port, () => {
            console.log(`Server listening on port ${config.server.port}`);
        });
    } catch (error) {
        await shutdown('Failed to bootstrap server', 1, error);
    }
};

process.on('SIGINT', () => {
    void shutdown('Received SIGINT, shutting down gracefully', 0);
});

process.on('SIGTERM', () => {
    void shutdown('Received SIGTERM, shutting down gracefully', 0);
});

process.on('unhandledRejection', (reason) => {
    void shutdown('Unhandled promise rejection', 1, reason);
});

process.on('uncaughtException', (error) => {
    void shutdown('Uncaught exception', 1, error);
});

if (require.main === module) {
    void bootstrap();
}
