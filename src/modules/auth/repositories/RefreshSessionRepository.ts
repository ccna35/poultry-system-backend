import { RefreshSession } from '../domain/RefreshSession';

export interface RefreshSessionRepository {
    create(session: RefreshSession): Promise<RefreshSession>;
    findById(id: string): Promise<RefreshSession | null>;
    revoke(
        sessionId: string,
        revokedAt: string,
        replacedBySessionId?: string | null,
    ): Promise<void>;
    revokeFamily(userId: string, familyId: string, revokedAt: string): Promise<void>;
    revokeAllForUser(userId: string, revokedAt: string): Promise<void>;
}
