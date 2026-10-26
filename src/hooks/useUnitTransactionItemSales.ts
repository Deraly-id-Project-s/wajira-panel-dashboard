import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unitTransactionItemSalesService } from '@/services/unitTransactionItemSales.service';

export const useStockUnits = (itemId?: string, options?: { companyId?: string; unitTypeIdFallback?: string }) => {
  const isValidId = !!itemId && itemId !== 'unit' && itemId !== 'undefined' && itemId !== 'null' && itemId.trim() !== '';
  const unitItemQuery = useQuery({
    queryKey: ['unit-transaction-item', itemId ?? ''],
    queryFn: () => unitTransactionItemSalesService.getUnitItemById(itemId as string),
    enabled: isValidId,
    staleTime: 1000 * 60,
  });

  const resolvedUnitTypeId = unitItemQuery.data?.unit_type_id || options?.unitTypeIdFallback || '';

  const stockQuery = useQuery({
    queryKey: ['stock-units', itemId ?? '', resolvedUnitTypeId, options?.companyId ?? '1'],
    queryFn: () => unitTransactionItemSalesService.getStockByUnitType(resolvedUnitTypeId, options?.companyId ?? '1'),
    enabled: !!itemId && !!resolvedUnitTypeId,
    staleTime: 1000 * 30,
  });

  return {
    unitItem: unitItemQuery.data,
    stockUnits: stockQuery.data ?? [],
    isUnitItemLoading: unitItemQuery.isLoading,
    isStockLoading: stockQuery.isLoading,
    isLoading: unitItemQuery.isLoading || stockQuery.isLoading,
    isUnitItemError: unitItemQuery.isError,
    isStockError: stockQuery.isError,
    unitItemError: unitItemQuery.error,
    stockError: stockQuery.error,
  };
};

export const useAssignUnitItemSales = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { unitTransactionItemId: string | number; unitTransactionDetails: number[]; isUpdate?: boolean }) =>
      unitTransactionItemSalesService.assignStock(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stock-units', String(variables.unitTransactionItemId)] });
      queryClient.invalidateQueries({ queryKey: ['unit-transaction-item', String(variables.unitTransactionItemId)] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-stock-units'] });
      queryClient.invalidateQueries({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey.includes('sales-transactions'),
      });
      queryClient.invalidateQueries({ queryKey: ['purchase-unit-items'] });
    },
  });
};

export const useBulkDeleteUnitItemSales = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { salesIds: number[]; unitTransactionItemId?: string | number }) =>
      unitTransactionItemSalesService.bulkDeleteSales(payload.salesIds),
    onSuccess: (_data, variables) => {
      if (variables.unitTransactionItemId) {
        queryClient.invalidateQueries({ queryKey: ['unit-transaction-item', String(variables.unitTransactionItemId)] });
        queryClient.invalidateQueries({ queryKey: ['stock-units', String(variables.unitTransactionItemId)] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['unit-transaction-item'] });
        queryClient.invalidateQueries({ queryKey: ['stock-units'] });
      }
      queryClient.invalidateQueries({ queryKey: ['unassigned-stock-units'] });
      queryClient.invalidateQueries({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey.includes('sales-transactions'),
      });
      queryClient.invalidateQueries({ queryKey: ['purchase-unit-items'] });
    },
  });
};

export const useUnassignedStockUnits = (params: {
  unitTypeId?: string | number;
  companyId?: string | number;
  unitTransactionItemId?: string | number;
  search?: string;
  page?: number;
  perPage?: number;
  enabled?: boolean;
}) => {
  const isEnabled = (params.enabled ?? true) && Boolean(params.unitTypeId) && Boolean(params.unitTransactionItemId);

  return useQuery({
    queryKey: [
      'unassigned-stock-units',
      String(params.unitTypeId ?? ''),
      String(params.companyId ?? '1'),
      String(params.unitTransactionItemId ?? ''),
      params.search ?? '',
      params.page ?? 1,
      params.perPage ?? 10,
    ],
    queryFn: async () => {
      const response = await unitTransactionItemSalesService.getUnassignedStockByUnitType({
        unitTypeId: params.unitTypeId!,
        companyId: params.companyId ?? '1',
        unitTransactionItemId: params.unitTransactionItemId!,
        search: params.search,
        page: params.page ?? 1,
        perPage: params.perPage ?? 10,
      });
      return response?.data ?? response;
    },
    enabled: isEnabled,
    staleTime: 1000 * 15,
  });
};

export const useDispatchStockLifecycle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      transactionId: string;
      personId: string;
      warehouseId: string;
      unitTransactionDetails: number[];
    }) => {
      const activityId = await unitTransactionItemSalesService.dispatchStockInit(payload.transactionId, {
        personId: payload.personId,
        warehouseId: payload.warehouseId,
        activityType: 'issue',
      });

      if (!activityId) {
        throw new Error('Warehouse activity tidak ditemukan saat dispatch');
      }

      await unitTransactionItemSalesService.dispatchStockConfirm(activityId, payload.unitTransactionDetails);
      return { activityId };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey.includes('sales-transactions'),
      });
      queryClient.invalidateQueries({ queryKey: ['purchase-unit-items', variables.transactionId] });
      queryClient.invalidateQueries({ queryKey: ['stock-units'] });
    },
  });
};
