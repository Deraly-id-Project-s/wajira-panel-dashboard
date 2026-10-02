import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, ChevronRight, Truck, ShieldCheck, Coins, Package } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CopyBox } from '@/components/ui/copy-box';
import { LoadingState } from '@/components/ui/loading-state';
import { CollapsibleBox } from '@/components/ui/collapsible-box';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { useArmadaDetail } from '@/hooks/useArmada';
import type { VehicleEquipmentAssigned } from '@/@types/armada.types';

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
};

const getRemainingLabel = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const diffInDays = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffInDays < 0) return { text: `${Math.abs(diffInDays)} hari lalu`, className: 'border-red-200 bg-red-50 text-red-700' };
  if (diffInDays <= 30) return { text: `${diffInDays} hari lagi`, className: 'border-red-200 bg-red-50 text-red-700' };
  if (diffInDays <= 90) return { text: `${diffInDays} hari lagi`, className: 'border-amber-200 bg-amber-50 text-amber-700' };
  return { text: `${diffInDays} hari lagi`, className: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
};

export default function ArmadaDetailPage() {
  const router = useRouter();
  const { slug, id } = router.query;

  const { data: armada, isLoading, isError } = useArmadaDetail(id as string | number | null);

  const handleBack = () => router.push(`/dashboard/${slug}/master/armada`);

  const equipmentColumns = useMemo<ColumnDef<VehicleEquipmentAssigned>[]>(() => [
    {
      header: 'Kode',
      accessorKey: 'code',
      cell: (item) => <CopyBox text={item.code || '-'} />,
    },
    {
      header: 'Nama Perlengkapan',
      accessorKey: 'name',
      cell: (item) => <span className="font-medium text-slate-800">{item.name}</span>,
    },
    {
      header: 'Deskripsi',
      accessorKey: 'description',
      cell: (item) => item.description || '-',
    },
    {
      header: 'Stok',
      accessorKey: 'stock',
      cell: (item) => (
        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 font-semibold">
          {item.stock} pcs
        </Badge>
      ),
    },
    {
      header: 'Harga Beli',
      accessorKey: 'buy_price',
      cell: (item) => <span className="text-slate-600">{currenciesFormat('idr', item.buy_price)}</span>,
    },
    {
      header: 'Harga Jual',
      accessorKey: 'sell_price',
      cell: (item) => <span className="text-slate-600">{currenciesFormat('idr', item.sell_price)}</span>,
    },
  ], []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <LoadingState variant="page" />
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !armada) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600">Gagal memuat data armada</h2>
          <Button onClick={handleBack} variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const stnkInfo = getRemainingLabel(armada.stnkAge);
  const kirInfo = getRemainingLabel(armada.kirAge);
  const assignedEquipments = armada.vehicleEquipmentAssigned ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="cursor-pointer hover:text-slate-800" onClick={handleBack}>Armada</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="font-medium text-slate-800">Detail Armada</span>
        </div>

        {/* Page Header */}
        <div className="flex items-center gap-4">
          <Button
            onClick={handleBack}
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Detail Armada: {armada.registrationNumber}</h1>
            <p className="text-sm text-slate-500">Informasi lengkap Armada beserta perlengkapan Armada</p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="rounded-md border-slate-200 bg-white shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3 mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" /> Spesifikasi Armada
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">No Polisi</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  <CopyBox text={armada.registrationNumber} />
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipe</span>
                <div className="mt-1">
                  <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 font-semibold uppercase">
                    {armada.type || '-'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">No Mesin</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  <CopyBox text={armada.machineNumber || '-'} />
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">No Rangka</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  <CopyBox text={armada.chassisNumber || '-'} />
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Masa STNK</span>
                <div className="mt-0.5 space-y-1">
                  <p className="text-sm font-bold text-slate-900">{formatDate(armada.stnkAge)}</p>
                  {stnkInfo && (
                    <Badge variant="outline" className={`text-xs font-medium ${stnkInfo.className}`}>
                      {stnkInfo.text}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Masa KIR</span>
                <div className="mt-0.5 space-y-1">
                  <p className="text-sm font-bold text-slate-900">{formatDate(armada.kirAge)}</p>
                  {kirInfo && (
                    <Badge variant="outline" className={`text-xs font-medium ${kirInfo.className}`}>
                      {kirInfo.text}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">No STNK</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{armada.stnkNumber || '-'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">No Buku KIR</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{armada.kirBook || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Equipment Assigned */}
        <CollapsibleBox
          icon={Package}
          title="Perlengkapan Armada"
          description={`${assignedEquipments.length} jenis perlengkapan pada armada ini`}
          defaultExpanded
        >
          {assignedEquipments.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">
              Belum ada perlengkapan yang ter-assign pada armada ini
            </div>
          ) : (
            <BaseTable
              data={assignedEquipments}
              columns={equipmentColumns}
              loading={isLoading}
            />
          )}
        </CollapsibleBox>
      </div>
    </DashboardLayout>
  );
}
