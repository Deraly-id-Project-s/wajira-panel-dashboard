import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, MoreVertical, Plus, Search, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { useCompany } from '@/contexts/CompanyContext';
import { useKas } from '@/hooks/useKas';
import { useMaterials } from '@/hooks/useMaterial';
import {
  useCreateMaterialTransactionBilling,
  useCreateMaterialTransactionItem,
  useDeleteMaterialTransactionItem,
  useMaterialTransaction,
  useMaterialTransactionBillings,
  useMaterialTransactionItems,
  useUpdateMaterialTransactionItem,
} from '@/hooks/useMaterialTransaction';
import { getVisiblePageNumbers } from '@/lib/api/pagination';
import { ApiResponseError, ApiValidationError } from '@/lib/api/response';
import type { MaterialTransactionDetailItem } from '@/@types/material-transaction.types';
import { PurchaseMaterialDetailItemModal } from '@/components/features/material-purchase/PurchaseMaterialDetailItemModal';
import { PurchaseMaterialPaymentModal } from '@/components/features/material-purchase/PurchaseMaterialPaymentModal';
import type { MaterialTransactionBillingFormValues, MaterialTransactionItemFormValues } from '@/scheme/material-transaction.schema';
import { LoadingState } from '@/components/ui/loading-state';

const formatDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatCurrency = (value: number) => `Rp${(value || 0).toLocaleString('id-ID')}`;

export default function SalesMaterialDetailPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const rawId = typeof router.query.id === 'string' ? Number(router.query.id) : NaN;
  const transactionId = Number.isFinite(rawId) ? rawId : undefined;

  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [openItemModal, setOpenItemModal] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MaterialTransactionDetailItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<MaterialTransactionDetailItem | null>(null);
  const [materialSearch, setMaterialSearch] = useState('');

  const transactionQuery = useMaterialTransaction(transactionId);
  const itemsQuery = useMaterialTransactionItems({ page: 1, perPage: 1000, type: 'sales', enabled: !!transactionId });
  const billingsQuery = useMaterialTransactionBillings({ page: 1, perPage: 1000, materialTransactionId: transactionId, enabled: !!transactionId });
  const materialsQuery = useMaterials({ page: 1, perPage: 100, search: materialSearch, sort_order: 'asc' });
  const kasQuery = useKas(companyId ?? undefined);

  const createItemMutation = useCreateMaterialTransactionItem();
  const updateItemMutation = useUpdateMaterialTransactionItem();
  const deleteItemMutation = useDeleteMaterialTransactionItem();
  const createBillingMutation = useCreateMaterialTransactionBilling();

  const transaction = transactionQuery.data;
  const allItems = useMemo(() => {
    const source = itemsQuery.data?.data ?? transaction?.materialTransactionDetails ?? [];
    if (!transactionId) return source;
    return source.filter((item) => item.materialTransactionId === transactionId);
  }, [itemsQuery.data?.data, transaction?.materialTransactionDetails, transactionId]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return allItems;
    return allItems.filter((item) => {
      const materialName = item.material?.name?.toLowerCase() ?? '';
      const description = item.description?.toLowerCase() ?? '';
      return materialName.includes(term) || description.includes(term) || String(item.qty).includes(term) || String(item.price).includes(term);
    });
  }, [allItems, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paginatedItems = filteredItems.slice((safePage - 1) * perPage, safePage * perPage);
  const startData = filteredItems.length === 0 ? 0 : (safePage - 1) * perPage + 1;
  const endData = Math.min(safePage * perPage, filteredItems.length);
  const pageNumbers = getVisiblePageNumbers(totalPages, safePage, 5);

  const totalPaidFromBillings = useMemo(() => {
    const billings = billingsQuery.data?.data ?? [];
    return billings.reduce((total, item) => total + item.amount, 0);
  }, [billingsQuery.data?.data]);

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
        toast.success('Detail penjualan material berhasil diperbarui');
      } else {
        await createItemMutation.mutateAsync({
          orderCode: values.orderCode,
          materialTransactionId: transactionId,
          materialId: values.materialId,
          qty: values.qty,
          price: values.price,
          description: values.description,
        });
        toast.success('Detail penjualan material berhasil ditambahkan');
      }

      setOpenItemModal(false);
      setEditingItem(null);
    } catch (error) {
      if (error instanceof ApiValidationError) {
        toast.error(error.message || 'Validasi gagal');
        return;
      }
      const message = error instanceof ApiResponseError ? error.message : 'Gagal menyimpan detail penjualan material';
      toast.error(message);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteItem || !transactionId) return;

    try {
      await deleteItemMutation.mutateAsync({ id: deleteItem.id, materialTransactionId: transactionId });
      toast.success('Detail penjualan material berhasil dihapus');
      setDeleteItem(null);
    } catch (error) {
      const message = error instanceof ApiResponseError ? error.message : 'Gagal menghapus detail penjualan material';
      toast.error(message);
    }
  };

  const itemColumns = useMemo<ColumnDef<MaterialTransactionDetailItem>[]>(
    () => [
      {
        header: 'NO',
        alignment: 'center',
        cell: (_, index) => startData + index,
      },
      {
        header: 'NAMA MATERIAL',
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
        header: 'HARGA SATUAN',
        accessorKey: 'price',
        alignment: 'center',
        className: 'text-slate-800',
        cell: (item) => item.price.toLocaleString('id-ID'),
      },
      {
        header: 'SUB TOTAL',
        accessorKey: 'total',
        alignment: 'center',
        className: 'text-slate-800',
        cell: (item) => item.total.toLocaleString('id-ID'),
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
                  <MoreVertical className="h-4 w-4 text-slate-700" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-md border-slate-200 p-2 shadow-lg">
                <DropdownMenuItem
                  onClick={() => {
                    setEditingItem(item);
                    setOpenItemModal(true);
                  }}
                  className="cursor-pointer rounded-md px-3 py-2 text-sm"
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeleteItem(item)} className="cursor-pointer rounded-md px-3 py-2 text-sm text-red-600 focus:text-red-600">
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [startData],
  );

  const handlePay = async (values: MaterialTransactionBillingFormValues) => {
    if (!transactionId || !transaction) return;
    if (values.amount > transaction.totalUnpaid) {
      toast.error('Nominal pembayaran melebihi sisa tagihan.');
      return;
    }

    try {
      await createBillingMutation.mutateAsync({
        materialTransactionId: transactionId,
        cashId: values.cashId,
        amount: values.amount,
        paymentDate: values.paymentDate,
        description: values.description,
      });
      toast.success('Pembayaran penjualan material berhasil disimpan');
      setOpenPaymentModal(false);
    } catch (error) {
      if (error instanceof ApiValidationError) {
        toast.error(error.message || 'Validasi gagal');
        return;
      }
      const message = error instanceof ApiResponseError ? error.message : 'Gagal menyimpan pembayaran';
      toast.error(message);
    }
  };

  if (transactionQuery.isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (!transaction) {
    return (
      <DashboardLayout>
        <div className="rounded-md border border-red-200 bg-red-50 p-10 text-center text-red-600">Detail penjualan material tidak ditemukan.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="space-y-3">
          <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <Link href={`/dashboard/${slug}/penjualan-material`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
          <h1 className="text-[24px] font-semibold text-slate-900">Detail Penjualan</h1>
        </div>

        <Card className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <label className="text-[16px] font-medium text-slate-900">Nomor Penjualan</label>
                <Input value={transaction.code} readOnly className="h-12 rounded-md border-slate-200 bg-white shadow-sm" />
              </div>
              <div className="space-y-3">
                <label className="text-[16px] font-medium text-slate-900">Total Terima</label>
                <Input value={formatCurrency(Math.max(transaction.totalPaid, totalPaidFromBillings))} readOnly className="h-12 rounded-md border-slate-200 bg-white shadow-sm" />
              </div>
              <div className="space-y-3">
                <label className="text-[16px] font-medium text-slate-900">Customer</label>
                <Input value={transaction.supplierName} readOnly className="h-12 rounded-md border-slate-200 bg-white shadow-sm" />
              </div>
              <div className="space-y-3">
                <label className="text-[16px] font-medium text-slate-900">Tanggal Terima</label>
                <Input value={formatDate(transaction.transactionDate)} readOnly className="h-12 rounded-md border-slate-200 bg-white shadow-sm" />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setOpenPaymentModal(true)}
                disabled={transaction.totalUnpaid <= 0}
                className="h-11 rounded-md bg-emerald-500 px-6 text-[18px] font-medium hover:bg-emerald-600"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Bayar
              </Button>
            </div>
          </div>
        </Card>

        <BaseTable
          data={paginatedItems}
          columns={itemColumns}
          loading={transactionQuery.isFetching && filteredItems.length === 0}
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
            <Button onClick={() => { setEditingItem(null); setOpenItemModal(true); }} className="button-theme-1!">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Data
            </Button>
          }
        />
      </div>

      <PurchaseMaterialDetailItemModal
        open={openItemModal}
        onOpenChange={(open) => {
          setOpenItemModal(open);
          if (!open) {
            setEditingItem(null);
            setMaterialSearch('');
          }
        }}
        initialData={editingItem}
        transaction={transaction}
        materials={materialsQuery.data?.data ?? []}
        isLoadingMaterials={materialsQuery.isLoading}
        materialSearch={materialSearch}
        onMaterialSearchChange={setMaterialSearch}
        onSubmit={handleSubmitItem}
        isSubmitting={createItemMutation.isPending || updateItemMutation.isPending}
        addTitle="Tambah Data Jual"
        editTitle="Edit Data Jual"
        codeLabel="Kode Penjualan"
        counterpartyLabel="Nama Customer"
        priceLabel="Harga Jual"
        subtotalLabel="Sub Total Jual"
      />

      <PurchaseMaterialPaymentModal
        open={openPaymentModal}
        onOpenChange={setOpenPaymentModal}
        transaction={transaction}
        cashes={kasQuery.data?.data ?? []}
        isLoadingCashes={kasQuery.isLoading}
        onSubmit={handlePay}
        isSubmitting={createBillingMutation.isPending}
        title="Pembayaran Penjualan"
        codeLabel="Nomor Penjualan"
        counterpartyLabel="Customer"
        totalLabel="Total Terima"
        paymentDateLabel="Tanggal Terima"
      />

      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus detail penjualan?</AlertDialogTitle>
            <AlertDialogDescription>Detail material pada transaksi ini akan dihapus permanen.</AlertDialogDescription>
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
