export interface Transaction {
  id: string;
  uuid?: string;
  companyId: string;
  unitTransactionId?: string | number | null;
  date: string; // transaction_date
  name: string; // kept for UI, mapped from description

  debitUSD: number;
  creditUSD: number;

  debitIDR: number;
  creditIDR: number;

  debitCash: number;
  creditCash: number;

  description?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTransactionRequest {
  companyId: string;
  unitTransactionId?: string | number | null;
  date: string;
  name?: string;
  description?: string;
  debitUSD?: number;
  creditUSD?: number;
  debitIDR?: number;
  creditIDR?: number;
  debitCash?: number;
  creditCash?: number;
}

export interface TransactionAudit {
  id: string;
  transactionId: string;
  companyId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  timestamp: string;
  userId: string;
  details: string;
  payload?: any;
}

export interface TransactionSummary {
  totalBcaUsd: number;
  totalBcaIdr: number;
  totalCashIdr: number;
}
