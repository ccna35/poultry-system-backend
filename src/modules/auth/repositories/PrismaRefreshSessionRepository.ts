import { PrismaClient, RefreshSession as PrismaRefreshSessionModel } from '../../../generated/prisma/client';
import { RefreshSession } from '../domain/RefreshSession';
import { RefreshSessionRepository } from './RefreshSessionRepository';

export class PrismaRefreshSessionRepository implements RefreshSessionRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async create(session: RefreshSession): Promise<RefreshSession> {
        const createdSession = await this.prisma.refreshSession.create({
            data: toPrismaRefreshSessionData(session),
        });

        return toDomainRefreshSession(createdSession);
    }

    async findById(id: string): Promise<RefreshSession | null> {
        const session = await this.prisma.refreshSession.findUnique({
            where: { id },
        });

        return session ? toDomainRefreshSession(session) : null;
    }

    async revoke(
        sessionId: string,
        revokedAt: string,
        replacedBySessionId?: string | null,
    ): Promise<void> {
        await this.prisma.refreshSession.updateMany({
            where: { id: sessionId },
            data: {
                revokedAt: new Date(revokedAt),
                replacedBySessionId: replacedBySessionId ?? null,
            },
        });
    }

    async revokeFamily(userId: string, familyId: string, revokedAt: string): Promise<void> {
        await this.prisma.refreshSession.updateMany({
            where: {
                userId,
                familyId,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(revokedAt),
            },
        });
    }

    async revokeAllForUser(userId: string, revokedAt: string): Promise<void> {
        await this.prisma.refreshSession.updateMany({
            where: {
                userId,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(revokedAt),
            },
        });
    }
}

const toPrismaRefreshSessionData = (session: RefreshSession) => ({
    id: session.id,
    userId: session.userId,
    familyId: session.familyId,
    tokenHash: session.tokenHash,
    expiresAt: new Date(session.expiresAt),
    revokedAt: session.revokedAt ? new Date(session.revokedAt) : null,
    replacedBySessionId: session.replacedBySessionId,
    lastUsedAt: session.lastUsedAt ? new Date(session.lastUsedAt) : null,
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    createdAt: new Date(session.createdAt),
});

const toDomainRefreshSession = (
    session: PrismaRefreshSessionModel,
): RefreshSession => ({
    id: session.id,
    userId: session.userId,
    familyId: session.familyId,
    tokenHash: session.tokenHash,
    expiresAt: session.expiresAt.toISOString(),
    revokedAt: session.revokedAt ? session.revokedAt.toISOString() : null,
    replacedBySessionId: session.replacedBySessionId,
    lastUsedAt: session.lastUsedAt ? session.lastUsedAt.toISOString() : null,
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    createdAt: session.createdAt.toISOString(),
});
