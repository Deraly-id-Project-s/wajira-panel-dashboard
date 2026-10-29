'use client';

import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { Badge } from '@/components/ui/badge';
import {
  useUnitTransactionBillingPayment,
  type PaymentFormData,
} from '@/hooks/useUnitTransactionBillingPayment';
import { BillingCostSummary } from '@/components/features/unit-transaksi/billing/BillingCostSummary';
import { BillingPaymentForm } from '@/components/features/unit-transaksi/billing/BillingPaymentForm';
import { BillingHistoryTable } from '@/components/features/unit-transaksi/billing/BillingHistoryTable';
import type { UnitBilling, UnitBillingHistory } from '@/@types/unit-billing.types';

export interface UnitTransactionPaymentPageViewProps {
  type: 'purchase' | 'sales';
  transactionId: string;
  code?: string;
  totalTagihan?: number;
  totalPpn?: number;
  totalDpp?: number;
  totalTagihanUsd?: number;
  totalTagihanUsdActual?: number;
  isUsdTransaction?: boolean;
  billing?: UnitBilling | null;
  histories?: UnitBillingHistory[];
  onSubmitPayment?: (data: PaymentFormData) => Promise<void>;
  onDeleteHistory?: (id: string | number) => Promise<void>;
  loading?: boolean;
  validationMessage?: string;
}

export function UnitTransactionPaymentPageView({
  type,
  transactionId,
  code: externalCode,
  totalTagihan: externalTotalTagihan,
  totalPpn: externalTotalPpn,
  totalDpp: externalTotalDpp,
  totalTagihanUsd: externalTotalTagihanUsd,
  isUsdTransaction: externalIsUsd,
  billing: externalBilling,
  histories: externalHistories,
  onSubmitPayment,
  onDeleteHistory,
  loading: externalLoading,
  validationMessage: externalValidationMessage,
}: UnitTransactionPaymentPageViewProps) {
  const router = useRouter();
  const slug = Array.isArray(router.query.slug) ? router.query.slug[0] : router.query.slug;

  // Integrated hook handling queries and mutations
  const hookState = useUnitTransactionBillingPayment({
    type,
    transactionId,
  });

  const isPurchase = type === 'purchase';
  const transactionLabel = isPurchase ? 'Pembelian' : 'Penjualan';
  const codeLabel = isPurchase ? 'Kode Beli' : 'Kode Jual';
  const segment = isPurchase ? 'pembelian-unit' : 'penjualan-unit';
  const listPath = `/dashboard/${slug}/transaksi/${segment}`;
  const detailPath = `${listPath}/${transactionId}`;

  // Resolve active data (giving priority to external props if explicitly supplied)
  const isUsd = externalIsUsd !== undefined ? externalIsUsd : hookState.isUsd;
  const code = externalCode || hookState.code;
  const billing = externalBilling !== undefined ? externalBilling : hookState.billing;
  const histories = externalHistories || hookState.histories;
  const isPaid = billing?.is_paid !== undefined ? billing.is_paid : hookState.isPaid;

  const totalTagihanUsd = externalTotalTagihanUsd !== undefined ? externalTotalTagihanUsd : hookState.totalTagihanUsd;
  const totalPaidUsd = hookState.totalPaidUsd;
  const remainingPaymentUsd = isPaid ? 0 : hookState.remainingPaymentUsd;

  const totalTagihanIdr = externalTotalTagihan !== undefined ? externalTotalTagihan : hookState.totalTagihanIdr;
  const totalPaidIdr = hookState.totalPaidIdr;
  const remainingPaymentIdr = isPaid ? 0 : hookState.remainingPaymentIdr;

  const totalDpp = externalTotalDpp !== undefined ? externalTotalDpp : hookState.totalDpp;
  const totalPpn = externalTotalPpn !== undefined ? externalTotalPpn : hookState.totalPpn;

  const loading = externalLoading !== undefined ? externalLoading : (hookState.isLoading || hookState.isSubmitting);
  const validationMessage = externalValidationMessage || hookState.validationMessage;

  const handleSubmit = onSubmitPayment || hookState.submitPayment;
  const handleDelete = onDeleteHistory || hookState.deleteHistory;

  if (hookState.isLoading && !externalBilling && !externalCode) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: `${transactionLabel} Unit`, onClick: () => router.push(listPath) },
            { label: `Detail ${transactionLabel}`, onClick: () => router.push(detailPath) },
            { label: `Billing ${transactionLabel} Unit` },
          ]}
          title={`Billing ${transactionLabel} Unit`}
          subtitle={
            <div className="flex flex-wrap items-center gap-2">
              <span>{codeLabel}:</span>
              <span className="inline-flex min-w-0 items-center font-semibold text-orange-600 sm:gap-1.5">
                {code}
              </span>
              {isUsd && (
                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 text-xs font-semibold">
                  Transaksi USD
                </Badge>
              )}
            </div>
          }
          onBack={() => router.push(detailPath)}
        />

        <div className="space-y-6">
          {/* 1. Ringkasan Biaya Transaksi & Invoice */}
          <BillingCostSummary
            type={type}
            isUsd={isUsd}
            isPaid={isPaid}
            totalTagihanUsd={totalTagihanUsd}
            totalPaidUsd={totalPaidUsd}
            remainingPaymentUsd={remainingPaymentUsd}
            totalTagihanIdr={totalTagihanIdr}
            totalPaidIdr={totalPaidIdr}
            remainingPaymentIdr={remainingPaymentIdr}
            totalDpp={totalDpp}
            totalPpn={totalPpn}
          />

          {/* 2. Form Pembayaran (Aktif bila belum lunas) */}
          <BillingPaymentForm
            isUsd={isUsd}
            isPaid={isPaid}
            remainingPaymentUsd={remainingPaymentUsd}
            remainingPaymentIdr={remainingPaymentIdr}
            loading={loading}
            canSubmit={!isPaid}
            onSubmit={handleSubmit}
            onCancel={() => router.push(detailPath)}
            validationMessage={validationMessage}
          />

          {/* 3. Tabel Riwayat Pembayaran (1 History == 1 TransactionFlow) */}
          <BillingHistoryTable
            isUsd={isUsd}
            isPaid={isPaid}
            histories={histories}
            loading={loading}
            onDeleteHistory={handleDelete}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default UnitTransactionPaymentPageView;
