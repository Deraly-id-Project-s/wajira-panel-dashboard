import React from 'react';
import { format } from 'date-fns';
import { CalendarDays, CircleUserRound, ClipboardList, MapPin, Truck } from 'lucide-react';
import type { DoEkspedisi, DoEkspedisiOrderTarifItem } from '@/@types/do-ekspedisi.types';
import { Card, CardContent } from '@/components/ui/card';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { useRouter } from 'next/router';
import { ReferenceLink } from '@/components/ui/reference-link';
import { formatCurrency } from '@/lib/utils/currency';

interface DOEkspedisiDetailCardProps {
  data: DoEkspedisi;
}

function DetailField({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-slate-400" /> : null}
        <span>{value ?? '-'}</span>
      </div>
    </div>
  );
}

function Section({ title, description, icon: Icon, children }: { title: string; description: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="space-y-6 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-orange-100 p-2 text-orange-700"><Icon className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-semibold text-slate-950">{title}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
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
    header: 'QTY',
    alignment: 'right',
    className: 'w-[110px] font-semibold',
    cell: (item) => `${item.qty || 0} PCS`,
  },
];

export function DOEkspedisiDetailCard({ data }: DOEkspedisiDetailCardProps) {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';

  const firstItem = data.items?.[0];
  const order = data.orderList;
  const orderDetails = React.useMemo<DoEkspedisiOrderTarifItem[]>(
    () =>
      order?.tarifs && order.tarifs.length > 0
        ? order.tarifs
        : [
          {
            id: 0,
            loadingIn: order?.loadingIn || firstItem?.loadingIn || '-',
            loadingOut: order?.loadingOut || firstItem?.loadingOut || '-',
            deliveryDestination: order?.destination || firstItem?.destination || '-',
            loadContent: order?.loadContent || '-',
            qty: Number(order?.qty || 0),
            tarifItems: [],
          },
        ],
    [firstItem?.destination, firstItem?.loadingIn, firstItem?.loadingOut, order?.destination, order?.loadContent, order?.loadingIn, order?.loadingOut, order?.qty, order?.tarifs],
  );

  const driverName = data.driver?.name;
  const registrationNumber = data.vehicle?.registrationNumber;
  const customerName = order?.customerName || firstItem?.customerName || firstItem?.customer?.name;

  return (
    <div className="space-y-6">
      <Section title="Detail Driver" description="Informasi kendaraan dan penanggung jawab pengiriman" icon={Truck}>
        <div className="grid grid-cols-1 gap-x-12 gap-y-6 border-t border-slate-100 pt-5 md:grid-cols-3">
          <DetailField label="Mulai Pengiriman" value={(data.startDate || data.date) ? format(new Date(data.startDate || data.date), 'dd/MM/yyyy HH:mm') : '-'} icon={CalendarDays} />
          <DetailField label="Selesai Pengiriman" value={data.endDate ? format(new Date(data.endDate), 'dd/MM/yyyy HH:mm') : '-'} icon={CalendarDays} />
          <DetailField label="Kode DO" value={data.doCode || '-'} icon={ClipboardList} />
          <DetailField label="Uang Jalan" value={formatCurrency(data.ujNominal)} />
          <DetailField
            label="Nama Driver"
            value={
              driverName ? (
                <ReferenceLink href={`/dashboard/${slug}/master/driver?search=${driverName}`}>
                  {driverName}
                </ReferenceLink>
              ) : (
                '-'
              )
            }
            icon={CircleUserRound}
          />
          <DetailField label="Tipe Armada" value={data.vehicle?.type || '-'} icon={Truck} />
          <DetailField
            label="Nomor Polisi"
            value={
              registrationNumber ? (
                <ReferenceLink href={`/dashboard/${slug}/master/vehicle?search=${registrationNumber}`}>
                  {registrationNumber}
                </ReferenceLink>
              ) : (
                '-'
              )
            }
            icon={Truck}
          />
          <div className="md:col-span-3 border-t border-slate-100 pt-4">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Atensi Driver</p>
              <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {data.driverNote || '-'}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Detail Order Customer" description="Identitas customer dan rincian rute pengiriman" icon={ClipboardList}>
        <div className="grid grid-cols-1 gap-x-12 gap-y-6 border-t border-slate-100 pt-5 md:grid-cols-3">
          <DetailField
            label="Nama Customer"
            value={
              customerName ? (
                <ReferenceLink href={`/dashboard/${slug}/master/customer?search=${customerName}`}>
                  {customerName}
                </ReferenceLink>
              ) : (
                '-'
              )
            }
            icon={CircleUserRound}
          />
          <DetailField label="Kode Order" value={data.orderCode || order?.code || '-'} icon={ClipboardList} />
          <div />
        </div>

        <div className="mt-6 space-y-4">
          {orderDetails.map((item, index) => {
            const allTarifItems = item.tarifItems && item.tarifItems.length ? item.tarifItems : order?.tarifs?.find((t) => t.id === item.id)?.tarifItems ?? [];
            const cargo = allTarifItems.length
              ? allTarifItems.map((cargoItem) => ({
                id: cargoItem.id,
                loadContent: cargoItem.loadContent,
                qty: Number(cargoItem.qty ?? 0),
              }))
              : [{
                id: `${item.id}-${index}-fallback`,
                loadContent: item.loadContent || order?.loadContent || '-',
                qty: Number(item.qty || order?.qty || 0),
              }];

            return (
              <div key={`${item.id}-${index}`} className="overflow-hidden rounded-xl border border-slate-200">
                <div className="flex items-center gap-3 border-b border-orange-200 bg-orange-50 px-4 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-300 text-sm font-bold text-orange-950">{index + 1}</span>
                  <div className="text-sm font-semibold text-slate-950">Detail Order #{index + 1}</div>
                </div>
                <div className="p-4">
                <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-3">
                  <DetailField label="Loading In" value={item.loadingIn || '-'} />
                  <DetailField label="Loading Out" value={item.loadingOut || '-'} />
                  <DetailField label="Tujuan Kirim" value={item.deliveryDestination || '-'} icon={MapPin} />
                </div>
                <div className="mt-6">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Daftar Muatan</p>
                  <BaseTable<CargoRow>
                    data={cargo}
                    columns={cargoColumns}
                    headerRowClassName="bg-orange-50"
                    containerClassName="rounded-lg border border-slate-200"
                  />
                </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
