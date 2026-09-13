import { getDoInvoicesList } from '@/services/do-invoice.service';
import type { DoInvoiceListParams, DoInvoiceListResponse } from '@/@types/do-invoice.types';
import type { PaginationParams } from '@/@types/pagination.types';

export interface InvoiceReportParams extends PaginationParams, DoInvoiceListParams {}

export const getInvoiceReport = async (params: InvoiceReportParams): Promise<DoInvoiceListResponse> => {
  return getDoInvoicesList(params);
};
