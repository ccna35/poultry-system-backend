import { Role } from '../../modules/auth/domain/User';

declare global {
    namespace Express {
        interface Request {
            auth?: {
                userId: string;
                role: Role;
                sessionId: string;
            };
        }
    }
}

export { };
