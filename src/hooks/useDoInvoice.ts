import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  DoInvoiceCreatePayload,
  DoInvoiceDeletePayload,
  DoInvoiceListParams,
  DoInvoiceProcessPayload,
} from '@/types/create-invoice.types';
import type { PaginationParams } from '@/types/pagination.types';
import {
  createDoInvoice,
  createFinanceInvoiceBillingPayment,
  deleteDoInvoice,
  getDoInvoiceById,
  getDoInvoicesList,
  processExpeditionById,
  processInvoiceById,
} from '@/services/do-invoice.service';
import type { CreateFinanceInvoicePaymentPayload } from '@/types/create-invoice.types';

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

export function useCreateDoInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DoInvoiceCreatePayload) => createDoInvoice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['do-invoice'] });
    },
  });
}

export function useDeleteDoInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload?: DoInvoiceDeletePayload }) => deleteDoInvoice(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['do-invoice'] });
    },
  });
}

export function useProcessDoInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload?: DoInvoiceProcessPayload }) => processInvoiceById(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['do-invoice'] });
      queryClient.invalidateQueries({ queryKey: ['do-invoice', 'detail', variables.id] });
    },
  });
}

export function useProcessDoExpedition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload?: DoInvoiceProcessPayload }) => processExpeditionById(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['do-invoice'] });
    },
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
