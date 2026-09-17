import React, { useState, useEffect, useMemo, type CSSProperties } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { useCashAdvanceReportFeature } from '@/hooks/report/useReportFeatures';
import { useCompany } from '@/contexts/CompanyContext';
import { resolveCompanyId, getLetterheadByCompanyId, getCompanyName } from '@/lib/print-letterhead';
import { PrintLetterPage } from '@/components/common/PrintLetterPage';
import { formatDate } from '@/lib/utils/format';
import { SearchPagination } from '@/components/ui/search-pagination';
import { LoadingState } from '@/components/ui/loading-state';
import { DocumentTemplatePrintFooter } from '@/components/common/DocumentTemplatePrintFooter';
import { getObjectStorageUrl } from '@/components/ui/storage-image';
import { useReportTemplatePrint } from '@/hooks/useReportTemplatePrint';
import { ReportTemplatePrintDialog } from '@/components/ui/report-template-print-dialog';
import { ReportFilterBar } from '@/components/common/ReportFilterBar';
import { ReportDateFilters, ReportCashAdvanceItem } from '@/@types/report-feature.types';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { ReferenceLink } from '@/components/ui/reference-link';
import { CopyBox } from '@/components/ui/copy-box';

export default function CashAdvanceReportsPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const slugParam = router.query.slug;

  const resolvedCompanyId = resolveCompanyId(slugParam, companyId) || 4;
  const selectedPrintBackground = getLetterheadByCompanyId(resolvedCompanyId);
  const templatePrint = useReportTemplatePrint(selectedPrintBackground);
  const templateBackground = templatePrint.selectedTemplate?.documentTemplate
    ? getObjectStorageUrl(templatePrint.selectedTemplate.documentTemplate)
    : selectedPrintBackground;
  const templateColor = templatePrint.selectedTemplate && /^#[0-9a-f]{6}$/i.test(templatePrint.selectedTemplate.tableColor)
    ? templatePrint.selectedTemplate.tableColor
    : '#1f4163';

  // States
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(25);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [orderBy, setOrderBy] = useState<string>('created_at');
  const [orderSort, setOrderSort] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRangeState] = useState<DateRange | undefined>(undefined);
  const [dateFilters, setDateFilters] = useState<ReportDateFilters>({});

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Sync date range to start_date and end_date
  useEffect(() => {
    const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
    const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : startDate;
    setDateFilters((prev) => ({
      ...prev,
      start_date: startDate,
      end_date: endDate,
    }));
  }, [dateRange]);

  // Fetch report data
  const { data, pagination, isLoading, isError, error } = useCashAdvanceReportFeature({
    page,
    per_page: perPage,
    search: debouncedSearch,
    order_by: orderBy,
    order_sort: orderSort,
    ...dateFilters,
  });

  const handlePrint = () => {
    templatePrint.openPrintDialog();
  };

  const columns: ColumnDef<ReportCashAdvanceItem>[] = useMemo(() => [
    {
      header: 'TANGGAL KLAIM',
      accessorKey: 'claim_date',
      cell: (item) => <span className="text-slate-600 whitespace-nowrap text-sm">{item.claim_date ? formatDate(item.claim_date) : '-'}</span>,
    },
    {
      header: 'DRIVER',
      accessorKey: 'driver_name',
      cell: (item) => item.driver_name ? (
        <ReferenceLink href={`/dashboard/${slugParam}/master/driver?search=${item.driver_name}`}>
          {item.driver_name}
        </ReferenceLink>
      ) : '-',
    },
    {
      header: 'KODE DO EKSPEDISI',
      accessorKey: 'do_expedition_code',
      cell: (item) => item.do_expedition_code ? (
        <CopyBox
          text={item.do_expedition_code}
          href={`/dashboard/${slugParam}/do-ekspedisi/detail/${item.do_expedition_id || item.do_expedition_code}`}
        />
      ) : '-',
    },
    {
      header: 'NO POLISI',
      accessorKey: 'vehicle_registration_number',
      cell: (item) => item.vehicle_registration_number ? (
        <ReferenceLink href={`/dashboard/${slugParam}/data-kendaraan?search=${item.vehicle_registration_number}`}>
          {item.vehicle_registration_number}
        </ReferenceLink>
      ) : '-',
    },
    {
      header: 'SUBJEK KAS BON',
      accessorKey: 'cash_advance_subject',
      cell: (item) => <span className="text-slate-600 whitespace-nowrap text-sm">{item.cash_advance_subject || '-'}</span>,
    },
    {
      header: 'NOMINAL PENGAJUAN',
      accessorKey: 'cash_advance_claim_nominal',
      alignment: 'right',
      cell: (item) => <span className="font-semibold text-gray-900 whitespace-nowrap tabular-nums text-sm">{currenciesFormat('idr', item.cash_advance_claim_nominal || 0)}</span>,
    },
    {
      header: 'NOMINAL DISETUJUI',
      accessorKey: 'cash_advance_approve_nominal',
      alignment: 'right',
      cell: (item) => <span className="text-blue-600 whitespace-nowrap tabular-nums text-sm">{currenciesFormat('idr', item.cash_advance_approve_nominal || 0)}</span>,
    },
    {
      header: 'NOMINAL KLAIM',
      accessorKey: 'claim_nominal',
      alignment: 'right',
      cell: (item) => <span className="text-orange-600 font-semibold whitespace-nowrap tabular-nums text-sm">{currenciesFormat('idr', item.claim_nominal || 0)}</span>,
    },
    {
      header: 'NOMINAL DIBAYAR',
      accessorKey: 'paid_nominal',
      alignment: 'right',
      cell: (item) => <span className="text-green-700 font-semibold whitespace-nowrap tabular-nums text-sm">{currenciesFormat('idr', item.paid_nominal || 0)}</span>,
    },
    {
      header: 'SISA PEMBAYARAN',
      accessorKey: 'remaining_payment',
      alignment: 'right',
      cell: (item) => <span className="text-red-600 whitespace-nowrap tabular-nums text-sm">{currenciesFormat('idr', item.remaining_payment || 0)}</span>,
    },
    {
      header: 'STATUS PEMBAYARAN',
      accessorKey: 'payment_status',
      alignment: 'center',
      cell: (item) => {
        const bg = item.is_paid ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200';
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${bg}`}>
            {item.payment_status || (item.is_paid ? 'Lunas' : 'Belum Lunas')}
          </span>
        );
      },
    },
    {
      header: 'STATUS KLAIM',
      accessorKey: 'claim_status',
      alignment: 'center',
      cell: (item) => {
        const bg = item.is_claim ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-700 border-slate-200';
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${bg}`}>
            {item.claim_status || (item.is_claim ? 'Sudah Diklaim' : 'Belum Diklaim')}
          </span>
        );
      },
    }
  ], [slugParam]);

  return (
    <DashboardLayout>
      <Head>
        <title>Laporan Kas Bon - Wajira Dashboard</title>
      </Head>
      <div className="space-y-6">
        {/* Header */}
        <div className="no-print">
          <PageHeader
            title="Laporan Kas Bon"
            subtitle="Laporan rekap klaim kas bon driver"
            actions={
              <Button onClick={handlePrint} variant="outline" className="w-full sm:w-auto" disabled={isLoading}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            }
          />
        </div>

        {/* Main Table Content */}
        <SearchPagination
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Cari kas bon..."
          searchAriaLabel="Cari data"
          filters={
            <div className="flex flex-wrap items-center gap-2">
              <DatePickerWithRange
                date={dateRange}
                onChange={setDateRangeState}
                placeholder="Pilih rentang tanggal"
                className="w-full sm:w-[260px]"
              />
              <ReportFilterBar filters={dateFilters} onFilterChange={setDateFilters} />
            </div>
          }
          page={pagination.currentPage}
          perPage={pagination.perPage}
          total={pagination.total}
          lastPage={pagination.lastPage}
          perPageOptions={[10, 25, 50, 100]}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
        >
          {isLoading ? (
            <div className="flex justify-center items-center py-20 bg-white rounded-md border border-gray-200 shadow-sm">
              <LoadingState variant="page" />
            </div>
          ) : isError ? (
            <div className="flex flex-col justify-center items-center py-20 w-full bg-white rounded-md border border-red-100 text-center p-6">
              <p className="text-red-600 font-semibold mb-1">Gagal memuat data laporan</p>
              <p className="text-sm text-slate-500">{(error as any)?.message || 'Terjadi kesalahan pada server backend'}</p>
            </div>
          ) : (
            <>
              {/* Print Letter Wrapping Container */}
              <PrintLetterPage
                id="laporan-cash-advance-print"
                className="laporan-penerimaan-print-area"
                letterheadSrc={templateBackground}
              >
                <div
                  className="laporan-penerimaan-print-content print-letter-content templated-report-print-content"
                  style={{ '--report-template-color': templateColor } as CSSProperties}
                >
                  {/* Cover Letter Heading - Visible only in Print */}
                  <div className="hidden print:flex flex-col items-center justify-center text-center space-y-1 mb-8 w-full">
                    <h2 className="text-[13px] font-bold uppercase text-gray-900 tracking-wide">
                      Laporan Kas Bon
                    </h2>
                    <p className="text-[13px] font-bold text-gray-900 tracking-wide">
                      {getCompanyName(resolvedCompanyId)}
                    </p>
                    <p className="text-[11px] text-gray-600">
                      Tanggal Cetak: {formatDate(new Date())}
                    </p>
                  </div>

                  <BaseTable
                    data={data}
                    columns={columns}
                    loading={isLoading}
                    sortBy={orderBy}
                    sortDirection={orderSort}
                    onSortChange={(key, dir) => {
                      setOrderBy(key);
                      setOrderSort(dir);
                      setPage(1);
                    }}
                  />

                  <DocumentTemplatePrintFooter template={templatePrint.selectedTemplate} />
                </div>
              </PrintLetterPage>
            </>
          )}
        </SearchPagination>

        <ReportTemplatePrintDialog
          open={templatePrint.isDialogOpen}
          onOpenChange={templatePrint.setIsDialogOpen}
          selectedTemplateId={templatePrint.selectedTemplateId}
          onTemplateChange={templatePrint.setSelectedTemplateId}
          onPrint={templatePrint.printWithSelectedTemplate}
          isPreparingPrint={templatePrint.isPreparingPrint}
          reportName="laporan kas bon"
        />
      </div>
    </DashboardLayout>
  );
}
