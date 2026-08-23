import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unitTransactionService } from '@/services/unitTransaction.service';
import { useCompany } from '@/contexts/CompanyContext';
import { companyQueryKeys } from '@/lib/query/company-key';

const unitTransactionKeys = {
  list: (companyId: string | number, options: { page?: number; perPage?: number; search?: string; status?: string; start_date?: string | null; end_date?: string | null }) =>
    companyQueryKeys.list(companyId, 'unit-transactions', {
      page: options.page,
      perPage: options.perPage,
      search: options.search,
      status: options.status,
      start_date: options.start_date,
      end_date: options.end_date,
    }),
  detail: (companyId: string | number, id: string) => companyQueryKeys.detail(companyId, 'unit-transactions', id),
  purchaseDetail: (companyId: string | number, id: string) => companyQueryKeys.detail(companyId, 'purchase-by-id', id),
  typeDetails: (companyId: string | number, id: string, page: number, perPage: number) =>
    companyQueryKeys.list(companyId, 'unit-transaction-type-details', { id, page, perPage }),
};

export const useUnitTransactions = (options: { page?: number; perPage?: number; search?: string; status?: string; start_date?: string | null; end_date?: string | null } = {}) => {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: companyId ? unitTransactionKeys.list(companyId, options) : ['unit-transactions', 'unscoped', options],
    queryFn: () => unitTransactionService.getUnitTransactions({
      page: options.page,
      perPage: options.perPage,
      search: options.search,
      status: options.status,
      start_date: options.start_date,
      end_date: options.end_date,
      company_id: companyId ?? undefined
    }),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
    refetchInterval: 30_000,
    staleTime: 0,
    enabled: Boolean(companyId),
  });
};

export const useUnitTransactionDetail = (id?: string) => {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: companyId ? unitTransactionKeys.detail(companyId, id ?? '') : ['unit-transaction', 'unscoped', id],
    queryFn: () => unitTransactionService.getUnitTransactionDetail(id as string, companyId ?? undefined),
    enabled: !!id && Boolean(companyId),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
    refetchInterval: 30_000,
    staleTime: 0,
  });
};

export const usePurchaseById = (id?: string) => {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: companyId ? unitTransactionKeys.purchaseDetail(companyId, id ?? '') : ['purchase-by-id', 'unscoped', id],
    queryFn: () => unitTransactionService.getUnitTransactionDetail(id as string, companyId ?? undefined),
    enabled: !!id && Boolean(companyId),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
    refetchInterval: 30_000,
    staleTime: 0,
  });
};

export const useUnitTransactionTypeDetails = (
  id?: string,
  options: { page?: number; perPage?: number } = {},
) => {
  const { companyId } = useCompany();
  const page = options.page ?? 1;
  const perPage = options.perPage ?? 10;

  return useQuery({
    queryKey: companyId
      ? unitTransactionKeys.typeDetails(companyId, id ?? '', page, perPage)
      : ['unit-transaction-type-details', 'unscoped', id, page, perPage],
    queryFn: () => unitTransactionService.getUnitTransactionTypeDetails(id as string, { page, perPage }),
    enabled: Boolean(id) && Boolean(companyId),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
    staleTime: 0,
  });
};

export const useUpdateUnitTransactionState = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: ({
      id,
      stockState,
      unitTransactionDetails,
      cashId,
      description,
    }: {
      id: string;
      stockState?: string;
      unitTransactionDetails?: Array<string | number>;
      cashId?: string | number;
      description?: string;
    }) =>
      unitTransactionService.updateUnitTransactionState(id, {
        stockState,
        unitTransactionDetails,
        cashId,
        description,
      }),
    onSuccess: (data) => {
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
        queryClient.invalidateQueries({ queryKey: unitTransactionKeys.detail(companyId, data.id) });
        queryClient.invalidateQueries({ queryKey: unitTransactionKeys.purchaseDetail(companyId, data.id) });
      }
      queryClient.invalidateQueries({ queryKey: ['unit-billings', data.id] });
      queryClient.invalidateQueries({ queryKey: ['unit-billing-current', data.id] });
      queryClient.invalidateQueries({ queryKey: ['unit-billing-history', '', data.id] });
      queryClient.invalidateQueries({ queryKey: ['purchase-unit-items', data.id] });
      queryClient.invalidateQueries({ queryKey: ['sales-by-id'] });
    },
  });
};

export const useSubmitTransactionAdjustment = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { cashId: string; amount: number; description: string; itemDetailIds: string[] } }) =>
      unitTransactionService.submitTransactionAdjustment(id, payload),
    onSuccess: (_data, variables) => {
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
        queryClient.invalidateQueries({ queryKey: unitTransactionKeys.detail(companyId, variables.id) });
        queryClient.invalidateQueries({ queryKey: unitTransactionKeys.purchaseDetail(companyId, variables.id) });
      }
      queryClient.invalidateQueries({ queryKey: ['unit-transaction', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['transaction-adjustments', variables.id] });
    },
  });
};

export const useTransactionAdjustments = (transactionId?: string) => {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: companyId ? companyQueryKeys.detail(companyId, 'transaction-adjustments', transactionId ?? '') : ['transaction-adjustments', 'unscoped', transactionId],
    queryFn: () => unitTransactionService.getTransactionAdjustments(transactionId as string, companyId ?? undefined),
    enabled: !!transactionId && Boolean(companyId),
    staleTime: 1000 * 60 * 2,
  });
};
