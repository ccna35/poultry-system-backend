import { User } from '../domain/User';
import { UserRepository } from './UserRepository';

export class InMemoryUserRepository implements UserRepository {
    private readonly users = new Map<string, User>();

    async count(): Promise<number> {
        return this.users.size;
    }

    async findById(id: string): Promise<User | null> {
        const user = this.users.get(id);
        return user ? { ...user } : null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = Array.from(this.users.values()).find((entry) => entry.email === email);
        return user ? { ...user } : null;
    }

    async create(user: User): Promise<User> {
        this.users.set(user.id, { ...user });
        return { ...user };
    }

    async update(user: User): Promise<User> {
        this.users.set(user.id, { ...user });
        return { ...user };
    }
}
