'use client';

import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { UnitTransactionForm } from '@/components/features/unit-transaction/UnitTransactionForm';
import { useCreatePurchase } from '@/hooks/usePurchase';
import { useCompany } from '@/contexts/CompanyContext';
import { useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { type UnitTransactionFormValues } from '@/components/features/unit-transaction/unit-transaction.schema';
import { CreatePurchaseRequest } from '@/@types/purchase.types';
import { SupplierCombobox } from '@/components/features/supplier/SupplierCombobox';
import type { Supplier } from '@/@types/supplier.types';
import { apiClient } from '@/lib/api/client';
import { purchaseService } from '@/services/purchase.service';

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

const DEFAULT_WAREHOUSE_ID = 1;

export default function CreatePurchasePage() {
  const router = useRouter();
  const { slug } = router.query;
  const { companyId } = useCompany();
  const mutation = useCreatePurchase();
  const [personId, setPersonId] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Supplier | null>(null);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);

  const generatedCode = useMemo(() => {
    const now = new Date();
    const ymd = now.toISOString().split('T')[0].replace(/-/g, '');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    const seq = String(now.getSeconds()).padStart(2, '0');
    const slugCode = String(slug || 'UNK')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    const companyCode = slugCode ? slugCode.slice(0, 3) : 'UNK';
    return `PBL-${companyCode}/${ymd}-${seq}${ms}`;
  }, [slug]);

  const handleSubmit = async (data: UnitTransactionFormValues) => {
    try {
      const personNumeric = Number(personId);
      const warehouseNumeric = DEFAULT_WAREHOUSE_ID;
      const companyNumeric = Number(companyId);
      const qtyNumber = Number(data.qty ?? 0);
      const unitTypeIdNumber = Number(data.unitTypeId ?? 0);
      const priceNumber = Number(data.price ?? 0);
      const bbnNumber = Number(data.bbnPrice ?? 0);
      const expeditionNumber = Number(data.expeditionFee ?? 0);
      const otherFeeNumber = Number(data.otherFee ?? 0);

      if (!personNumeric || personNumeric <= 0) {
        toast.error('Supplier wajib dipilih (person_id tidak boleh kosong)');
        return;
      }

      if (!warehouseNumeric || warehouseNumeric <= 0) {
        toast.error('Warehouse ID wajib diisi (gunakan ID yang valid, contoh: 1)');
        return;
      }

      if (!companyNumeric || companyNumeric <= 0) {
        toast.error('Company ID tidak valid. Silakan pilih company terlebih dahulu.');
        return;
      }

      if (!qtyNumber || qtyNumber <= 0) {
        toast.error('Qty wajib diisi dan minimal 1');
        return;
      }

      if (!unitTypeIdNumber || unitTypeIdNumber <= 0) {
        toast.error('Tipe unit wajib dipilih sebelum menyimpan pembelian.');
        return;
      }

      // Non-blocking precheck: backend remains the source of truth for capacity validation.
      await getWarehouseRemainingCapacity(warehouseNumeric);

      const payload: CreatePurchaseRequest = {
        warehouse_id: warehouseNumeric,
        person_id: personNumeric,
        company_id: companyNumeric,
        code: generatedCode,
        type: 'purchase',
        max_capacity: String(qtyNumber),
        stock_state: 'draft',
        unit_type_id: unitTypeIdNumber,
        qty_total: qtyNumber,
        price: priceNumber,
        bbn_price: bbnNumber,
        expedition_fee: expeditionNumber,
        other_fee: otherFeeNumber,
        document_template_id: data.documentTemplateId ?? null,
      };

      const response = await mutation.mutateAsync(payload);

      toast.success(`Pembelian berhasil dibuat dengan nomor Transaksi ${response?.code}`);
      router.push(`/dashboard/${slug}/transaksi/pembelian-unit/${response?.id}`);
    } catch (err: any) {
      const statusCode = err?.statusCode ?? err?.response?.status;
      const apiMessage = err?.message;
      const apiErrors = err?.details || err?.response?.data?.errors;

      // Some backend deployments persist the transaction but return 405.
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
            router.push(`/dashboard/${slug}/transaksi/pembelian-unit`);
            return;
          }
        } catch {
          // Continue to normal error toast below.
        }
      }

      let detail = '';
      if (apiErrors && typeof apiErrors === 'object') {
        if (Array.isArray((apiErrors as any).max_capacity)) {
          toast.error('Kapasitas gudang tidak cukup. Gunakan Warehouse ID lain atau sesuaikan max capacity.');
          return;
        }
        const entries = Object.entries(apiErrors)
          .map(([k, v]) => {
            const msg = Array.isArray(v) ? v[0] : String(v);
            return `${k}: ${msg}`;
          })
          .join(', ');
        detail = entries;
      }
      const detailJson = err?.response?.data ? JSON.stringify(err.response.data) : '';
      toast.error(detail || apiMessage || 'Gagal membuat pembelian');
      if (process.env.NODE_ENV !== 'production') {
        if (detailJson) console.error('create purchase error detail', detailJson);
      }
    }
  };

  const purchasePath = `/dashboard/${slug}/transaksi/pembelian-unit`;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Pembelian Unit', onClick: () => router.push(`/dashboard/${slug}/transaksi/pembelian-unit`) },
            { label: 'Detail Pembelian' }
          ]}
          title="Tambah Data Pembelian"
          subtitle={
            <>
              <span>Kode Beli:</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:text-orange-700">{generatedCode}</span>
            </>
          }
          onBack={() => router.push(`/dashboard/${slug}/transaksi/pembelian-unit`)}
        />

        <div className="rounded-md border bg-white p-5 md:p-6 shadow-sm">
          <UnitTransactionForm
            type="purchase"
            allowCreateTypeUnit
            onSubmit={handleSubmit}
            loading={mutation.isPending}
            onCancel={() => router.push(purchasePath)}
            companyId={companyId}
            prependFields={
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tanggal</Label>
                  <Input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="bg-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Supplier</Label>
                  <SupplierCombobox
                    companyId={companyId}
                    selectedId={personId}
                    allowCreate
                    onSelect={(supplier) => {
                      setPersonId(String(supplier.id));
                      setSelectedPerson(supplier);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Alamat</Label>
                  <Input value={selectedPerson?.address ?? ''} readOnly disabled className="bg-transparent" placeholder="Alamat supplier" />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">NPWP</Label>
                  <Input value={selectedPerson?.npwp ?? ''} readOnly disabled className="bg-transparent" placeholder="NPWP supplier" />
                </div>
              </div>
            }
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
