import { PrismaClient, Role as PrismaRole, User as PrismaUserModel } from '../../../generated/prisma/client';
import { Role, User } from '../domain/User';
import { UserRepository } from './UserRepository';

export class PrismaUserRepository implements UserRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async count(): Promise<number> {
        return this.prisma.user.count();
    }

    async findById(id: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        return user ? toDomainUser(user) : null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        return user ? toDomainUser(user) : null;
    }

    async create(user: User): Promise<User> {
        const createdUser = await this.prisma.user.create({
            data: toPrismaCreateUserData(user),
        });

        return toDomainUser(createdUser);
    }

    async update(user: User): Promise<User> {
        const updatedUser = await this.prisma.user.update({
            where: { id: user.id },
            data: toPrismaUpdateUserData(user),
        });

        return toDomainUser(updatedUser);
    }
}

const toPrismaCreateUserData = (user: User) => ({
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    role: user.role as PrismaRole,
    passwordChangedAt: new Date(user.passwordChangedAt),
    lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : null,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt),
});

const toPrismaUpdateUserData = (user: User) => ({
    email: user.email,
    passwordHash: user.passwordHash,
    role: user.role as PrismaRole,
    passwordChangedAt: new Date(user.passwordChangedAt),
    lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : null,
    updatedAt: new Date(user.updatedAt),
});

const toDomainUser = (user: PrismaUserModel): User => ({
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    role: user.role as Role,
    passwordChangedAt: user.passwordChangedAt.toISOString(),
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
});
