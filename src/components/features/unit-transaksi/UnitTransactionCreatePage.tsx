'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { CollapsibleBox } from '@/components/ui/collapsible-box';
import { FileText } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { UnitTransactionForm } from '@/components/features/unit-transaksi/UnitTransactionForm';
import {
  UnitTransactionPartyFields,
  type UnitTransactionPerson,
} from '@/components/features/unit-transaksi/UnitTransactionPartyFields';
import { useCreatePurchase } from '@/hooks/usePurchase';
import { useCreateSales } from '@/hooks/useSales';
import { useCompany } from '@/contexts/CompanyContext';
import type { CreatePurchaseRequest } from '@/@types/purchase.types';
import type { UnitTransactionFormValues, UnitTransactionKind } from '@/types/unit-transaction.types';
import { apiClient } from '@/lib/api/client';
import { purchaseService } from '@/services/purchase.service';
import { generateSalesCode } from '@/lib/utils/sales';
import {
  usePurchaseById,
  useUpdateUnitTransactionDocumentTemplate,
} from '@/hooks/useUnitTransaction';
import {
  useCreateUnitItem,
  usePurchaseUnitItems,
  useSalesUnitItems,
} from '@/hooks/useUnitTransactionItem';

type UnitTransactionCreatePageProps = {
  type: UnitTransactionKind;
  mode?: 'transaction' | 'unit';
};

type WarehouseDataResponse = {
  success?: boolean;
  data?: {
    capacity?: number | string;
    unit_transactions?: {
      data?: Array<{
        max_capacity?: number | string;
      }>;
      total?: number;
    };
  };
};

const DEFAULT_WAREHOUSE_ID = 1;

const getWarehouseRemainingCapacity = async (warehouseId: number): Promise<{ remaining: number; used: number; capacity: number }> => {
  const response = await apiClient.get<WarehouseDataResponse>(`/wapi/warehouse/warehouse-data/${warehouseId}`, {
    params: {
      per_page: 500,
    },
  });

  const payload = response.data;
  const capacity = Number(payload?.data?.capacity ?? 0);
  const rows = payload?.data?.unit_transactions?.data ?? [];
  const used = rows.reduce((acc, row) => acc + Number(row?.max_capacity ?? 0), 0);
  const remaining = Math.max(0, capacity - used);

  return { remaining, used, capacity };
};

const toNumber = (value: unknown) => {
  const normalized = Number(value ?? 0);
  return Number.isFinite(normalized) ? normalized : 0;
};

const getSlug = (slugQuery: unknown) => {
  if (Array.isArray(slugQuery)) return slugQuery[0] ?? '';
  return typeof slugQuery === 'string' ? slugQuery : '';
};

const createPurchaseCode = (slug: string) => {
  const now = new Date();
  const ymd = now.toISOString().split('T')[0].replace(/-/g, '');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  const seq = String(now.getSeconds()).padStart(2, '0');
  const slugCode = String(slug || 'UNK')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  const companyCode = slugCode ? slugCode.slice(0, 3) : 'UNK';

  return `PBL-${companyCode}/${ymd}-${seq}${ms}`;
};

const readApiErrorMessage = (error: unknown, fallback: string) => {
  const err = error as any;
  const detail = err?.details || err?.response?.data?.errors;

  if (typeof detail === 'string' && detail.trim()) return detail;

  if (detail && typeof detail === 'object') {
    const text = Object.values(detail)
      .flatMap((value: any) => (Array.isArray(value) ? value : [value]))
      .map((value: any) => String(value))
      .join(', ')
      .trim();
    if (text) return text;
  }

  return String(err?.message ?? fallback);
};

export function UnitTransactionCreatePage({ type, mode }: UnitTransactionCreatePageProps) {
  const router = useRouter();
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  const slug = getSlug(router.query.slug);
  const rawId = router.query.id;
  const transactionId = Array.isArray(rawId) ? rawId[0] : typeof rawId === 'string' ? rawId : undefined;

  const currentMode = mode ?? (transactionId ? 'unit' : 'transaction');
  const isPurchase = type === 'purchase';
  const isUnitMode = currentMode === 'unit';

  const transactionPath = `/dashboard/${slug}/transaksi/${isPurchase ? 'pembelian-unit' : 'penjualan-unit'}`;

  // Queries & Mutations for mode === 'transaction'
  const createPurchase = useCreatePurchase();
  const createSales = useCreateSales();
  const generatedCode = useMemo(
    () => (isPurchase ? createPurchaseCode(slug) : generateSalesCode(router.query.slug)),
    [isPurchase, router.query.slug, slug],
  );
  const [personId, setPersonId] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<UnitTransactionPerson | null>(null);
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);

  // Queries & Mutations for mode === 'unit'
  const { data: transactionDetail, isLoading: isLoadingDetail } = usePurchaseById(isUnitMode ? transactionId : undefined);
  const { data: purchaseItems } = usePurchaseUnitItems(isUnitMode && isPurchase ? transactionId : undefined);
  const { data: salesItems } = useSalesUnitItems(isUnitMode && !isPurchase ? transactionId : undefined);
  const addUnitMutation = useCreateUnitItem();
  const updateTemplateMutation = useUpdateUnitTransactionDocumentTemplate();

  const existingItems = isPurchase ? purchaseItems : salesItems;
  const existingTypeUnitIds = useMemo(
    () =>
      (existingItems?.data ?? [])
        .map((item) => (item.unit_type_id ? String(item.unit_type_id) : ''))
        .filter((value): value is string => Boolean(value)),
    [existingItems],
  );

  const handlePersonSelect = (person: UnitTransactionPerson) => {
    setPersonId(String(person.id));
    setSelectedPerson(person);
  };

  const submitNewTransactionPurchase = async (data: UnitTransactionFormValues) => {
    const personNumeric = Number(personId);
    const companyNumeric = Number(companyId);
    const qty = toNumber(data.qty);
    const unitTypeId = toNumber(data.unitTypeId);

    if (!personNumeric || personNumeric <= 0) {
      toast.error('Supplier wajib dipilih');
      return;
    }

    if (!companyNumeric || companyNumeric <= 0) {
      toast.error('Company ID tidak valid. Silakan pilih company terlebih dahulu.');
      return;
    }

    if (!qty || qty <= 0) {
      toast.error('Qty wajib diisi dan minimal 1');
      return;
    }

    if (!unitTypeId || unitTypeId <= 0) {
      toast.error('Tipe unit wajib dipilih sebelum menyimpan pembelian.');
      return;
    }

    await getWarehouseRemainingCapacity(DEFAULT_WAREHOUSE_ID);

    const payload: CreatePurchaseRequest = {
      warehouse_id: DEFAULT_WAREHOUSE_ID,
      person_id: personNumeric,
      company_id: companyNumeric,
      code: generatedCode,
      type: 'purchase',
      max_capacity: String(qty),
      stock_state: 'draft',
      unit_type_id: unitTypeId,
      qty_total: qty,
      price: toNumber(data.price),
      price_discount: toNumber(data.price_discount),
      price_usd_discount: toNumber(data.price_usd_discount),
      bbn_price: toNumber(data.bbnPrice),
      expedition_fee: toNumber(data.expeditionFee),
      other_fee: toNumber(data.otherFee),
      price_usd: data.priceUsd ? Number(data.priceUsd) : undefined,
      price_per_unit_usd: data.pricePerUnitUsd ? Number(data.pricePerUnitUsd) : undefined,
      usd_costs: data.usd_costs && data.usd_costs.length > 0 ? data.usd_costs : undefined,
      document_template_id: data.documentTemplateId ?? null,
    };

    try {
      const response = await createPurchase.mutateAsync(payload);
      const code = response?.code || generatedCode;
      toast.success(`Transaksi Pembelian Unit Tipe berhasil ditambahkan dengan kode transaksi ${code}`);
      router.push(`${transactionPath}/${response?.id}`);
    } catch (error) {
      const err = error as any;
      const statusCode = err?.statusCode ?? err?.response?.status;
      const apiMessage = err?.message;

      if (statusCode === 405 || String(apiMessage ?? '').toLowerCase().includes('method not allowed')) {
        try {
          const probe = await purchaseService.getPurchases(String(companyId), {
            page: 1,
            perPage: 20,
            search: generatedCode,
            withTotals: false,
          });
          const alreadyCreated = probe.data.find((item) => item.code === generatedCode);
          if (alreadyCreated) {
            toast.success(`Transaksi Pembelian Unit Tipe berhasil ditambahkan dengan kode transaksi ${generatedCode}`);
            router.push(transactionPath);
            return;
          }
        } catch {
          // Use the original API error below.
        }
      }

      const details = err?.details || err?.response?.data?.errors;
      if (details && typeof details === 'object' && Array.isArray((details as any).max_capacity)) {
        toast.error('Kapasitas gudang tidak cukup. Gunakan Warehouse ID lain atau sesuaikan max capacity.');
        return;
      }

      toast.error(readApiErrorMessage(error, 'Gagal membuat pembelian'));
    }
  };

  const submitNewTransactionSales = async (data: UnitTransactionFormValues) => {
    const personNumeric = Number(personId);
    const companyNumeric = Number(companyId);
    const qty = toNumber(data.qty);
    const unitTypeId = toNumber(data.unitTypeId);

    if (!personNumeric) {
      toast.error('Customer wajib dipilih');
      return;
    }

    if (!companyNumeric) {
      toast.error('Company tidak valid');
      return;
    }

    if (!unitTypeId) {
      toast.error('Tipe Unit wajib dipilih');
      return;
    }

    if (!qty || qty <= 0) {
      toast.error('QTY wajib diisi dan minimal 1');
      return;
    }

    const payload = {
      company_id: companyNumeric,
      person_id: personNumeric,
      warehouse_id: DEFAULT_WAREHOUSE_ID,
      code: generatedCode,
      type: 'sales' as const,
      max_capacity: qty,
      stock_state: 'draft',
      unit_type_id: unitTypeId,
      qty_total: qty,
      price: toNumber(data.price),
      price_discount: toNumber(data.price_discount),
      price_usd_discount: toNumber(data.price_usd_discount),
      bbn_price: toNumber(data.bbnPrice),
      expedition_fee: toNumber(data.expeditionFee),
      other_fee: toNumber(data.otherFee),
      price_usd: data.priceUsd ? Number(data.priceUsd) : undefined,
      price_per_unit_usd: data.pricePerUnitUsd ? Number(data.pricePerUnitUsd) : undefined,
      usd_costs: data.usd_costs && data.usd_costs.length > 0 ? data.usd_costs : undefined,
      dpp_tax_id: data.dppTaxVersionId ? Number(data.dppTaxVersionId) : undefined,
      ppn_tax_id: data.ppnTaxVersionId ? Number(data.ppnTaxVersionId) : undefined,
      document_template_id: data.documentTemplateId ?? null,
    };

    try {
      const response = await createSales.mutateAsync(payload);
      const code = response?.code || generatedCode;
      toast.success(`Transaksi Penjualan Unit Tipe berhasil ditambahkan dengan kode transaksi ${code}`);
      router.push(response?.id ? `${transactionPath}/${response.id}` : transactionPath);
    } catch (error) {
      const message = readApiErrorMessage(error, 'Gagal menambahkan penjualan unit');
      if (message.toLowerCase().includes('no stock available')) {
        toast.error('Stok untuk tipe unit ini tidak tersedia di warehouse. Silakan pilih tipe unit lain yang tersedia.');
        return;
      }
      toast.error(message);
    }
  };

  const handleUnitSubmit = async (data: UnitTransactionFormValues) => {
    try {
      if (!transactionId) {
        toast.error('ID transaksi tidak valid');
        return;
      }

      const unitTypeId = String(data.unitTypeId ?? '').trim();
      const qty = Number(data.qty ?? 0);
      const price = Number(data.price ?? 0);
      const bbn = Number(data.bbnPrice ?? 0);
      const expedition = Number(data.expeditionFee ?? 0);
      const other = Number(data.otherFee ?? 0);

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

      if (![price, bbn, expedition, other].every((v) => Number.isFinite(v) && v >= 0)) {
        toast.error('Harga dan biaya harus berupa angka valid');
        return;
      }

      const maxCapacity = Number(transactionDetail?.max_capacity ?? 0);
      const usedQty = (existingItems?.data ?? []).reduce((acc, item) => acc + Number(item.qty_total ?? 0), 0);
      const remainingCapacity = Math.max(0, maxCapacity - usedQty);

      if (maxCapacity > 0 && qty > remainingCapacity) {
        toast.error(`Qty melebihi kapasitas sisa transaksi. Sisa kapasitas: ${remainingCapacity}`);
        return;
      }

      const payload = {
        unit_transaction_id: transactionId,
        unit_type_id: unitTypeId,
        qty_total: qty,
        price,
        bbn_price: bbn,
        expedition_fee: expedition,
        other_fee: other,
        price_discount: Number(data.price_discount ?? 0) || 0,
        price_usd_discount: Number(data.price_usd_discount ?? 0) || 0,
        price_usd: data.priceUsd ? Number(data.priceUsd) : undefined,
        price_per_unit_usd: data.pricePerUnitUsd ? Number(data.pricePerUnitUsd) : undefined,
        usd_costs: data.usd_costs && data.usd_costs.length > 0 ? data.usd_costs : undefined,
        company_id: companyId ? Number(companyId) : undefined,
        type: type,
        dpp_tax_id: data.dppTaxVersionId ? Number(data.dppTaxVersionId) : undefined,
        ppn_tax_id: data.ppnTaxVersionId ? Number(data.ppnTaxVersionId) : undefined,
      };

      const response = await addUnitMutation.mutateAsync(payload);

      const currentTemplateId = transactionDetail?.documentTemplateId ?? null;
      if ((data.documentTemplateId ?? null) !== currentTemplateId) {
        await updateTemplateMutation.mutateAsync({ id: transactionId, documentTemplateId: data.documentTemplateId ?? null });
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sales-transaction', transactionId] }),
        queryClient.invalidateQueries({ queryKey: ['sales-transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['purchase-by-id', transactionId] }),
        queryClient.invalidateQueries({ queryKey: ['unit-transaction', transactionId] }),
        queryClient.invalidateQueries({ queryKey: ['purchase-unit-items', transactionId] }),
        queryClient.invalidateQueries({ queryKey: ['sales-unit-items', transactionId] }),
      ]);

      const code = (response as { code?: string } | undefined)?.code || transactionDetail?.code || transactionId;
      toast.success(`Transaksi ${isPurchase ? 'Pembelian' : 'Penjualan'} Unit Tipe berhasil ditambahkan dengan kode transaksi ${code}`);
      router.push(`${transactionPath}/${transactionId}`);
    } catch (error: any) {
      const status = error?.statusCode ?? error?.response?.status;
      if (status === 422) {
        toast.error('Stok tidak tersedia di warehouse. Silakan pilih tipe unit lain yang tersedia.');
        return;
      }

      const detail = error?.details;
      const message = typeof detail === 'string' ? detail : error?.message || 'Gagal menambahkan unit.';
      toast.error(message);
    }
  };

  const handleTransactionSubmit = (data: UnitTransactionFormValues) => {
    if (isPurchase) {
      void submitNewTransactionPurchase(data);
      return;
    }
    void submitNewTransactionSales(data);
  };

  if (isUnitMode && isLoadingDetail) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (isUnitMode) {
    const invoiceCode = transactionDetail?.code ?? '-';

    return (
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader
            breadcrumbs={[
              { label: isPurchase ? 'Pembelian Unit' : 'Penjualan Unit', onClick: () => router.push(transactionPath) },
              { label: isPurchase ? 'Detail Pembelian' : 'Detail Penjualan', onClick: () => router.push(`${transactionPath}/${transactionId}`) },
              { label: isPurchase ? 'Tambah Unit Pembelian' : 'Tambah Unit Penjualan' },
            ]}
            title={isPurchase ? 'Tambah Unit Pembelian' : 'Tambah Unit Penjualan'}
            onBack={() => router.push(`${transactionPath}/${transactionId}`)}
            subtitle={
              <div className="flex flex-wrap items-center gap-2">
                <span>{isPurchase ? 'Kode Pembelian:' : 'Kode Penjualan:'}</span>
                <span className={isPurchase ? 'font-semibold text-orange-600' : 'font-semibold text-orange-600'}>{invoiceCode}</span>
              </div>
            }
          />

          <Card className="rounded-md">
            <CardContent className="p-6">
              <UnitTransactionForm
                type={type}
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
                  documentTemplateId: transactionDetail?.documentTemplateId ?? null,
                }}
                excludedTypeUnitIds={existingTypeUnitIds}
                onSubmit={handleUnitSubmit}
                onCancel={() => router.back()}
                submitDisabled={addUnitMutation.isPending}
                cancelDisabled={addUnitMutation.isPending}
                loading={addUnitMutation.isPending}
                companyId={companyId}
              />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: isPurchase ? 'Pembelian Unit' : 'Penjualan Unit', onClick: () => router.push(transactionPath) },
            { label: isPurchase ? 'Tambah Data Pembelian' : 'Tambah Data Penjualan' },
          ]}
          title={isPurchase ? 'Tambah Data Pembelian' : 'Tambah Data Penjualan'}
          subtitle={
            <div className="flex flex-wrap items-center gap-2">
              <span>{isPurchase ? 'Kode Beli:' : 'Kode Jual:'}</span>
              <span className={isPurchase ? 'font-semibold text-orange-600' : 'font-semibold text-blue-600'}>{generatedCode}</span>
            </div>
          }
          onBack={() => router.push(transactionPath)}
        />

        <CollapsibleBox
          icon={FileText}
          title={`Informasi ${isPurchase ? 'Pembelian' : 'Penjualan'}`}
          description={`Kelola detail informasi ${isPurchase ? 'pembelian' : 'penjualan'} unit dan biaya-biaya terkait`}
        >
          <UnitTransactionForm
            type={type}
            allowCreateTypeUnit
            onSubmit={handleTransactionSubmit}
            loading={isPurchase ? createPurchase.isPending : createSales.isPending}
            onCancel={() => router.push(transactionPath)}
            companyId={companyId}
            prependFields={(form) => (
              <UnitTransactionPartyFields
                type={type}
                companyId={companyId}
                form={form}
                personId={personId}
                selectedPerson={selectedPerson}
                transactionDate={transactionDate}
                onDateChange={setTransactionDate}
                onPersonSelect={handlePersonSelect}
              />
            )}
          />
        </CollapsibleBox>
      </div>
    </DashboardLayout>
  );
}
