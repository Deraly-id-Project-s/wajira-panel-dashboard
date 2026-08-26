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
import { GoodsIssueItemModal } from '@/components/features/goods-issue/GoodsIssueItemModal';
import { SearchableSelect } from '@/components/features/vehicle-data/SearchableSelect';
import { formatCurrency } from '@/components/features/goods-issue/goods-issue.utils';
import type { GoodsIssueItem } from '@/@types/goods-issue.types';
import { useCompany } from '@/contexts/CompanyContext';
import { useCustomers } from '@/hooks/useCustomer';
import {
  useCreateGoodsIssueItem,
  useDeleteGoodsIssueItem,
  useGoodsIssue,
  useUpdateGoodsIssue,
  useUpdateGoodsIssueItem,
} from '@/hooks/useGoodsIssue';
import { useMaterials } from '@/hooks/useMaterial';
import { ApiResponseError, ApiValidationError } from '@/lib/api/response';
import { goodsIssueSchema, type GoodsIssueFormValues, type GoodsIssueItemFormValues } from '@/scheme/goods-issue.schema';
import { LoadingState } from '@/components/ui/loading-state';

const toDateValue = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export default function GoodsIssueEditPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const companyIdValue = Number(companyId ?? '3') || 3;
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const rawId = typeof router.query.id === 'string' ? Number(router.query.id) : NaN;
  const id = Number.isFinite(rawId) ? rawId : undefined;

  const query = useGoodsIssue(id);
  const customersQuery = useCustomers({ page: 1, perPage: 100, company_id: String(companyIdValue) });
  const materialsQuery = useMaterials({ page: 1, perPage: 100, sort_order: 'asc' });
  const updateIssueMutation = useUpdateGoodsIssue();
  const createItemMutation = useCreateGoodsIssueItem();
  const updateItemMutation = useUpdateGoodsIssueItem();
  const deleteItemMutation = useDeleteGoodsIssueItem();

  const [itemOpen, setItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GoodsIssueItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GoodsIssueItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [customerSearch, setCustomerSearch] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');

  const issue = query.data;

  const customerOptions = useMemo(
    () =>
      (customersQuery.data?.data ?? []).map((customer) => ({
        value: String(customer.id),
        label: customer.name,
        subtitle: [customer.code, customer.phone].filter(Boolean).join(' • '),
      })),
    [customersQuery.data],
  );

  const form = useForm<GoodsIssueFormValues>({
    resolver: zodResolver(goodsIssueSchema),
    defaultValues: {
      customerId: 0,
      transactionDate: '',
      description: '',
    },
  });

  useEffect(() => {
    if (!issue) return;
    form.reset({
      customerId: issue.customerId ?? 0,
      transactionDate: issue.transactionDate ?? '',
      description: issue.description ?? '',
    });
  }, [form, issue]);

  const filteredItems = useMemo(() => {
    const source = issue?.goodsTransactionDetails ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return source;
    return source.filter((item) =>
      [item.material?.code, item.material?.name, item.type, item.description, String(item.qty)]
        .filter(Boolean).join(' ').toLowerCase().includes(term),
    );
  }, [issue?.goodsTransactionDetails, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageItems = filteredItems.slice((safePage - 1) * perPage, safePage * perPage);

  useEffect(() => {
    if (selectedIds.length === 0) return;
    const validIds = new Set((issue?.goodsTransactionDetails ?? []).map((item) => item.id));
    setSelectedIds((current) => current.filter((item) => validIds.has(item)));
  }, [issue?.goodsTransactionDetails, selectedIds.length]);

  const handleUpdateHeader = async (values: GoodsIssueFormValues) => {
    if (!issue) return;
    try {
      await updateIssueMutation.mutateAsync({
        id: issue.id,
        payload: {
          customerId: values.customerId,
          transactionDate: values.transactionDate,
          description: values.description,
          location: issue.location,
          companyId: issue.companyId || companyIdValue,
        },
      });
      toast.success('Informasi pengeluaran berhasil diperbarui');
    } catch (error) {
      const message = error instanceof ApiValidationError || error instanceof ApiResponseError ? error.message : 'Gagal memperbarui data pengeluaran material';
      toast.error(message);
    }
  };

  const handleSaveItem = async (values: GoodsIssueItemFormValues) => {
    if (!issue) return;
    try {
      if (editingItem) {
        await updateItemMutation.mutateAsync({
          id: editingItem.id,
          payload: { goodsTransactionId: issue.id, materialId: values.materialId, qty: values.qty, type: values.type, price: values.price, description: values.description },
        });
        toast.success('Detail material berhasil diperbarui');
      } else {
        await createItemMutation.mutateAsync({
          goodsTransactionId: issue.id, materialId: values.materialId, qty: values.qty, type: values.type, price: values.price, description: values.description,
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
    if (!issue) return;
    const targets = deleteTarget?.id ? [deleteTarget.id] : selectedIds;
    if (targets.length === 0) return;
    try {
      await Promise.all(targets.map((targetId) => deleteItemMutation.mutateAsync({ id: targetId, goodsTransactionId: issue.id })));
      toast.success('Detail material berhasil dihapus');
      setDeleteTarget(null);
      setSelectedIds([]);
    } catch (error) {
      const message = error instanceof ApiResponseError ? error.message : 'Gagal menghapus detail material';
      toast.error(message);
    }
  };

  const itemColumns = useMemo<ColumnDef<GoodsIssueItem>[]>(
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

  if (query.isLoading) return <DashboardLayout><LoadingState variant="page" /></DashboardLayout>;
  if (!issue) return <DashboardLayout><div className="rounded-md border border-red-200 bg-red-50 p-10 text-center text-red-600">Data pengeluaran material tidak ditemukan.</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Data Pengeluaran Material', onClick: () => router.push(`/dashboard/${slug}/warehouse/pengeluaran-material`) },
            { label: 'Edit' }
          ]}
          title="Data Pengeluaran Material"
          onBack={() => router.push(`/dashboard/${slug}/warehouse/pengeluaran-material`)}
        />

        <Card className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={form.handleSubmit(handleUpdateHeader)} className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-6">
              <h2 className="text-[18px] font-semibold text-slate-900">Informasi Pengeluaran</h2>
              <Button
                type="submit"
                disabled={updateIssueMutation.isPending}
                className="h-10 rounded-[10px] bg-[#1f4163] px-5 text-[16px] hover:bg-[#183552]"
              >
                {updateIssueMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[15px] font-medium text-slate-900">Kode Pengeluaran</Label>
                <Input value={issue.code} readOnly className="h-11 rounded-md border-slate-200 text-[16px] text-slate-500" />
              </div>

              <div className="space-y-2">
                <Label className="text-[15px] font-medium text-slate-900">Tanggal Pengeluaran</Label>
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
                <Label className="text-[15px] font-medium text-slate-900">Customer</Label>
                <Controller
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value ? String(field.value) : ''}
                      onChange={(value) => field.onChange(Number(value))}
                      options={customerOptions}
                      placeholder={customersQuery.isLoading ? 'Memuat customer...' : 'Pilih customer'}
                      searchPlaceholder="Cari customer..."
                      emptyText="Customer tidak ditemukan."
                      loading={customersQuery.isLoading}
                      onSearchChange={setCustomerSearch}
                      className="h-11 rounded-md border-slate-200 bg-white px-3 text-[16px]"
                    />
                  )}
                />
                {form.formState.errors.customerId ? (
                  <p className="text-xs text-red-600">{form.formState.errors.customerId.message}</p>
                ) : null}
                {customerSearch ? <p className="text-xs text-slate-500">Pencarian: {customerSearch}</p> : null}
              </div>

              <div className="space-y-2">
                <Label className="text-[15px] font-medium text-slate-900">Total Harga Penjualan</Label>
                <Input value={formatCurrency(issue.totalBrutto)} readOnly className="h-11 rounded-md border-slate-200 text-[16px]" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Keterangan</Label>
              <Textarea
                {...form.register('description')}
                rows={4}
                placeholder="Contoh: Barang sudah dikeluarkan"
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
                <Button variant="outline" onClick={() => setDeleteTarget({ id: 0 } as GoodsIssueItem)} className="border-red-300 text-red-600 hover:text-red-700">
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

      <GoodsIssueItemModal
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
