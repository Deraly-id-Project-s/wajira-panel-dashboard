import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { refundAdministrasiService } from '@/services/refund-administrasi.service';
import { useCompany } from '@/contexts/CompanyContext';
import { companyQueryKeys } from '@/lib/query/company-key';
import { CreateRefundPayload, CreateRefundPaymentPayload, UpdateRefundPayload, UpdateRefundPaymentPayload } from '@/types/refund.type';
import type { UnitTransactionItemDetail } from '@/types/unit-transaction.types';

const refundAdministrasiKeys = {
  list: (companyId: string | number, options: { page?: number; perPage?: number; search?: string; unit_transaction_id?: string }) =>
    companyQueryKeys.list(companyId, 'administrasi-refund-list', { page: options.page, perPage: options.perPage, search: options.search, unit_transaction_id: options.unit_transaction_id }),
  detail: (companyId: string | number, refundId: string) =>
    companyQueryKeys.detail(companyId, 'administrasi-refund-detail', refundId),
  itemDetails: (companyId: string | number, options: { page?: number; perPage?: number; search?: string }) =>
    companyQueryKeys.list(companyId, 'transaction-item-details', { page: options.page, perPage: options.perPage, search: options.search }),
  transactionDetail: (companyId: string | number, transactionId: string) =>
    companyQueryKeys.detail(companyId, 'refund-transaction-detail', transactionId),
};

export const useRefundList = (options: { page?: number; perPage?: number; search?: string; unit_transaction_id?: string } = {}) => {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: companyId
      ? refundAdministrasiKeys.list(companyId, options)
      : ['administrasi-refund-list', 'unscoped', options],
    queryFn: () => refundAdministrasiService.getRefundList({ page: options.page, per_page: options.perPage, search: options.search, unit_transaction_id: options.unit_transaction_id }),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(companyId),
  });
};

export const useCreateRefund = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: (payload: CreateRefundPayload) => refundAdministrasiService.createRefund({
      company_id: payload.company_id ?? companyId ?? undefined,
      ...payload
    }),
    onSuccess: () => {
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
      } else {
        queryClient.invalidateQueries({ queryKey: ['administrasi-refund-list'] });
      }
    },
  });
};

export const useUpdateRefund = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRefundPayload }) => refundAdministrasiService.updateRefund(id, {
      company_id: payload.company_id ?? companyId ?? undefined,
      ...payload
    }),
    onSuccess: () => {
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
      } else {
        queryClient.invalidateQueries({ queryKey: ['administrasi-refund-list'] });
      }
    },
  });
};

export const useDeleteRefund = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: (payload: string | { id: string, deleteFinanceRefund?: boolean }) => {
      if (typeof payload === 'string') {
        return refundAdministrasiService.deleteRefund(payload);
      }
      return refundAdministrasiService.deleteRefund(payload.id, payload.deleteFinanceRefund);
    },
    onSuccess: () => {
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
      } else {
        queryClient.invalidateQueries({ queryKey: ['administrasi-refund-list'] });
      }
    },
  });
};

export const useCreateRefundPayment = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: (payload: CreateRefundPaymentPayload) => refundAdministrasiService.createRefundPayment(payload),
    onSuccess: () => {
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
      } else {
        queryClient.invalidateQueries({ queryKey: ['administrasi-refund-list'] });
      }
    },
  });
};

export const useUpdateRefundPayment = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRefundPaymentPayload }) => refundAdministrasiService.updateRefundPayment(id, payload),
    onSuccess: () => {
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
      } else {
        queryClient.invalidateQueries({ queryKey: ['administrasi-refund-list'] });
      }
    },
  });
};

export const useDeleteRefundPayment = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: (id: string) => refundAdministrasiService.deleteRefundPayment(id),
    onSuccess: () => {
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
      } else {
        queryClient.invalidateQueries({ queryKey: ['administrasi-refund-list'] });
      }
    },
  });
};

export const useTransactionItemDetails = (options: { page?: number; perPage?: number; search?: string } = {}) => {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: companyId
      ? refundAdministrasiKeys.itemDetails(companyId, options)
      : ['transaction-item-details', 'unscoped', options],
    queryFn: () => refundAdministrasiService.getTransactionItemDetails({ page: options.page, per_page: options.perPage, search: options.search }),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(companyId),
  });
};

export const useRefundTransactionDetail = (transactionId?: string) => {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: companyId && transactionId ? refundAdministrasiKeys.transactionDetail(companyId, transactionId) : ['refund-transaction-detail', 'unscoped', transactionId],
    queryFn: () => refundAdministrasiService.getTransactionDetail(transactionId as string),
    enabled: Boolean(companyId) && Boolean(transactionId),
    staleTime: 1000 * 60 * 5,
  });
};

export const useRefundDetail = (refundId?: string) => {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: companyId && refundId ? refundAdministrasiKeys.detail(companyId, refundId) : ['administrasi-refund-detail', 'unscoped', refundId],
    queryFn: () => refundAdministrasiService.getRefundDetail(refundId as string),
    enabled: Boolean(companyId) && Boolean(refundId),
    staleTime: 1000 * 60 * 5,
  });
};

export const useRefundSelectableItems = (transactionId?: string) => {
  const transactionQuery = useRefundTransactionDetail(transactionId);
  const itemDetailsQuery = useTransactionItemDetails({ page: 1, perPage: 100, search: transactionId });

  const transactionItems = useMemo(
    () =>
    ((transactionQuery.data?.unit_transaction_items ?? []) as Array<{
      id?: string | number;
      price?: string | number;
      unit_type?: { name?: string; unit_model?: string };
      unit_transaction_item_details?: Array<{
        id?: string | number;
        unit_transaction_item_id?: string | number;
        unit_type_name?: string;
        tipeUnit?: string;
        color?: string;
        machine_number?: string;
        chassis_number?: string;
        price?: string | number;
        status?: string;
        in_stock?: boolean | number | string;
        is_forecast?: boolean | number | string;
        created_at?: string;
      }>;
      unit_type_sold_details?: Array<{
        id?: string | number;
        unit_transaction_item_id?: string | number;
        unit_type_name?: string;
        tipeUnit?: string;
        color?: string;
        machine_number?: string;
        chassis_number?: string;
        price?: string | number;
        status?: string;
        in_stock?: boolean | number | string;
        is_forecast?: boolean | number | string;
        created_at?: string;
      }>;
    }>),
    [transactionQuery.data?.unit_transaction_items],
  );

  const items = useMemo(() => {
    const nestedItems = transactionItems.flatMap((item) => {
      const details = item.unit_type_sold_details ?? item.unit_transaction_item_details ?? [];
      return details.map((detail) => ({
        id: String(detail.id ?? ''),
        unit_transaction_item_id: String(detail.unit_transaction_item_id ?? item.id ?? ''),
        unit_type_name: detail.unit_type_name ?? detail.tipeUnit ?? item.unit_type?.unit_model ?? item.unit_type?.name ?? '-',
        price: detail.price !== undefined ? Number(detail.price) : Number(item.price ?? 0),
        color: detail.color ?? '-',
        machine_number: detail.machine_number ?? '-',
        chassis_number: detail.chassis_number ?? '-',
        status: detail.status ? String(detail.status) : '',
        in_stock: detail.in_stock === true || detail.in_stock === 1 || detail.in_stock === '1',
        is_forecast: detail.is_forecast === true || detail.is_forecast === 1 || detail.is_forecast === '1',
        created_at: detail.created_at ?? '',
      }));
    });

    const fallbackItems = ((itemDetailsQuery.data?.data ?? []) as UnitTransactionItemDetail[]).filter((item) =>
      transactionItems.some((entry) => String(entry.id ?? '') === String(item.unit_transaction_item_id ?? '')),
    );

    if (nestedItems.length > 0) {
      return nestedItems;
    }

    return fallbackItems.map((item) => {
      const parent = transactionItems.find((entry) => String(entry.id ?? '') === String(item.unit_transaction_item_id ?? ''));
      return {
        ...item,
        price: item.price ?? Number(parent?.price ?? 0),
        unit_type_name: item.unit_type_name ?? parent?.unit_type?.unit_model ?? parent?.unit_type?.name ?? '-',
      };
    });
  }, [itemDetailsQuery.data?.data, transactionItems]);

  return {
    transactionQuery,
    itemDetailsQuery,
    items,
  };
};
