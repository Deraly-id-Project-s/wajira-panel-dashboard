import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Download, Printer, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange, type DateRangePickerMode } from '@/components/ui/date-range-picker';
import { SearchPagination } from '@/components/ui/search-pagination';
import { LedgerAccountSelect } from '@/components/features/laporan-buku-besar/LedgerAccountSelect';
import { LaporanJurnalTable } from '@/components/features/laporan-jurnal/LaporanJurnalTable';
import { LaporanJurnalPrintDocument } from '@/components/features/laporan-jurnal/LaporanJurnalPrintDocument';
import { DocumentTemplateSelect } from '@/components/features/document-template/DocumentTemplateSelect';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useJournalReport } from '@/hooks/report/useJournalReport';
import { useAccounts } from '@/hooks/useAccount';
import { useDocumentTemplates } from '@/hooks/useDocumentTemplate';
import { JournalReportParams } from '@/@types/journal-report.types';
import { useCompany } from '@/contexts/CompanyContext';
import { getLetterheadByCompanyId, resolveCompanyId } from '@/lib/print-letterhead';
import { exportJournalReport } from '@/services/report/journalReport.service';
import { getObjectStorageUrl } from '@/components/ui/storage-image';

const getCompanyName = (companyId: number) => {
  if (companyId === 1) return 'PT WAJIRA JAGRATARA MORINDO';
  if (companyId === 3) return 'PT WAJIRA YANOTAMA';
  if (companyId === 4) return 'PT WAJIRA TRANSINDO';
  return 'PT WAJIRA';
};

export default function LaporanJurnalPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const resolvedCompanyId = resolveCompanyId(router.query.slug, companyId) || 1;
  const selectedPrintBackground = getLetterheadByCompanyId(resolvedCompanyId);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [dateMode, setDateMode] = useState<DateRangePickerMode>('date');
  const [sortBy, setSortBy] = useState('payment_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isExporting, setIsExporting] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [printedAt, setPrintedAt] = useState(() => new Date());

  const documentTemplatesQuery = useDocumentTemplates({ page: 1, perPage: 100 });
  const documentTemplates = useMemo(
    () => documentTemplatesQuery.data?.data ?? [],
    [documentTemplatesQuery.data?.data],
  );
  const selectedDocumentTemplate = useMemo(
    () => documentTemplates.find((template) => String(template.id) === selectedTemplateId) ?? null,
    [documentTemplates, selectedTemplateId],
  );

  const accountQuery = useAccounts({
    page: 1,
    perPage: 1000,
    search: '',
    company_id: resolvedCompanyId,
    enabled: Boolean(resolvedCompanyId),
  });

  const accountOptions = useMemo(() => accountQuery.data?.data ?? [], [accountQuery.data?.data]);
  const selectedAccount = useMemo(
    () => accountOptions.find((account) => Number(account.id) === Number(selectedAccountId)) ?? null,
    [accountOptions, selectedAccountId],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null;
  const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : startDate;

  const queryParams = useMemo<JournalReportParams>(
    () => ({
      company_id: resolvedCompanyId,
      page,
      per_page: perPage,
      start_date: startDate,
      end_date: endDate,
      account_id: selectedAccountId,
      account_code: selectedAccount?.code ?? null,
      account_name: selectedAccount?.name ?? null,
      search: search || null,
      sort_by: sortBy,
      sort_order: sortOrder,
    }),
    [resolvedCompanyId, page, perPage, startDate, endDate, selectedAccountId, selectedAccount?.code, selectedAccount?.name, search, sortBy, sortOrder],
  );

  const { data, pagination, isLoading, isFetching } = useJournalReport({
    ...queryParams,
    enabled: Boolean(resolvedCompanyId),
  });

  const handleSortChange = (key: string, direction: 'asc' | 'desc') => {
    setSortBy(key);
    setSortOrder(direction);
    setPage(1);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
  };

  const handleReset = () => {
    setSelectedAccountId(null);
    setSearchInput('');
    setSearch('');
    setDateRange(undefined);
    setDateMode('date');
    setPage(1);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportJournalReport({
        ...queryParams,
        page: undefined,
        per_page: undefined,
      });
      toast.success('Laporan jurnal berhasil diexport');
    } catch (error: any) {
      toast.error(error?.message || 'Gagal export laporan jurnal');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenPrintDialog = () => {
    setSelectedTemplateId(null);
    setIsPrintDialogOpen(true);
  };

  const waitForImage = (url?: string | null) => {
    if (!url) return Promise.resolve();

    return new Promise<void>((resolve) => {
      const image = new window.Image();
      const timeout = window.setTimeout(resolve, 2500);
      const finish = () => {
        window.clearTimeout(timeout);
        resolve();
      };

      image.onload = finish;
      image.onerror = finish;
      image.src = url;
      if (image.complete) finish();
    });
  };

  const handlePrint = async () => {
    if (!selectedDocumentTemplate) {
      toast.error('Pilih template print terlebih dahulu');
      return;
    }

    setIsPreparingPrint(true);
    setPrintedAt(new Date());

    const backgroundUrl = selectedDocumentTemplate.documentTemplate
      ? getObjectStorageUrl(selectedDocumentTemplate.documentTemplate)
      : selectedPrintBackground;
    const signatureUrl = getObjectStorageUrl(selectedDocumentTemplate.personSignature);

    await Promise.all([waitForImage(backgroundUrl), waitForImage(signatureUrl)]);
    setIsPrintDialogOpen(false);
    setIsPreparingPrint(false);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => window.print());
    });
  };

  const periodLabel = startDate
    ? `${dateRange?.from ? format(dateRange.from, 'dd MMM yyyy') : '-'}${endDate && endDate !== startDate && dateRange?.to ? ` – ${format(dateRange.to, 'dd MMM yyyy')}` : ''}`
    : 'Semua periode';
  const accountLabel = selectedAccount
    ? `${selectedAccount.code || '-'} · ${selectedAccount.name || '-'}`
    : 'Semua akun';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="no-print">
          <PageHeader
            title="Laporan Jurnal"
            subtitle="Pantau jurnal transaksi berdasarkan akun dan periode pembayaran"
            actions={
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button onClick={handleExport} variant="outline" disabled={isFetching || isExporting}>
                  <Download className="mr-2 h-4 w-4" />
                  {isExporting ? 'Exporting...' : 'Export'}
                </Button>
                <Button onClick={handleOpenPrintDialog} variant="outline">
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            }
          />
        </div>

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari data"
          filters={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="w-full sm:w-[220px]">
                <LedgerAccountSelect
                  value={selectedAccountId}
                  onValueChange={(value) => {
                    setSelectedAccountId(value);
                    setPage(1);
                  }}
                  options={accountOptions}
                  disabled={accountQuery.isLoading}
                />
              </div>
              <div className="w-full sm:w-[260px]">
                <DatePickerWithRange
                  date={dateRange}
                  onChange={handleDateRangeChange}
                  enablePeriodFilter
                  mode={dateMode}
                  onModeChange={(mode) => {
                    setDateMode(mode);
                    setDateRange(undefined);
                    setPage(1);
                  }}
                />
              </div>
              <Button type="button" variant="outline" onClick={handleReset} className="h-9">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          }
          page={page}
          perPage={perPage}
          total={pagination.total}
          lastPage={pagination.lastPage}
          perPageOptions={[25, 50, 100]}
          onPageChange={setPage}
          onPerPageChange={(value) => {
            setPerPage(value);
            setPage(1);
          }}
        >
          <LaporanJurnalTable
            data={data}
            loading={isLoading}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />
        </SearchPagination>

        <LaporanJurnalPrintDocument
          data={data}
          template={selectedDocumentTemplate}
          fallbackBackground={selectedPrintBackground}
          companyName={getCompanyName(resolvedCompanyId)}
          accountLabel={accountLabel}
          periodLabel={periodLabel}
          reportPage={page}
          reportTotal={pagination.total}
          printedAt={printedAt}
        />

        <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
          <DialogContent closeOnInteractOutside={false} className="max-h-[88vh] overflow-hidden p-0 sm:max-w-2xl">
            <DialogHeader className="border-b border-slate-200 px-6 py-5 pr-12">
              <DialogTitle>Pilih Template Print</DialogTitle>
              <DialogDescription>Pilih desain dokumen yang akan digunakan untuk mencetak laporan jurnal.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[56vh] overflow-y-auto px-6 py-5">
              <DocumentTemplateSelect
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
                disabled={isPreparingPrint}
                allowEmpty={false}
                placeholder="Pilih template laporan jurnal"
                variant="cards"
              />
            </div>
            <DialogFooter className="border-t border-slate-200 bg-slate-50/70 px-6 py-4">
              <Button type="button" variant="outline" onClick={() => setIsPrintDialogOpen(false)} disabled={isPreparingPrint}>
                Batal
              </Button>
              <Button type="button" onClick={() => void handlePrint()} disabled={!selectedTemplateId || isPreparingPrint}>
                {isPreparingPrint ? 'Menyiapkan...' : 'Print Sekarang'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
