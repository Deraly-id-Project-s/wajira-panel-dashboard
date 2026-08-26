import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, Plus, Save } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { MoneyInput } from '@/components/ui/money-input';
import { useCompany } from '@/contexts/CompanyContext';
import { usePurchases, usePurchaseById, useUnitTransactionItemDetailsData } from '@/hooks/usePurchase';
import { useCreateRefund, useUpdateRefund, useRefundDetail } from '@/hooks/useRefundAdministrasi';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { CopyBox } from '@/components/ui/copy-box';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { toast } from 'sonner';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { ReferenceLink } from '@/components/ui/reference-link';
import { LoadingState } from '@/components/ui/loading-state';

const refundFormSchema = z.object({
  unit_transaction_id: z.string().min(1, 'Transaksi harus dipilih'),
  refund_date: z.string().min(1, 'Tanggal refund harus diisi'),
  refund_amount: z.number().min(1, 'Nominal refund harus lebih dari 0'),
  note: z.string().min(1, 'Catatan / Alasan refund harus diisi'),
  unit_transaction_item_detail_ids: z.array(z.number()).min(1, 'Pilih minimal satu unit untuk direfund'),
});

type RefundFormValues = z.infer<typeof refundFormSchema>;

interface PurchaseRefundFormPageContentProps {
  mode: 'create' | 'edit';
  refundId?: string;
}

export default function PurchaseRefundFormPageContent({ mode, refundId }: PurchaseRefundFormPageContentProps) {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const { companyId } = useCompany();

  // Search filter states for items checkbox table
  const [filterColor, setFilterColor] = useState('');
  const [filterMachineNumber, setFilterMachineNumber] = useState('');
  const [filterChassisNumber, setFilterChassisNumber] = useState('');

  const debouncedColor = useDebouncedValue(filterColor, 300);
  const debouncedMachine = useDebouncedValue(filterMachineNumber, 300);
  const debouncedChassis = useDebouncedValue(filterChassisNumber, 300);

  const createMutation = useCreateRefund();
  const updateMutation = useUpdateRefund();

  // Edit Mode Query
  const refundDetailQuery = useRefundDetail(refundId);
  const existingRefund = refundDetailQuery.data;

  const form = useForm<RefundFormValues>({
    resolver: zodResolver(refundFormSchema),
    defaultValues: {
      unit_transaction_id: '',
      refund_date: new Date().toISOString().slice(0, 10),
      refund_amount: 0,
      note: '',
      unit_transaction_item_detail_ids: [],
    },
  });

  const selectedTransactionId = form.watch('unit_transaction_id');
  const selectedIds = form.watch('unit_transaction_item_detail_ids');

  // Load Parent Transaction Details to Map Prices
  const { data: parentPurchase, isLoading: isLoadingParent } = usePurchaseById(selectedTransactionId);

  // Fetch Items from requested endpoint: /wapi/transaction/unit-transaction/unit-transaction/:id/get-item-details
  const { data: itemDetails = [], isLoading: isLoadingItems } = useUnitTransactionItemDetailsData(
    selectedTransactionId,
    {
      in_stock: true,
      color: debouncedColor || undefined,
      machine_number: debouncedMachine || undefined,
      chassis_number: debouncedChassis || undefined,
      status: 'normal',
    }
  );

  // Prepopulate query params or existing refund values
  useEffect(() => {
    if (router.query.unit_transaction_id && mode === 'create') {
      form.setValue('unit_transaction_id', String(router.query.unit_transaction_id));
    }
  }, [router.query.unit_transaction_id, mode, form]);

  useEffect(() => {
    if (mode === 'edit' && existingRefund) {
      form.reset({
        unit_transaction_id: String(existingRefund.unit_transaction_id ?? existingRefund.transaction?.id ?? ''),
        refund_date: existingRefund.refund_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        refund_amount: Number(existingRefund.refund_amount || 0),
        note: existingRefund.note || '',
        unit_transaction_item_detail_ids: (existingRefund.items ?? []).map((item) => Number(item.pivot?.unit_transaction_item_detail_id || item.id)),
      });
    }
  }, [existingRefund, mode, form]);

  // Combine items to resolve prices from parent transaction
  const mappedItems = useMemo(() => {
    return itemDetails.map((detail) => {
      // Find matching item in transaction details to get price
      const parentItem = parentPurchase?.units?.find(
        (unit) => String(unit.typeUnitId) === String(detail.unit_transaction_item_id)
      ) || parentPurchase?.unit_transaction_items?.find(
        (item: any) => Number(item.id) === Number(detail.unit_transaction_item_id)
      );

      return {
        ...detail,
        price: detail.price !== undefined ? Number(detail.price) : Number(parentItem?.price ?? 0),
      };
    });
  }, [itemDetails, parentPurchase]);

  // Calculations for Summary
  const selectedItemsPriceSum = useMemo(() => {
    return mappedItems
      .filter((item) => selectedIds.includes(Number(item.id)))
      .reduce((sum, item) => sum + Number(item.price || 0), 0);
  }, [mappedItems, selectedIds]);

  const toggleItem = useCallback((id: number, checked: boolean) => {
    if (checked) {
      form.setValue('unit_transaction_item_detail_ids', [...selectedIds, id]);
    } else {
      form.setValue('unit_transaction_item_detail_ids', selectedIds.filter((item) => item !== id));
    }
  }, [selectedIds, form]);

  const allSelected = mappedItems.length > 0 && mappedItems.every((item) => selectedIds.includes(Number(item.id)));

  const toggleAllItems = useCallback((checked: boolean) => {
    if (checked) {
      form.setValue('unit_transaction_item_detail_ids', mappedItems.map((item) => Number(item.id)));
    } else {
      form.setValue('unit_transaction_item_detail_ids', []);
    }
  }, [mappedItems, form]);

  const onSubmit = async (values: RefundFormValues) => {
    let newRefundId = null;
    try {
      if (mode === 'create') {
        const response = await createMutation.mutateAsync({
          unit_transaction_id: values.unit_transaction_id,
          refund_date: values.refund_date,
          refund_amount: values.refund_amount,
          note: values.note,
          unit_transaction_item_detail_ids: values.unit_transaction_item_detail_ids,
        });
        toast.success('Data refund berhasil dibuat');
        newRefundId = response.id;
      } else {
        if (!refundId) return;
        await updateMutation.mutateAsync({
          id: refundId,
          payload: {
            unit_transaction_id: values.unit_transaction_id,
            refund_date: values.refund_date,
            refund_amount: values.refund_amount,
            note: values.note,
            unit_transaction_item_detail_ids: values.unit_transaction_item_detail_ids,
          },
        });
        toast.success('Data refund berhasil diperbarui');
        newRefundId = refundId;
      }

      router.push(`/dashboard/${slug}/transaksi/pembelian-unit/${values.unit_transaction_id}/refund/${newRefundId}`);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menyimpan data refund');
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        header: (
          <Checkbox
            checked={allSelected}
            onCheckedChange={(checked) => toggleAllItems(Boolean(checked))}
          />
        ),
        alignment: 'center',
        cell: (item) => (
          <Checkbox
            checked={selectedIds.includes(Number(item.id))}
            onCheckedChange={(checked) => toggleItem(Number(item.id), Boolean(checked))}
          />
        ),
      },
      {
        header: 'NAMA TIPE UNIT',
        accessorKey: 'unit_type_name',
        sortable: true,
        cell: (item) => item?.unit_type_name ? <ReferenceLink href={`/dashboard/${slug}/master/tipe-unit?search=${item?.unit_type_name}`}>{item?.unit_type_name}</ReferenceLink> : '-'
      },
      {
        header: 'WARNA',
        accessorKey: 'color',
        sortable: true,
      },
      {
        header: 'NOMOR MESIN',
        accessorKey: 'machine_number',
        sortable: true,
        cell: (item) => <CopyBox text={item.machine_number} />,
      },
      {
        header: 'NOMOR RANGKA',
        accessorKey: 'chassis_number',
        sortable: true,
        cell: (item) => <CopyBox text={item.chassis_number} />,
      },
      {
        header: 'STATUS',
        accessorKey: 'status',
        sortable: true,
        cell: (item) => (
          <Badge variant="outline" className="font-semibold capitalize">
            {item.status || '-'}
          </Badge>
        ),
      },
      {
        header: 'HARGA',
        accessorKey: 'price',
        sortable: true,
        cell: (item) => currenciesFormat('idr', Number(item.price || 0)),
      },
    ],
    [slug, selectedIds, allSelected, toggleAllItems, toggleItem]
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Pembelian Unit', onClick: () => router.push(`/dashboard/${slug}/transaksi/pembelian-unit`) },
            { label: 'Data Refund Pembelian', onClick: () => router.push(`/dashboard/${slug}/transaksi/refund-beli${parentPurchase?.id ? `?unit_transaction_id=${parentPurchase.id}` : ''}`) },
            { label: mode === 'create' ? 'Tambah Data Refund Pembelian' : 'Edit Data Refund Pembelian' }
          ]}
          title={mode === 'create' ? 'Tambah Data Refund Pembelian' : 'Edit Data Refund Pembelian'}
          subtitle={
            <div className="flex items-center gap-2">
              <span>Kode Beli:</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:text-orange-700">
                {parentPurchase?.code || '-'}
              </span>
            </div>
          }
          onBack={() => router.push(`/dashboard/${slug}/transaksi/refund-beli${parentPurchase?.id ? `?unit_transaction_id=${parentPurchase.id}` : ''}`)}
        />

        {/* Main Forms Card */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Form Fields Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Informasi Refund</h2>

              {/* Unit Transaction ID Select */}
              <div className="space-y-2">
                <Label>Pilih Transaksi Pembelian</Label>
                <Input value={parentPurchase?.code || 'Memuat...'} disabled className="bg-slate-50 font-medium" />
                {form.formState.errors.unit_transaction_id && (
                  <p className="text-xs text-red-500">{form.formState.errors.unit_transaction_id.message}</p>
                )}
              </div>

              {/* Date Input */}
              <div className="space-y-2">
                <Label>Tanggal Refund</Label>
                <Input
                  type="date"
                  value={form.watch('refund_date')}
                  onChange={(e) => form.setValue('refund_date', e.target.value)}
                />
                {form.formState.errors.refund_date && (
                  <p className="text-xs text-red-500">{form.formState.errors.refund_date.message}</p>
                )}
              </div>

              {/* Refund Amount Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Nominal Refund</Label>
                  {selectedItemsPriceSum > 0 && (
                    <button
                      type="button"
                      onClick={() => form.setValue('refund_amount', selectedItemsPriceSum)}
                      className="text-xs text-blue-600 font-medium hover:underline"
                    >
                      Gunakan Total Unit ({currenciesFormat('idr', selectedItemsPriceSum)})
                    </button>
                  )}
                </div>
                <MoneyInput
                  value={form.watch('refund_amount')}
                  onChangeValue={(val) => form.setValue('refund_amount', val)}
                />
                {form.formState.errors.refund_amount && (
                  <p className="text-xs text-red-500">{form.formState.errors.refund_amount.message}</p>
                )}
              </div>

              {/* Notes Input */}
              <div className="space-y-2">
                <Label>Catatan / Alasan</Label>
                <Textarea
                  placeholder="Ketik keterangan cacat, kerusakan, dll..."
                  value={form.watch('note')}
                  onChange={(e) => form.setValue('note', e.target.value)}
                  rows={4}
                />
                {form.formState.errors.note && (
                  <p className="text-xs text-red-500">{form.formState.errors.note.message}</p>
                )}
              </div>

              {/* QTY & Summary Indicators */}
              <div className="pt-2 border-t flex flex-col gap-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Jumlah Unit Terpilih:</span>
                  <span className="font-semibold text-slate-900">{selectedIds.length} Unit</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Harga Unit:</span>
                  <span className="font-semibold text-slate-900">{currenciesFormat('idr', selectedItemsPriceSum)}</span>
                </div>
              </div>

              {/* Actions Save */}
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full bg-[#1e3a5f] hover:bg-[#152e4d] gap-2 py-6 rounded-md"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <LoadingState variant="inline" text={null} />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Simpan Refund Beli
              </Button>
            </div>
          </div>

          {/* Unit Details Checkbox Table */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-3 gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Unit Transaksi Pembelian</h2>
                  <p className="text-xs text-slate-500">Pilih unit yang ingin direfund</p>
                </div>
              </div>

              {/* Search Filters for Table */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-md border border-slate-100">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500">Warna</span>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={filterColor}
                      onChange={(e) => setFilterColor(e.target.value)}
                      placeholder="Cari warna..."
                      className="pl-8 h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500">Nomor Mesin</span>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={filterMachineNumber}
                      onChange={(e) => setFilterMachineNumber(e.target.value)}
                      placeholder="Cari nomor mesin..."
                      className="pl-8 h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500">Nomor Rangka</span>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={filterChassisNumber}
                      onChange={(e) => setFilterChassisNumber(e.target.value)}
                      placeholder="Cari nomor rangka..."
                      className="pl-8 h-9 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* The BaseTable Checkbox list */}
              {selectedTransactionId ? (
                <BaseTable
                  data={mappedItems}
                  columns={columns}
                  loading={isLoadingItems || isLoadingParent}
                />
              ) : (
                <div className="h-48 flex flex-col items-center justify-center border border-dashed rounded-md text-slate-400 text-sm">
                  Silakan pilih transaksi pembelian terlebih dahulu untuk melihat daftar unit
                </div>
              )}

              {form.formState.errors.unit_transaction_item_detail_ids && (
                <p className="text-sm text-red-500 font-medium mt-2">
                  {form.formState.errors.unit_transaction_item_detail_ids.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
