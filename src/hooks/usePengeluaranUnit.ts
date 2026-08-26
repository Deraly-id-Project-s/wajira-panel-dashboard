import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DispatchUnitTableParams, PengeluaranUnitListParams, SavePengeluaranUnitPayload } from '@/types/pengeluaran-unit.types';
import {
  createPengeluaranUnit,
  dispatchPengeluaranStock,
  getCustomerOptions,
  getDispatchUnitRows,
  getPengeluaranUnitById,
  getPengeluaranUnits,
  getSupplierOptions,
  getWarehouseOptions,
  updatePengeluaranUnit,
} from '@/services/pengeluaran-unit.service';

const pengeluaranUnitKeys = {
  all: ['pengeluaran-unit'] as const,
  list: (params: PengeluaranUnitListParams) => ['pengeluaran-unit', 'list', params] as const,
  detail: (id: string | number) => ['pengeluaran-unit', 'detail', String(id)] as const,
  warehouses: ['pengeluaran-unit', 'warehouse-options'] as const,
  customers: ['pengeluaran-unit', 'customer-options'] as const,
  suppliers: ['pengeluaran-unit', 'supplier-options'] as const,
  dispatchTable: (params: DispatchUnitTableParams) => ['pengeluaran-unit', 'dispatch-table', params] as const,
};

export const usePengeluaranUnits = (params: PengeluaranUnitListParams) =>
  useQuery({
    queryKey: pengeluaranUnitKeys.list(params),
    queryFn: () => getPengeluaranUnits(params),
    retry: 2,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });

export const usePengeluaranUnitById = (id?: string | number) =>
  useQuery({
    queryKey: pengeluaranUnitKeys.detail(String(id ?? '')),
    queryFn: () => getPengeluaranUnitById(id as string | number),
    enabled: Boolean(id),
    retry: 2,
  });

export const useWarehouseOptions = () =>
  useQuery({
    queryKey: pengeluaranUnitKeys.warehouses,
    queryFn: getWarehouseOptions,
    retry: 2,
    staleTime: 60_000,
  });

export const useCustomerOptions = () =>
  useQuery({
    queryKey: pengeluaranUnitKeys.customers,
    queryFn: getCustomerOptions,
    retry: 2,
    staleTime: 60_000,
  });

export const useSupplierOptions = () =>
  useQuery({
    queryKey: pengeluaranUnitKeys.suppliers,
    queryFn: getSupplierOptions,
    retry: 2,
    staleTime: 60_000,
  });

export const useDispatchUnitRows = (params: DispatchUnitTableParams) =>
  useQuery({
    queryKey: pengeluaranUnitKeys.dispatchTable(params),
    queryFn: () => getDispatchUnitRows(params),
    retry: 2,
    staleTime: 15_000,
    placeholderData: (previousData) => previousData,
  });

export const useCreatePengeluaranUnit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SavePengeluaranUnitPayload) => createPengeluaranUnit(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pengeluaranUnitKeys.all });
    },
  });
};

export const useUpdatePengeluaranUnit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: SavePengeluaranUnitPayload }) => updatePengeluaranUnit(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pengeluaranUnitKeys.all });
      queryClient.invalidateQueries({ queryKey: pengeluaranUnitKeys.detail(variables.id) });
    },
  });
};

export const useDispatchPengeluaranStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ warehouseActivityId, detailIds }: { warehouseActivityId: number | string; detailIds: number[] }) => dispatchPengeluaranStock(warehouseActivityId, detailIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pengeluaran-unit', 'dispatch-table'] });
      queryClient.invalidateQueries({ queryKey: pengeluaranUnitKeys.detail(variables.warehouseActivityId) });
      queryClient.invalidateQueries({ queryKey: pengeluaranUnitKeys.all });
    },
  });
};

export { pengeluaranUnitKeys };
