import { apiClient } from '@/lib/api/client';
import { ensureSuccess, LaravelApiResponse } from '@/lib/api/response';

export const unitTransactionItemSalesService = {
  async getUnitItemById(itemId: string) {
    const response = await apiClient.get<LaravelApiResponse<any>>(
      `/wapi/transaction/unit-transaction/unit-transaction-item/${itemId}`
    );
    return ensureSuccess(response.data);
  },

  async getStockByUnitType(unitTypeId: string, companyId: string) {
    const response = await apiClient.get<LaravelApiResponse<any>>(
      `/wapi/master-data/unit-type/${unitTypeId}`,
      {
        params: {
          company_id: companyId,
          in_stock: 'true',
          stock_state: 'receipt'
        },
      }
    );
    const result = ensureSuccess(response.data);
    const data = result?.data ?? result;
    const details = data?.unit_item_details?.data ?? [];
    return details.map((detail: any) => ({
      id: Number(detail.id ?? 0),
      color: String(detail.color ?? '-'),
      machine_number: String(detail.machine_number ?? '-'),
      chassis_number: String(detail.chassis_number ?? '-'),
      in_stock: detail.in_stock === true || detail.in_stock === 1 || detail.in_stock === '1',
      status: String(detail.status ?? ''),
      warehouse_sub_block: detail.warehouse_sub_block,
      stock_state: detail.stock_state ?? null,
      is_reserved: detail.is_reserved === true || detail.is_reserved === 1 || detail.is_reserved === '1',
      source_transaction_before_id: detail.source_transaction_before_id ?? detail.source_transaction_before?.id ?? null,
      source_transaction_before: detail.source_transaction_before ?? null,
      unit_transaction_item_sales: detail.unit_transaction_item_sales ?? null,
    }));
  },

  async assignStock(payload: { unitTransactionItemId: string; unitTransactionDetails: number[]; isUpdate?: boolean }) {
    const response = await apiClient.post<LaravelApiResponse<any>>(
      `/wapi/transaction/unit-transaction/unit-transaction-item-sales`,
      {
        unit_transaction_item_id: Number(payload.unitTransactionItemId),
        unit_transaction_details: payload.unitTransactionDetails,
      }
    );
    return ensureSuccess(response.data);
  },

  async dispatchStockInit(transactionId: string, options: { personId: string; warehouseId: string; activityType: string }) {
    const form = new FormData();
    form.append('warehouse_id', options.warehouseId);
    form.append('activity_type', options.activityType);
    form.append('unit_transaction_id', transactionId);
    form.append('person_id', options.personId);
    form.append('activity_date', new Date().toISOString().split('T')[0]);

    const response = await apiClient.post<LaravelApiResponse<any>>('/wapi/warehouse/warehouse-activity', form);
    const result = ensureSuccess(response.data);
    const resolved = result?.id ?? result?.warehouse_activity_id ?? result?.data?.id ?? result?.data?.warehouse_activity_id;
    return String(resolved ?? '');
  },

  async dispatchStockConfirm(activityId: string, unitTransactionDetails: number[]) {
    const urlEncodedBody = new URLSearchParams();
    urlEncodedBody.append('unit_transaction_details', JSON.stringify(unitTransactionDetails.map(String)));

    await apiClient.put(`/wapi/warehouse/warehouse-activity/${activityId}/dispatch-stock`, urlEncodedBody, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }
};
