export type TransactionType = 'expense' | 'income' | 'investment' | 'loss' | 'transfer';

export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'bank_slip' | 'transfer' | 'cash' | 'other';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  budgetLimit?: number; // Teto mensal opcional
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'investment' | 'cash';
  institution: string; // Ex: Nubank, Itaú, Inter, XP
  balance: number;
  color: string;
  icon?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  institution: string;
  limit: number;
  availableLimit: number;
  closingDay: number;
  dueDay: number;
  color: string;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  accountId?: string;
  creditCardId?: string;
  paymentMethod: PaymentMethod;
  status: 'completed' | 'pending';
  isRecurring?: boolean;
  recurrenceFrequency?: 'monthly' | 'weekly' | 'yearly';
  installments?: {
    current: number;
    total: number;
  };
  notes?: string;
  aiExtracted?: boolean;
}

export interface Budget {
  id: string;
  categoryId: string;
  month: string; // YYYY-MM
  allocatedAmount: number;
}

export interface FinancialSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyInvestments: number;
  monthlyLosses: number;
  netSavings: number;
  savingsRate: number;
}

export interface AiParsedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryName: string;
  categoryId?: string;
  confidence: number;
  suggestedAccount?: string;
  suggestedCard?: string;
  selected: boolean;
}
