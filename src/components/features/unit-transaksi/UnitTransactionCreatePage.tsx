'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
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
import { CollapsibleBox } from '@/components/ui/collapsible-box';
import { FileText } from 'lucide-react';

type UnitTransactionCreatePageProps = {
  type: UnitTransactionKind;
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

export function UnitTransactionCreatePage({ type }: UnitTransactionCreatePageProps) {
  const router = useRouter();
  const { companyId } = useCompany();
  const createPurchase = useCreatePurchase();
  const createSales = useCreateSales();
  const slug = getSlug(router.query.slug);
  const isPurchase = type === 'purchase';
  const transactionPath = `/dashboard/${slug}/transaksi/${isPurchase ? 'pembelian-unit' : 'penjualan-unit'}`;
  const generatedCode = useMemo(
    () => (isPurchase ? createPurchaseCode(slug) : generateSalesCode(router.query.slug)),
    [isPurchase, router.query.slug, slug],
  );
  const [personId, setPersonId] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<UnitTransactionPerson | null>(null);
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);

  const handlePersonSelect = (person: UnitTransactionPerson) => {
    setPersonId(String(person.id));
    setSelectedPerson(person);
  };

  const submitPurchase = async (data: UnitTransactionFormValues) => {
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
      toast.success(`Pembelian berhasil dibuat dengan nomor Transaksi ${response?.code}`);
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
            toast.success('Pembelian berhasil dibuat');
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

  const submitSales = async (data: UnitTransactionFormValues) => {
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
      toast.success('Penjualan unit berhasil ditambahkan');
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

  const handleSubmit = (data: UnitTransactionFormValues) => {
    if (isPurchase) {
      void submitPurchase(data);
      return;
    }
    void submitSales(data);
  };

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
            onSubmit={handleSubmit}
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
