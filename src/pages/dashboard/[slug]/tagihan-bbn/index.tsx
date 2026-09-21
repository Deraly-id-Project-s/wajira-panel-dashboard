import * as React from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useCompany } from '@/contexts/CompanyContext';
import { useKas } from '@/hooks/useKas';
import {
  useBBNBillList,
  useCreateBBNBill,
  useCreateBBNBillBilling,
  useCreateBBNBillBillingItem,
  useDeleteBBNBill,
} from '@/hooks/useBBNBill';
import { useDitlantasProcessOptions } from '@/hooks/useVehicleDocument';
import { BBNBillFormDialog, BBNBillPaymentDialog, DeleteBBNBillDialog } from '@/components/features/tagihan-bbn/BBNBillDialogs';
import { BBNBillTable } from '@/components/features/tagihan-bbn/BBNBillTable';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import { Plus } from 'lucide-react';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import type { BBNBill, BBNBillPayload } from '@/@types/bbn-bill.types';
import { getCashLabel } from '@/components/features/tagihan-bbn/utils';

export default function BBNBillListPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const { companyId } = useCompany();
  const safeCompanyId = companyId || '1';

  const { page, perPage, search, setPage, setPerPage, setSearch } = useQueryParamsTable({
    defaultPerPage: 25,
  });
  const [searchInput, setSearchInput] = React.useState(search);
  const [ditlantasSearch, setDitlantasSearch] = React.useState('');
  const [createOpen, setCreateOpen] = React.useState(false);
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedBill, setSelectedBill] = React.useState<BBNBill | null>(null);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search !== searchInput.trim()) {
        setSearch(searchInput.trim());
      }
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchInput, search, setSearch]);

  const listQuery = useBBNBillList({ page, perPage, search });
  const ditlantasQuery = useDitlantasProcessOptions(ditlantasSearch, false);
  const kasQuery = useKas(safeCompanyId);
  const createMutation = useCreateBBNBill();
  const deleteMutation = useDeleteBBNBill();
  const createBillingMutation = useCreateBBNBillBilling();
  const createBillingItemMutation = useCreateBBNBillBillingItem();

  const ditlantasOptions = React.useMemo(
    () =>
      (ditlantasQuery.data ?? [])
        .filter((item) => {
          if (item.isAlreadyProcessed === true) return false;
          if (item.unprocessedCount === 0) return false;
          return true;
        })
        .map((item) => ({
          value: String(item.id),
          label: `${item.code} - ${item.vendorName || ''}`,
          subtitle: item.vendorName || undefined,
        })),
    [ditlantasQuery.data],
  );

  const cashOptions = React.useMemo(() => {
    const cashes = kasQuery.data?.data ?? [];
    const unique = new Map<string, { id: number; label: string }>();
    cashes.forEach((cash) => {
      const label = getCashLabel(cash);
      if (!unique.has(label)) {
        unique.set(label, { id: Number(cash.id), label });
      }
    });

    const order = ['BCA USD', 'BCA IDR', 'CASH IDR'];
    return Array.from(unique.values()).sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
  }, [kasQuery.data?.data]);

  const handleCreate = async (payload: BBNBillPayload) => {
    try {
      await createMutation.mutateAsync(payload);
      toast.success('Tagihan BBN berhasil ditambahkan');
      setCreateOpen(false);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleQuickPayment = async (payload: { paidDate: string; cashId: number; amount: number }) => {
    if (!selectedBill) return;

    try {
      const billing = await createBillingMutation.mutateAsync({ bbnBillId: selectedBill.id });
      await createBillingItemMutation.mutateAsync({
        bbnBillBillingId: billing.id,
        paidDate: payload.paidDate,
        cashId: payload.cashId,
        amount: payload.amount,
      });
      toast.success('Pembayaran tagihan BBN berhasil ditambahkan');
      setPaymentOpen(false);
      setSelectedBill(null);
      router.push(`/dashboard/${slug}/tagihan-bbn/${selectedBill.id}`);
    } catch (error: any) {
      if (String(error.message || '').toLowerCase().includes('already') || String(error.message || '').toLowerCase().includes('exists')) {
        try {
          router.push(`/dashboard/${slug}/tagihan-bbn/${selectedBill.id}/pembayaran`);
          setPaymentOpen(false);
          return;
        } catch {
          // noop
        }
      }
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!selectedBill) return;

    try {
      await deleteMutation.mutateAsync(selectedBill.id);
      toast.success('Tagihan BBN berhasil dihapus');
      setDeleteOpen(false);
      setSelectedBill(null);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">Data Tagihan BBN</h1>
            <p className="text-sm text-slate-500">Kelola data tagihan BBN dengan mudah</p>
          </div>
        </div>

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari tagihan BBN"
          page={page}
          perPage={perPage}
          total={listQuery.data?.meta.total}
          lastPage={listQuery.data?.meta.lastPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          actions={
            <Button onClick={() => setCreateOpen(true)} className="btn-primary!">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Data
            </Button>
          }
        >
          <BBNBillTable
            items={listQuery.data?.data ?? []}
            isLoading={listQuery.isLoading}
            onDetail={(item) => router.push(`/dashboard/${slug}/tagihan-bbn/${item.id}`)}
            onPay={(item) => {
              setSelectedBill(item);
              setPaymentOpen(true);
            }}
            onPrint={(item) => router.push(`/dashboard/${slug}/tagihan-bbn/print/${item.id}`)}
            onDelete={(item) => {
              setSelectedBill(item);
              setDeleteOpen(true);
            }}
          />
        </SearchPagination>
      </div>

      <BBNBillFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
        ditlantasOptions={ditlantasOptions}
        onDitlantasSearchChange={setDitlantasSearch}
      />

      <BBNBillPaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        onSubmit={handleQuickPayment}
        isSubmitting={createBillingMutation.isPending || createBillingItemMutation.isPending}
        bill={selectedBill}
        cashOptions={cashOptions}
      />

      <DeleteBBNBillDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
        bill={selectedBill}
      />
    </DashboardLayout>
  );
}
