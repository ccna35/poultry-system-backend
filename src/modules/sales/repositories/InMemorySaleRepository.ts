import { Sale } from '../domain/Sale';
import { SaleRepository } from './SaleRepository';

export class InMemorySaleRepository implements SaleRepository {
    private readonly sales: Sale[];

    constructor(seedData: Sale[] = []) {
        this.sales = [...seedData];
    }

    async create(sale: Sale): Promise<Sale> {
        this.sales.push(sale);
        return sale;
    }

    async findByCycle(cycleId: string): Promise<Sale | null> {
        return this.sales.find((sale) => sale.cycleId === cycleId) ?? null;
    }
}
