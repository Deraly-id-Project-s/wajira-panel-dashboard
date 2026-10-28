import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import type {
  GeneralJournal,
  GeneralJournalFilterParams,
  GeneralJournalListItem,
} from '@/@types/general-journal.types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GeneralJournalTable from '@/components/features/general-journal/GeneralJournalTable';
import DeleteGeneralJournalDialog from '@/components/features/general-journal/DeleteGeneralJournalDialog';
import ToggleGeneralJournalPostingDialog from '@/components/features/general-journal/ToggleGeneralJournalPostingDialog';
import { useCompany } from '@/contexts/CompanyContext';
import { useGeneralJournals } from '@/hooks/useGeneralJournal';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

const mapJournalToListItem = (item: GeneralJournal): GeneralJournalListItem => ({
  id: item.id,
  uuid: item.uuid,
  code: item.code,
  date: item.date,
  note: item.note || 'Pencatatan jurnal umum memorial',
  is_paid: Boolean(item.is_paid),
  is_valid: Boolean(item.is_valid),
  is_balanced: Boolean(item.is_balanced),
  total_debit: Number(item.total_debit ?? 0),
  total_credit: Number(item.total_credit ?? 0),
  billingsCount: (item.billings ?? []).length,
  companyName: item.company?.name || '-',
  created_at: item.created_at,
});

export default function GeneralJournalPage() {
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'posted' | 'draft'>('all');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isToggleOpen, setIsToggleOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GeneralJournalListItem | null>(null);

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

  const startDate = date?.from ? format(date.from, 'yyyy-MM-dd') : undefined;
  const endDate = date?.to ? format(date.to, 'yyyy-MM-dd') : startDate;

  const queryParams = useMemo<GeneralJournalFilterParams>(() => {
    const params: GeneralJournalFilterParams = {
      page,
      per_page: perPage,
      search: searchValue || undefined,
      company_id: companyNumber > 0 ? companyNumber : undefined,
      start_date: startDate,
      end_date: endDate,
      sort_by: 'id',
      sort_order: 'desc',
    };

    if (statusFilter === 'posted') params.is_paid = true;
    if (statusFilter === 'draft') params.is_paid = false;

    return params;
  }, [page, perPage, searchValue, companyNumber, startDate, endDate, statusFilter]);

  const { data: response, isLoading, isFetching } = useGeneralJournals(queryParams, {
    enabled: !isCompanyLoading && companyNumber > 0,
  });

  const listItems = useMemo(
    () => (response?.data ?? []).map(mapJournalToListItem),
    [response?.data],
  );

  const meta = useMemo(
    () =>
      response?.meta ?? {
        currentPage: 1,
        perPage: 25,
        total: 0,
        lastPage: 1,
        hasMorePages: false,
      },
    [response?.meta],
  );

  const handleView = (item: GeneralJournalListItem) => {
    void router.push(`/dashboard/${slug}/finance/jurnal-umum/${item.id}`);
  };

  const handleEdit = (item: GeneralJournalListItem) => {
    void router.push(`/dashboard/${slug}/finance/jurnal-umum/${item.id}/edit`);
  };

  const handleDelete = (item: GeneralJournalListItem) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const handleToggleStatus = (item: GeneralJournalListItem) => {
    setSelectedItem(item);
    setTargetStatus(!item.is_paid);
    setIsToggleOpen(true);
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Transaksi Jurnal Umum - Wajira Dashboard</title>
      </Head>

      <div className="space-y-6">
        <PageHeader
          title="Transaksi Jurnal Umum"
          subtitle="Pencatatan memorial jurnal penyesuaian non-kas. Transaksi hanya akan muncul di Laporan Jurnal Umum setelah diposting."
          actions={
            canCreate ? (
              <Button
                type="button"
                onClick={() => void router.push(`/dashboard/${slug}/finance/jurnal-umum/create`)}
                className="w-full sm:w-auto btn-primary"
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Jurnal
              </Button>
            ) : null
          }
        />

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Cari kode jurnal atau keterangan..."
          filters={
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="w-full sm:w-40">
                <Select
                  value={statusFilter}
                  onValueChange={(val: 'all' | 'posted' | 'draft') => {
                    setStatusFilter(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 bg-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="posted">Posted (Lunas)</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-64">
                <DatePickerWithRange
                  date={date}
                  onChange={handleDateChange}
                  placeholder="Pilih rentang tanggal"
                  className="w-full"
                />
              </div>
            </div>
          }
          page={page}
          perPage={perPage}
          total={meta.total}
          lastPage={meta.lastPage}
          perPageOptions={[10, 25, 50, 100]}
          onPageChange={setPage}
          onPerPageChange={(value) => {
            setPerPage(value);
            setPage(1);
          }}
        >
          <GeneralJournalTable
            data={listItems}
            meta={meta}
            isLoading={isLoading || isFetching}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </SearchPagination>

        <DeleteGeneralJournalDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          data={selectedItem}
        />

        <ToggleGeneralJournalPostingDialog
          open={isToggleOpen}
          onOpenChange={setIsToggleOpen}
          data={selectedItem}
          targetStatus={targetStatus}
        />
      </div>
    </DashboardLayout>
  );
}
