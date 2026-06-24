import { EventBus } from '../../../shared/events/EventBus';
import { DOMAIN_EVENT_TYPES } from '../../../shared/events/domain-events';
import { ExpenseService } from '../services/ExpenseService';

export const registerExpenseEventHandlers = (
  eventBus: EventBus,
  expenseService: ExpenseService,
): void => {
  eventBus.subscribe(DOMAIN_EVENT_TYPES.CYCLE_CREATED, async ({ payload }) => {
    await expenseService.addSystemExpense({
      cycleId: payload.cycleId,
      expenseDate: payload.expenseDate,
      category: 'CHICKS',
      amount: payload.amount,
      description: 'Automatic chicks expense on cycle creation',
      sourceType: 'SYSTEM',
      sourceId: payload.cycleId,
    });
  });

  eventBus.subscribe(
    DOMAIN_EVENT_TYPES.FEED_PURCHASE_CREATED,
    async ({ payload }) => {
      await expenseService.addSystemExpense({
        cycleId: payload.cycleId,
        expenseDate: payload.purchaseDate,
        category: 'FEED',
        amount: payload.amount,
        description: 'Automatic feed expense from feed purchase',
        sourceType: 'FEED_PURCHASE',
        sourceId: payload.purchaseId,
      });
    },
  );

  eventBus.subscribe(
    DOMAIN_EVENT_TYPES.MEDICATION_LOG_CREATED,
    async ({ payload }) => {
      await expenseService.addSystemExpense({
        cycleId: payload.cycleId,
        expenseDate: payload.date,
        category: 'MEDICATION',
        amount: payload.amount,
        description: 'Automatic medication expense from medication log',
        sourceType: 'MEDICATION_LOG',
        sourceId: payload.medicationLogId,
      });
    },
  );
};
