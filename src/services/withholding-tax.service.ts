import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, ApiValidationError, ensureSuccess, type LaravelApiResponse, toPaginatedResult } from '@/lib/api/response';
import type {
  WithholdingTaxItem,
  WithholdingTaxListParams,
  WithholdingTaxListResponse,
  WithholdingTaxPayload,
} from '@/types/withholding-tax.types';

// Separate base paths for finance and transaction
// const financeBasePath = '/wapi/finance/withholding-tax';
const transactionBasePath = '/wapi/transaction/withholding-tax';

const mapWithholdingTax = (item: any): WithholdingTaxItem => {
  return {
    id: Number(item.id ?? 0),
    company_id: item.company_id ? Number(item.company_id) : null,
    source: item.source ?? 'internal',
    cash_id: item.cash_id ? Number(item.cash_id) : null,
    unit_transaction_id: item.unit_transaction_id ? Number(item.unit_transaction_id) : null,
    bbn_bill_id: item.bbn_bill_id ? Number(item.bbn_bill_id) : null,
    do_invoice_id: item.do_invoice_id ? Number(item.do_invoice_id) : null,
    withholding_number: item.withholding_number ?? null,
    withholding_age: item.withholding_age ? Number(item.withholding_age) : null,
    pph_amount: item.pph_amount ? Number(item.pph_amount) : null,
    pph_description: item.pph_description ?? null,
    payment_amount: item.payment_amount ? Number(item.payment_amount) : null,
    payment_date: item.payment_date ?? null,
    no_invoice: item.no_invoice ?? null,
    created_at: item.created_at ?? null,
    updated_at: item.updated_at ?? null,
    company: item.company,
    cash: item.cash,
    unit_transaction: item.unit_transaction,
    bbn_bill: item.bbn_bill,
    do_invoice: item.do_invoice,
  };
};



export const getWithholdingTaxList = async (params: WithholdingTaxListParams): Promise<WithholdingTaxListResponse> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(transactionBasePath, {
    params: {
      ...buildLaravelPaginationQuery(params),
      source: params.source,
      company_id: params.company_id,
      cash_id: params.cash_id,
      withholding_number: params.withholding_number,
      withholding_age: params.withholding_age,
      pph_amount: params.pph_amount,
      pph_description: params.pph_description,
      payment_amount: params.payment_amount,
      payment_date: params.payment_date,
      no_invoice: params.no_invoice,
      order_by: params.order_by ?? 'created_at',
      order_dir: params.order_dir ?? 'desc',
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
    },
  });

  const payload = ensureSuccess(response.data);
  return toPaginatedResult(payload, mapWithholdingTax);
};

export const getWithholdingTaxDetail = async (id: string | number): Promise<WithholdingTaxItem> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(`${transactionBasePath}/${id}`);
  return mapWithholdingTax(ensureSuccess(response.data));
};

export const createWithholdingTax = async (payload: WithholdingTaxPayload): Promise<WithholdingTaxItem> => {
  try {
    const data = new URLSearchParams();
    
    if (payload.source) data.append('source', payload.source);
    if (payload.cash_id != null) data.append('cash_id', String(payload.cash_id));
    if (payload.unit_transaction_id != null) data.append('unit_transaction_id', String(payload.unit_transaction_id));
    if (payload.withholding_number) data.append('withholding_number', payload.withholding_number);
    if (payload.withholding_age != null && !Number.isNaN(payload.withholding_age)) data.append('withholding_age', String(payload.withholding_age));
    if (payload.pph_amount != null && !Number.isNaN(payload.pph_amount)) data.append('pph_amount', String(payload.pph_amount));
    if (payload.pph_description) data.append('pph_description', payload.pph_description);
    if (payload.payment_amount != null && !Number.isNaN(payload.payment_amount)) data.append('payment_amount', String(payload.payment_amount));
    if (payload.payment_date) data.append('payment_date', payload.payment_date);
    if (payload.no_invoice) data.append('no_invoice', payload.no_invoice);
    if (payload.company_id != null) data.append('company_id', String(payload.company_id));

    const response = await apiClient.post<LaravelApiResponse<any>>(transactionBasePath, data, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return mapWithholdingTax(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const updateWithholdingTax = async (id: string | number, payload: WithholdingTaxPayload): Promise<WithholdingTaxItem> => {
  try {
    const data = new URLSearchParams();
    
    if (payload.source) data.append('source', payload.source);
    if (payload.cash_id != null) data.append('cash_id', String(payload.cash_id));
    if (payload.unit_transaction_id != null) data.append('unit_transaction_id', String(payload.unit_transaction_id));
    if (payload.withholding_number) data.append('withholding_number', payload.withholding_number);
    if (payload.withholding_age != null && !Number.isNaN(payload.withholding_age)) data.append('withholding_age', String(payload.withholding_age));
    if (payload.pph_amount != null && !Number.isNaN(payload.pph_amount)) data.append('pph_amount', String(payload.pph_amount));
    if (payload.pph_description) data.append('pph_description', payload.pph_description);
    if (payload.payment_amount != null && !Number.isNaN(payload.payment_amount)) data.append('payment_amount', String(payload.payment_amount));
    if (payload.payment_date) data.append('payment_date', payload.payment_date);
    if (payload.no_invoice) data.append('no_invoice', payload.no_invoice);
    if (payload.company_id != null) data.append('company_id', String(payload.company_id));

    const response = await apiClient.put<LaravelApiResponse<any>>(`${transactionBasePath}/${id}`, data, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return mapWithholdingTax(ensureSuccess(response.data));
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};

export const deleteWithholdingTax = async (id: string | number): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<null>>(`${transactionBasePath}/${id}`);
  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Failed to delete withholding tax data');
  }
};
