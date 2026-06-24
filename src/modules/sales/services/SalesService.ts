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
  ) {}

  async createSale(input: CreateSaleInput): Promise<Sale> {
    if (input.birdsSold <= 0) {
      throw new ValidationError('birdsSold must be greater than 0');
    }

    if (input.averageSellingWeightKg <= 0) {
      throw new ValidationError('averageSellingWeightKg must be greater than 0');
    }

    if (input.pricePerKg < 0) {
      throw new ValidationError('pricePerKg cannot be negative');
    }

    const existingSale = await this.saleRepository.findByCycle(input.cycleId);
    if (existingSale) {
      throw new ConflictError('Only one sale per cycle is allowed in MVP');
    }

    const cycle = await this.cycleService.ensureCycleIsActive(input.cycleId);

    const totalDeaths = await this.dailyLogService.getTotalDeathsByCycle(input.cycleId);
    const remainingBirds = Math.max(0, cycle.initialBirds - totalDeaths);

    if (input.birdsSold > remainingBirds) {
      throw new ValidationError('birdsSold cannot exceed remaining birds');
    }

    const timestamp = nowIso();
    const sale: Sale = {
      id: generateId(),
      cycleId: input.cycleId,
      saleDate: toDateOnly(input.saleDate),
      birdsSold: input.birdsSold,
      averageSellingWeightKg: input.averageSellingWeightKg,
      pricePerKg: input.pricePerKg,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const createdSale = await this.saleRepository.create(sale);
    await this.cycleService.completeCycle(input.cycleId, createdSale.saleDate);

    return createdSale;
  }

  async getSaleByCycle(cycleId: string): Promise<Sale | null> {
    await this.cycleService.getCycleById(cycleId);
    return this.saleRepository.findByCycle(cycleId);
  }
}
