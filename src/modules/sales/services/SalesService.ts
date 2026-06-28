import { ConflictError } from '../../../shared/errors/ConflictError';
import { ValidationError } from '../../../shared/errors/ValidationError';
import { nowIso, toDateOnly } from '../../../shared/utils/date';
import { generateId } from '../../../shared/utils/id';
import { CycleService } from '../../cycles/services/CycleService';
import { DailyLogService } from '../../daily-logs/services/DailyLogService';
import { CreateSaleInput, Sale } from '../domain/Sale';
import { SaleRepository } from '../repositories/SaleRepository';

export class SalesService {
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly cycleService: CycleService,
    private readonly dailyLogService: DailyLogService,
  ) { }

  async createSale(input: CreateSaleInput): Promise<Sale> {
    if (input.totalWeightKg <= 0) {
      throw new ValidationError('totalWeightKg must be greater than 0');
    }

    if (input.pricePerKg < 0) {
      throw new ValidationError('pricePerKg cannot be negative');
    }

    const existingSale = await this.saleRepository.findByCycle(input.cycleId);
    if (existingSale) {
      throw new ConflictError('Only one sale per cycle is allowed in MVP');
    }

    const saleDate = toDateOnly(input.saleDate);
    const cycle = await this.cycleService.ensureCycleIsActive(input.cycleId);
    const totalDeaths = await this.dailyLogService.getTotalDeathsByCycle(input.cycleId);
    const birdsSold = Math.max(0, cycle.initialBirds - totalDeaths);

    if (birdsSold <= 0) {
      throw new ValidationError('There are no remaining birds to sell for this cycle');
    }

    const timestamp = nowIso();
    const sale: Sale = {
      id: generateId(),
      cycleId: input.cycleId,
      saleDate,
      birdsSold,
      totalWeightKg: input.totalWeightKg,
      pricePerKg: input.pricePerKg,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    return this.saleRepository.createAndCompleteCycle(sale);
  }

  async getSaleByCycle(cycleId: string): Promise<Sale | null> {
    await this.cycleService.getCycleById(cycleId);
    return this.saleRepository.findByCycle(cycleId);
  }
}
