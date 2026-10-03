"use client";

import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SearchPagination } from '@/components/ui/search-pagination';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { ReportTemplatePrintDialog } from '@/components/ui/report-template-print-dialog';
import { LoadingState } from '@/components/ui/loading-state';

import { useCompany } from '@/contexts/CompanyContext';
import { resolveCompanyId, getLetterheadByCompanyId } from '@/lib/print-letterhead';
import { useReportTemplatePrint } from '@/hooks/useReportTemplatePrint';
import { useVehicleEquipmentTransactionReport } from '@/hooks/useVehicleEquipmentTransactionReport';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { formatDate } from '@/lib/utils/format';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import type { VehicleEquipmentTransactionItem } from '@/types/vehicle-equipment-transaction-report.types';

import { useQuery } from '@tanstack/react-query';
import { getVehicleEquipments } from '@/services/vehicle-equipment.service';
import { CopyBox } from '@/components/ui/copy-box';

type TabType = 'purchase' | 'sales';

export default function LaporanTransaksiPerlengkapanKendaraanPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const slugParam = router.query.slug;
  const resolvedCompanyId = resolveCompanyId(slugParam, companyId);
  const selectedPrintBackground = getLetterheadByCompanyId(resolvedCompanyId);
  const templatePrint = useReportTemplatePrint(selectedPrintBackground);

  const [activeTab, setActiveTab] = useState<TabType>('purchase');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [vehicleEquipmentId, setVehicleEquipmentId] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');

  const { page, perPage, search, setPage, setPerPage, setSearch } = useQueryParamsTable({ defaultPerPage: 25 });

  const { data: equipmentList } = useQuery({
    queryKey: ['vehicle-equipment-lookup'],
    queryFn: () => getVehicleEquipments({ page: 1, perPage: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
  const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

  const params = useMemo(() => ({
    page,
    perPage,
    search,
    type: activeTab,
    start_date: startDate,
    end_date: endDate,
    vehicle_equipment_id: vehicleEquipmentId !== 'all' ? Number(vehicleEquipmentId) : undefined,
    state: stateFilter !== 'all' ? stateFilter : undefined,
  }), [page, perPage, search, activeTab, startDate, endDate, vehicleEquipmentId, stateFilter]);


  const { data, isLoading, isFetching } = useVehicleEquipmentTransactionReport(params);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabType);
    setPage(1);
  };

  const columns = useMemo<ColumnDef<VehicleEquipmentTransactionItem>[]>(() => [
    {
      header: 'No',
      id: 'no',
      cell: (_, idx) => (
        <span className="text-slate-400 text-sm">{(idx ?? 0) + 1 + (page - 1) * perPage}</span>
      ),
    },
    {
      header: 'Kode Transaksi',
      accessorKey: 'code',
      cell: (item) => (
        <CopyBox text={item.code || '-'} />
      ),
    },
    {
      header: 'Nomor Nota',
      accessorKey: 'nota_number',
      cell: (item) => (
        <CopyBox text={item.nota_number || '-'} />
      ),
    },
    {
      header: 'Nama Perlengkapan',
      id: 'equipment_name',
      cell: (item) => (
        <span className="text-sm font-medium text-slate-900">{item.vehicle_equipment?.name || '-'}</span>
      ),
    },
    {
      header: 'Tanggal Transaksi',
      accessorKey: 'transaction_date',
      cell: (item) => (
        <span className="text-sm text-slate-600 whitespace-nowrap">{formatDate(item.transaction_date)}</span>
      ),
    },
    {
      header: 'Tipe Billing',
      accessorKey: 'billing_type',
      cell: (item) => (
        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700 capitalize">
          {item.billing_type || '-'}
        </Badge>
      ),
    },
    {
      header: 'QTY',
      accessorKey: 'qty',
      cell: (item) => (
        <span className="tabular-nums font-semibold text-slate-900">{item.qty}</span>
      ),
    },
    {
      header: 'Diskon',
      accessorKey: 'discount',
      cell: (item) => (
        <span className="tabular-nums text-slate-700">{currenciesFormat('idr', item.discount)}</span>
      ),
    },
    {
      header: 'Total Nominal',
      accessorKey: 'total_netto',
      cell: (item) => (
        <span className="tabular-nums font-semibold text-slate-900">{currenciesFormat('idr', item.total_netto)}</span>
      ),
    },
    {
      header: 'Supplier/Customer',
      id: 'person_name',
      cell: (item) => (
        <span className="text-sm text-slate-700">{item.person?.name || '-'}</span>
      ),
    },
    {
      header: 'Status Bayar',
      id: 'billing_status',
      cell: (item) => {
        const isPaid = item.billing_summary?.is_paid ?? false;
        return (
          <Badge
            variant="outline"
            className={isPaid
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'}
          >
            {isPaid ? 'LUNAS' : 'BELUM LUNAS'}
          </Badge>
        );
      },
    },
  ], [page, perPage]);

  const filterSection = (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
      <DatePickerWithRange
        date={dateRange}
        onChange={setDateRange}
        placeholder="Filter tanggal transaksi"
        enablePeriodFilter
      />

      <Select value={vehicleEquipmentId} onValueChange={(val) => { setVehicleEquipmentId(val); setPage(1); }}>
        <SelectTrigger className="h-10 w-full border-slate-300 bg-white shadow-xs sm:w-[200px]">
          <SelectValue placeholder="Semua Perlengkapan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Perlengkapan</SelectItem>
          {(equipmentList?.data ?? []).map((eq) => (
            <SelectItem key={eq.id} value={String(eq.id)}>
              {eq.name} ({eq.code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={stateFilter} onValueChange={(val) => { setStateFilter(val); setPage(1); }}>
        <SelectTrigger className="h-10 w-full border-slate-300 bg-white shadow-xs sm:w-[150px]">
          <SelectValue placeholder="Semua Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Status</SelectItem>
          <SelectItem value="done">Selesai</SelectItem>
          <SelectItem value="process">Proses</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="no-print">
          <PageHeader
            title="Laporan Transaksi Perlengkapan Kendaraan"
            subtitle="Pantau semua transaksi pembelian dan penjualan perlengkapan kendaraan"
            actions={
              <Button variant="outline" onClick={() => templatePrint.openPrintDialog()}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            }
          />
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <div className="no-print">
            <TabsList className="flex h-auto p-1 bg-gray-50 flex-row justify-start border border-gray-100 rounded-md">
              <TabsTrigger
                value="purchase"
                className="rounded-md px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm cursor-pointer"
              >
                Laporan Pembelian
              </TabsTrigger>
              <TabsTrigger
                value="sales"
                className="rounded-md px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm cursor-pointer"
              >
                Laporan Penjualan
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            <SearchPagination
              searchValue={search}
              onSearchChange={(value) => { setSearch(value); setPage(1); }}
              searchPlaceholder="Cari kode transaksi, nota, atau perlengkapan..."
              searchAriaLabel="Cari laporan transaksi"
              page={page}
              perPage={perPage}
              total={data?.meta?.total}
              lastPage={data?.meta?.lastPage}
              onPageChange={setPage}
              onPerPageChange={(value) => { setPerPage(value); setPage(1); }}
              actions={filterSection}
            >
              {isLoading ? (
                <LoadingState variant="page" />
              ) : (
                <BaseTable
                  data={data?.data ?? []}
                  columns={columns}
                  loading={isFetching}
                  headerRowClassName="bg-slate-50/80"
                  containerClassName="rounded-lg border border-slate-200 bg-white shadow-sm"
                />
              )}
            </SearchPagination>
          </TabsContent>
        </Tabs>

        <ReportTemplatePrintDialog
          open={templatePrint.isDialogOpen}
          onOpenChange={templatePrint.setIsDialogOpen}
          selectedTemplateId={templatePrint.selectedTemplateId}
          onTemplateChange={templatePrint.setSelectedTemplateId}
          onPrint={templatePrint.printWithSelectedTemplate}
          isPreparingPrint={templatePrint.isPreparingPrint}
          reportName="laporan transaksi perlengkapan kendaraan"
        />
      </div>
    </DashboardLayout>
  );
}
