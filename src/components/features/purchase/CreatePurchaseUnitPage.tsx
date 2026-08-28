'use client';

import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UnitTransactionForm } from '@/components/features/unit-transaction/UnitTransactionForm';
import { usePurchaseById, useUpdateUnitTransactionDocumentTemplate } from '@/hooks/useUnitTransaction';
import { useCreateUnitItem, usePurchaseUnitItems } from '@/hooks/useUnitTransactionItem';
import { Card, CardContent } from '@/components/ui/card';
import { type UnitTransactionFormValues } from '@/scheme/unit-transaction.schema';
import { useMemo } from 'react';
import { LoadingState } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';

const parseApiError = (err: any): string => {
  const details = err?.details ?? err?.response?.data?.errors;
  if (typeof details === 'string') return details;
  if (details && typeof details === 'object') {
    return Object.entries(details)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : String(v)}`)
      .join(', ');
  }

  const responseMessage = err?.response?.data?.message;
  if (typeof responseMessage === 'string' && responseMessage.trim()) return responseMessage;

  return err?.message || 'Gagal menambahkan unit';
};

export default function CreatePurchaseUnitPage() {
  const router = useRouter();
  const { slug, id } = router.query;

  const { data: purchase, isLoading } = usePurchaseById(id as string);
  const { data: existingItems } = usePurchaseUnitItems(id as string);
  const addUnitMutation = useCreateUnitItem();
  const updateTemplateMutation = useUpdateUnitTransactionDocumentTemplate();

  const existingTypeUnitIds = useMemo(
    () =>
      (existingItems?.data ?? [])
        .map((item) => (item.unit_type_id ? String(item.unit_type_id) : ''))
        .filter((value): value is string => Boolean(value)),
    [existingItems]
  );

  const handleSubmit = async (data: UnitTransactionFormValues) => {
    try {
      if (!data.unitTypeId) {
        toast.error('Tipe unit wajib dipilih');
        return;
      }

      if (existingTypeUnitIds.includes(String(data.unitTypeId))) {
        toast.error('Tipe unit sudah ada di transaksi ini. Pilih tipe unit lain.');
        return;
      }

      const qty = Number(data.qty ?? 0);
      const price = Number(data.price ?? 0);
      const bbn = Number(data.bbnPrice ?? 0);
      const expedition = Number(data.expeditionFee ?? 0);
      const other = Number(data.otherFee ?? 0);

      if (!Number.isFinite(qty) || qty <= 0) {
        toast.error('Qty wajib lebih dari 0');
        return;
      }

      if (![price, bbn, expedition, other].every((v) => Number.isFinite(v) && v >= 0)) {
        toast.error('Harga dan biaya harus berupa angka valid');
        return;
      }

      const maxCapacity = Number(purchase?.max_capacity ?? 0);
      const usedQty = (existingItems?.data ?? []).reduce((acc, item) => acc + Number(item.qty_total ?? 0), 0);
      const remainingCapacity = Math.max(0, maxCapacity - usedQty);

      if (maxCapacity > 0 && qty > remainingCapacity) {
        toast.error(`Qty melebihi kapasitas sisa transaksi. Sisa kapasitas: ${remainingCapacity}`);
        return;
      }

      await addUnitMutation.mutateAsync({
        unit_transaction_id: id as string,
        unit_type_id: data?.unitTypeId,
        qty_total: qty,
        price,
        bbn_price: bbn,
        expedition_fee: expedition,
        other_fee: other,
        price_usd: data?.priceUsd ? Number(data?.priceUsd) : undefined,
        price_per_unit_usd: data?.pricePerUnitUsd ? Number(data?.pricePerUnitUsd) : undefined,
        dpp_tax_id: data?.dppTaxVersionId ? Number(data?.dppTaxVersionId) : undefined,
        ppn_tax_id: data?.ppnTaxVersionId ? Number(data?.ppnTaxVersionId) : undefined,
      });
      if ((data.documentTemplateId ?? null) !== (purchase?.documentTemplateId ?? null)) {
        await updateTemplateMutation.mutateAsync({ id: String(id), documentTemplateId: data.documentTemplateId ?? null });
      }
      toast.success('Unit berhasil ditambahkan');
      router.push(`/dashboard/${slug}/transaksi/pembelian-unit/${id}`);
    } catch (err: any) {
      toast.error(parseApiError(err));
    }
  };

  if (isLoading) {
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
            { label: 'Pembelian Unit', onClick: () => router.push(`/dashboard/${slug}/transaksi/pembelian-unit`) },
            { label: 'Detail Pembelian', onClick: () => router.push(`/dashboard/${slug}/transaksi/pembelian-unit/${id}`) },
            { label: 'Tambah Unit Pembelian' }
          ]}
          title="Tambah Unit Pembelian"
          onBack={() => router.push(`/dashboard/${slug}/transaksi/pembelian-unit`)}
          subtitle={
            <>
              <span>Kode Pembelian:</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:text-orange-700">{purchase?.code ?? '-'}</span>
            </>
          }
        />

        <Card className="rounded-md">
          <CardContent className="p-6">
            <UnitTransactionForm
              type="purchase"
              allowCreateTypeUnit
              onSubmit={handleSubmit}
              onCancel={() => router.back()}
              loading={addUnitMutation.isPending}
              excludedTypeUnitIds={existingTypeUnitIds}
              defaultValues={{ documentTemplateId: purchase?.documentTemplateId ?? null }}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
