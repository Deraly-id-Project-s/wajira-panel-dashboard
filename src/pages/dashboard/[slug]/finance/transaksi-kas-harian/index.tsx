import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { KasHarian, KasHarianListItem } from '@/@types/kas-harian.types';
import type { PaginationMeta } from '@/@types/pagination.types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DeleteKasHarianDialog from '@/components/features/kas-harian/DeleteKasHarianDialog';
import TogglePaymentStatusDialog from '@/components/features/kas-harian/TogglePaymentStatusDialog';
import KasHarianTable from '@/components/features/kas-harian/KasHarianTable';
import { useCompany } from '@/contexts/CompanyContext';
import { useKasHarian } from '@/hooks/useKasHarian';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

const LIVE_UPDATE_INTERVAL = 5000;

const mapManualCashFlow = (item: KasHarian): KasHarianListItem => ({
  id: item.id,
  source: (item.finance_billings ?? []).length > 0 ? 'billing' : 'manual',
  date: item.date,
  code: item.code,
  invoiceNumber: item.invoice_number ?? null,
  note: item.note || 'Transaksi kas harian',
  debet: Number(item.debet || 0),
  debet_usd: Number(item.debet_usd || 0),
  credit: Number(item.credit || 0),
  credit_usd: Number(item.credit_usd || 0),
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
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isToggleOpen, setIsToggleOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState(false);
  const [selectedItem, setSelectedItem] = useState<KasHarian | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearchValue(searchInput.trim());
      setPage(1);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const kasHarianQuery = useKasHarian(
    {
      page: 1,
      per_page: 1000,
      company_id: companyNumber || undefined,
    },
    {
      enabled: !isCompanyLoading && companyNumber > 0,
      refetchInterval: !isDeleteOpen && !isToggleOpen ? LIVE_UPDATE_INTERVAL : false,
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

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center flex-wrap w-full sm:w-auto">
              <div className="relative w-full sm:w-[332px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search here"
                  className="pl-9 bg-white"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap">
                <span>Show</span>
                <Select
                  value={String(perPage)}
                  onValueChange={(value) => {
                    setPerPage(Number(value));
                  }}
                >
                  <SelectTrigger className="w-[70px] bg-white cursor-pointer">
                    <SelectValue placeholder="25" />
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
            {canCreate && (
              <Button type="button" onClick={() => void router.push(`/dashboard/${slug}/finance/transaksi-kas-harian/create`)} className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#152e4d]">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Data
              </Button>
            )}
          </div>

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
            onToggleStatus={handleToggleStatus}
            onPageChange={setPage}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </div>
      </div>

      <DeleteKasHarianDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} data={selectedItem} />
      <TogglePaymentStatusDialog open={isToggleOpen} onOpenChange={setIsToggleOpen} data={selectedItem} targetStatus={targetStatus} />
    </DashboardLayout>
  );
}
