import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Pencil, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { useCompany } from '@/contexts/CompanyContext';
import { useKas } from '@/hooks/useKas';
import {
  useBBNBillBillingItems,
  useBBNBillBillings,
  useBBNBillDetail,
  useDeleteBBNBillBillingItem,
} from '@/hooks/useBBNBill';
import {
  calculateOutstanding,
  formatBillCode,
  formatCurrency,
  formatShortDate,
  getCashLabel,
} from '@/components/features/tagihan-bbn/utils';
import { formatDate } from '@/lib/utils/format';
import { LoadingState } from '@/components/ui/loading-state';

function ReadonlyField({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-900">{label}</p>
      <Input value={value} readOnly className={`h-11 rounded-md border-slate-200 bg-white ${danger ? 'text-red-500' : 'text-slate-500'}`} />
    </div>
  );
}

export default function BBNBillDetailPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const id = typeof router.query.id === 'string' ? router.query.id : null;
  const { companyId } = useCompany();
  const safeCompanyId = companyId || '1';

  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(25);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim().toLowerCase());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const detailQuery = useBBNBillDetail(id);
  const billingsQuery = useBBNBillBillings({ page: 1, perPage: 1000 });
  const billingItemsQuery = useBBNBillBillingItems({ page: 1, perPage: 1000 });
  const kasQuery = useKas(safeCompanyId);
  const deleteBillingItemMutation = useDeleteBBNBillBillingItem();

  const cashLabelMap = React.useMemo(() => {
    const map = new Map<number, string>();
    (kasQuery.data?.data ?? []).forEach((cash) => {
      map.set(Number(cash.id), getCashLabel(cash));
    });
    return map;
  }, [kasQuery.data?.data]);

  const billings = React.useMemo(() => {
    const currentId = Number(id || 0);
    const fromList = (billingsQuery.data?.data ?? []).filter((item) => item.bbnBillId === currentId);
    if (fromList.length > 0) return fromList;

    return (detailQuery.data?.billings ?? []).map((item) => ({
      id: item.id,
      uuid: item.uuid,
      bbnBillId: item.bbnBillId,
      totalPayment: item.totalPayment,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      bbnBill: null,
    }));
  }, [billingsQuery.data?.data, detailQuery.data?.billings, id]);

  const billingIds = React.useMemo(() => new Set(billings.map((item) => item.id)), [billings]);

  const paymentItems = React.useMemo(() => {
    return (billingItemsQuery.data?.data ?? [])
      .filter((item) => billingIds.has(item.bbnBillBillingId))
      .map((item) => {
        const cashIdNum = item.cashId ? Number(item.cashId) : 0;
        const rawLabel = cashLabelMap.get(cashIdNum) || item.cashLabel || 'Cash';
        const label = (() => {
          const upper = rawLabel.toUpperCase();
          if (upper.includes('USD')) return 'BCA USD';
          if (upper.includes('BCA')) return 'BCA IDR';
          return 'CASH IDR';
        })();
        return {
          ...item,
          cashLabel: label,
        };
      });
  }, [billingIds, billingItemsQuery.data?.data, cashLabelMap]);

  const vehicles = React.useMemo(() => detailQuery.data?.dealerDetail?.vehicleDatas ?? [], [detailQuery.data?.dealerDetail?.vehicleDatas]);
  const filteredVehicles = React.useMemo(() => {
    if (!search) return vehicles;

    return vehicles.filter((vehicle) => {
      const registration = vehicle.vehicleRegistration;
      return [
        detailQuery.data?.dealer?.name || '',
        vehicle.stnkName || '',
        vehicle.machineNumber || '',
        vehicle.chassisNumber || '',
        registration?.tnkbNumber || '',
        vehicle.invoiceNumber || '',
      ].some((field) => field.toLowerCase().includes(search));
    });
  }, [detailQuery.data?.dealer?.name, search, vehicles]);

  const pagedVehicles = React.useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredVehicles.slice(start, start + perPage);
  }, [filteredVehicles, page, perPage]);

  const aggregatedFees = React.useMemo(() => {
    return vehicles.reduce(
      (acc, vehicle) => {
        const registration = vehicle.vehicleRegistration;
        acc.bbn += registration?.bbnRegistrationFee || 0;
        acc.garwil += registration?.garwilFee || 0;
        acc.nik += registration?.nikValidationFee || 0;
        acc.acceleration += registration?.accelerationFee || 0;
        acc.stamp += registration?.stampFee || 0;
        acc.pnbp += registration?.pnbpBpkb || 0;
        acc.skpd += registration?.skpdFee || 0;
        return acc;
      },
      { bbn: 0, garwil: 0, nik: 0, acceleration: 0, stamp: 0, pnbp: 0, skpd: 0 },
    );
  }, [vehicles]);

  const vehicleColumns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        header: 'NAMA DEALER',
        alignment: 'center',
        cell: () => <span className="uppercase text-slate-700">{detailQuery.data?.dealer?.name || '-'}</span>,
      },
      {
        header: 'NAMA STNK',
        alignment: 'center',
        cell: (vehicle) => vehicle.stnkName || '-',
      },
      {
        header: 'NOMOR POLISI',
        alignment: 'center',
        cell: (vehicle) => vehicle.vehicleRegistration?.tnkbNumber || '-',
      },
      {
        header: 'NOMOR RANGKA',
        alignment: 'center',
        cell: (vehicle) => vehicle.chassisNumber || '-',
      },
      {
        header: 'NOMOR MESIN',
        alignment: 'center',
        cell: (vehicle) => vehicle.machineNumber || '-',
      },
      {
        header: 'DAFTAR BBN',
        alignment: 'center',
        cell: (vehicle) => formatCurrency(vehicle.vehicleRegistration?.bbnRegistrationFee || 0),
      },
      {
        header: 'ACC GARWIL',
        alignment: 'center',
        cell: (vehicle) => formatCurrency(vehicle.vehicleRegistration?.garwilFee || 0),
      },
      {
        header: 'ACC NIK',
        alignment: 'center',
        cell: (vehicle) => formatCurrency(vehicle.vehicleRegistration?.nikValidationFee || 0),
      },
      {
        header: 'PERCEPATAN',
        alignment: 'center',
        cell: (vehicle) => formatCurrency(vehicle.vehicleRegistration?.accelerationFee || 0),
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (vehicle) => (
          <Link
            href={`/dashboard/${slug}/tagihan-bbn/${detailQuery.data?.id}/kendaraan/${vehicle.id}/edit`}
            className="text-sm font-medium text-[#1f4163] hover:underline"
          >
            Edit
          </Link>
        ),
      },
    ],
    [detailQuery.data?.dealer?.name, detailQuery.data?.id, slug]
  );

  const paymentColumns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        header: 'Tanggal',
        alignment: 'left',
        cell: (item) => formatDate(item.paidDate),
      },
      {
        header: 'Keterangan Bayar',
        alignment: 'left',
        cell: () => (
          <span className="cursor-pointer text-sm font-medium text-blue-600 hover:underline">
            Link
          </span>
        ),
      },
      {
        header: 'Nominal Pembayaran Cash BCA',
        alignment: 'left',
        cell: (item) => {
          const label = item.cashLabel || 'Cash';
          return label === 'BCA IDR' ? formatCurrency(item.amount) : 'Rp';
        },
      },
      {
        header: 'Nominal Pembayaran USD BCA',
        alignment: 'left',
        cell: (item) => {
          const label = item.cashLabel || 'Cash';
          return label === 'BCA USD' ? formatCurrency(item.amount) : 'Rp';
        },
      },
      {
        header: 'Nominal Pembayaran Cash',
        alignment: 'left',
        cell: (item) => {
          const label = item.cashLabel || 'Cash';
          return label === 'CASH IDR' || label === 'Cash' ? formatCurrency(item.amount) : 'Rp';
        },
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => (
          <div className="flex items-center justify-center gap-3">
            <Link
              href={`/dashboard/${slug}/tagihan-bbn/${detailQuery.data?.id}/pembayaran?itemId=${item.id}`}
              className="text-sm font-medium text-[#1f4163] hover:underline"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={async () => {
                try {
                  await deleteBillingItemMutation.mutateAsync(item.id);
                  toast.success('Item pembayaran berhasil dihapus');
                } catch (error: any) {
                  toast.error(getApiErrorMessage(error));
                }
              }}
              className="text-sm font-medium text-red-600 hover:underline"
            >
              Hapus
            </button>
          </div>
        ),
      },
    ],
    [deleteBillingItemMutation, detailQuery.data?.id, slug]
  );

  return (
    <DashboardLayout>
      {detailQuery.isLoading ? (
        <LoadingState variant="page" />
      ) : detailQuery.isError || !detailQuery.data ? (
        <div className="flex h-[360px] flex-col items-center justify-center gap-3 text-center">
          <p className="text-red-500">Detail tagihan BBN tidak ditemukan.</p>
          <button onClick={() => router.back()} className="text-sm text-blue-600 underline">Kembali</button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-[36px] font-semibold tracking-[-0.03em] text-slate-950">Detail Tagihan</h1>
              <p className="mt-1 text-base text-slate-500">Kelola data tagihan STNK &amp; BPKB</p>
            </div>
            <div className="flex gap-3">
              <Link href={`/dashboard/${slug}/tagihan-bbn/${detailQuery.data.id}/edit`}>
                <Button variant="outline" className="h-11 rounded-md border-slate-200 bg-white">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <Button onClick={() => router.push(`/dashboard/${slug}/tagihan-bbn/print/${detailQuery.data.id}`)} variant="outline" className="w-full sm:w-auto">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>
          </div>

          <Card className="rounded-md border border-slate-200 bg-white p-5 shadow-sm space-y-5">
            <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
              <ReadonlyField label="Kode Ditlantas" value={detailQuery.data.ditlantasProcess?.code || '-'} />
              <ReadonlyField label="Nomor Tagihan" value={detailQuery.data.code || formatBillCode(detailQuery.data.id)} />
            </div>
            <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
              <ReadonlyField label="Tanggal Penagihan" value={formatShortDate(detailQuery.data.billDate)} />
              <ReadonlyField label="Tanggal Bayar" value={formatShortDate(detailQuery.data.paidDate)} />
            </div>
            <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
              <ReadonlyField label="Jumlah Tagihan" value={formatCurrency(detailQuery.data.bruttoAmount)} />
              <ReadonlyField label="PPH 23=2%" value={formatCurrency(detailQuery.data.pph23Amount ?? 0)} />
              <ReadonlyField label="Grand Total (Jumlah Tagihan & PPH)" value={formatCurrency(detailQuery.data.bruttoAmount - (detailQuery.data.pph23Amount ?? 0))} />
            </div>
            <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
              <ReadonlyField label="Kurang Bayar" value={formatCurrency(detailQuery.data.remainingAmount !== undefined ? detailQuery.data.remainingAmount : calculateOutstanding(detailQuery.data.bruttoAmount, detailQuery.data.paidAmount))} danger />
              <ReadonlyField label="Terbayar" value={formatCurrency(detailQuery.data.paidAmount)} />
            </div>
          </Card>

          {/* Tabel Detail Kendaraan */}
          <BaseTable
            data={pagedVehicles}
            columns={vehicleColumns}
            loading={detailQuery.isLoading}
            searchPlaceholder="Search here"
            search={searchInput}
            onSearchChange={(val) => {
              setSearchInput(val);
            }}
            showLimitChange
            perPage={perPage}
            onPerPageChange={(val) => {
              setPerPage(val);
            }}
            meta={{
              currentPage: page,
              perPage,
              lastPage: Math.max(1, Math.ceil(filteredVehicles.length / perPage)),
              total: filteredVehicles.length,
            }}
            onPageChange={setPage}
            headerRowClassName="bg-[#edf2f7]"
          />

          {/* Tabel History Pembayaran */}
          <div className="space-y-4">
            <div>
              <h2 className="text-[32px] font-semibold tracking-[-0.03em] text-slate-950">History Pembayaran</h2>
              <p className="mt-1 text-sm text-slate-500">Rincian lengkap unit yang dibeli</p>
            </div>

            <BaseTable
              data={paymentItems}
              columns={paymentColumns}
              loading={billingItemsQuery.isLoading || billingsQuery.isLoading}
              headerRowClassName="bg-[#eef9ee]"
            />
          </div>

          <Card className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Ringkasan Biaya Kendaraan</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <ReadonlyField label="Daftar BBN" value={formatCurrency(aggregatedFees.bbn)} />
              <ReadonlyField label="Acc Garwil" value={formatCurrency(aggregatedFees.garwil)} />
              <ReadonlyField label="Acc NIK" value={formatCurrency(aggregatedFees.nik)} />
              <ReadonlyField label="Percepatan" value={formatCurrency(aggregatedFees.acceleration)} />
              <ReadonlyField label="Materai" value={formatCurrency(aggregatedFees.stamp)} />
              <ReadonlyField label="PNBP BPKB" value={formatCurrency(aggregatedFees.pnbp)} />
              <ReadonlyField label="Notice SKPD" value={formatCurrency(aggregatedFees.skpd)} />
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
