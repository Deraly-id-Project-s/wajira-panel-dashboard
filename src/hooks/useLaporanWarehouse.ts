import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  getStockData,
  getStockDetailData,
  getOrderOutstanding,
} from '@/services/laporan-warehouse.service';

export const useGetWarehouseStock = (params: { company_id?: number; page?: number; per_page?: number; search?: string; status?: string }) => {
  return useQuery({
    queryKey: ['warehouse-stock', params],
    queryFn: () => getStockData(params),
    placeholderData: keepPreviousData,
  });
};

export const useGetWarehouseStockDetail = (params: {
  warehouse_id?: number;
  company_id?: number | string | undefined;
  page?: number;
  per_page?: number;
  search?: string;
  machine_number?: string;
  chassis_number?: string;
  color?: string;
  stock_state?: string;
  in_stock?: boolean | string;
  is_forecast?: boolean | string;
  is_sold_unit?: boolean | string;
  unit_transaction_item_id?: string;
}) => {
  return useQuery({
    queryKey: ['warehouse-stock-detail', params],
    queryFn: () => getStockDetailData(params),
    placeholderData: keepPreviousData,
  });
};

export const useGetWarehouseOutstanding = (params: {
  warehouse_id?: number;
  type: 'purchase' | 'sales';
  page?: number;
  per_page?: number;
  qty_outstanding?: boolean | string;
  order_by?: string;
  order_sort?: 'asc' | 'desc';
}) => {
  return useQuery({
    queryKey: ['warehouse-outstanding', params],
    queryFn: () => getOrderOutstanding(params),
    placeholderData: keepPreviousData,
  });
};
