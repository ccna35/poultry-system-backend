import {
    Prisma,
    PrismaClient,
    type WeightLog as PrismaWeightLogModel,
} from '../../../generated/prisma/client';

import { WeightLog } from '../domain/WeightLog';
import { WeightRepository } from './WeightRepository';

export class PrismaWeightRepository implements WeightRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async create(weightLog: WeightLog): Promise<WeightLog> {
        const createdLog = await this.prisma.weightLog.create({
            data: toPrismaCreateData(weightLog),
        });

        return toDomainWeightLog(createdLog);
    }

    async listByCycle(cycleId: string): Promise<WeightLog[]> {
        const logs = await this.prisma.weightLog.findMany({
            where: {
                cycleId,
            },
            orderBy: {
                date: 'asc',
            },
        });

        return logs.map(toDomainWeightLog);
    }

    async getLatestByCycle(cycleId: string): Promise<WeightLog | null> {
        const log = await this.prisma.weightLog.findFirst({
            where: {
                cycleId,
            },
            orderBy: {
                date: 'desc',
            },
        });

        return log ? toDomainWeightLog(log) : null;
    }
}

function toPrismaCreateData(log: WeightLog): Prisma.WeightLogUncheckedCreateInput {
    return {
        id: log.id,
        cycleId: log.cycleId,
        date: toDateOnly(log.date),
        sampleSize: log.sampleSize,
        averageWeightKg: new Prisma.Decimal(log.averageWeightKg),
        notes: log.notes ?? null,
        createdAt: new Date(log.createdAt),
        updatedAt: new Date(log.updatedAt),
    };
}

function toDomainWeightLog(log: PrismaWeightLogModel): WeightLog {
    return {
        id: log.id,
        cycleId: log.cycleId,
        date: toDateString(log.date),
        sampleSize: log.sampleSize,
        averageWeightKg: log.averageWeightKg.toNumber(),
        notes: log.notes,
        createdAt: log.createdAt.toISOString(),
        updatedAt: log.updatedAt.toISOString(),
    };
}

function toDateOnly(value: string): Date {
    return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

function toDateString(value: Date): string {
    return value.toISOString().slice(0, 10);
}