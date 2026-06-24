export type ExpenseCategory =
  | 'CHICKS'
  | 'FEED'
  | 'MEDICATION'
  | 'LABOR'
  | 'ELECTRICITY'
  | 'TRANSPORT'
  | 'MISC'
  | 'OTHER';

export type ExpenseSourceType =
  | 'MANUAL'
  | 'FEED_PURCHASE'
  | 'MEDICATION_LOG'
  | 'SYSTEM';

export interface Expense {
  id: string;
  cycleId: string;
  expenseDate: string;
  category: ExpenseCategory;
  amount: number;
  description: string | null;
  sourceType: ExpenseSourceType | null;
  sourceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AddManualExpenseInput {
  cycleId: string;
  expenseDate: string;
  category: ExpenseCategory;
  amount: number;
  description?: string | null;
}

export interface AddSystemExpenseInput {
  cycleId: string;
  expenseDate: string;
  category: ExpenseCategory;
  amount: number;
  description?: string | null;
  sourceType: ExpenseSourceType;
  sourceId?: string | null;
}
