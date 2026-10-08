import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unitTransactionService } from '@/services/unitTransaction.service';
import { useCompany } from '@/contexts/CompanyContext';
import { companyQueryKeys } from '@/lib/query/company-key';
import { toast } from 'sonner';

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
  typeDetails: (companyId: string | number, id: string, page: number, perPage: number, filters?: Record<string, any>) =>
    companyQueryKeys.list(companyId, 'unit-transaction-type-details', { id, page, perPage, ...filters }),
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
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(companyId),
  });
};

export const useUnitTransactionDetail = (id?: string) => {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: companyId ? unitTransactionKeys.detail(companyId, id ?? '') : ['unit-transaction', 'unscoped', id],
    queryFn: () => unitTransactionService.getUnitTransactionDetail(id as string, companyId ?? undefined),
    enabled: !!id && Boolean(companyId),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    staleTime: 1000 * 60 * 5,
  });
};

export const usePurchaseById = (id?: string) => {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: companyId ? unitTransactionKeys.purchaseDetail(companyId, id ?? '') : ['purchase-by-id', 'unscoped', id],
    queryFn: () => unitTransactionService.getUnitTransactionDetail(id as string, companyId ?? undefined),
    enabled: !!id && Boolean(companyId),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    staleTime: 1000 * 60 * 5,
  });
};

export const useUnitTransactionTypeDetails = (
  id?: string,
  options: {
    page?: number;
    perPage?: number;
    search?: string;
    status?: string;
    in_stock?: boolean | string;
  } = {},
) => {
  const { companyId } = useCompany();
  const page = options.page ?? 1;
  const perPage = options.perPage ?? 10;
  const search = options.search;
  const status = options.status;
  const in_stock = options.in_stock;

  return useQuery({
    queryKey: companyId
      ? unitTransactionKeys.typeDetails(companyId, id ?? '', page, perPage, { search, status, in_stock })
      : ['unit-transaction-type-details', 'unscoped', id, page, perPage, search, status, in_stock],
    queryFn: () =>
      unitTransactionService.getUnitTransactionTypeDetails(id as string, {
        page,
        perPage,
        search,
        status,
        in_stock,
      }),
    enabled: Boolean(id) && Boolean(companyId),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 5,
  });
};

export const useExportUnitTypeDetails = () => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (
    transactionId: string | number,
    transactionCode?: string,
    filters?: { search?: string; status?: string; in_stock?: boolean | string },
  ) => {
    try {
      setIsExporting(true);
      const blob = await unitTransactionService.exportUnitTypeDetails(transactionId, filters);

      const downloadUrl = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      const cleanCode = transactionCode ? String(transactionCode).replace(/[\/\\]/g, '-') : String(transactionId);
      link.setAttribute('download', `unit_type_details_${cleanCode}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('File Excel berhasil diunduh');
    } catch (error: any) {
      console.error('Gagal mengunduh data export unit type details:', error);
      let errorMessage = 'Gagal mengunduh data export unit type details';
      if (error?.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          if (json?.message) errorMessage = json.message;
        } catch {
          // ignore
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  return { handleExport, isExporting };
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

export const useUpdateUnitTransactionDocumentTemplate = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: ({ id, documentTemplateId }: { id: string; documentTemplateId: string | number | null }) =>
      unitTransactionService.updateDocumentTemplate(id, documentTemplateId),
    onSuccess: (data) => {
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
        queryClient.invalidateQueries({ queryKey: unitTransactionKeys.detail(companyId, data.id) });
        queryClient.invalidateQueries({ queryKey: unitTransactionKeys.purchaseDetail(companyId, data.id) });
      }
      queryClient.invalidateQueries({ queryKey: ['sales-transaction', data.id] });
      queryClient.invalidateQueries({ queryKey: ['sales-transactions'] });
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

export const useFewerStockItems = (params: {
  type?: string;
  unit_type_id?: number | string;
  search?: string;
  start_date?: string;
  end_date?: string;
  per_page?: number;
  page?: number;
} = {}, enabled = true) => {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ['fewer-stock-items', companyId, params],
    queryFn: () =>
      unitTransactionService.getFewerStockItems({
        ...params,
        company_id: companyId ?? undefined,
      }),
    enabled: enabled && Boolean(params.type) && Boolean(params.unit_type_id),
    staleTime: 0,
  });
};

export const useAssignFewerStockItems = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: ({
      sourceTransactionId,
      payload,
    }: {
      sourceTransactionId: string | number;
      payload: {
        unit_transaction_id: number | string;
        unit_transaction_item_details_id: Array<number | string>;
      };
    }) => unitTransactionService.assignFewerStockItems(sourceTransactionId, payload),
    onSuccess: () => {
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
      }
      queryClient.invalidateQueries({ queryKey: ['unit-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['unit-transaction'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-by-id'] });
      queryClient.invalidateQueries({ queryKey: ['sales-by-id'] });
      queryClient.invalidateQueries({ queryKey: ['unit-item-details'] });
      queryClient.invalidateQueries({ queryKey: ['unit-transaction-item'] });
      queryClient.invalidateQueries({ queryKey: ['unit-item-details-by-transaction'] });
      queryClient.invalidateQueries({ queryKey: ['stock-units'] });
      queryClient.invalidateQueries({ queryKey: ['fewer-stock-items'] });
    },
  });
};
