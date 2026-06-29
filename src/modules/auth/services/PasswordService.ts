import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export class PasswordService {
    async hash(password: string): Promise<string> {
        return bcrypt.hash(password, SALT_ROUNDS);
    }

    async verify(password: string, passwordHash: string): Promise<boolean> {
        return bcrypt.compare(password, passwordHash);
    }
}
