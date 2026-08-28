'use client';

import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { UnitTransactionForm } from '@/components/features/unit-transaction/UnitTransactionForm';
import { type UnitTransactionFormValues } from '@/components/features/unit-transaction/unit-transaction.schema';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { useSalesDetail } from '@/hooks/useSales';
import { useCreateUnitItem, useSalesUnitItems } from '@/hooks/useUnitTransactionItem';
import { useTypeUnits } from '@/hooks/useTypeUnit';
import { useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { useUpdateUnitTransactionDocumentTemplate } from '@/hooks/useUnitTransaction';

export default function CreateSalesUnitPage() {
  const router = useRouter();
  const { slug: slugQuery, id } = router.query;
  const slug = Array.isArray(slugQuery) ? slugQuery[0] : slugQuery || '';
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const salesId = Array.isArray(id) ? id[0] : id;
  const { data: salesDetail, isLoading: isLoadingDetail } = useSalesDetail(salesId);
  const createItemMutation = useCreateUnitItem();
  const updateTemplateMutation = useUpdateUnitTransactionDocumentTemplate();
  const { data: typeUnitData, isLoading: isLoadingTypeUnits } = useTypeUnits({
    sort_by: 'created_at',
    sort_order: 'asc',
    // in_stock: 'true',
    company_id: companyId || (salesDetail?.raw as any)?.company_id || 1
  });

  const { data: salesItemsResponse } = useSalesUnitItems(salesId);

  const existingTypeUnitIds = useMemo(
    () =>
      (salesItemsResponse?.data ?? [])
        .map((item) => (item.unit_type_id ? String(item.unit_type_id) : ''))
        .filter((value): value is string => Boolean(value)),
    [salesItemsResponse],
  );

  const invoiceCode = salesDetail?.raw?.code ?? '-';

  const handleSubmit = async (data: UnitTransactionFormValues) => {
    try {
      if (!salesId) {
        toast.error('ID penjualan tidak valid');
        return;
      }

      const unitTypeId = String(data.unitTypeId ?? '').trim();
      const qty = Number(data.qty ?? 0);

      if (!unitTypeId) {
        toast.error('Tipe Unit wajib dipilih');
        return;
      }

      if (existingTypeUnitIds.includes(unitTypeId)) {
        toast.error('Tipe unit sudah ada di transaksi ini. Pilih tipe unit lain.');
        return;
      }

      if (qty <= 0) {
        toast.error('QTY minimal 1');
        return;
      }

      const maxCapacity = Number(salesDetail?.raw?.max_capacity ?? 0);
      const usedQty = (salesItemsResponse?.data ?? []).reduce((acc, item) => acc + Number(item.qty_total ?? 0), 0);
      const remainingCapacity = Math.max(0, maxCapacity - usedQty);

      if (maxCapacity > 0 && qty > remainingCapacity) {
        toast.error(`Qty melebihi kapasitas sisa transaksi. Sisa kapasitas: ${remainingCapacity}`);
        return;
      }

      await createItemMutation.mutateAsync({
        unit_transaction_id: salesId,
        unit_type_id: unitTypeId,
        qty_total: qty,
        price: Number(data.price ?? 0),
        bbn_price: Number(data.bbnPrice ?? 0),
        expedition_fee: Number(data.expeditionFee ?? 0),
        other_fee: Number(data.otherFee ?? 0),
        price_usd: data.priceUsd ? Number(data.priceUsd) : undefined,
        price_per_unit_usd: data.pricePerUnitUsd ? Number(data.pricePerUnitUsd) : undefined,
        company_id: companyId ?? undefined,
        type: 'sales',
        dpp_tax_id: data.dppTaxVersionId ? Number(data.dppTaxVersionId) : undefined,
        ppn_tax_id: data.ppnTaxVersionId ? Number(data.ppnTaxVersionId) : undefined,
      });
      const currentTemplateId = salesDetail?.ui?.documentTemplateId ?? null;
      if ((data.documentTemplateId ?? null) !== currentTemplateId) {
        await updateTemplateMutation.mutateAsync({ id: salesId, documentTemplateId: data.documentTemplateId ?? null });
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sales-transaction', salesId] }),
        queryClient.invalidateQueries({ queryKey: ['sales-transactions'] }),
      ]);

      toast.success('Unit berhasil ditambahkan!');
      const basePath = slug ? `/dashboard/${slug}/transaksi/penjualan-unit` : '/transaksi/penjualan-unit';
      router.push(`${basePath}/${salesId}`);
    } catch (error: any) {
      const status = error?.statusCode ?? error?.response?.status;
      if (status === 422) {
        toast.error('Stock tidak tersedia di warehouse. Silakan lakukan pembelian terlebih dahulu.');
        return;
      }

      const detail = error?.details;
      const message =
        typeof detail === 'string'
          ? detail
          : error?.message || 'Gagal menambahkan unit.';

      toast.error(message);
    }
  };

  if (isLoadingDetail) {
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
            { label: 'Penjualan Unit', onClick: () => router.push(`/dashboard/${slug}/transaksi/penjualan-unit`) },
            { label: 'Detail Penjualan', onClick: () => router.push(`/dashboard/${slug}/transaksi/penjualan-unit/${salesId}`) },
            { label: 'Tambah Unit Penjualan' }
          ]}
          title="Tambah Unit Penjualan"
          onBack={() => router.push(`/dashboard/${slug}/transaksi/penjualan-unit/${salesId}`)}
          subtitle={
            <>
              <span>Kode Penjualan:</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:text-orange-700">{invoiceCode}</span>
            </>
          }
        />

        <Card className="rounded-md">
          <CardContent className="p-6">
            <UnitTransactionForm
              type="sales"
              allowCreateTypeUnit
              defaultValues={{
                unitTypeId: '',
                qty: 1,
                price: 0,
                bbnPrice: 0,
                expeditionFee: 0,
                otherFee: 0,
                hppTotal: 0,
                dppTotal: 0,
                ppnTotal: 0,
                hppPerUnit: 0,
                dppPerUnit: 0,
                ppnPerUnit: 0,
                documentTemplateId: salesDetail?.ui?.documentTemplateId ?? null,
              }}
              typeUnitOptions={typeUnitData?.data ?? []}
              onSubmit={handleSubmit}
              onCancel={() => router.back()}
              submitDisabled={createItemMutation.isPending || isLoadingTypeUnits}
              cancelDisabled={createItemMutation.isPending}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
