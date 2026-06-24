import { createApp } from './app';

const PORT = Number(process.env.PORT ?? 3000);

const bootstrap = async (): Promise<void> => {
    const app = await createApp();

    app.listen(PORT, () => {
        // eslint-disable-next-line no-console
        console.log(`Server listening on port ${PORT}`);
    });
};

bootstrap();