import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  useGoodsIssueEquipmentDetail,
  useUpdateGoodsIssueEquipment,
} from '@/hooks/warehouse/useGoodsIssueEquipment';
import {
  useCreateGoodsTransactionDetail,
  useUpdateGoodsTransactionDetail,
  useDeleteGoodsTransactionDetail,
} from '@/hooks/warehouse/useGoodsTransactionDetailMutation';
import { GoodsIssueEquipmentFormModal } from '@/components/features/warehouse/issue-equipment/GoodsIssueEquipmentFormModal';
import { GoodsIssueEquipmentDetailFormModal } from '@/components/features/warehouse/issue-equipment/GoodsIssueEquipmentDetailFormModal';
import { GoodsIssueEquipmentDetailTable } from '@/components/features/warehouse/issue-equipment/GoodsIssueEquipmentDetailTable';
import type { GoodsTransactionDetailEquipment } from '@/@types/goods-issue-equipment.types';
import type { GoodsIssueEquipmentFormValues, GoodsIssueEquipmentItemFormValues } from '@/scheme/goods-issue-equipment.schema';

const formatLongDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import { LoadingState } from '@/components/ui/loading-state';

const getErrorMessage = (error: any): string => {
  return getApiErrorMessage(error);
};

export default function PengeluaranPerlengkapanEditPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const rawId = typeof router.query.id === 'string' ? Number(router.query.id) : NaN;
  const id = Number.isFinite(rawId) ? rawId : undefined;

  const companyIdValue = 4; // Enforce PT Wajira Transindo

  const query = useGoodsIssueEquipmentDetail(id);
  const updateHeaderMutation = useUpdateGoodsIssueEquipment();
  const createItemMutation = useCreateGoodsTransactionDetail();
  const updateItemMutation = useUpdateGoodsTransactionDetail();
  const deleteItemMutation = useDeleteGoodsTransactionDetail();

  const [headerOpen, setHeaderOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GoodsTransactionDetailEquipment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GoodsTransactionDetailEquipment | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);

  const transaction = query.data;

  const filteredItems = useMemo(() => {
    const source = transaction?.goodsTransactionDetails ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return source;
    return source.filter((item) =>
      [
        item.vehicleEquipment?.code,
        item.vehicleEquipment?.name,
        item.description,
        String(item.qty),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }, [transaction?.goodsTransactionDetails, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    return filteredItems.slice((safePage - 1) * perPage, safePage * perPage);
  }, [filteredItems, safePage, perPage]);

  // Sync selected checkboxes when items list updates
  useEffect(() => {
    if (selectedIds.length === 0) return;
    const validIds = new Set((transaction?.goodsTransactionDetails ?? []).map((item) => item.id));
    setSelectedIds((current) => current.filter((itemId) => validIds.has(itemId)));
  }, [transaction?.goodsTransactionDetails, selectedIds.length]);

  const handleUpdateHeader = async (values: GoodsIssueEquipmentFormValues) => {
    if (!transaction) return;
    try {
      await updateHeaderMutation.mutateAsync({
        id: transaction.id,
        payload: {
          companyId: companyIdValue,
          type: 'issue',
          category: values.category,
          vehicleFleetId: values.vehicleFleetId,
          driverId: values.driverId,
          transactionDate: values.transactionDate,
          description: values.description,
        },
      });
      toast.success('Header pengeluaran perlengkapan berhasil diperbarui');
      setHeaderOpen(false);
      query.refetch();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleSaveItem = async (values: GoodsIssueEquipmentItemFormValues) => {
    if (!transaction) return;
    try {
      if (editingItem) {
        await updateItemMutation.mutateAsync({
          id: editingItem.id,
          payload: {
            goodsTransactionId: transaction.id,
            vehicleEquipmentId: values.vehicleEquipmentId,
            qty: values.qty,
            description: values.description,
          },
        });
        toast.success('Detail perlengkapan berhasil diperbarui');
      } else {
        await createItemMutation.mutateAsync({
          goodsTransactionId: transaction.id,
          vehicleEquipmentId: values.vehicleEquipmentId,
          qty: values.qty,
          description: values.description,
        });
        toast.success('Detail perlengkapan berhasil ditambahkan');
      }
      setItemOpen(false);
      setEditingItem(null);
      query.refetch();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDeleteItemSubmit = async () => {
    if (!transaction) return;
    const targets = deleteTarget?.id ? [deleteTarget.id] : selectedIds;
    if (targets.length === 0) return;
    try {
      await Promise.all(
        targets.map((targetId) =>
          deleteItemMutation.mutateAsync({
            id: targetId,
            goodsTransactionId: transaction.id,
          })
        )
      );
      toast.success('Detail perlengkapan berhasil dihapus');
      setDeleteTarget(null);
      setSelectedIds([]);
      query.refetch();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    }
  };

  if (query.isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (!transaction) {
    return (
      <DashboardLayout>
        <div className="rounded-md border border-red-200 bg-red-50 p-10 text-center text-red-600 font-semibold">
          Data pengeluaran perlengkapan tidak ditemukan.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 px-1">
        <PageHeader
          breadcrumbs={[
            { label: 'Data Pengeluaran Perlengkapan', onClick: () => router.push(`/dashboard/${slug}/warehouse/pengeluaran-perlengkapan`) },
            { label: 'Edit' }
          ]}
          title="Data Pengeluaran Perlengkapan"
          onBack={() => router.push(`/dashboard/${slug}/warehouse/pengeluaran-perlengkapan`)}
        />

        {/* Transaction Header Info Card */}
        <Card className="rounded-md border border-slate-200 bg-white p-6 shadow-none">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-5">
              <h2 className="text-[18px] font-semibold text-slate-900">Informasi Pengeluaran</h2>
              <Button
                onClick={() => setHeaderOpen(true)}
                className="h-10 rounded-[10px] px-5 text-[15px] button-theme-1!"
              >
                Edit Header
              </Button>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[15px] font-medium text-slate-900">Kode Pengeluaran</label>
                <Input value={transaction.code} readOnly className="h-11 rounded-md border-slate-200 text-[16px] text-slate-500 bg-slate-50/50" />
              </div>
              <div className="space-y-2">
                <label className="text-[15px] font-medium text-slate-900">Tanggal Pengeluaran</label>
                <Input value={formatLongDate(transaction.transactionDate)} readOnly className="h-11 rounded-md border-slate-200 text-[16px] text-slate-500 bg-slate-50/50" />
              </div>
              <div className="space-y-2">
                <label className="text-[15px] font-medium text-slate-900">Driver</label>
                <Input value={transaction.driver?.name ?? '-'} readOnly className="h-11 rounded-md border-slate-200 text-[16px] text-slate-500 bg-slate-50/50" />
              </div>
              <div className="space-y-2">
                <label className="text-[15px] font-medium text-slate-900">Nomor Polisi</label>
                <Input value={transaction.vehicleFleet?.registrationNumber ?? '-'} readOnly className="h-11 rounded-md border-slate-200 text-[16px] text-slate-500 bg-slate-50/50" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[15px] font-medium text-slate-900">Keterangan</label>
                <Textarea value={transaction.description ?? ''} readOnly rows={3} className="rounded-md border-slate-200 text-[16px] text-slate-500 bg-slate-50/50" />
              </div>
            </div>
          </div>
        </Card>

        {/* Search, Limit Selector and Add Button */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[328px]">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search equipment items..."
                className="h-11 rounded-md border-slate-200 bg-white pl-11 shadow-none"
              />
            </div>
            <div className="flex items-center gap-3 text-[16px] text-slate-700">
              <span>Show</span>
              <Select
                value={String(perPage)}
                onValueChange={(value) => {
                  setPerPage(Number(value));
                }}
              >
                <SelectTrigger className="h-11 w-[68px] rounded-md border-slate-200 bg-white shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span>Page</span>
            </div>
          </div>
          <Button onClick={() => { setEditingItem(null); setItemOpen(true); }} className="button-theme-1!">
            <Plus className="mr-2 h-4 w-4" /> Tambah Item
          </Button>
        </div>

        {/* Selected Items / Multidelete Bar */}
        <div className="flex items-center justify-between px-1">
          <p className="text-[14px] text-slate-500">
            {selectedIds.length > 0 ? `${selectedIds.length} data terpilih` : 'Pilih data untuk menghapus banyak item'}
          </p>
          <Button
            variant="outline"
            onClick={() => setDeleteTarget({ id: 0 } as GoodsTransactionDetailEquipment)}
            disabled={selectedIds.length === 0}
            className="border-red-300 text-red-600 hover:text-red-700 h-9 px-3 rounded-lg"
          >
            Hapus Terpilih
          </Button>
        </div>

        {/* Detail Items Table Card */}
        <Card className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-none">
          <div className="overflow-x-auto">
            <GoodsIssueEquipmentDetailTable
              data={pageItems}
              selectedIds={selectedIds}
              onSelectedIdsChange={setSelectedIds}
              onEdit={(item) => {
                setEditingItem(item);
                setItemOpen(true);
              }}
              onDelete={(item) => setDeleteTarget(item)}
            />
          </div>
        </Card>

        {/* Pagination navigation controls */}
        <div className="flex flex-col gap-4 px-1 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-[14px] text-slate-500">
            Showing {filteredItems.length === 0 ? 0 : (safePage - 1) * perPage + 1}-
            {Math.min(safePage * perPage, filteredItems.length)} of {filteredItems.length} data
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <Button
              variant="ghost"
              className="h-9 px-3 rounded-lg"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={safePage <= 1}
            >
              Previous
            </Button>
            <Button variant="outline" className="h-9 w-9 rounded-lg border-slate-200 bg-white shadow-none font-semibold">
              {safePage}
            </Button>
            <Button
              variant="ghost"
              className="h-9 px-3 rounded-lg"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={safePage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Header Form Modal */}
      <GoodsIssueEquipmentFormModal
        open={headerOpen}
        onOpenChange={setHeaderOpen}
        onSubmit={handleUpdateHeader}
        isSubmitting={updateHeaderMutation.isPending}
        initialData={transaction}
      />

      {/* Item Form Modal */}
      <GoodsIssueEquipmentDetailFormModal
        open={itemOpen}
        onOpenChange={(open) => {
          setItemOpen(open);
          if (!open) setEditingItem(null);
        }}
        onSubmit={handleSaveItem}
        isSubmitting={createItemMutation.isPending || updateItemMutation.isPending}
        initialData={editingItem}
      />

      {/* Detail Item deletion Alert Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-[28px] border-none p-10 shadow-2xl">
          <AlertDialogHeader className="space-y-3 text-left">
            <AlertDialogTitle className="text-[24px] font-semibold text-slate-950">
              Hapus Detail Perlengkapan?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[16px] text-slate-500">
              {deleteTarget?.id
                ? `Apakah Anda yakin ingin menghapus perlengkapan ${deleteTarget.vehicleEquipment?.name ?? deleteTarget.id}?`
                : `Apakah Anda yakin ingin menghapus ${selectedIds.length} item detail perlengkapan terpilih?`}{' '}
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-end gap-4 mt-6">
            <AlertDialogCancel className="h-12 rounded-md border-slate-300 px-5 text-[16px]">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItemSubmit}
              disabled={deleteItemMutation.isPending}
              className="h-12 rounded-md bg-red-600 px-5 text-[16px] hover:bg-red-700 font-semibold"
            >
              {deleteItemMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
