import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { Printer } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DOEkspedisiTable } from '@/components/features/do-ekspedisi/DOEkspedisiTable';
import { DOEkspedisiTablePrintDocument } from '@/components/features/do-ekspedisi/DOEkspedisiTablePrintDocument';
import { DeleteDOEkspedisiModal } from '@/components/features/do-ekspedisi/DeleteDOEkspedisiModal';
import { Button } from '@/components/ui/button';
import { ReportTemplatePrintDialog } from '@/components/ui/report-template-print-dialog';
import { SearchPagination } from '@/components/ui/search-pagination';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import type { DoEkspedisi } from '@/@types/do-ekspedisi.types';
import {
  useDeleteDoEkspedisi,
  useDoEkspedisis,
} from '@/hooks/useDoEkspedisi';
import { useProcessDoExpedition } from '@/hooks/useDoInvoice';
import { PageHeader } from '@/components/ui/page-header';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import { useCompany } from '@/contexts/CompanyContext';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { useReportTemplatePrint } from '@/hooks/useReportTemplatePrint';
import { getCompanyName, getLetterheadByCompanyId, resolveCompanyId } from '@/lib/print-letterhead';

export default function DOEkspedisiPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { companyId } = useCompany();
  const resolvedCompanyId = resolveCompanyId(slug, companyId) || 1;
  const selectedPrintBackground = getLetterheadByCompanyId(resolvedCompanyId);
  const templatePrint = useReportTemplatePrint(selectedPrintBackground);

  const { page, perPage, search, setPage, setPerPage, setSearch, updateQuery } = useQueryParamsTable({
    defaultPerPage: 25,
  });
  const [searchInput, setSearchInput] = useState(search);
  const [date, setDate] = useState<DateRange | undefined>();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DoEkspedisi | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search !== searchInput.trim()) {
        setSearch(searchInput.trim());
      }
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [searchInput, search, setSearch]);

  const handleDateChange = (next?: DateRange) => {
    setDate(next);
    setPage(1);
  };

  const listQuery = useDoEkspedisis({
    page,
    perPage,
    search,
    order_by: 'created_at',
    order_sort: 'desc',
    start_date: date?.from ? date.from.toISOString().split('T')[0] : undefined,
    end_date: date?.to ? date.to.toISOString().split('T')[0] : undefined,
  });
  const deleteMutation = useDeleteDoEkspedisi();
  const processExpeditionMutation = useProcessDoExpedition();

  const handleDelete = (item: DoEkspedisi) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;

    try {
      await deleteMutation.mutateAsync(selectedItem.id);
      toast.success('Data DO Ekspedisi berhasil dihapus');
      setIsDeleteOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleEditClick = useCallback(
    (item: DoEkspedisi) => {
      if (!slug) return;
      router.push(`/dashboard/${slug}/do-ekspedisi/form/${item.id}`);
    },
    [slug, router],
  );

  const handleDetailClick = useCallback(
    (item: DoEkspedisi) => {
      if (!slug) return;
      router.push(`/dashboard/${slug}/do-ekspedisi/detail/${item.id}`);
    },
    [slug, router],
  );

  const handlePrintClick = useCallback(
    async (item: DoEkspedisi) => {
      if (!slug) return;
      try {
        await processExpeditionMutation.mutateAsync({ id: item.id });
      } catch (error: any) {
        toast.error(getApiErrorMessage(error));
        return;
      }
      router.push(`/dashboard/${slug}/do-ekspedisi/print/${item.id}`);
    },
    [processExpeditionMutation, slug, router],
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Data DO Ekspedisi"
          subtitle="Buat faktur dengan informasi penagihan yang diperlukan."
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
          searchPlaceholder="Search here"
          searchAriaLabel="Cari DO ekspedisi"
          page={page}
          perPage={perPage}
          total={listQuery.data?.meta.total}
          lastPage={listQuery.data?.meta.lastPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          filters={
            <DatePickerWithRange
              date={date}
              onChange={handleDateChange}
              placeholder="Pilih rentang tanggal"
              className="w-full sm:w-[260px]"
            />
          }
          actions={
            search ? (
              <Button
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
            ) : null
          }
        >
          <DOEkspedisiTable
            data={listQuery.data?.data ?? []}
            isLoading={listQuery.isLoading}
            onEdit={handleEditClick}
            onDetail={handleDetailClick}
            onDelete={handleDelete}
            onPrint={(item) => {
              void handlePrintClick(item);
            }}
          />
        </SearchPagination>
      </div>

      <DeleteDOEkspedisiModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
        itemName={selectedItem?.doCode}
      />

      <DOEkspedisiTablePrintDocument
        data={listQuery.data?.data ?? []}
        template={templatePrint.selectedTemplate}
        fallbackBackground={selectedPrintBackground}
        companyName={getCompanyName(resolvedCompanyId)}
        periodLabel={
          date?.from
            ? `${format(date.from, 'dd MMM yyyy')}${
                date.to && date.to !== date.from ? ` – ${format(date.to, 'dd MMM yyyy')}` : ''
              }`
            : 'Semua Periode'
        }
        reportPage={page}
        reportTotal={listQuery.data?.meta.total ?? (listQuery.data?.data?.length || 0)}
        printedAt={templatePrint.printedAt}
      />

      <ReportTemplatePrintDialog
        open={templatePrint.isDialogOpen}
        onOpenChange={templatePrint.setIsDialogOpen}
        selectedTemplateId={templatePrint.selectedTemplateId}
        onTemplateChange={templatePrint.setSelectedTemplateId}
        onPrint={templatePrint.printWithSelectedTemplate}
        isPreparingPrint={templatePrint.isPreparingPrint}
        reportName="DO ekspedisi"
      />
    </DashboardLayout>
  );
}
