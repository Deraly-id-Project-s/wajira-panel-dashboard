import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UpsertUnitBillingPayload } from '@/types/unit-billing.types';
import { useCompany } from '@/contexts/CompanyContext';
import { useSalesDetail } from '@/hooks/useSales';
import { useUnitBillings } from '@/hooks/useUnitBilling';
import { companyQueryKeys } from '@/lib/query/company-key';
import { salesPaymentService } from '@/services/salesPayment.service';

const toNumber = (value: unknown): number => {
  const normalized = Number(value ?? 0);
  return Number.isFinite(normalized) ? normalized : 0;
};

const toDateYMD = (value?: string): string => {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Date().toISOString().slice(0, 10);
};

export const usePaymentData = (salesId?: string) => {
  const salesDetailQuery = useSalesDetail(salesId);
  const billingsQuery = useUnitBillings(salesId);

  const itemDetailsQuery = useQuery({
    queryKey: ['unit-transaction-item-details-by-transaction', salesId ?? ''],
    queryFn: () => salesPaymentService.getTransactionItemsDetail(salesId as string),
    enabled: !!salesId,
    staleTime: 1000 * 30,
  });

  const items = useMemo(() => itemDetailsQuery.data ?? [], [itemDetailsQuery.data]);
  const total = useMemo(() => items.reduce((acc, item) => acc + Number(item.price ?? 0), 0), [items]);
  const existingBilling = billingsQuery.data?.[0] ?? null;

  return {
    salesData: salesDetailQuery.data?.ui ?? null,
    salesRaw: salesDetailQuery.data?.raw ?? null,
    billings: billingsQuery.data ?? [],
    existingBilling,
    items,
    total,
    isLoading: salesDetailQuery.isLoading || billingsQuery.isLoading || itemDetailsQuery.isLoading,
    isError: salesDetailQuery.isError || billingsQuery.isError || itemDetailsQuery.isError,
    error: salesDetailQuery.error ?? billingsQuery.error ?? itemDetailsQuery.error,
  };
};

export const useSubmitBilling = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async (payload: {
      salesId: string;
      companyId: string | number;
      paymentBca: number;
      paymentCash: number;
      paymentBcaUsd: number;
      totalTagihan: number;
      billings: Array<{ id: string; bca_payment: number; cash_payment: number; bca_payment_2: number }>;
      existingBillingId?: string;
      paymentAt?: string;
    }) => {
      const bcaPayment = toNumber(payload.paymentBca);
      const cashPayment = toNumber(payload.paymentCash);
      const bcaPaymentUsd = toNumber(payload.paymentBcaUsd);
      const submittedTotal = bcaPayment + cashPayment + bcaPaymentUsd;

      const currentBillingId = payload.existingBillingId ? String(payload.existingBillingId) : '';
      const paidFromOthers = payload.billings
        .filter((item) => String(item.id) !== currentBillingId)
        .reduce((acc, item) => acc + toNumber(item.bca_payment) + toNumber(item.cash_payment) + toNumber(item.bca_payment_2), 0);

      const formState = {
        unit_transaction_id: String(payload.salesId),
        bca_payment_amount: bcaPayment,
        cash_payment_amount: cashPayment,
        bca_payment_usd_amount: bcaPaymentUsd,
        payment_at: toDateYMD(payload.paymentAt),
        is_paid: paidFromOthers + submittedTotal >= toNumber(payload.totalTagihan) && toNumber(payload.totalTagihan) > 0 ? 1 : 0,
        company_id: toNumber(payload.companyId),
      };

      const upsertPayload: UpsertUnitBillingPayload = {
        company_id: String(formState.company_id),
        unit_transaction_id: formState.unit_transaction_id,
        bca_payment: formState.bca_payment_amount,
        cash_payment: formState.cash_payment_amount,
        bca_payment_2: formState.bca_payment_usd_amount,
        payment_date: formState.payment_at,
        is_paid: formState.is_paid === 1,
      };

      if (currentBillingId) {
        const data = await salesPaymentService.updateBilling(currentBillingId, upsertPayload);
        return { data, mode: 'update' as const };
      }

      const data = await salesPaymentService.createBilling(upsertPayload);
      return { data, mode: 'create' as const };
    },
    onSuccess: (_result, variables) => {
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
      }
      queryClient.invalidateQueries({ queryKey: ['unit-billings', variables.salesId] });
      queryClient.invalidateQueries({ queryKey: ['unit-billing-current', variables.salesId] });
      queryClient.invalidateQueries({ queryKey: ['unit-billing-history', '', variables.salesId] });
      queryClient.invalidateQueries({ queryKey: ['sales-transaction', variables.salesId] });
      queryClient.invalidateQueries({ queryKey: ['sales-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['unit-transaction-item-details-by-transaction', variables.salesId] });
    },
  });
};
