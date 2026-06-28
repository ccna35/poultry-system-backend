import {
    Prisma,
    PrismaClient,
    type MedicationLog as PrismaMedicationLogModel,
} from '../../../generated/prisma/client';

import { MedicationLog } from '../domain/MedicationLog';
import { MedicationRepository } from './MedicationRepository';

export class PrismaMedicationRepository implements MedicationRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async create(medicationLog: MedicationLog): Promise<MedicationLog> {
        const createdLog = await this.prisma.medicationLog.create({
            data: toPrismaCreateData(medicationLog),
        });

        return toDomainMedicationLog(createdLog);
    }

    async listByCycle(cycleId: string): Promise<MedicationLog[]> {
        const logs = await this.prisma.medicationLog.findMany({
            where: {
                cycleId,
            },
            orderBy: {
                date: 'asc',
            },
        });

        return logs.map(toDomainMedicationLog);
    }
}

function toPrismaCreateData(
    log: MedicationLog,
): Prisma.MedicationLogUncheckedCreateInput {
    return {
        id: log.id,
        cycleId: log.cycleId,
        date: toDateOnly(log.date),
        medicineName: log.medicineName,
        dosageAmount: new Prisma.Decimal(log.dosage.amount),
        dosageUnit: log.dosage.unit,
        dosagePerAmount: new Prisma.Decimal(log.dosage.perAmount ?? 1),
        dosagePerUnit: log.dosage.perUnit,
        notes: log.notes ?? null,
        createdAt: new Date(log.createdAt),
        updatedAt: new Date(log.updatedAt),
    };
}

function toDomainMedicationLog(log: PrismaMedicationLogModel): MedicationLog {
    return {
        id: log.id,
        cycleId: log.cycleId,
        date: toDateString(log.date),
        medicineName: log.medicineName,
        dosage: {
            amount: log.dosageAmount.toNumber(),
            unit: log.dosageUnit,
            perAmount: log.dosagePerAmount.toNumber(),
            perUnit: log.dosagePerUnit,
        },
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