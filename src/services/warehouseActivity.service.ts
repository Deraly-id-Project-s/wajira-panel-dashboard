import { apiClient } from '@/lib/api/client';
import { ensureSuccess, LaravelApiResponse } from '@/lib/api/response';

type WarehouseActivityApiModel = {
  id?: string | number;
  warehouse_activity_id?: string | number;
  data?: {
    id?: string | number;
    warehouse_activity_id?: string | number;
  };
};

const warehouseBasePath = '/wapi/warehouse/warehouse-activity';

const extractActivityId = (payload: WarehouseActivityApiModel): string => {
  const candidates = [payload?.id, payload?.warehouse_activity_id, payload?.data?.id, payload?.data?.warehouse_activity_id];
  const resolved = candidates.find((item) => item !== undefined && item !== null && String(item).length > 0);
  return String(resolved ?? '');
};

const readApiError = (error: any): string => {
  const details = error?.details ?? error?.response?.data?.errors;
  if (typeof details === 'string' && details.trim()) return details;

  if (details && typeof details === 'object') {
    const text = Object.entries(details)
      .map(([field, value]) => `${field}: ${Array.isArray(value) ? value[0] : String(value)}`)
      .join(', ')
      .trim();
    if (text) return text;
  }

  return error?.response?.data?.message || error?.message || 'Unexpected server error';
};

const toYmd = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const warehouseActivityService = {
  async createReceiptActivity(payload: {
    unitTransactionId: string;
    warehouseId: string;
    personId?: string;
    description?: string;
    unitTransactionItemId?: string;
    activityDate?: string;
    type?: string;
  }): Promise<string> {
    const unitTransactionId = String(payload.unitTransactionId ?? '').trim();
    const warehouseId = String(payload.warehouseId ?? '').trim();
    const personId = String(payload.personId ?? '').trim();
    const description = String(payload?.description ?? '-');
    const unitTransactionItemId = String(payload.unitTransactionItemId ?? '').trim();

    if (!unitTransactionId) {
      throw new Error('unit_transaction_id wajib diisi sebelum membuat warehouse activity.');
    }
    if (!warehouseId) {
      throw new Error('warehouse_id wajib diisi sebelum membuat warehouse activity.');
    }
    if (!personId) {
      throw new Error('person_id wajib diisi sebelum membuat warehouse activity.');
    }
    if (!unitTransactionItemId) {
      throw new Error('unit_transaction_item_id wajib diisi sebelum membuat warehouse activity.');
    }

    const form = new FormData();
    form.append('warehouse_id', warehouseId);
    form.append('unit_transaction_id', unitTransactionId);
    form.append('activity_type', 'receipt');
    form.append('type', payload.type ?? 'unit-type');
    form.append('description', description);
    form.append('person_id', personId);
    form.append('unit_transaction_item_id', unitTransactionItemId);
    form.append('activity_date', String(payload.activityDate ?? toYmd(new Date())));

    try {
      const response = await apiClient.post<LaravelApiResponse<WarehouseActivityApiModel>>(warehouseBasePath, form);
      const data = ensureSuccess(response.data);
      const activityId = extractActivityId(data as WarehouseActivityApiModel);
      if (!activityId) throw new Error('Gagal mendapatkan ID warehouse activity');
      return activityId;
    } catch (error: any) {
      console.error('[warehouseActivity.createReceiptActivity] failed attempt', {
        attempt: `${warehouseBasePath} [POST]`,
        payload,
        error: readApiError(error),
      });
      throw new Error(readApiError(error));
    }
  },

  async createIssueActivity(payload: {
    unitTransactionId: string;
    warehouseId: string;
    personId?: string;
    unitTransactionItemId?: string;
    activityDate?: string;
    description?: string;
    type?: string;
  }): Promise<string> {
    const unitTransactionId = String(payload.unitTransactionId ?? '').trim();
    const warehouseId = String(payload.warehouseId ?? '').trim();
    const personId = String(payload.personId ?? '').trim();
    const description = String(payload?.description ?? '-');
    const unitTransactionItemId = String(payload.unitTransactionItemId ?? '').trim();

    if (!unitTransactionId) {
      throw new Error('unit_transaction_id wajib diisi sebelum membuat warehouse activity.');
    }
    if (!warehouseId) {
      throw new Error('warehouse_id wajib diisi sebelum membuat warehouse activity.');
    }
    if (!personId) {
      throw new Error('person_id wajib diisi sebelum membuat warehouse activity.');
    }
    if (!unitTransactionItemId) {
      throw new Error('unit_transaction_item_id wajib diisi sebelum membuat warehouse activity.');
    }

    const form = new FormData();
    form.append('warehouse_id', warehouseId);
    form.append('activity_type', 'issue');
    form.append('type', payload.type ?? 'unit-type');
    form.append('description', description);
    form.append('unit_transaction_id', unitTransactionId);
    form.append('state', 'process');
    form.append('person_id', personId);
    form.append('unit_transaction_item_id', unitTransactionItemId);
    form.append('activity_date', String(payload.activityDate ?? toYmd(new Date())));

    try {
      const response = await apiClient.post<LaravelApiResponse<WarehouseActivityApiModel>>(warehouseBasePath, form);
      const data = ensureSuccess(response.data);
      const activityId = extractActivityId(data as WarehouseActivityApiModel);
      if (!activityId) throw new Error('Gagal mendapatkan ID warehouse activity');
      return activityId;
    } catch (error: any) {
      console.error('[warehouseActivity.createIssueActivity] failed attempt', {
        attempt: `${warehouseBasePath} [POST]`,
        payload,
        error: readApiError(error),
      });
      throw new Error(readApiError(error));
    }
  },

  async receiptStock(activityId: string, unitTransactionDetails: Array<string | number>): Promise<void> {
    if (!activityId) {
      throw new Error('warehouse_activity_id wajib diisi sebelum receipt stock.');
    }
    if (!Array.isArray(unitTransactionDetails) || unitTransactionDetails.length === 0) {
      throw new Error('unit_transaction_details wajib diisi sebelum receipt stock.');
    }

    const urlEncodedBody = new URLSearchParams();
    urlEncodedBody.append('unit_transaction_details', JSON.stringify(unitTransactionDetails.map((item) => String(item))));

    try {
      await apiClient.put<LaravelApiResponse<any>>(`${warehouseBasePath}/${activityId}/receipt-stock`, urlEncodedBody, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    } catch (error: any) {
      console.error('[warehouseActivity.receiptStock] failed attempt', {
        attempt: `${warehouseBasePath}/${activityId}/receipt-stock [PUT]`,
        activityId,
        unitTransactionDetails,
        error: readApiError(error),
      });
      throw new Error(readApiError(error));
    }
  },

  async dispatchStock(activityId: string, unitTransactionDetails: Array<string | number>): Promise<void> {
    if (!activityId) {
      throw new Error('warehouse_activity_id wajib diisi sebelum dispatch stock.');
    }
    if (!Array.isArray(unitTransactionDetails) || unitTransactionDetails.length === 0) {
      throw new Error('unit_transaction_details wajib diisi sebelum dispatch stock.');
    }

    const urlEncodedBody = new URLSearchParams();
    urlEncodedBody.append('unit_transaction_details', JSON.stringify(unitTransactionDetails.map((item) => String(item))));

    try {
      await apiClient.put<LaravelApiResponse<any>>(`${warehouseBasePath}/${activityId}/dispatch-stock`, urlEncodedBody, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    } catch (error: any) {
      console.error('[warehouseActivity.dispatchStock] failed attempt', {
        attempt: `${warehouseBasePath}/${activityId}/dispatch-stock [PUT]`,
        activityId,
        unitTransactionDetails,
        error: readApiError(error),
      });
      throw new Error(readApiError(error));
    }
  },
};
