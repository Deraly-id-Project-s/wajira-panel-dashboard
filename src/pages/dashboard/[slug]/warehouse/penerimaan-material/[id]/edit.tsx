import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useRouter } from 'next/router';
import { ArrowLeft, MoreVertical, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Textarea } from '@/components/ui/textarea';
import { GoodsReceiptItemModal } from '@/components/features/goods-receipt/GoodsReceiptItemModal';
import { SearchableSelect } from '@/components/features/vehicle-data/SearchableSelect';
import type { GoodsReceiptItem } from '@/@types/goods-receipt.types';
import { useCompany } from '@/contexts/CompanyContext';
import { useMaterials } from '@/hooks/useMaterial';
import {
  useCreateGoodsReceiptItem,
  useDeleteGoodsReceiptItem,
  useGoodsReceipt,
  useUpdateGoodsReceipt,
  useUpdateGoodsReceiptItem,
} from '@/hooks/useGoodsReceipt';
import { useSuppliers } from '@/hooks/useSupplier';
import { ApiResponseError, ApiValidationError } from '@/lib/api/response';
import { goodsReceiptSchema, type GoodsReceiptFormValues, type GoodsReceiptItemFormValues } from '@/scheme/goods-receipt.schema';
import { formatCurrency } from '@/components/features/goods-receipt/goods-receipt.utils';
import { LoadingState } from '@/components/ui/loading-state';

const toDateValue = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export default function GoodsReceiptEditPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const companyIdValue = Number(companyId ?? '3') || 3;
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const rawId = typeof router.query.id === 'string' ? Number(router.query.id) : NaN;
  const id = Number.isFinite(rawId) ? rawId : undefined;

  const query = useGoodsReceipt(id);
  const suppliersQuery = useSuppliers(String(companyIdValue));
  const materialsQuery = useMaterials({ page: 1, perPage: 100, sort_order: 'asc' });
  const updateReceiptMutation = useUpdateGoodsReceipt();
  const createItemMutation = useCreateGoodsReceiptItem();
  const updateItemMutation = useUpdateGoodsReceiptItem();
  const deleteItemMutation = useDeleteGoodsReceiptItem();

  const [itemOpen, setItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GoodsReceiptItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GoodsReceiptItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');

  const receipt = query.data;

  const supplierOptions = useMemo(
    () =>
      (suppliersQuery.data?.data ?? []).map((supplier) => ({
        value: String(supplier.id),
        label: supplier.name,
        subtitle: [supplier.code, supplier.phone].filter(Boolean).join(' • '),
      })),
    [suppliersQuery.data],
  );

  const form = useForm<GoodsReceiptFormValues>({
    resolver: zodResolver(goodsReceiptSchema),
    defaultValues: {
      supplierId: 0,
      transactionDate: '',
      description: '',
    },
  });

  useEffect(() => {
    if (!receipt) return;
    form.reset({
      supplierId: receipt.supplierId ?? 0,
      transactionDate: receipt.transactionDate ?? '',
      description: receipt.description ?? '',
    });
  }, [form, receipt]);

  const filteredItems = useMemo(() => {
    const source = receipt?.goodsTransactionDetails ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return source;
    return source.filter((item) =>
      [item.material?.code, item.material?.name, item.type, item.description, String(item.qty)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [receipt?.goodsTransactionDetails, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageItems = filteredItems.slice((safePage - 1) * perPage, safePage * perPage);

  useEffect(() => {
    if (selectedIds.length === 0) return;
    const validIds = new Set((receipt?.goodsTransactionDetails ?? []).map((item) => item.id));
    setSelectedIds((current) => current.filter((item) => validIds.has(item)));
  }, [receipt?.goodsTransactionDetails, selectedIds.length]);

  const handleUpdateHeader = async (values: GoodsReceiptFormValues) => {
    if (!receipt) return;
    try {
      await updateReceiptMutation.mutateAsync({
        id: receipt.id,
        payload: {
          supplierId: values.supplierId,
          transactionDate: values.transactionDate,
          description: values.description,
          location: receipt.location,
          companyId: receipt.companyId || companyIdValue,
        },
      });
      toast.success('Informasi penerimaan berhasil diperbarui');
    } catch (error) {
      const message = error instanceof ApiValidationError || error instanceof ApiResponseError ? error.message : 'Gagal memperbarui data penerimaan material';
      toast.error(message);
    }
  };

  const handleSaveItem = async (values: GoodsReceiptItemFormValues) => {
    if (!receipt) return;
    try {
      if (editingItem) {
        await updateItemMutation.mutateAsync({
          id: editingItem.id,
          payload: {
            goodsTransactionId: receipt.id,
            materialId: values.materialId,
            qty: values.qty,
            type: values.type,
            price: values.price,
            description: values.description,
          },
        });
        toast.success('Detail material berhasil diperbarui');
      } else {
        await createItemMutation.mutateAsync({
          goodsTransactionId: receipt.id,
          materialId: values.materialId,
          qty: values.qty,
          type: values.type,
          price: values.price,
          description: values.description,
        });
        toast.success('Detail material berhasil ditambahkan');
      }

      setItemOpen(false);
      setEditingItem(null);
    } catch (error) {
      const message = error instanceof ApiValidationError || error instanceof ApiResponseError ? error.message : 'Gagal menyimpan detail material';
      toast.error(message);
    }
  };

  const handleDeleteItem = async () => {
    if (!receipt || !deleteTarget) return;
    try {
      if (deleteTarget.id > 0) {
        await deleteItemMutation.mutateAsync({ id: deleteTarget.id, goodsTransactionId: receipt.id });
        setSelectedIds((current) => current.filter((id) => id !== deleteTarget.id));
      } else {
        await Promise.all(selectedIds.map((id) => deleteItemMutation.mutateAsync({ id, goodsTransactionId: receipt.id })));
        setSelectedIds([]);
      }
      toast.success('Detail material berhasil dihapus');
      setDeleteTarget(null);
    } catch (error) {
      const message = error instanceof ApiValidationError || error instanceof ApiResponseError ? error.message : 'Gagal menghapus detail material';
      toast.error(message);
    }
  };

  const itemColumns = useMemo<ColumnDef<GoodsReceiptItem>[]>(
    () => [
      {
        header: 'NO',
        alignment: 'left',
        cell: (_, index) => (safePage - 1) * perPage + index + 1,
      },
      {
        header: 'KODE BARANG',
        accessorKey: 'material.code',
        className: 'font-medium text-slate-900',
        cell: (item) => item.material?.code ?? '-',
      },
      {
        header: 'NAMA BARANG',
        accessorKey: 'material.name',
        className: 'text-slate-800',
        cell: (item) => item.material?.name ?? '-',
      },
      {
        header: 'QTY',
        accessorKey: 'qty',
        alignment: 'center',
        cell: (item) => item.qty,
      },
      {
        header: 'SATUAN',
        accessorKey: 'type',
        alignment: 'center',
        cell: (item) => item.type.toUpperCase(),
      },
      {
        header: 'HARGA SATUAN',
        accessorKey: 'price',
        alignment: 'right',
        cell: (item) => formatCurrency(item.price),
      },
      {
        header: 'TOTAL',
        accessorKey: 'total',
        alignment: 'right',
        className: 'font-semibold text-slate-900',
        cell: (item) => formatCurrency(item.total),
      },
      {
        header: 'Aksi',
        alignment: 'right',
        sticky: 'right',
        cell: (item) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 w-9 rounded-full p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 rounded-md border-slate-200 p-2 shadow-lg">
                <DropdownMenuItem onClick={() => { setEditingItem(item); setItemOpen(true); }} className="cursor-pointer rounded-md px-3 py-2 text-sm">
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeleteTarget(item)} className="cursor-pointer rounded-md px-3 py-2 text-sm text-red-600 focus:text-red-600">
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [perPage, safePage],
  );

  if (query.isLoading) {
    return <DashboardLayout><LoadingState variant="page" /></DashboardLayout>;
  }

  if (!receipt) {
    return <DashboardLayout><div className="rounded-md border border-red-200 bg-red-50 p-10 text-center text-red-600">Data penerimaan material tidak ditemukan.</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Data Penerimaan Material', onClick: () => router.push(`/dashboard/${slug}/warehouse/penerimaan-material`) },
            { label: 'Edit' }
          ]}
          title="Data Penerimaan Material"
          onBack={() => router.push(`/dashboard/${slug}/warehouse/penerimaan-material`)}
        />

        <Card className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={form.handleSubmit(handleUpdateHeader)} className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-6">
              <h2 className="text-[18px] font-semibold text-slate-900">Informasi Penerimaan</h2>
              <Button
                type="submit"
                disabled={updateReceiptMutation.isPending}
                className="h-10 rounded-[10px] bg-[#1f4163] px-5 text-[16px] hover:bg-[#183552]"
              >
                {updateReceiptMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[15px] font-medium text-slate-900">Kode Pembelian</Label>
                <Input value={receipt.code} readOnly className="h-11 rounded-md border-slate-200 text-[16px] text-slate-500" />
              </div>

              <div className="space-y-2">
                <Label className="text-[15px] font-medium text-slate-900">Tanggal Pembelian</Label>
                <Controller
                  control={form.control}
                  name="transactionDate"
                  render={({ field }) => (
                    <DatePicker
                      value={toDateValue(field.value)}
                      onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                      placeholder="Pick a Date"
                      className="h-11 rounded-md border-slate-200 px-3 text-[16px]"
                    />
                  )}
                />
                {form.formState.errors.transactionDate ? (
                  <p className="text-xs text-red-600">{form.formState.errors.transactionDate.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label className="text-[15px] font-medium text-slate-900">Total Harga Beli</Label>
                <Input value={formatCurrency(receipt.totalBrutto)} readOnly className="h-11 rounded-md border-slate-200 text-[16px]" />
              </div>

              <div className="space-y-2">
                <Label className="text-[15px] font-medium text-slate-900">Supplier</Label>
                <Controller
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value ? String(field.value) : ''}
                      onChange={(value) => field.onChange(Number(value))}
                      options={supplierOptions}
                      placeholder={suppliersQuery.isLoading ? 'Memuat supplier...' : 'Pilih supplier'}
                      searchPlaceholder="Cari supplier..."
                      emptyText="Supplier tidak ditemukan."
                      loading={suppliersQuery.isLoading}
                      onSearchChange={setSupplierSearch}
                      className="h-11 rounded-md border-slate-200 bg-white px-3 text-[16px]"
                    />
                  )}
                />
                {form.formState.errors.supplierId ? (
                  <p className="text-xs text-red-600">{form.formState.errors.supplierId.message}</p>
                ) : null}
                {supplierSearch ? <p className="text-xs text-slate-500">Pencarian: {supplierSearch}</p> : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Keterangan</Label>
              <Textarea
                {...form.register('description')}
                rows={4}
                placeholder="Contoh: Barang sudah diterima"
                className="rounded-md border-slate-200 text-[16px]"
              />
            </div>
          </form>
        </Card>

        <BaseTable
          data={pageItems}
          columns={itemColumns}
          showCheckbox
          selectedIds={new Set(selectedIds.map(String))}
          onSelectedIdsChange={(set) => setSelectedIds(Array.from(set).map(Number))}
          getRowId={(item) => String(item.id)}
          searchPlaceholder="Search here"
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          showLimitChange
          perPage={perPage}
          onPerPageChange={(value) => {
            setPerPage(value);
            setPage(1);
          }}
          meta={{
            currentPage: safePage,
            perPage,
            lastPage: totalPages,
            total: filteredItems.length,
          }}
          onPageChange={setPage}
          headerActions={
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              {selectedIds.length > 0 && (
                <Button variant="outline" onClick={() => setDeleteTarget({ id: 0 } as GoodsReceiptItem)} className="border-red-300 text-red-600 hover:text-red-700">
                  Hapus ({selectedIds.length})
                </Button>
              )}
              <Button onClick={() => { setEditingItem(null); setItemOpen(true); }} className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#152e4d]">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Data
              </Button>
            </div>
          }
        />
      </div>

      <GoodsReceiptItemModal
        open={itemOpen}
        onOpenChange={(open) => { setItemOpen(open); if (!open) setEditingItem(null); }}
        onSubmit={handleSaveItem}
        isSubmitting={createItemMutation.isPending || updateItemMutation.isPending}
        initialData={editingItem}
        materials={materialsQuery.data?.data ?? []}
        isLoadingMaterials={materialsQuery.isLoading}
        materialSearch={materialSearch}
        onMaterialSearchChange={setMaterialSearch}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus detail material?</AlertDialogTitle>
            <AlertDialogDescription>{deleteTarget?.id ? `Data ${deleteTarget.material?.name ?? deleteTarget.id} akan dihapus.` : `${selectedIds.length} data terpilih akan dihapus.`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} disabled={deleteItemMutation.isPending} className="bg-red-600 hover:bg-red-700">
              {deleteItemMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
