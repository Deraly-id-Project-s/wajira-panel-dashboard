import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  DoInvoiceListParams,
  DoInvoiceBillingHistoryPayload,
  UpdateDoInvoiceBillingPayload,
} from '@/@types/do-invoice.types';
import type { PaginationParams } from '@/@types/pagination.types';
import {
  createFinanceInvoiceBillingPayment,
  getDoInvoiceById,
  getDoInvoicesList,
  createDoInvoiceBillingHistory,
  updateDoInvoiceBillingHistory,
  deleteDoInvoiceBillingHistory,
  updateDoInvoiceBilling,
} from '@/services/do-invoice.service';
import type { CreateFinanceInvoicePaymentPayload } from '@/@types/do-invoice.types';

export function useDoInvoices(params: PaginationParams & DoInvoiceListParams & { enabled?: boolean }) {
  const { enabled = true, ...rest } = params;

  return useQuery({
    queryKey: ['do-invoice', rest],
    queryFn: () => getDoInvoicesList(rest),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useDoInvoiceDetail(id?: string | number | null) {
  return useQuery({
    queryKey: ['do-invoice', 'detail', id],
    queryFn: () => getDoInvoiceById(id as string | number),
    enabled: !!id,
    retry: false,
  });
}

export function useCreateFinanceInvoicePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateFinanceInvoicePaymentPayload) => createFinanceInvoiceBillingPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['do-invoice'] });
    },
  });
}

const invalidateInvoiceDetail = (queryClient: ReturnType<typeof useQueryClient>, invoiceId: string | number) => {
  queryClient.invalidateQueries({ queryKey: ['do-invoice'] });
  queryClient.invalidateQueries({ queryKey: ['do-invoice', 'detail', invoiceId] });
};

export function useCreateDoInvoiceBillingHistory(invoiceId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DoInvoiceBillingHistoryPayload) => createDoInvoiceBillingHistory(payload),
    onSuccess: () => invalidateInvoiceDetail(queryClient, invoiceId),
  });
}

export function useUpdateDoInvoiceBillingHistory(invoiceId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: DoInvoiceBillingHistoryPayload }) =>
      updateDoInvoiceBillingHistory(id, payload),
    onSuccess: () => invalidateInvoiceDetail(queryClient, invoiceId),
  });
}

export function useDeleteDoInvoiceBillingHistory(invoiceId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteDoInvoiceBillingHistory(id),
    onSuccess: () => invalidateInvoiceDetail(queryClient, invoiceId),
  });
}

export function useUpdateDoInvoiceBilling(invoiceId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: UpdateDoInvoiceBillingPayload }) =>
      updateDoInvoiceBilling(id, payload),
    onSuccess: () => invalidateInvoiceDetail(queryClient, invoiceId),
  });
}
