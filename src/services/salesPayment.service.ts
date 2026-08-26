import { UpsertUnitBillingPayload, UnitBilling } from '@/types/unit-billing.types';
import { apiClient } from '@/lib/api/client';
import { ensureSuccess, LaravelApiResponse } from '@/lib/api/response';
import { unitBillingService } from '@/services/unitBilling.service';

type ItemDetailApiModel = {
  id?: string | number;
  price?: string | number;
  unit_transaction_item?: {
    price?: string | number;
  };
};

export type PaymentTransactionItem = {
  id: string;
  price: number;
  qty: number;
};

const itemDetailBasePath = '/wapi/transaction/unit-transaction-item-detail';
const itemDetailLegacyPath = '/wapi/transaction/unit-transaction/unit-transaction-item-detail';

const toNumber = (value: unknown): number => {
  const normalized = Number(value ?? 0);
  return Number.isFinite(normalized) ? normalized : 0;
};

const shouldFallback = (error: any): boolean => {
  const statusCode = error?.statusCode ?? error?.response?.status;
  return statusCode === 404 || statusCode === 405;
};

const withPathFallback = async <T>(primary: () => Promise<T>, legacy: () => Promise<T>): Promise<T> => {
  try {
    return await primary();
  } catch (error) {
    if (!shouldFallback(error)) throw error;
    return legacy();
  }
};

const mapItem = (item: ItemDetailApiModel): PaymentTransactionItem => ({
  id: String(item.id ?? ''),
  price: toNumber(item.unit_transaction_item?.price ?? item.price),
  qty: 1,
});

const normalizeItems = (payload: any): ItemDetailApiModel[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

export const salesPaymentService = {
  async getTransactionItemsDetail(unitTransactionId: string): Promise<PaymentTransactionItem[]> {
    const response = await withPathFallback(
      () =>
        apiClient.get<LaravelApiResponse<any>>(itemDetailBasePath, {
          params: {
            unit_transaction_id: unitTransactionId,
          },
        }),
      () =>
        apiClient.get<LaravelApiResponse<any>>(itemDetailLegacyPath, {
          params: {
            unit_transaction_id: unitTransactionId,
          },
        }),
    );

    const payload = ensureSuccess(response.data);
    return normalizeItems(payload)
      .map(mapItem)
      .filter((item) => item.id.length > 0);
  },

  async createBilling(payload: UpsertUnitBillingPayload): Promise<UnitBilling> {
    return unitBillingService.createBilling(payload);
  },

  async updateBilling(id: string, payload: UpsertUnitBillingPayload): Promise<UnitBilling> {
    return unitBillingService.updateBilling(id, payload);
  },
};
