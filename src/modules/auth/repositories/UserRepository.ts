import { User } from '../domain/User';

export interface UserRepository {
    count(): Promise<number>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    create(user: User): Promise<User>;
    update(user: User): Promise<User>;
}
