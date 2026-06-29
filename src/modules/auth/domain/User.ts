export type Role = 'ADMIN';

export type User = {
    id: string;
    email: string;
    passwordHash: string;
    role: Role;
    passwordChangedAt: string;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type PublicUser = {
    id: string;
    email: string;
    role: Role;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export const toPublicUser = (user: User): PublicUser => ({
    id: user.id,
    email: user.email,
    role: user.role,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});
