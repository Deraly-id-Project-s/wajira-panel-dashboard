import * as React from 'react';
import {
  ArrowRight,
  CalendarDays,
  CircleUserRound,
  ClipboardList,
  Copy,
  FileText,
  MapPin,
  Package,
  Route,
  Truck,
  UserRound,
  Wallet,
} from 'lucide-react';
import type { OrderList, OrderListStatus, OrderListTarifItem } from '@/@types/order-list.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  formatOrderCurrency,
  getOrderStatusBadgeClassName,
  getOrderStatusLabel,
  getOrderVehicleTypeLabel,
  ORDER_LIST_STATUS_OPTIONS,
} from './order-list.utils';

interface OrderListDetailViewProps {
  data: OrderList;
  onBack: () => void;
  onUpdateStatus?: (status: OrderListStatus) => void;
  canUpdateStatus?: boolean;
  isUpdatingStatus?: boolean;
}

function formatDate(value?: string | null, includeTime = false) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

function Field({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className="flex min-w-0 items-start gap-2 text-sm font-semibold text-slate-950">
        {Icon ? <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> : null}
        <div className="min-w-0 break-words">{value || '-'}</div>
      </div>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-orange-100 p-2 text-orange-700">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
      </div>
    </div>
  );
}

function getRouteInvoice(route: OrderListTarifItem) {
  if (route.expeditionInvoice != null) return Number(route.expeditionInvoice);
  if (route.vehicleType === 'towing') return Number(route.tarif?.invTowing ?? 0);
  if (route.vehicleType === 'cdd') return Number(route.tarif?.invCdd ?? 0);
  return Number(route.tarif?.invFuso ?? 0);
}

function getRouteDriverFee(route: OrderListTarifItem) {
  if (route.driverFee != null) return Number(route.driverFee);
  if (route.vehicleType === 'towing') return Number(route.tarif?.ujTowing ?? 0);
  if (route.vehicleType === 'cdd') return Number(route.tarif?.ujCdd ?? 0);
  return Number(route.tarif?.ujFuso ?? 0);
}

function CurrencyRow({ label, value, emphasized = false }: { label: string; value?: number | null; emphasized?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between gap-4 text-sm', emphasized && 'border-t border-orange-200 pt-3')}>
      <span className={emphasized ? 'font-semibold text-slate-900' : 'text-slate-500'}>{label}</span>
      <span className={cn('font-semibold text-slate-900', emphasized && 'text-base text-orange-700')}>
        {formatOrderCurrency(value)}
      </span>
    </div>
  );
}

function CargoList({ route }: { route: OrderListTarifItem }) {
  const items = route.tarifItems?.length
    ? route.tarifItems
    : route.loadContent
      ? [{
          id: `${route.id}-fallback`,
          uuid: undefined,
          loadContent: route.loadContent,
          qty: Number(route.qty ?? 0),
        }]
      : [];

  if (!items.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
        Belum ada item muatan pada rute ini.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="grid grid-cols-[56px_minmax(0,1fr)_100px] bg-orange-100 px-3 py-3 text-xs font-semibold uppercase text-slate-500">
        <span className="text-center">No</span>
        <span>Nama Muatan</span>
        <span className="text-right">Qty</span>
      </div>
      <div className="divide-y divide-slate-100 bg-white">
        {items.map((item, index) => (
          <div key={item.uuid || item.id || `${route.id}-${index}`} className="grid grid-cols-[56px_minmax(0,1fr)_100px] items-center px-3 py-3 text-sm">
            <span className="text-center text-slate-400">{index + 1}</span>
            <span className="break-words font-medium text-slate-900">{item.loadContent || '-'}</span>
            <span className="text-right font-semibold text-slate-900">{Number(item.qty ?? 0).toLocaleString('id-ID')} PCS</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrderListDetailView({
  data,
  onBack,
  onUpdateStatus,
  canUpdateStatus = false,
  isUpdatingStatus = false,
}: OrderListDetailViewProps) {
  const [nextStatus, setNextStatus] = React.useState<OrderListStatus>(data.status);
  React.useEffect(() => setNextStatus(data.status), [data.status]);

  const routes = data.tarifs ?? [];
  const expeditions = Array.isArray(data.expeditions) ? data.expeditions : [];
  const totalCargo = routes.reduce(
    (total, route) => total + (route.tarifItems ?? []).reduce((sum, item) => sum + Number(item.qty ?? 0), 0),
    0,
  );
  const totalDistance = routes.reduce((total, route) => total + Number(route.tarif?.distance ?? 0), 0);
  const totalBilling = Number(data.billInvoice ?? 0) + Number(data.ppn ?? 0) - Number(data.pph ?? 0);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        breadcrumbs={[{ label: 'Order List', onClick: onBack }, { label: 'Detail Order' }]}
        title="Detail Order List"
        onBack={onBack}
        subtitle={(
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(data.code)}
              className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:text-orange-700"
            >
              {data.code}
              <Copy className="h-3.5 w-3.5" />
            </button>
            <Badge variant="outline" className={cn('rounded-full px-3 py-1', getOrderStatusBadgeClassName(data.status))}>
              {getOrderStatusLabel(data.status)}
            </Badge>
            <span className="text-xs text-slate-500">Dibuat {formatDate(data.createdAt, true)}</span>
          </div>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Rute', value: routes.length.toLocaleString('id-ID'), suffix: ' rute', icon: Route },
          { label: 'Total Muatan', value: totalCargo.toLocaleString('id-ID'), suffix: ' PCS', icon: Package },
          { label: 'Total Jarak', value: totalDistance.toLocaleString('id-ID'), suffix: ' KM', icon: MapPin },
          { label: 'Total UJ Driver', value: formatOrderCurrency(data.ujDriver), suffix: '', icon: Wallet },
        ].map((item) => (
          <Card key={item.label} className="border-slate-200 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-orange-100 p-3 text-orange-700"><item.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="mt-1 font-bold text-slate-950">
                  {item.value}<span className="ml-1 text-xs font-semibold text-slate-500">{item.suffix}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="space-y-6 p-5 sm:p-6">
          <SectionHeading icon={FileText} title="Informasi Order" description="Informasi customer dan rangkuman tujuan pengiriman" />
          <div className="grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Customer" value={data.customer?.name || '-'} icon={CircleUserRound} />
            <Field label="Kode Customer" value={data.customer?.code || '-'} icon={ClipboardList} />
            <Field label="Tipe Armada" value={getOrderVehicleTypeLabel(data)} icon={Truck} />
            <Field label="DO Ekspedisi" value={`${expeditions.length} data`} icon={FileText} />
          </div>
          <div className="grid gap-5 rounded-xl bg-orange-50 p-4 md:grid-cols-3">
            <Field label="Lokasi Muat" value={data.loadingIn || '-'} icon={MapPin} />
            <Field label="Lokasi Bongkar" value={data.loadingOut || '-'} icon={MapPin} />
            <Field label="Tujuan Pengiriman" value={data.deliveryDestination || '-'} icon={MapPin} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <SectionHeading icon={Route} title="Rute, Armada & Muatan" description="Data berasal dari setiap DO order list tarif" />

          {routes.length ? (
            <div className="space-y-5">
              {routes.map((route, index) => {
                const tarif = route.tarif;
                const cargoCount = route.tarifItems?.length ?? (route.loadContent ? 1 : 0);

                return (
                  <div key={route.uuid || route.id || index} className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="flex flex-col gap-3 border-b border-orange-200 bg-orange-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-300 text-sm font-bold text-orange-950">{index + 1}</span>
                        <div>
                          <p className="font-semibold text-slate-950">{tarif?.loadingIn || route.loadingIn || '-'} <ArrowRight className="inline h-4 w-4" /> {tarif?.loadingOut || route.loadingOut || '-'}</p>
                          <p className="mt-0.5 text-xs text-slate-500">Tarif #{route.tarifId} · Rute #{route.id} · {cargoCount} jenis muatan</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="w-fit rounded-full border-orange-200 bg-orange-100 text-orange-800">
                        {getOrderVehicleTypeLabel(data, route)}
                      </Badge>
                    </div>

                    <div className="grid gap-5 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Field label="Jarak" value={`${Number(tarif?.distance ?? 0).toLocaleString('id-ID')} KM`} icon={Route} />
                      <Field label="Kendaraan" value={route.vehicle?.registrationNumber || (route.vehicleId ? `ID ${route.vehicleId}` : '-')} icon={Truck} />
                      <Field label="Driver" value={route.driver?.name || (route.driverId ? `ID ${route.driverId}` : '-')} icon={UserRound} />
                      <Field label="Dibuat" value={formatDate(route.createdAt)} icon={CalendarDays} />
                    </div>

                    <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                      <div className="min-w-0">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Daftar Muatan</p>
                        <CargoList route={route} />
                      </div>
                      <div className="space-y-3 rounded-lg bg-orange-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rincian Tarif</p>
                        <CurrencyRow label="UJ Driver" value={getRouteDriverFee(route)} />
                        <CurrencyRow label="Invoice" value={getRouteInvoice(route)} />
                        <div className="border-t border-orange-200 pt-3">
                          <p className="text-xs text-slate-500">Tujuan Pengiriman</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{route.deliveryDestination || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
              Belum ada data rute dan tarif pada order ini.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <SectionHeading icon={Wallet} title="Ringkasan Keuangan" description="Nilai agregat dari DO order list" />
            <div className="space-y-3 border-t border-slate-100 pt-5">
              <CurrencyRow label="Invoice Ekspedisi" value={data.billInvoice} />
              <CurrencyRow label="PPN" value={data.ppn} />
              <CurrencyRow label="PPh" value={data.pph} />
              <CurrencyRow label="Total Tagihan" value={totalBilling} emphasized />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <SectionHeading icon={ClipboardList} title="Status Order" description="Perubahan selain draft akan membentuk data DO ekspedisi" />
            <div className="flex items-center justify-between border-t border-slate-100 pt-5">
              <div>
                <p className="font-semibold text-slate-950">Status saat ini</p>
                <p className="mt-1 text-sm text-slate-500">Diperbarui {formatDate(data.updatedAt, true)}</p>
              </div>
              <Badge variant="outline" className={cn('rounded-full px-3 py-1 text-sm', getOrderStatusBadgeClassName(data.status))}>
                {getOrderStatusLabel(data.status)}
              </Badge>
            </div>
            {canUpdateStatus ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select value={nextStatus} onValueChange={(value: OrderListStatus) => setNextStatus(value)}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Pilih status" /></SelectTrigger>
                  <SelectContent>
                    {ORDER_LIST_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  disabled={isUpdatingStatus || nextStatus === data.status}
                  onClick={() => onUpdateStatus?.(nextStatus)}
                >
                  {isUpdatingStatus ? 'Menyimpan...' : 'Ubah Status'}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <SectionHeading icon={Truck} title="Ringkasan Biaya per Armada" description="Nilai agregat yang dikirim oleh API detail order list" />
          <div className="grid gap-4 border-t border-slate-100 pt-5 md:grid-cols-3">
            {[
              { label: 'Towing', uj: data.ujTowing, invoice: data.invTowing },
              { label: 'CDD', uj: data.ujCdd, invoice: data.invCdd },
              { label: 'Fuso', uj: data.ujFuso, invoice: data.invFuso },
            ].map((item) => (
              <div key={item.label} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-sm font-bold uppercase text-slate-900">{item.label}</p>
                <CurrencyRow label="UJ Driver" value={item.uj} />
                <CurrencyRow label="Invoice" value={item.invoice} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
