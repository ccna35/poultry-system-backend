import { Role } from '../../modules/auth/domain/User';
import { Logger } from 'pino';

declare global {
    namespace Express {
        interface Request {
            auth?: {
                userId: string;
                role: Role;
                sessionId: string;
            };
            id: string;
            log: Logger;
        }
    }
}

export { };
