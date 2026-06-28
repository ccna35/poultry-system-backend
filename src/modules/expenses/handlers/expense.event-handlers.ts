import { EventBus } from '../../../shared/events/EventBus';
import { DOMAIN_EVENT_TYPES } from '../../../shared/events/domain-events';
import { ExpenseService } from '../services/ExpenseService';

export const registerExpenseEventHandlers = (
  eventBus: EventBus,
  expenseService: ExpenseService,
): void => {
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