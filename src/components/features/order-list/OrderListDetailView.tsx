import * as React from 'react';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleUserRound,
  ClipboardList,
  Copy,
  FileText,
  MapPin,
  Package,
  Route,
  Truck,
  Wallet,
} from 'lucide-react';
import type { OrderList } from '@/@types/order-list.types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils';
import {
  formatOrderCurrency,
  getOrderStatusBadgeClassName,
  getOrderStatusLabel,
  getOrderVehicleTypeLabel,
} from './order-list.utils';
import { ReferenceLink } from '@/components/ui/reference-link';

interface ExpeditionData {
  id?: number;
  code?: string;
  date?: string | null;
  driver_note?: string | null;
  is_printed?: boolean;
  vehicle?: { registration_number?: string; type?: string } | null;
  driver?: { name?: string } | null;
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Field({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-slate-400" /> : null}
        <span>{value}</span>
      </div>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-orange-100 p-2 text-orange-700"><Icon className="h-5 w-5" /></div>
      <div>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
      </div>
    </div>
  );
}

interface CargoRow {
  id: string | number;
  loadContent: string;
  qty: number;
}

const cargoColumns: ColumnDef<CargoRow>[] = [
  {
    header: 'No',
    alignment: 'center',
    className: 'w-[56px] text-slate-400',
    cell: (_item, index) => index + 1,
  },
  {
    header: 'Nama Muatan',
    cell: (item) => <span className="font-medium text-slate-900">{item.loadContent || '-'}</span>,
  },
  {
    header: 'Qty',
    alignment: 'right',
    className: 'w-[110px] font-semibold',
    cell: (item) => `${item.qty} PCS`,
  },
];

const KPI_COLOR_CLASSES = {
  blue: 'bg-orange-100 text-orange-700',
  violet: 'bg-orange-200 text-orange-800',
  amber: 'bg-orange-300 text-orange-900',
  emerald: 'bg-orange-50 text-orange-700',
} as const;

interface OrderListDetailViewProps {
  data: OrderList;
  onBack: () => void;
}

export function OrderListDetailView({ data, onBack }: OrderListDetailViewProps) {
  const expeditions = (Array.isArray(data.expeditions) ? data.expeditions : []) as ExpeditionData[];
  const routes = data.tarifs ?? [];
  const totalCargo = routes.reduce((sum, route) => {
    const items = route.tarifItems ?? (route.loadContent ? [{ loadContent: route.loadContent, qty: route.qty ?? 0 }] : []);
    return sum + items.reduce((itemSum, item) => itemSum + Number(item.qty ?? 0), 0);
  }, 0);
  const totalDistance = routes.reduce((sum, route) => sum + Number(route.tarif?.distance ?? 0), 0);
  const totalUj = data.ujDriver || routes.reduce((sum, route) => sum + Number(route.driverFee ?? 0), 0);
  const copiedCode = () => navigator.clipboard?.writeText(data.code);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        breadcrumbs={[{ label: 'Order List', onClick: onBack }, { label: 'Detail Order' }]}
        title="Detail Order"
        onBack={onBack}
        subtitle={(
          <>
            <button type="button" onClick={copiedCode} className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:text-orange-700">
              {data.code}
            </button>
            <Badge variant="outline" className={cn('rounded-full px-3 py-1', getOrderStatusBadgeClassName(data.status))}>
              {getOrderStatusLabel(data.status)}
            </Badge>
          </>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Ekspedisi', value: expeditions.length || routes.length, suffix: ' DO', icon: Truck, color: 'blue' },
          { label: 'Total Muatan', value: totalCargo, suffix: ' PCS', icon: Package, color: 'violet' },
          { label: 'Total Jarak', value: totalDistance.toLocaleString('id-ID'), suffix: ' KM', icon: Route, color: 'amber' },
          { label: 'Total UJ Driver', value: formatOrderCurrency(totalUj), suffix: '', icon: Wallet, color: 'emerald' },
        ].map((item) => (
          <Card key={item.label} className="border-slate-200 shadow-sm"><CardContent className="flex items-center gap-4 p-5">
            <div className={cn('rounded-xl p-3', KPI_COLOR_CLASSES[item.color as keyof typeof KPI_COLOR_CLASSES])}><item.icon className="h-5 w-5" /></div>
            <div><p className="text-xs text-slate-500">{item.label}</p><p className="mt-1 font-bold text-slate-950">{item.value}<span className="ml-1 text-xs font-semibold text-slate-500">{item.suffix}</span></p></div>
          </CardContent></Card>
        ))}
      </div>

      <Card className="border-slate-200 shadow-sm"><CardContent className="space-y-6 p-5 sm:p-6">
        <SectionHeading icon={FileText} title="Informasi Order" description="Identitas order, customer, dan detail pengiriman utama" />
        <div className="grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Customer" value={data.customer?.name || '-'} icon={CircleUserRound} />
          <Field label="Jenis Kendaraan" value={getOrderVehicleTypeLabel(data)} icon={Truck} />
          <Field label="Jumlah Tujuan" value={`${routes.length} tujuan`} icon={MapPin} />
        </div>
        <div className="grid gap-5 rounded-xl bg-orange-50 p-4 sm:grid-cols-2">
          <Field label="Lokasi Muat" value={data.loadingIn || '-'} icon={MapPin} />
          <Field label="Lokasi Bongkar" value={data.loadingOut || '-'} icon={MapPin} />
        </div>
      </CardContent></Card>

      <Card className="border-slate-200 shadow-sm"><CardContent className="space-y-5 p-5 sm:p-6">
        <SectionHeading icon={ClipboardList} title="Detail Ekspedisi & Muatan" description="Rincian DO, tujuan pengiriman, dan barang pada setiap rute" />
        <div className="space-y-5">
          {routes.map((route, index) => {
            const expedition = expeditions[index];
            const tarif = route.tarif;
            const cargo = route.tarifItems ?? (route.loadContent ? [{ id: `${route.id}-fallback`, loadContent: route.loadContent, qty: route.qty ?? 0 }] : []);
            const invoice = route.expeditionInvoice || (data.vehicleType === 'fuso' ? tarif?.invFuso : tarif?.invCdd);
            const uj = route.driverFee || (data.vehicleType === 'fuso' ? tarif?.ujFuso : tarif?.ujCdd);
            return (
              <div key={route.id || index} className="overflow-hidden rounded-xl border border-slate-200">
                <div className="flex flex-col gap-3 border-b border-orange-200 bg-orange-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-300 text-sm font-bold text-orange-950">{index + 1}</span><div><p className="font-semibold text-slate-950">{expedition?.code || `Ekspedisi #${index + 1}`}</p><p className="text-xs text-slate-500">{route.deliveryDestination || '-'}</p></div></div>
                  <div className="flex items-center gap-2"><Badge variant="outline" className="rounded-full border-orange-200 bg-orange-100 text-orange-800">{getOrderVehicleTypeLabel(data, route)}</Badge>{expedition?.is_printed ? <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700"><CheckCircle2 className="mr-1 h-3 w-3" />Sudah dicetak</Badge> : <Badge variant="outline" className="rounded-full text-slate-500">Belum dicetak</Badge>}</div>
                </div>
                <div className="grid gap-4 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Rute" value={<span className="inline-flex items-center gap-1">{route.loadingIn || tarif?.loadingIn || '-'} <ArrowRight className="h-3.5 w-3.5" /> {route.loadingOut || tarif?.loadingOut || '-'}</span>} icon={Route} />
                  <Field label="Jarak" value={`${Number(tarif?.distance ?? 0).toLocaleString('id-ID')} KM`} />
                  <Field label="Tanggal Jalan" value={formatDate(expedition?.date)} icon={CalendarDays} />
                  <Field label="Kendaraan / Driver" value={expedition?.vehicle?.registration_number || 'Belum ditugaskan'} icon={Truck} />
                </div>
                <div className="grid gap-5 p-4 lg:grid-cols-[1fr_260px]">
                  <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Daftar Muatan</p><BaseTable<CargoRow> data={cargo as CargoRow[]} columns={cargoColumns} headerRowClassName="bg-orange-100" containerClassName="rounded-lg" /></div>
                  <div className="space-y-3 rounded-lg bg-orange-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rincian Tarif</p><div className="flex justify-between gap-3 text-sm"><span className="text-slate-500">UJ Driver</span><span className="font-semibold text-slate-900">{formatOrderCurrency(uj)}</span></div><div className="flex justify-between gap-3 text-sm"><span className="text-slate-500">Invoice</span><span className="font-semibold text-slate-900">{formatOrderCurrency(invoice)}</span></div><div className="flex justify-between gap-3 border-t border-orange-200 pt-3 text-sm"><span className="text-slate-500">Tujuan</span><span className="text-right font-semibold text-slate-900">{route.deliveryDestination || '-'}</span></div></div>
                </div>
                {expedition?.driver_note ? <div className="border-t border-slate-100 px-4 py-3 text-sm text-slate-600"><span className="font-semibold text-slate-900">Catatan driver:</span> {expedition.driver_note}</div> : null}
              </div>
            );
          })}
        </div>
      </CardContent></Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="border-slate-200 shadow-sm"><CardContent className="space-y-5 p-5 sm:p-6"><SectionHeading icon={Wallet} title="Ringkasan Keuangan" /><div className="space-y-3 border-t border-slate-100 pt-5"><div className="flex justify-between text-sm"><span className="text-slate-500">Invoice Ekspedisi</span><span className="font-semibold text-slate-900">{formatOrderCurrency(data.billInvoice)}</span></div><div className="flex justify-between text-sm"><span className="text-slate-500">PPN</span><span className="font-semibold text-slate-900">{formatOrderCurrency(data.ppn)}</span></div><div className="flex justify-between border-t border-slate-100 pt-3"><span className="font-bold text-slate-950">Total Tagihan</span><span className="text-lg font-bold text-orange-700">{formatOrderCurrency(Number(data.billInvoice ?? 0) + Number(data.ppn ?? 0))}</span></div></div></CardContent></Card>
        <Card className="border-slate-200 shadow-sm"><CardContent className="space-y-5 p-5 sm:p-6"><SectionHeading icon={ClipboardList} title="Status Order" /><div className="flex items-center justify-between border-t border-slate-100 pt-5"><div><p className="font-semibold text-slate-950">Status pengiriman</p><p className="mt-1 text-sm text-slate-500">Status terakhir order list</p></div><Badge variant="outline" className={cn('rounded-full px-3 py-1 text-sm', getOrderStatusBadgeClassName(data.status))}>{getOrderStatusLabel(data.status)}</Badge></div></CardContent></Card>
      </div>
    </div>
  );
}
