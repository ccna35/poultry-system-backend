import {
    Prisma,
    PrismaClient,
    type DailyLog as PrismaDailyLogModel,
} from '../../../generated/prisma/client';

import { ValidationError } from '../../../shared/errors/ValidationError';
import { DailyLog } from '../domain/DailyLog';
import { DailyLogRepository } from './DailyLogRepository';

export class PrismaDailyLogRepository implements DailyLogRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async create(log: DailyLog): Promise<DailyLog> {
        const createdLog = await this.prisma.dailyLog.create({
            data: toPrismaCreateData(log),
        });

        return toDomainDailyLog(createdLog);
    }

    async createWithFeedConsumption(log: DailyLog): Promise<DailyLog> {
        const createdLog = await this.prisma.$transaction(async (tx) => {
            const createdLog = await tx.dailyLog.create({
                data: toPrismaCreateData(log),
            });

            if (log.feedConsumedKg > 0) {
                const updatedBalances = await tx.feedInventoryBalance.updateMany({
                    where: {
                        cycleId: log.cycleId,
                        feedType: log.feedType,
                        quantityKg: {
                            gte: new Prisma.Decimal(log.feedConsumedKg),
                        },
                    },
                    data: {
                        quantityKg: {
                            decrement: new Prisma.Decimal(log.feedConsumedKg),
                        },
                    },
                });

                if (updatedBalances.count === 0) {
                    throw new ValidationError('رصيد العلف غير كافٍ لنوع العلف المحدد.');
                }

                await tx.feedInventoryMovement.create({
                    data: toPrismaConsumptionMovementCreateData(log),
                });
            }

            return createdLog;
        });

        return toDomainDailyLog(createdLog);
    }

    async listByCycle(cycleId: string): Promise<DailyLog[]> {
        const logs = await this.prisma.dailyLog.findMany({
            where: {
                cycleId,
            },
            orderBy: {
                date: 'asc',
            },
        });

        return logs.map(toDomainDailyLog);
    }

    async findByCycleAndDate(
        cycleId: string,
        date: string,
    ): Promise<DailyLog | null> {
        const log = await this.prisma.dailyLog.findUnique({
            where: {
                cycleId_date: {
                    cycleId,
                    date: toDateOnly(date),
                },
            },
        });

        return log ? toDomainDailyLog(log) : null;
    }

    async getTotalDeathsByCycle(cycleId: string): Promise<number> {
        const result = await this.prisma.dailyLog.aggregate({
            where: {
                cycleId,
            },
            _sum: {
                deaths: true,
            },
        });

        return result._sum.deaths ?? 0;
    }
}

function toPrismaCreateData(log: DailyLog): Prisma.DailyLogUncheckedCreateInput {
    return {
        id: log.id,
        cycleId: log.cycleId,
        date: toDateOnly(log.date),
        deaths: log.deaths,
        feedType: log.feedType,
        feedConsumedKg: new Prisma.Decimal(log.feedConsumedKg),
        temperature:
            log.temperature !== null && log.temperature !== undefined
                ? new Prisma.Decimal(log.temperature)
                : null,
        humidity:
            log.humidity !== null && log.humidity !== undefined
                ? new Prisma.Decimal(log.humidity)
                : null,
        waterConsumedLiters:
            log.waterConsumedLiters !== null &&
                log.waterConsumedLiters !== undefined
                ? new Prisma.Decimal(log.waterConsumedLiters)
                : null,
        notes: log.notes ?? null,
        createdAt: new Date(log.createdAt),
        updatedAt: new Date(log.updatedAt),
    };
}

function toPrismaConsumptionMovementCreateData(
    log: DailyLog,
): Prisma.FeedInventoryMovementUncheckedCreateInput {
    return {
        id: log.id,
        cycleId: log.cycleId,
        movementDate: toDateOnly(log.date),
        feedType: log.feedType,
        movementType: 'CONSUMPTION',
        quantityKg: new Prisma.Decimal(log.feedConsumedKg),
        referenceType: 'DAILY_LOG',
        referenceId: log.id,
        notes: 'Automatic inventory decrease from daily log',
        createdAt: new Date(log.createdAt),
        updatedAt: new Date(log.updatedAt),
    };
}

function toDomainDailyLog(log: PrismaDailyLogModel): DailyLog {
    return {
        id: log.id,
        cycleId: log.cycleId,
        date: toDateString(log.date),
        deaths: log.deaths,
        feedType: log.feedType,
        feedConsumedKg: log.feedConsumedKg.toNumber(),
        temperature: log.temperature ? log.temperature.toNumber() : null,
        humidity: log.humidity ? log.humidity.toNumber() : null,
        waterConsumedLiters: log.waterConsumedLiters
            ? log.waterConsumedLiters.toNumber()
            : null,
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