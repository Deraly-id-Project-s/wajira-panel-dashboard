import * as React from 'react';
import { useRouter } from 'next/router';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { SearchPagination } from '@/components/ui/search-pagination';
import { VehicleDocumentDetailTable } from '@/components/features/vehicle-document/VehicleDocumentDetailTable';
import { useVehicleDocumentDetail } from '@/hooks/useVehicleDocument';
import type { VehicleDocumentItem } from '@/@types/vehicle-document.types';
import { LoadingState } from '@/components/ui/loading-state';

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, 'dd/MM/yyyy');
};

export default function EditVehicleDocumentPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const id = typeof router.query.id === 'string' ? router.query.id : null;

  const detailQuery = useVehicleDocumentDetail(id);

  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(25);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search !== searchInput.trim().toLowerCase()) {
        setSearch(searchInput.trim().toLowerCase());
        setPage(1);
      }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput, search, setPage]);

  const registrationItems = React.useMemo<VehicleDocumentItem[]>(() => {
    const registrations = detailQuery.data?.vehicleRegistrations || [];

    return registrations.map((item) => ({
      id: item.id,
      registrationId: item.id,
      vehicleDataId: item.vehicleDataId ?? null,
      dealerId: item.dealerId ?? null,
      regionId: item.regionId ?? null,
      dealerName: item.dealerName || '-',
      stnkName: item.stnkName || '-',
      regionName: item.regionName || '-',
      machineNumber: item.machineNumber || '-',
      invoiceReceiveDate: item.invoiceReceiveDate || '-',
      bpkbRegistrationDate: item.bpkbRegistrationDate || '-',
      stnkRegistrationDate: item.stnkRegistrationDate || '-',
      skpdPaymentDate: item.skpdPaymentDate || '-',
      bpkbReceivedDate: item.bpkbReceivedDate || '-',
      stnkReceivedDate: item.stnkReceivedDate || '-',
      skpdReceivedDate: item.skpdReceivedDate || '-',
      tnkbReceivedDate: item.tnkbReceivedDate || '-',
      tnkbNumber: item.tnkbNumber || '-',
      noticeFee: item.noticeFee || 0,
      vendorEmployee: item.vendorName || '-',
      vehicleType: item.vehicleType || 'r2',
    }));
  }, [detailQuery.data?.vehicleRegistrations]);

  const filteredItems = React.useMemo(() => {
    const items = registrationItems;
    if (!search) return items;
    return items.filter((item) =>
      [item.dealerName, item.stnkName, item.regionName, item.machineNumber, item.tnkbNumber, item.vendorEmployee]
        .some((field) => (field || '').toLowerCase().includes(search))
    );
  }, [registrationItems, search]);

  const pagedItems = React.useMemo<VehicleDocumentItem[]>(() => {
    const start = (page - 1) * perPage;
    return filteredItems.slice(start, start + perPage);
  }, [filteredItems, page, perPage]);

  // Count processed and unprocessed from nested vehicleRegistrations
  const processedCount = React.useMemo(() => {
    return (detailQuery.data?.vehicleRegistrations || []).filter(item => item.isAlreadyProcessed).length;
  }, [detailQuery.data?.vehicleRegistrations]);

  const unprocessedCount = React.useMemo(() => {
    return (detailQuery.data?.vehicleRegistrations || []).filter(item => !item.isAlreadyProcessed).length;
  }, [detailQuery.data?.vehicleRegistrations]);

  const totalCount = detailQuery.data?.vehicleRegistrations?.length || 0;

  return (
    <DashboardLayout>
      {detailQuery.isLoading ? (
        <LoadingState variant="page" />
      ) : detailQuery.isError || !detailQuery.data ? (
        <div className="flex h-[360px] flex-col items-center justify-center gap-3 text-center">
          <p className="text-red-500">Data penerimaan tidak ditemukan.</p>
          <button onClick={() => router.back()} className="text-sm text-blue-600 underline">Kembali</button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Detail & Edit STNK/BPKB</h1>
              <p className="mt-1 text-sm text-slate-500">Kelola dan update data registrasi kendaraan</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => window.print()} variant="outline" className="w-full sm:w-auto">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>
          </div>

          <Card className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Informasi Header Dokumen</h2>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Kode Dokumen</Label>
                <div className="mt-1 text-sm font-semibold text-slate-900">{detailQuery.data.code || '-'}</div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Kode Ditlantas</Label>
                <div className="mt-1 text-sm font-semibold text-slate-900">{detailQuery.data.ditlantasProcess?.code || '-'}</div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Vendor</Label>
                <div className="mt-1 text-sm font-semibold text-slate-900">{detailQuery.data.ditlantasProcess?.vendor?.name || '-'}</div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Tanggal Terima</Label>
                <div className="mt-1 text-sm font-semibold text-slate-900">{formatDate(detailQuery.data.receiptDate)}</div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Tanggal Proses Ditlantas</Label>
                <div className="mt-1 text-sm font-semibold text-slate-900">{formatDate(detailQuery.data.ditlantasProcess?.processDate)}</div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Tanggal Dibuat</Label>
                <div className="mt-1 text-sm font-semibold text-slate-900">{formatDate(detailQuery.data.createdAt)}</div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Terakhir Diupdate</Label>
                <div className="mt-1 text-sm font-semibold text-slate-900">{formatDate(detailQuery.data.updatedAt)}</div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Keterangan</Label>
                <div className="mt-1 text-sm text-slate-700">{detailQuery.data.description || '-'}</div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-4 border-t border-slate-100 pt-6">
              <div className="rounded-md bg-slate-50 px-4 py-2 text-sm">
                Total Kendaraan: <span className="font-semibold text-slate-900">{totalCount}</span>
              </div>
              <div className="rounded-md bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
                Processed: <span className="font-semibold text-emerald-700">{processedCount}</span>
              </div>
              <div className="rounded-md bg-amber-50 px-4 py-2 text-sm text-amber-800">
                Unprocessed: <span className="font-semibold text-amber-700">{unprocessedCount}</span>
              </div>
            </div>
          </Card>

          <SearchPagination
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder="Search here"
            searchAriaLabel="Cari kendaraan"
            page={page}
            perPage={perPage}
            total={filteredItems.length}
            lastPage={Math.max(1, Math.ceil(filteredItems.length / perPage))}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
          >
            <VehicleDocumentDetailTable
              items={pagedItems}
              isLoading={detailQuery.isFetching}
              onEdit={(item) => {
                const registrationId = item.registrationId || item.id;
                router.push(`/dashboard/${slug}/stnk-bpkb/${detailQuery.data?.id}/registration/${registrationId}/edit`);
              }}
            />
          </SearchPagination>
        </div>
      )}
    </DashboardLayout>
  );
}
