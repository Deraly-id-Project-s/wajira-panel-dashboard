import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { DateRange } from 'react-day-picker';
import type { KasHarian, KasHarianListItem } from '@/@types/kas-harian.types';
import type { PaginationMeta } from '@/@types/pagination.types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import DeleteKasHarianDialog from '@/components/features/kas-harian/DeleteKasHarianDialog';
import TogglePaymentStatusDialog from '@/components/features/kas-harian/TogglePaymentStatusDialog';
import KasHarianTable from '@/components/features/kas-harian/KasHarianTable';
import { useCompany } from '@/contexts/CompanyContext';
import { useKasHarian, useSyncKasHarianPpnData } from '@/hooks/useKasHarian';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';

const mapManualCashFlow = (item: KasHarian): KasHarianListItem => ({
  id: item.id,
  source: (item.finance_billings ?? []).length > 0 ? 'billing' : 'manual',
  date: item.date,
  code: item.code,
  invoiceNumber: item.invoice_number ?? null,
  note: item.note || 'Transaksi kas harian',
  debet: item.cash_position?.debet_idr_total ?? Number(item.debet || item.debet_total || 0),
  debet_usd: item.cash_position?.debet_usd_total ?? Number(item.debet_usd || item.debet_usd_total || 0),
  credit: item.cash_position?.credit_idr_total ?? Number(item.credit || item.credit_total || 0),
  credit_usd: item.cash_position?.credit_usd_total ?? Number(item.credit_usd || item.credit_usd_total || 0),
  remaining_payment: Number(item.remaining_payment ?? 0),
  remaining_payment_usd: Number(item.remaining_payment_usd ?? 0),
  cash_position: item.cash_position ?? null,
  accountName: item.account ? `${item.account.code ?? '-'} - ${item.account.name ?? '-'}` : '-',
  cashName: item.cash?.description || item.cash?.code || '-',
  cashFlowId: item.id,
  financeBillingId: (item.finance_billings ?? [])[0]?.id,
  goodsTransactionBillingId: item.goods_transaction_billing_id ?? undefined,
  unitTransactionBillingId: item.unit_transaction_billing_id ?? undefined,
  isValid: item.is_valid ?? undefined,
  is_paid: item.is_paid === true || item.is_paid === '1' ? true : item.is_paid === false || item.is_paid === '0' ? false : undefined,
});

export default function KasHarianPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { companyId, isLoading: isCompanyLoading } = useCompany();
  const companyNumber = Number(companyId || 0);
  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('finance:create');
  const canEdit = hasPermission('finance:edit');
  const canDelete = hasPermission('finance:delete');

  const [searchInput, setSearchInput] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [date, setDate] = useState<DateRange | undefined>();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isToggleOpen, setIsToggleOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState(false);
  const [selectedItem, setSelectedItem] = useState<KasHarian | null>(null);
  const syncPpnMutation = useSyncKasHarianPpnData();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearchValue(searchInput.trim());
      setPage(1);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const handleDateChange = (next?: DateRange) => {
    setDate(next);
    setPage(1);
  };

  const startDate = date?.from ? date.from.toISOString().split('T')[0] : undefined;
  const endDate = date?.to ? date.to.toISOString().split('T')[0] : undefined;

  const kasHarianQuery = useKasHarian(
    {
      page: 1,
      per_page: 1000,
      company_id: companyNumber || undefined,
      start_date: startDate,
      end_date: endDate,
    },
    {
      enabled: !isCompanyLoading && companyNumber > 0,
      refetchInterval: false,
    },
  );

  const queryError = kasHarianQuery.error;

  const errorMessage = useMemo(() => {
    const error = queryError;
    if (!error || typeof error !== 'object' || !('message' in error)) {
      return 'Gagal memuat data transaksi kas harian';
    }

    const message = (error as { message?: unknown }).message;
    return typeof message === 'string' && message.trim().length > 0 ? message : 'Gagal memuat data transaksi kas harian';
  }, [queryError]);

  useEffect(() => {
    if (kasHarianQuery.isError) {
      toast.error(errorMessage);
    }
  }, [errorMessage, kasHarianQuery.isError]);

  const mergedData = useMemo(() => {
    return (kasHarianQuery.data?.data ?? [])
      .map(mapManualCashFlow)
      .filter((item) => {
        if (!searchValue) return true;
        const query = searchValue.toLowerCase();
        return [item.code, item.invoiceNumber ?? '', item.note, item.accountName, item.cashName ?? ''].some((value) => value.toLowerCase().includes(query));
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [kasHarianQuery.data?.data, searchValue]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * perPage;
    return mergedData.slice(start, start + perPage);
  }, [mergedData, page, perPage]);

  const meta: PaginationMeta = useMemo(() => {
    const total = mergedData.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    return {
      currentPage: Math.min(page, lastPage),
      perPage,
      total,
      lastPage,
    };
  }, [mergedData.length, page, perPage]);

  useEffect(() => {
    if (page > meta.lastPage) {
      setPage(meta.lastPage || 1);
    }
  }, [meta.lastPage, page]);

  const isFetching = kasHarianQuery.isFetching;
  const isLoading = kasHarianQuery.isLoading || isCompanyLoading;
  const isError = kasHarianQuery.isError;

  const handleEdit = (item: KasHarianListItem) => {
    const targetId = item.cashFlowId || item.id;
    if (!targetId || typeof slug !== 'string') return;
    void router.push(`/dashboard/${slug}/finance/transaksi-kas-harian/${targetId}/edit`);
  };

  const handleDelete = (item: KasHarianListItem) => {
    const manualItem = (kasHarianQuery.data?.data ?? []).find((cashFlow) => cashFlow.id === item.cashFlowId);
    if (!manualItem) return;
    setSelectedItem(manualItem);
    setIsDeleteOpen(true);
  };

  const handleToggleStatus = (item: KasHarianListItem) => {
    const manualItem = (kasHarianQuery.data?.data ?? []).find((cashFlow) => cashFlow.id === item.cashFlowId);
    if (!manualItem) return;
    setSelectedItem(manualItem);
    setTargetStatus(!manualItem.is_paid);
    setIsToggleOpen(true);
  };

  const handleSyncPpnData = async (item: KasHarianListItem) => {
    if (!item.cashFlowId || syncPpnMutation.isPending) return;

    try {
      await syncPpnMutation.mutateAsync(item.cashFlowId);
      toast.success('Data PPN berhasil disinkronkan');
    } catch (error) {
      toast.error(getApiErrorMessage(error) || 'Gagal menyinkronkan data PPN');
    }
  };

  const pushTo = (item: KasHarianListItem) => {
    const targetId = item.cashFlowId || item.id;
    if (!targetId) return;
    void router.push(`/dashboard/${slug}/finance/transaksi-kas-harian/${targetId}?source=${item.source}`);
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Transaksi Kas Harian - Wajira Dashboard</title>
      </Head>

      <div className="space-y-6">
        <PageHeader
          title="Arus Transaksi Kas Harian"
          subtitle="Kelola arus transaksi kas harian"
        />

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari transaksi kas harian"
          filters={
            <DatePickerWithRange
              date={date}
              onChange={handleDateChange}
              placeholder="Pilih rentang tanggal"
              className="w-full sm:w-[260px]"
            />
          }
          page={page}
          perPage={perPage}
          total={meta.total}
          lastPage={meta.lastPage}
          onPageChange={setPage}
          onPerPageChange={(value) => {
            setPerPage(value);
            setPage(1);
          }}
          actions={
            canCreate ? (
              <Button type="button" onClick={() => void router.push(`/dashboard/${slug}/finance/transaksi-kas-harian/create`)} className="w-full sm:w-auto btn-primary">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Data
              </Button>
            ) : null
          }
        >
          <KasHarianTable
            data={paginatedData}
            meta={meta}
            hasNextPage={page < meta.lastPage}
            isLoading={isLoading}
            isFetching={isFetching}
            isError={isError}
            errorMessage={errorMessage}
            onRetry={() => {
              void kasHarianQuery.refetch();
            }}
            onView={pushTo}
            onPay={pushTo}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSyncPpnData={(item) => void handleSyncPpnData(item)}
            onToggleStatus={handleToggleStatus}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </SearchPagination>
      </div>

      <DeleteKasHarianDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} data={selectedItem} />
      <TogglePaymentStatusDialog open={isToggleOpen} onOpenChange={setIsToggleOpen} data={selectedItem} targetStatus={targetStatus} />
    </DashboardLayout>
  );
}