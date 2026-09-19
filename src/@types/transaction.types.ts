export interface Transaction {
  id: string;
  uuid?: string;
  companyId: string;
  unitTransactionId?: number | string | null;
  date: string; // transaction_date
  name: string;
  description?: string;

  debitUSD: number;
  creditUSD: number;

  debitIDR: number;
  creditIDR: number;

  debitCash: number;
  creditCash: number;

  transactionProof?: File | string | null;

  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTransactionRequest {
  companyId: string | number;
  unitTransactionId?: number | string | null;
  date: string;
  name: string;
  description?: string;
  debitUSD?: number;
  creditUSD?: number;
  debitIDR?: number;
  creditIDR?: number;
  debitCash?: number;
  creditCash?: number;
  transactionProof?: File | string | null;
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
