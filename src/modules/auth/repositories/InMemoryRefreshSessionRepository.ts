import { RefreshSession } from '../domain/RefreshSession';
import { RefreshSessionRepository } from './RefreshSessionRepository';

export class InMemoryRefreshSessionRepository implements RefreshSessionRepository {
    private readonly sessions = new Map<string, RefreshSession>();

    async create(session: RefreshSession): Promise<RefreshSession> {
        this.sessions.set(session.id, { ...session });
        return { ...session };
    }

    async findById(id: string): Promise<RefreshSession | null> {
        const session = this.sessions.get(id);
        return session ? { ...session } : null;
    }

    async revoke(
        sessionId: string,
        revokedAt: string,
        replacedBySessionId?: string | null,
    ): Promise<void> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return;
        }

        this.sessions.set(sessionId, {
            ...session,
            revokedAt,
            replacedBySessionId: replacedBySessionId ?? null,
        });
    }

    async revokeFamily(userId: string, familyId: string, revokedAt: string): Promise<void> {
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.userId !== userId || session.familyId !== familyId) {
                continue;
            }

            this.sessions.set(sessionId, {
                ...session,
                revokedAt,
            });
        }
    }

    async revokeAllForUser(userId: string, revokedAt: string): Promise<void> {
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.userId !== userId) {
                continue;
            }

            this.sessions.set(sessionId, {
                ...session,
                revokedAt,
            });
        }
    }
}
