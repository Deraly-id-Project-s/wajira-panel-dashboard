import type {
  UJDriverItem,
  CreateUJDriverPaymentPayload,
  UJDriverFilterParams,
  UJDriverPaginationResponse
} from '@/types/uj-driver.types';
import { apiClient } from '@/lib/api/client';
import { ApiValidationError, ensureSuccess, type LaravelApiResponse } from '@/lib/api/response';

const BASE_PATH = '/wapi/transaction/do-expedition';
const PAYMENT_PATH = '/wapi/finance/uj-driver-billing-payment';

export const getUJDriverList = async (params: UJDriverFilterParams): Promise<UJDriverPaginationResponse<UJDriverItem>['data']> => {
  const response = await apiClient.get<UJDriverPaginationResponse<any>>(BASE_PATH, {
    params: {
      search: params.search?.trim() || undefined,
      order_by: params.order_by ?? 'created_at',
      order_sort: params.order_sort ?? 'desc',
      page: params.page ?? 1,
      per_page: params.per_page ?? 10,
      do_order_list_id: params.do_order_list_id,
      with_driver: params.with_driver,
    },
  });

  const payload = ensureSuccess(response.data as unknown as LaravelApiResponse<any>);
  
  return {
    current_page: payload.current_page || 1,
    data: (payload.data || []).map((item: any) => ({
      ...item,
      // Ensure nested objects are null if undefined to match the type
      vehicle: item.vehicle || null,
      driver: item.driver || null,
      order_list: item.order_list || null,
      uj_driver_billing_payment: item.uj_driver_billing_payment || null,
    })),
    from: payload.from || 0,
    last_page: payload.last_page || 1,
    per_page: payload.per_page || 10,
    to: payload.to || 0,
    total: payload.total || 0,
    links: payload.links,
    next_page_url: payload.next_page_url,
    prev_page_url: payload.prev_page_url,
  };
};

export const createUJDriverBillingPayment = async (payload: CreateUJDriverPaymentPayload): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('do_expedition_id', String(payload.do_expedition_id));
    formData.append('cash_id', String(payload.cash_id));
    formData.append('amount', String(payload.amount));

    const response = await apiClient.post<LaravelApiResponse<any>>(PAYMENT_PATH, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return ensureSuccess(response.data);
  } catch (error) {
    if (error instanceof ApiValidationError) throw error;
    throw error;
  }
};
