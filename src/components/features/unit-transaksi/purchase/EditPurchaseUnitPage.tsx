'use client';


import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { UnitTransactionForm } from '@/components/features/unit-transaksi/UnitTransactionForm';
import { usePurchaseById, useUpdateUnitTransactionDocumentTemplate } from '@/hooks/useUnitTransaction';
import {
  usePurchaseUnitItems,
  useUpdateUnitItem,
} from '@/hooks/useUnitTransactionItem';
import { toast } from 'sonner';
import { type UnitTransactionFormValues } from '@/scheme/unit-transaction.schema';
import { LoadingState } from '@/components/ui/loading-state';

const parseApiError = (err: any): string => {
  const details = err?.details ?? err?.response?.data?.errors;

  if (typeof details === 'string') return details;

  if (details && typeof details === 'object') {
    return Object.entries(details)
      .map(
        ([field, value]) =>
          `${field}: ${Array.isArray(value) ? value[0] : String(value)}`
      )
      .join(', ');
  }

  const responseMessage = err?.response?.data?.message;
  if (typeof responseMessage === 'string' && responseMessage.trim()) return responseMessage;

  return err?.message || 'Gagal memperbarui unit';
};

export default function EditPurchaseUnitPage() {
  const router = useRouter();
  const { slug, id, unitId } = router.query;

  const { data: purchase, isLoading } = usePurchaseById(id as string);
  const { data: unitItems, isLoading: isUnitLoading } = usePurchaseUnitItems(id as string);
  const updateUnitMutation = useUpdateUnitItem();
  const updateTemplateMutation = useUpdateUnitTransactionDocumentTemplate();

  const unit = unitItems?.data?.find((item) => item.id === String(unitId));
  const parentTransactionId = String(unit?.unit_transaction_id ?? id ?? '');

  const excludedTypeUnitIds = (unitItems?.data ?? [])
    .filter((item) => item.id !== String(unitId) && item.unit_type_id)
    .map((item) => String(item.unit_type_id));

  const handleSubmit = async (data: UnitTransactionFormValues) => {
    try {
      if (!unitId) {
        toast.error('Unit item tidak ditemukan');
        return;
      }

      const selectedTypeUnitId = data.unitTypeId !== undefined && data.unitTypeId !== null ? String(data.unitTypeId) : '';
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

      if (selectedTypeUnitId && excludedTypeUnitIds.includes(selectedTypeUnitId)) {
        toast.error('Tipe unit sudah digunakan oleh item lain di transaksi ini');
        return;
      }

      const currentTypeUnitId = unit?.unit_type_id ? String(unit.unit_type_id) : '';
      const currentQty = Number(unit?.qty_total ?? 0);
      const currentPrice = Number(unit?.price ?? 0);
      const currentBbn = Number(unit?.bbn_price ?? 0);
      const currentExpedition = Number(unit?.expedition_fee ?? 0);
      const currentOther = Number(unit?.other_fee ?? 0);
      const currentPriceUsd = Number(unit?.price_usd ?? 0);
      const currentPricePerUnitUsd = Number(unit?.price_per_unit_usd ?? 0);

      const priceUsd = Number(data.priceUsd ?? 0);
      const pricePerUnitUsd = Number(data.pricePerUnitUsd ?? 0);

      const isSame = (a: number, b: number) => Math.abs(a - b) < 0.000001;

      const maxCapacity = Number(purchase?.max_capacity ?? 0);
      const totalQtyAllItems = (unitItems?.data ?? []).reduce((acc, item) => acc + Number(item.qty_total ?? 0), 0);
      const remainingCapacityForThisItem = Math.max(0, maxCapacity - (totalQtyAllItems - currentQty));

      if (maxCapacity > 0 && qty > remainingCapacityForThisItem) {
        toast.error(`Qty melebihi kapasitas sisa transaksi. Sisa kapasitas untuk item ini: ${remainingCapacityForThisItem}`);
        return;
      }

      const payload: any = {
        unit_transaction_id: parentTransactionId,
      };

      if (selectedTypeUnitId && selectedTypeUnitId !== currentTypeUnitId) {
        payload.unit_type_id = selectedTypeUnitId;
      }
      if (!isSame(qty, currentQty)) {
        payload.qty_total = qty;
      }
      if (!isSame(price, currentPrice)) {
        payload.price = price;
      }
      if (!isSame(bbn, currentBbn)) {
        payload.bbn_price = bbn;
      }
      if (!isSame(expedition, currentExpedition)) {
        payload.expedition_fee = expedition;
      }
      if (!isSame(other, currentOther)) {
        payload.other_fee = other;
      }
      if (!isSame(priceUsd, currentPriceUsd)) {
        payload.price_usd = priceUsd;
      }
      if (!isSame(pricePerUnitUsd, currentPricePerUnitUsd)) {
        payload.price_per_unit_usd = pricePerUnitUsd;
      }

      const currentDppTaxId = unit?.dpp_tax_id ? Number(unit.dpp_tax_id) : 0;
      const currentPpnTaxId = unit?.ppn_tax_id ? Number(unit.ppn_tax_id) : 0;
      const newDppTaxId = data.dppTaxVersionId ? Number(data.dppTaxVersionId) : 0;
      const newPpnTaxId = data.ppnTaxVersionId ? Number(data.ppnTaxVersionId) : 0;

      if (newDppTaxId !== currentDppTaxId) {
        payload.dpp_tax_id = newDppTaxId || undefined;
      }
      if (newPpnTaxId !== currentPpnTaxId) {
        payload.ppn_tax_id = newPpnTaxId || undefined;
      }

      const hasChanges = Object.keys(payload).length > 1;
      if (!hasChanges) {
        toast.info('Tidak ada perubahan data');
        return;
      }

      await updateUnitMutation.mutateAsync({
        id: String(unitId),
        payload,
      });
      if ((data.documentTemplateId ?? null) !== (purchase?.documentTemplateId ?? null)) {
        await updateTemplateMutation.mutateAsync({ id: parentTransactionId, documentTemplateId: data.documentTemplateId ?? null });
      }

      toast.success('Unit berhasil diperbarui');
      router.push(`/dashboard/${slug}/transaksi/pembelian-unit/${parentTransactionId}`);
    } catch (err: any) {
      toast.error(parseApiError(err));
    }
  };

  if (isLoading || isUnitLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (!purchase) return null;

  if (!unit) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Unit item tidak ditemukan</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Pembelian Unit', onClick: () => router.push(`/dashboard/${slug}/transaksi/pembelian-unit`) },
            { label: 'Detail Pembelian', onClick: () => router.push(`/dashboard/${slug}/transaksi/pembelian-unit/${parentTransactionId}`) },
            { label: 'Edit Unit' }
          ]}
          title="Data Pembelian"
          subtitle={
            <>
              <span>Kode Beli:</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:text-orange-700">{purchase.code}</span>
            </>
          }
          onBack={() => router.back()}
        />

        <Card className="rounded-md">
          <CardContent className="p-6">
            <UnitTransactionForm
              type="purchase"
              allowCreateTypeUnit
              defaultValues={{
                unitTypeId: unit.unit_type_id ?? '',
                qty: unit.qty_total,
                price: unit.price,
                bbnPrice: unit.bbn_price,
                expeditionFee: unit.expedition_fee,
                documentTemplateId: purchase?.documentTemplateId ?? null,
                otherFee: unit.other_fee,
                priceUsd: unit.price_usd,
                pricePerUnitUsd: unit.price_per_unit_usd,
                dppTaxVersionId: unit.dpp_tax_id != null ? String(unit.dpp_tax_id) : undefined,
                ppnTaxVersionId: unit.ppn_tax_id != null ? String(unit.ppn_tax_id) : undefined,
              }}
              onSubmit={handleSubmit}
              onCancel={() => router.back()}
              loading={updateUnitMutation.isPending}
              excludedTypeUnitIds={excludedTypeUnitIds}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
