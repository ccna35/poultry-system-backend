import { Sale } from '../domain/Sale';

export interface SaleRepository {
    create(sale: Sale): Promise<Sale>;
    findByCycle(cycleId: string): Promise<Sale | null>;
}
