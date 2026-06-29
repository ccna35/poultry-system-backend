export type RefreshSession = {
    id: string;
    userId: string;
    familyId: string;
    tokenHash: string;
    expiresAt: string;
    revokedAt: string | null;
    replacedBySessionId: string | null;
    lastUsedAt: string | null;
    userAgent: string | null;
    ipAddress: string | null;
    createdAt: string;
};
