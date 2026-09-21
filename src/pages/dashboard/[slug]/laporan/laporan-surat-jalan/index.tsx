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
import { useExpeditionReportFeature } from '@/hooks/report/useReportFeatures';
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
import { ReportDateFilters, ReportExpeditionItem } from '@/@types/report-feature.types';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { ReferenceLink } from '@/components/ui/reference-link';
import { CopyBox } from '@/components/ui/copy-box';

export default function LaporanSuratJalanPage() {
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
  const { data, pagination, isLoading, isError, error } = useExpeditionReportFeature({
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

  const columns: ColumnDef<ReportExpeditionItem>[] = useMemo(() => [
    {
      header: 'KODE SURAT JALAN',
      accessorKey: 'do_expedition_code',
      sortable: true,
      cell: (item) => item.do_expedition_code ? (
        <CopyBox
          text={item.do_expedition_code}
          href={`/dashboard/${slugParam}/do-ekspedisi/detail/${item.id || item.do_expedition_code}`}
        />
      ) : '-',
    },
    {
      header: 'KODE ORDER',
      accessorKey: 'order_list_code',
      cell: (item) => item.order_list_code ? (
        <CopyBox
          text={item.order_list_code}
          href={`/dashboard/${slugParam}/administrasi/order-list/detail/${item.order_list_id || item.order_list_code}`}
        />
      ) : '-',
    },
    {
      header: 'CUSTOMER',
      accessorKey: 'customer_name',
      cell: (item) => item.customer_name ? (
        <ReferenceLink href={`/dashboard/${slugParam}/master/customer?search=${item.customer_name}`}>
          {item.customer_name}
        </ReferenceLink>
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
      header: 'TIPE ARMADA',
      accessorKey: 'vehicle_type',
      cell: (item) => <span className="text-slate-600 uppercase">{item.vehicle_type || '-'}</span>,
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
      header: 'TUJUAN KIRIM',
      accessorKey: 'delivery_destination',
      cell: (item) => <span className="text-slate-600">{item.delivery_destination || '-'}</span>,
    },
    {
      header: 'STATUS',
      accessorKey: 'status',
      cell: (item) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          {item.status || '-'}
        </span>
      ),
    },
    {
      header: 'TOTAL NOMINAL',
      accessorKey: 'uj_nominal_after_claim',
      alignment: 'right',
      cell: (item) => <span className="tabular-nums font-semibold">{currenciesFormat('idr', item.uj_nominal_after_claim || 0)}</span>,
    },
    {
      header: 'STATUS PEMBAYARAN',
      accessorKey: 'uj_payment_status',
      alignment: 'center',
      cell: (item) => (
        item.is_paid ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
            {item.uj_payment_status || 'Lunas'}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            {item.uj_payment_status || 'Belum Lunas'}
          </span>
        )
      ),
    },
  ], [slugParam]);

  return (
    <DashboardLayout>
      <Head>
        <title>Laporan Ekspedisi - Wajira Dashboard</title>
      </Head>
      <div className="space-y-6">
        {/* Header */}
        <div className="no-print">
          <PageHeader
            title="Laporan Ekspedisi"
            subtitle="Laporan aktivitas pengiriman logistik / DO ekspedisi"
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
          searchPlaceholder="Cari data ekspedisi..."
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
          perPageOptions={[25, 50, 100]}
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
                id="laporan-ekspedisi-print"
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
                      Laporan Ekspedisi
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
          reportName="laporan ekspedisi"
        />
      </div>
    </DashboardLayout>
  );
}
