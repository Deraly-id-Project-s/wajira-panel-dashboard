import * as React from 'react';
import Head from 'next/head';
import { format } from 'date-fns';
import { Plus, Printer } from 'lucide-react';
import { useRouter } from 'next/router';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import type { DriverCashAdvance, DriverCashAdvanceApprovalPayload } from '@/@types/driver-cash-advance.types';
import { KasBonApprovalDialog } from '@/components/features/kas-bon/KasBonApprovalDialog';
import { KasBonDeleteDialog } from '@/components/features/kas-bon/KasBonDeleteDialog';
import { KasBonTable } from '@/components/features/kas-bon/KasBonTable';
import { KasBonTablePrintDocument } from '@/components/features/kas-bon/KasBonTablePrintDocument';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { PageHeader } from '@/components/ui/page-header';
import { ReportTemplatePrintDialog } from '@/components/ui/report-template-print-dialog';
import { SearchPagination } from '@/components/ui/search-pagination';
import { useCompany } from '@/contexts/CompanyContext';
import {
  useApproveDriverCashAdvance,
  useDeleteDriverCashAdvance,
  useDriverCashAdvances,
} from '@/hooks/useDriverCashAdvance';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { useReportTemplatePrint } from '@/hooks/useReportTemplatePrint';
import { getCompanyName, getLetterheadByCompanyId, resolveCompanyId } from '@/lib/print-letterhead';

export default function KasBonPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const { companyId } = useCompany();
  const resolvedCompanyId = resolveCompanyId(slug, companyId) || 1;
  const selectedPrintBackground = getLetterheadByCompanyId(resolvedCompanyId);
  const templatePrint = useReportTemplatePrint(selectedPrintBackground);

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('transaction:create');
  const canEdit = hasPermission('transaction:edit');
  const canDelete = hasPermission('transaction:delete');

  const { page, perPage, search, setPage, setPerPage, setSearch, updateQuery } = useQueryParamsTable({
    defaultPerPage: 25,
  });
  const [searchInput, setSearchInput] = React.useState(search);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [selectedItem, setSelectedItem] = React.useState<DriverCashAdvance | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [approvalOpen, setApprovalOpen] = React.useState(false);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search !== searchInput.trim()) {
        setSearch(searchInput.trim());
      }
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [search, searchInput, setSearch]);

  const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null;
  const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : null;

  const listQuery = useDriverCashAdvances({
    page,
    perPage,
    search,
    sort_by: 'created_at',
    sort_order: 'desc',
    company_id: companyId ?? undefined,
    start_date: startDate,
    end_date: endDate,
    enabled: Boolean(companyId),
  });
  const deleteMutation = useDeleteDriverCashAdvance();
  const approveMutation = useApproveDriverCashAdvance();

  const tableData = listQuery.data?.data ?? [];

  const handleAdd = React.useCallback(() => {
    if (!slug) return;
    void router.push(`/dashboard/${slug}/kas-bon/create`);
  }, [router, slug]);

  const handleEdit = React.useCallback(
    (item: DriverCashAdvance) => {
      if (!slug) return;
      void router.push(`/dashboard/${slug}/kas-bon/edit/${item.id}`);
    },
    [router, slug],
  );

  const handleDetail = React.useCallback(
    (item: DriverCashAdvance) => {
      if (!slug) return;
      void router.push(`/dashboard/${slug}/kas-bon/${item.id}`);
    },
    [router, slug],
  );

  const handleDeleteClick = React.useCallback((item: DriverCashAdvance) => {
    setSelectedItem(item);
    setDeleteOpen(true);
  }, []);

  const handleApproveClick = React.useCallback((item: DriverCashAdvance) => {
    setSelectedItem(item);
    setApprovalOpen(true);
  }, []);

  const handleDelete = React.useCallback(async () => {
    if (!selectedItem) return;

    try {
      await deleteMutation.mutateAsync(selectedItem.id);
      toast.success('Kas bon berhasil dihapus');
      setDeleteOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus kas bon');
    }
  }, [deleteMutation, selectedItem]);

  const handleApprove = React.useCallback(
    async (payload: DriverCashAdvanceApprovalPayload) => {
      if (!selectedItem) return;

      try {
        await approveMutation.mutateAsync({
          id: selectedItem.id,
          payload,
        });
        toast.success(
          payload.is_approve
            ? 'Kas bon berhasil disetujui'
            : 'Kas bon berhasil ditolak',
        );
        setApprovalOpen(false);
        setSelectedItem(null);
      } catch (error: any) {
        toast.error(error.message || 'Gagal memproses approval kas bon');
      }
    },
    [approveMutation, selectedItem],
  );

  return (
    <DashboardLayout>
      <Head>
        <title>Kas Bon - Wajira Dashboard</title>
      </Head>

      <div className="space-y-6">
        <PageHeader
          title="Kas Bon"
          subtitle="Kelola pengajuan kas bon driver"
          actions={
            <Button onClick={templatePrint.openPrintDialog} variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          }
        />

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Cari kas bon..."
          searchAriaLabel="Cari kas bon"
          page={page}
          perPage={perPage}
          total={listQuery.data?.meta.total}
          lastPage={listQuery.data?.meta.lastPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          filters={
            <DatePickerWithRange
              date={dateRange}
              onChange={(range) => {
                setDateRange(range);
                setPage(1);
              }}
              className="w-full sm:w-[260px]"
            />
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {search && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchInput('');
                    updateQuery({ search: undefined, page: 1 });
                  }}
                >
                  Reset
                </Button>
              )}
              {listQuery.isFetching && (
                <span className="text-xs font-medium text-slate-400 animate-pulse">
                  Memperbarui data...
                </span>
              )}
              <Button type="button" onClick={handleAdd} disabled={!canCreate} variant="default">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Data
              </Button>
            </div>
          }
        >
          <KasBonTable
            data={tableData}
            isLoading={!listQuery.data}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onApprove={handleApproveClick}
            onDetail={handleDetail}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </SearchPagination>
      </div>

      <KasBonApprovalDialog
        open={approvalOpen}
        onOpenChange={setApprovalOpen}
        item={selectedItem}
        onConfirm={handleApprove}
        isApproving={approveMutation.isPending}
      />

      <KasBonDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
        itemName={selectedItem?.subject}
      />

      <KasBonTablePrintDocument
        data={tableData}
        template={templatePrint.selectedTemplate}
        fallbackBackground={selectedPrintBackground}
        companyName={getCompanyName(resolvedCompanyId)}
        periodLabel={
          startDate
            ? `${dateRange?.from ? format(dateRange.from, 'dd MMM yyyy') : '-'}${endDate && endDate !== startDate && dateRange?.to ? ` – ${format(dateRange.to, 'dd MMM yyyy')}` : ''
            }`
            : 'Semua Periode'
        }
        reportPage={page}
        reportTotal={listQuery.data?.meta.total ?? tableData.length}
        printedAt={templatePrint.printedAt}
      />

      <ReportTemplatePrintDialog
        open={templatePrint.isDialogOpen}
        onOpenChange={templatePrint.setIsDialogOpen}
        selectedTemplateId={templatePrint.selectedTemplateId}
        onTemplateChange={templatePrint.setSelectedTemplateId}
        onPrint={templatePrint.printWithSelectedTemplate}
        isPreparingPrint={templatePrint.isPreparingPrint}
        reportName="kas bon"
      />
    </DashboardLayout>
  );
}
