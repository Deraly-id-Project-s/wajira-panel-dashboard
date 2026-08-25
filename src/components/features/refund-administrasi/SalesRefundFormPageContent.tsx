import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Search, Save, ChevronRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { MoneyInput } from '@/components/ui/money-input';
import { useCreateRefund, useUpdateRefund, useRefundDetail, useRefundSelectableItems } from '@/hooks/useRefundAdministrasi';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { CopyBox } from '@/components/ui/copy-box';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { toast } from 'sonner';
import { createRefundSchema, type CreateRefundFormValues } from '@/schemas/refund.schema';
import { ReferenceLink } from '@/components/ui/reference-link';
import { LoadingState } from '@/components/ui/loading-state';

interface SalesRefundFormPageContentProps {
  transactionId: string;
  mode: 'create' | 'edit';
  refundId?: string;
}

const displayDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().split('T')[0] || '';
};

export default function SalesRefundFormPageContent({ transactionId, mode, refundId }: SalesRefundFormPageContentProps) {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';

  // Search filter states for items checkbox table
  const [filterColor, setFilterColor] = useState('');
  const [filterMachineNumber, setFilterMachineNumber] = useState('');
  const [filterChassisNumber, setFilterChassisNumber] = useState('');

  // Queries & Mutations
  const createMutation = useCreateRefund();
  const updateMutation = useUpdateRefund();

  // Edit Mode Query
  const refundDetailQuery = useRefundDetail(mode === 'edit' && refundId ? refundId : undefined);
  const existingRefund = refundDetailQuery.data;

  // Retrieve unit items and parent transaction data
  const selectableItemsQuery = useRefundSelectableItems(transactionId);
  const displayedItems = useMemo(() => {
    if (mode === 'edit' && existingRefund) {
      return existingRefund.items ?? [];
    }
    return selectableItemsQuery.items ?? [];
  }, [existingRefund, mode, selectableItemsQuery.items]);

  const form = useForm<CreateRefundFormValues>({
    resolver: zodResolver(createRefundSchema),
    defaultValues: {
      unit_transaction_id: transactionId,
      refund_date: new Date().toISOString().slice(0, 10),
      refund_amount: 0,
      note: '',
      unit_transaction_item_detail_ids: [],
    },
  });

  const rawSelectedIds = form.watch('unit_transaction_item_detail_ids');
  const selectedIds = useMemo<number[]>(() => rawSelectedIds ?? [], [rawSelectedIds]);

  // Prepopulate query params or existing refund values
  useEffect(() => {
    if (transactionId) {
      form.setValue('unit_transaction_id', transactionId);
    }
  }, [transactionId, form]);

  useEffect(() => {
    if (mode === 'edit' && existingRefund) {
      form.reset({
        unit_transaction_id: String(existingRefund.unit_transaction_id ?? existingRefund.transaction?.id ?? transactionId),
        refund_date: existingRefund.refund_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        refund_amount: Number(existingRefund.refund_amount || 0),
        note: existingRefund.note || '',
        unit_transaction_item_detail_ids: (existingRefund.items ?? []).map((item) => Number(item.pivot?.unit_transaction_item_detail_id || item.id)),
      });
    }
  }, [existingRefund, mode, form, transactionId]);

  // Client-side filtering of unit items
  const filteredItems = useMemo(() => {
    return displayedItems.filter((item) => {
      const matchColor = !filterColor || item.color?.toLowerCase().includes(filterColor.toLowerCase());
      const matchMachine = !filterChassisNumber || item.machine_number?.toLowerCase().includes(filterMachineNumber.toLowerCase());
      const matchChassis = !filterChassisNumber || item.chassis_number?.toLowerCase().includes(filterChassisNumber.toLowerCase());
      return matchColor && matchMachine && matchChassis;
    });
  }, [displayedItems, filterColor, filterMachineNumber, filterChassisNumber]);

  // Calculations for Summary
  const selectedItemsPriceSum = useMemo(() => {
    return displayedItems
      .filter((item) => selectedIds.includes(Number(item.id)))
      .reduce((sum, item) => sum + Number(item.price || 0), 0);
  }, [displayedItems, selectedIds]);

  const toggleItem = useCallback((id: number, checked: boolean) => {
    if (checked) {
      form.setValue('unit_transaction_item_detail_ids', [...selectedIds, id]);
    } else {
      form.setValue('unit_transaction_item_detail_ids', selectedIds.filter((item) => item !== id));
    }
  }, [selectedIds, form]);

  const selectableFilteredItems = useMemo(() => {
    return filteredItems.filter((item) => item.status !== 'returned' && item.status !== 'refunded');
  }, [filteredItems]);

  const allSelected = selectableFilteredItems.length > 0 && selectableFilteredItems.every((item) => selectedIds.includes(Number(item.id)));

  const toggleAllItems = useCallback((checked: boolean) => {
    if (checked) {
      form.setValue('unit_transaction_item_detail_ids', selectableFilteredItems.map((item) => Number(item.id)));
    } else {
      form.setValue('unit_transaction_item_detail_ids', []);
    }
  }, [selectableFilteredItems, form]);

  const onSubmit = async (values: CreateRefundFormValues) => {
    let newRefundId = null;
    try {
      if (mode === 'create') {
        const response = await createMutation.mutateAsync({
          unit_transaction_id: values.unit_transaction_id,
          refund_date: values.refund_date,
          refund_amount: Number(values.refund_amount),
          note: values.note || '',
          unit_transaction_item_detail_ids: values.unit_transaction_item_detail_ids.map(Number),
        });

        newRefundId = response.id;
        toast.success('Data refund penjualan berhasil dibuat');
      } else {
        if (!refundId) return;
        await updateMutation.mutateAsync({
          id: refundId,
          payload: {
            unit_transaction_id: values.unit_transaction_id,
            refund_date: values.refund_date,
            refund_amount: Number(values.refund_amount),
            note: values.note || '',
            unit_transaction_item_detail_ids: values.unit_transaction_item_detail_ids.map(Number),
          },
        });
        newRefundId = refundId;
        toast.success('Data refund penjualan berhasil diperbarui');
      }
      router.push(`/dashboard/${slug}/transaksi/penjualan-unit/${transactionId}/refund/${newRefundId}`);
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
            disabled={item?.status === 'returned' || item?.status === 'refunded'}
          />
        ),
      },
      {
        header: 'TIPE UNIT',
        accessorKey: 'unit_type_name',
        sortable: true,
        cell: (item) => <ReferenceLink href={`/dashboard/${slug}/master/type-unit?search=${item?.unit_type_name}`}>{item?.unit_type_name}</ReferenceLink>
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
    [selectedIds, allSelected, toggleAllItems, toggleItem, slug]
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* BREADCRUMB HEADER */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="hover:text-slate-800 cursor-pointer" onClick={() => router.push(`/dashboard/${slug}/transaksi/`)}>
            Penjualan Unit
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="hover:text-slate-800 cursor-pointer" onClick={() => router.push(`/dashboard/${slug}/transaksi/penjualan-unit/${transactionId}/refund`)}>
            Data Refund Penjualan
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="font-medium text-slate-800">{mode === 'create' ? 'Tambah Data Refund Penjualan' : 'Edit Data Refund Penjualan'}</span>
        </div>

        {/* HEADLINE & ACTIONS */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => router.push(`/dashboard/${slug}/transaksi/penjualan-unit/${transactionId}/refund`)} variant="ghost" size="icon" className="h-10 w-10 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </Button>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-slate-900">{mode === 'create' ? 'Tambah Data Refund Penjualan' : 'Edit Data Refund Penjualan'}</h1>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span>Kode Jual:</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:text-orange-700">{selectableItemsQuery.transactionQuery?.data?.code}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Forms Card */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Form Fields Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Informasi Refund</h2>

              {/* Unit Transaction ID Select */}
              <div className="space-y-2">
                <Label>Pilih Transaksi Penjualan</Label>
                <Input value={selectableItemsQuery.transactionQuery?.data?.code || 'Memuat...'} disabled className="bg-slate-50 font-medium" />
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
                className="gap-2 py-6 rounded-md button-theme-1!"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <LoadingState variant="inline" text={null} />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Simpan Refund Jual
              </Button>
            </div>
          </div>

          {/* Unit Details Checkbox Table */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-3 gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Unit Transaksi Penjualan</h2>
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
              {transactionId ? (
                <BaseTable
                  data={filteredItems}
                  columns={columns}
                  loading={selectableItemsQuery.transactionQuery.isLoading || selectableItemsQuery.itemDetailsQuery.isLoading}
                />
              ) : (
                <div className="h-48 flex flex-col items-center justify-center border border-dashed rounded-md text-slate-400 text-sm">
                  Silakan pilih transaksi penjualan terlebih dahulu untuk melihat daftar unit
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
