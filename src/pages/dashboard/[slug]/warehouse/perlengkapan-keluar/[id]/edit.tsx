import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useRouter } from 'next/router';
import { ArrowLeft, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { MaterialReceiptItemModal } from '@/components/features/material-receipt/MaterialReceiptItemModal';
import { UploadInvoiceModal } from '@/components/features/material-receipt/UploadInvoiceModal';
import { SearchableSelect } from '@/components/features/vehicle-data/SearchableSelect';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Textarea } from '@/components/ui/textarea';
import type { MaterialTransactionDetailItem } from '@/@types/material-transaction.types';
import { useMaterials } from '@/hooks/useMaterial';
import {
  useCreateMaterialTransactionItem,
  useDeleteMaterialTransactionItem,
  useMaterialTransaction,
  useMaterialTransactionItem,
  useMaterialTransactionItems,
  useUpdateMaterialTransaction,
  useUpdateMaterialTransactionItem,
  useUploadMaterialTransactionInvoice,
} from '@/hooks/useMaterialTransaction';
import { useWarehouseOptions } from '@/hooks/usePengeluaranUnit';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { getVisiblePageNumbers } from '@/lib/api/pagination';
import { ApiResponseError, ApiValidationError } from '@/lib/api/response';
import { materialTransactionSchema, type MaterialTransactionFormValues, type MaterialTransactionItemFormValues } from '@/scheme/material-transaction.schema';
import { LoadingState } from '@/components/ui/loading-state';

const toDateValue = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export default function MaterialReleaseEditPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const rawId = typeof router.query.id === 'string' ? Number(router.query.id) : NaN;
  const transactionId = Number.isFinite(rawId) ? rawId : undefined;
  const { page, perPage, search, setPage, setPerPage, setSearch } = useQueryParamsTable({ defaultPerPage: 25 });

  const transactionQuery = useMaterialTransaction(transactionId);
  const itemsQuery = useMaterialTransactionItems({
    page,
    perPage,
    search,
    materialTransactionId: transactionId,
    type: 'sales',
    enabled: !!transactionId,
  });
  const warehousesQuery = useWarehouseOptions();

  const [materialSearch, setMaterialSearch] = useState('');
  const materialsQuery = useMaterials({ page: 1, perPage: 100, search: materialSearch, sort_order: 'asc' });
  const [openItemModal, setOpenItemModal] = useState(false);
  const [openInvoiceModal, setOpenInvoiceModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MaterialTransactionDetailItem | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | undefined>(undefined);
  const itemDetailQuery = useMaterialTransactionItem(editingItemId);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteTargets, setDeleteTargets] = useState<MaterialTransactionDetailItem[]>([]);

  const updateTransactionMutation = useUpdateMaterialTransaction();
  const createItemMutation = useCreateMaterialTransactionItem();
  const updateItemMutation = useUpdateMaterialTransactionItem();
  const deleteItemMutation = useDeleteMaterialTransactionItem();
  const uploadInvoiceMutation = useUploadMaterialTransactionInvoice();

  const form = useForm<MaterialTransactionFormValues>({
    resolver: zodResolver(materialTransactionSchema),
    defaultValues: {
      warehouseId: 0,
      supplierName: '',
      transactionDate: '',
      description: '',
    },
  });

  useEffect(() => {
    if (!transactionQuery.data) return;
    form.reset({
      warehouseId: transactionQuery.data.warehouseId,
      supplierName: transactionQuery.data.supplierName,
      transactionDate: transactionQuery.data.transactionDate,
      description: transactionQuery.data.description ?? '',
    });
  }, [transactionQuery.data, form]);

  useEffect(() => {
    if (itemDetailQuery.data) {
      setEditingItem(itemDetailQuery.data);
    }
  }, [itemDetailQuery.data]);

  const items = itemsQuery.data?.data ?? [];
  const totalPages = itemsQuery.data?.meta.lastPage ?? 1;
  const pageNumbers = useMemo(() => getVisiblePageNumbers(totalPages, page, 5), [page, totalPages]);
  const totalData = itemsQuery.data?.meta.total ?? 0;
  const startData = totalData === 0 ? 0 : (page - 1) * perPage + 1;
  const endData = Math.min(page * perPage, totalData);
  const allSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id));

  const handleUpdateTransaction = async (values: MaterialTransactionFormValues) => {
    if (!transactionId) return;

    try {
      await updateTransactionMutation.mutateAsync({
        id: transactionId,
        payload: values,
      });
      toast.success('Informasi pengeluaran berhasil diperbarui');
    } catch (error) {
      if (error instanceof ApiValidationError) {
        toast.error(error.message || 'Validasi gagal');
        return;
      }
      toast.error(error instanceof ApiResponseError ? error.message : 'Gagal memperbarui data pengeluaran');
    }
  };

  const handleSubmitItem = async (values: MaterialTransactionItemFormValues) => {
    if (!transactionId) return;

    try {
      if (editingItem) {
        await updateItemMutation.mutateAsync({
          id: editingItem.id,
          payload: {
            orderCode: values.orderCode,
            materialTransactionId: transactionId,
            materialId: values.materialId,
            qty: values.qty,
            price: values.price,
            description: values.description,
          },
        });
        toast.success('Item material berhasil diperbarui');
      } else {
        await createItemMutation.mutateAsync({
          orderCode: values.orderCode,
          materialTransactionId: transactionId,
          materialId: values.materialId,
          qty: values.qty,
          price: values.price,
          description: values.description,
        });
        toast.success('Item material berhasil ditambahkan');
      }

      setOpenItemModal(false);
      setEditingItem(null);
      setEditingItemId(undefined);
    } catch (error) {
      if (error instanceof ApiValidationError) {
        toast.error(error.message || 'Validasi gagal');
        return;
      }
      toast.error(error instanceof ApiResponseError ? error.message : 'Gagal menyimpan item material');
    }
  };

  const handleDeleteItems = async () => {
    if (!transactionId || deleteTargets.length === 0) return;

    try {
      for (const item of deleteTargets) {
        await deleteItemMutation.mutateAsync({ id: item.id, materialTransactionId: transactionId });
      }
      toast.success(`${deleteTargets.length} item material berhasil dihapus`);
      setSelectedIds((current) => current.filter((id) => !deleteTargets.some((item) => item.id === id)));
      setDeleteTargets([]);
    } catch (error) {
      toast.error(error instanceof ApiResponseError ? error.message : 'Gagal menghapus item material');
    }
  };

  const handleUploadInvoice = async (file: File | null) => {
    if (!transactionId) return;
    if (!file) {
      toast.error('Silakan pilih file invoice terlebih dahulu');
      return;
    }

    try {
      await uploadInvoiceMutation.mutateAsync({ id: transactionId, file });
      toast.success(`Invoice untuk ${transactionQuery.data?.code ?? 'transaksi ini'} berhasil diunggah`);
      setOpenInvoiceModal(false);
    } catch (error) {
      if (error instanceof ApiValidationError) {
        toast.error(error.message || 'Validasi upload invoice gagal');
        return;
      }

      toast.error(error instanceof ApiResponseError ? error.message : 'Gagal mengunggah invoice');
    }
  };

  const columns = useMemo<ColumnDef<MaterialTransactionDetailItem>[]>(
    () => [
      {
        header: 'NO',
        alignment: 'center',
        cell: (_, index) => startData + index,
      },
      {
        header: 'NO PENJUALAN',
        accessorKey: 'orderCode',
        className: 'text-slate-800',
        cell: (item) => item.orderCode ?? '-',
      },
      {
        header: 'KODE BARANG',
        accessorKey: 'material.code',
        className: 'text-slate-800 font-medium',
        cell: (item) => item.material?.code ?? '-',
      },
      {
        header: 'NAMA BARANG',
        accessorKey: 'material.name',
        className: 'text-slate-800 font-medium',
        cell: (item) => item.material?.name ?? '-',
      },
      {
        header: 'QTY',
        accessorKey: 'qty',
        alignment: 'center',
        className: 'text-slate-800',
        cell: (item) => item.qty,
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              onClick={() => {
                setEditingItem(item);
                setEditingItemId(item.id);
                setOpenItemModal(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => setDeleteTargets([item])}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [startData],
  );

  if (transactionQuery.isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (!transactionQuery.data) {
    return (
      <DashboardLayout>
        <div className="rounded-md border border-red-200 bg-red-50 p-10 text-center text-red-600">Data pengeluaran perlengkapan tidak ditemukan.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Data Pengeluaran Perlengkapan', onClick: () => router.push(`/dashboard/${slug}/warehouse/perlengkapan-keluar`) },
            { label: 'Edit' }
          ]}
          title="Data Pengeluaran Perlengkapan"
          subtitle={
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              No Pengeluaran
              {transactionQuery.data?.code && (
                <span className="font-medium text-[#1f4163]">{transactionQuery.data.code}</span>
              )}
            </div>
          }
          onBack={() => router.push(`/dashboard/${slug}/warehouse/perlengkapan-keluar`)}
        />

        <Card className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-none">
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-6">
              <h2 className="text-[20px] font-semibold text-slate-950">Informasi Pengeluaran</h2>
            </div>

            <form onSubmit={form.handleSubmit(handleUpdateTransaction)} className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-[15px] font-medium text-slate-900">No Pengeluaran</Label>
                  <Input value={transactionQuery.data.code} readOnly className="h-12 rounded-md border-slate-200 bg-white text-[15px]" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[15px] font-medium text-slate-900">Tanggal Keluar</Label>
                  <Controller
                    control={form.control}
                    name="transactionDate"
                    render={({ field }) => (
                      <DatePicker
                        value={toDateValue(field.value)}
                        onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                        placeholder="Pilih tanggal"
                        className="h-12 rounded-md border-slate-200 px-4 text-[15px]"
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[15px] font-medium text-slate-900">Tujuan / Supplier</Label>
                  <Input {...form.register('supplierName')} className="h-12 rounded-md border-slate-200 text-[15px]" />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <div className="space-y-2">
                  <Label className="text-[15px] font-medium text-slate-900">Warehouse</Label>
                  <Controller
                    control={form.control}
                    name="warehouseId"
                    render={({ field }) => (
                      <SearchableSelect
                        value={field.value ? String(field.value) : ''}
                        onChange={(value) => field.onChange(Number(value))}
                        options={(warehousesQuery.data ?? []).map((warehouse) => ({ value: String(warehouse.id), label: warehouse.name }))}
                        placeholder={warehousesQuery.isLoading ? 'Memuat warehouse...' : 'Pilih warehouse'}
                        searchPlaceholder="Cari warehouse..."
                        emptyText="Warehouse tidak ditemukan."
                        loading={warehousesQuery.isLoading}
                        className="h-12 rounded-md border-slate-200 px-4 text-[15px]"
                      />
                    )}
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="button" onClick={() => setOpenInvoiceModal(true)} className="h-11 rounded-md px-5 text-[16px] button-theme-1!">
                    Upload Invoice
                  </Button>
                  <Button type="submit" disabled={updateTransactionMutation.isPending} className="h-11 rounded-md bg-emerald-500 px-5 text-[16px] hover:bg-emerald-600">
                    {updateTransactionMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[15px] font-medium text-slate-900">Keterangan</Label>
                <Textarea {...form.register('description')} rows={4} className="rounded-md border-slate-200 px-4 py-3 text-[15px]" />
              </div>
            </form>
          </div>
        </Card>

        <BaseTable
          data={items}
          columns={columns}
          loading={itemsQuery.isLoading || itemsQuery.isFetching}
          showCheckbox
          selectedIds={new Set(selectedIds.map(String))}
          onSelectedIdsChange={(set) => setSelectedIds(Array.from(set).map(Number))}
          getRowId={(item) => String(item.id)}
          searchPlaceholder="Search here"
          search={search}
          onSearchChange={setSearch}
          showLimitChange
          perPage={perPage}
          onPerPageChange={setPerPage}
          meta={{
            currentPage: page,
            perPage,
            lastPage: totalPages,
            total: totalData,
          }}
          onPageChange={setPage}
          headerActions={
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              {selectedIds.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setDeleteTargets(items.filter((item) => selectedIds.includes(item.id)))}
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  Hapus ({selectedIds.length})
                </Button>
              )}
              <Button onClick={() => { setEditingItem(null); setEditingItemId(undefined); setOpenItemModal(true); }} className="button-theme-1!">
                <Plus className="mr-2 h-4 w-4" />
                Tambah
              </Button>
            </div>
          }
        />
      </div>

      <MaterialReceiptItemModal
        open={openItemModal}
        onOpenChange={(open) => {
          setOpenItemModal(open);
          if (!open) {
            setEditingItem(null);
            setEditingItemId(undefined);
            setMaterialSearch('');
          }
        }}
        initialData={itemDetailQuery.data ?? editingItem}
        materials={materialsQuery.data?.data ?? []}
        isLoadingMaterials={materialsQuery.isLoading || itemDetailQuery.isLoading}
        materialSearch={materialSearch}
        onMaterialSearchChange={setMaterialSearch}
        onSubmit={handleSubmitItem}
        isSubmitting={createItemMutation.isPending || updateItemMutation.isPending}
        addTitle="Input Pengeluaran Unit"
        editTitle="Edit Pengeluaran Unit"
        descriptionText="Masukkan detail pengeluaran unit baru"
        orderCodeLabel="Nomor Penjualan"
        orderCodePlaceholder="Masukkan nomor penjualan"
        priceLabel="Harga Jual"
      />

      <UploadInvoiceModal
        open={openInvoiceModal}
        onOpenChange={setOpenInvoiceModal}
        onSubmit={handleUploadInvoice}
        isSubmitting={uploadInvoiceMutation.isPending}
      />

      <AlertDialog open={deleteTargets.length > 0} onOpenChange={(open) => !open && setDeleteTargets([])}>
        <AlertDialogContent className="max-w-[680px] rounded-[28px] border-none p-10 shadow-2xl">
          <AlertDialogHeader className="space-y-5 text-left">
            <AlertDialogTitle className="text-[28px] font-semibold text-slate-950">Hapus Data Ini?</AlertDialogTitle>
            <AlertDialogDescription className="text-[18px] text-slate-500">Apa anda yakin ingin menghapus data ini?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-end gap-4">
            <AlertDialogCancel className="h-14 rounded-md border-slate-300 px-7 text-[18px]">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItems} disabled={deleteItemMutation.isPending} className="h-14 rounded-md bg-red-600 px-7 text-[18px] hover:bg-red-700">
              {deleteItemMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
