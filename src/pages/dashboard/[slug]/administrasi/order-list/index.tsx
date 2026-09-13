import * as React from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { Plus, Printer } from 'lucide-react';
import type { OrderList, OrderListStatus } from '@/@types/order-list.types';
import { OrderListDeleteDialog } from '@/components/features/order-list/OrderListDeleteDialog';
import { OrderListTable } from '@/components/features/order-list/OrderListTable';
import { OrderListTablePrintDocument } from '@/components/features/order-list/OrderListTablePrintDocument';
import { OrderStatusConfirmDialog } from '@/components/features/order-list/OrderStatusConfirmDialog';
import { ProcessDoInvoiceDialog } from '@/components/features/order-list/ProcessDoInvoiceDialog';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useOrderLists, useDeleteOrderList, useProcessOrderListInvoice, useUpdateOrderListState } from '@/hooks/useOrderList';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { ReportTemplatePrintDialog } from '@/components/ui/report-template-print-dialog';
import { SearchPagination } from '@/components/ui/search-pagination';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { useCompany } from '@/contexts/CompanyContext';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { useReportTemplatePrint } from '@/hooks/useReportTemplatePrint';
import { getCompanyName, getLetterheadByCompanyId, resolveCompanyId } from '@/lib/print-letterhead';

export default function OrderListPage() {
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
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<OrderList | null>(null);
  const [statusConfirmOpen, setStatusConfirmOpen] = React.useState(false);
  const [statusUpdateData, setStatusUpdateData] = React.useState<{ item: OrderList; newStatus: OrderListStatus } | null>(null);
  const [invoiceTarget, setInvoiceTarget] = React.useState<OrderList | null>(null);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search !== searchInput.trim()) {
        setSearch(searchInput.trim());
      }
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [searchInput, search, setSearch]);

  const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null;
  const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : null;

  const listQueryParams = React.useMemo(
    () => ({
      page,
      perPage,
      search,
      order_by: 'created_at' as const,
      order_sort: 'desc' as const,
      company_id: companyId ?? undefined,
      start_date: startDate,
      end_date: endDate,
      enabled: Boolean(companyId),
    }),
    [companyId, endDate, page, perPage, search, startDate],
  );

  const listQuery = useOrderLists(listQueryParams);
  const deleteMutation = useDeleteOrderList();
  const updateMutation = useUpdateOrderListState();
  const processInvoiceMutation = useProcessOrderListInvoice();
  const tableData = listQuery.data?.data ?? [];

  const handleDelete = React.useCallback(async () => {
    if (!selectedItem) return;

    try {
      await deleteMutation.mutateAsync(selectedItem.id);
      toast.success('Order list berhasil dihapus');
      setDeleteOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus order list');
    }
  }, [selectedItem, deleteMutation]);

  const handleUpdateStatus = React.useCallback((item: OrderList, newStatus: OrderListStatus) => {
    setStatusUpdateData({ item, newStatus });
    setStatusConfirmOpen(true);
  }, []);

  const handleConfirmUpdateStatus = React.useCallback(async () => {
    if (!statusUpdateData) return;
    const { item, newStatus } = statusUpdateData;

    try {
      await updateMutation.mutateAsync({
        id: item.id,
        payload: { status: newStatus },
      });
      toast.success('Status berhasil diperbarui');
      setStatusConfirmOpen(false);
      setStatusUpdateData(null);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui status');
    }
  }, [statusUpdateData, updateMutation]);

  const handleAdd = React.useCallback(() => {
    if (!slug) return;
    void router.push(`/dashboard/${slug}/administrasi/order-list/create`);
  }, [slug, router]);

  const navigateTo = React.useCallback(
    (path: string) => {
      if (!slug) return;
      void router.push(path);
    },
    [slug, router],
  );

  const handleDetail = React.useCallback(
    (item: OrderList) => {
      navigateTo(`/dashboard/${slug}/administrasi/order-list/detail/${item.id}`);
    },
    [navigateTo, slug],
  );

  const handleEdit = React.useCallback(
    (item: OrderList) => {
      navigateTo(`/dashboard/${slug}/administrasi/order-list/edit/${item.id}`);
    },
    [navigateTo, slug],
  );

  const handleDeleteClick = React.useCallback(
    (item: OrderList) => {
      setSelectedItem(item);
      setDeleteOpen(true);
    },
    [],
  );

  const handleProcessInvoice = React.useCallback(async () => {
    if (!invoiceTarget) return;
    try {
      const result = await processInvoiceMutation.mutateAsync(invoiceTarget.id);
      toast.success('DO invoice dan billing berhasil dibuat');
      setInvoiceTarget(null);
      const invoiceId = result.invoice.uuid || result.invoice.id;
      if (invoiceId) {
        void router.push(`/dashboard/${slug}/administrasi/do-invoice/detail/${encodeURIComponent(String(invoiceId))}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal memproses DO invoice');
    }
  }, [invoiceTarget, processInvoiceMutation, router, slug]);

  const showTableSkeleton = !listQuery.data;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Order List"
          subtitle="Lihat dan kelola pesanan pelanggan dengan mudah"
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
          searchPlaceholder="Cari order list..."
          searchAriaLabel="Cari order list"
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
                  className="rounded-md border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer h-9 text-xs px-3"
                >
                  Reset
                </Button>
              )}
              {listQuery.isFetching && (
                <span className="text-xs font-medium text-slate-400 animate-pulse">
                  Memperbarui data...
                </span>
              )}
              <Button
                type="button"
                onClick={handleAdd}
                disabled={!canCreate}
                className="btn-primary!"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Data
              </Button>
            </div>
          }
        >
          <OrderListTable
            data={tableData}
            isLoading={showTableSkeleton}
            onDetail={handleDetail}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onUpdateStatus={handleUpdateStatus}
            onProcessInvoice={setInvoiceTarget}
            processingInvoiceId={processInvoiceMutation.isPending ? invoiceTarget?.id : null}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </SearchPagination>
      </div>

      <OrderListDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
        itemName={selectedItem?.code}
      />

      <OrderStatusConfirmDialog
        open={statusConfirmOpen}
        onOpenChange={setStatusConfirmOpen}
        onConfirm={handleConfirmUpdateStatus}
        isUpdating={updateMutation.isPending}
        itemName={statusUpdateData?.item.code}
        newStatus={statusUpdateData?.newStatus}
      />

      <ProcessDoInvoiceDialog
        open={invoiceTarget !== null}
        onOpenChange={(open) => !open && setInvoiceTarget(null)}
        onConfirm={handleProcessInvoice}
        isProcessing={processInvoiceMutation.isPending}
        orderCode={invoiceTarget?.code}
      />

      <OrderListTablePrintDocument
        data={tableData}
        template={templatePrint.selectedTemplate}
        fallbackBackground={selectedPrintBackground}
        companyName={getCompanyName(resolvedCompanyId)}
        periodLabel={
          startDate
            ? `${dateRange?.from ? format(dateRange.from, 'dd MMM yyyy') : '-'}${
                endDate && endDate !== startDate && dateRange?.to ? ` – ${format(dateRange.to, 'dd MMM yyyy')}` : ''
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
        reportName="order list"
      />
    </DashboardLayout>
  );
}
