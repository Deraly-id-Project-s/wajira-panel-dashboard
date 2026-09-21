'use client';

import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import {
  UnitTransactionPaymentForm,
  type PaymentFormData,
} from '@/components/features/unit-transaksi/UnitTransactionPaymentForm';
import type { UnitBilling, UnitBillingHistory } from '@/@types/unit-billing.types';

interface UnitTransactionPaymentPageViewProps {
  type: 'purchase' | 'sales';
  transactionId: string;
  code: string;
  totalTagihan: number;
  totalPpn: number;
  totalDpp?: number;
  totalTagihanUsd?: number;
  totalTagihanUsdActual?: number;
  billing: UnitBilling | null;
  histories: UnitBillingHistory[];
  onSubmitPayment: (data: PaymentFormData) => Promise<void>;
  onDeleteHistory: (id: string | number) => Promise<void>;
  loading: boolean;
  validationMessage?: string;
}

export function UnitTransactionPaymentPageView({
  type,
  transactionId,
  code,
  totalTagihan,
  totalPpn,
  totalDpp,
  totalTagihanUsd,
  totalTagihanUsdActual,
  billing,
  histories,
  onSubmitPayment,
  onDeleteHistory,
  loading,
  validationMessage,
}: UnitTransactionPaymentPageViewProps) {
  const router = useRouter();
  const slug = Array.isArray(router.query.slug) ? router.query.slug[0] : router.query.slug;
  const isPurchase = type === 'purchase';
  const transactionLabel = isPurchase ? 'Pembelian' : 'Penjualan';
  const codeLabel = isPurchase ? 'Kode Beli' : 'Kode Jual';
  const segment = isPurchase ? 'pembelian-unit' : 'penjualan-unit';
  const listPath = `/dashboard/${slug}/transaksi/${segment}`;
  const detailPath = `${listPath}/${transactionId}`;

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: `${transactionLabel} Unit`, onClick: () => router.push(listPath) },
            { label: `Detail ${transactionLabel}`, onClick: () => router.push(detailPath) },
            { label: `Billing ${transactionLabel} Unit` },
          ]}
          title={`Billing ${transactionLabel} Unit`}
          subtitle={
            <>
              <span>{codeLabel}:</span>
              <span className="inline-flex min-w-0 items-center font-semibold text-orange-600 sm:gap-1.5">
                {code}
              </span>
            </>
          }
          onBack={() => router.push(detailPath)}
        />

        <Card className="rounded-md">
          <CardContent className="p-4 sm:p-6">
            <UnitTransactionPaymentForm
              type={type}
              code={code}
              totalTagihan={totalTagihan}
              totalPpn={totalPpn}
              totalDpp={totalDpp}
              totalTagihanUsd={totalTagihanUsd}
              totalTagihanUsdActual={totalTagihanUsdActual}
              billing={billing}
              histories={histories}
              onSubmitPayment={onSubmitPayment}
              onDeleteHistory={onDeleteHistory}
              onCancel={() => router.back()}
              loading={loading}
              canSubmit
              validationMessage={validationMessage}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
