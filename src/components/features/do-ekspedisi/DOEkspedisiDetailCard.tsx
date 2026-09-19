import React from 'react';
import { format } from 'date-fns';
import { CalendarClock, CalendarDays, CheckCircle2, CircleUserRound, ClipboardList, Clock3, MapPin, Pencil, ReceiptText, Truck, WalletCards } from 'lucide-react';
import type { DoEkspedisi, DoEkspedisiOrderTarifItem } from '@/@types/do-ekspedisi.types';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { useRouter } from 'next/router';
import { ReferenceLink } from '@/components/ui/reference-link';
import { formatCurrency } from '@/lib/utils/currency';
import { CopyBox } from '@/components/ui/copy-box';
import { Button } from '@/components/ui/button';
import { DateTimeRangeDialog } from '@/components/ui/date-time-range-dialog';
import { useUpdateDoEkspedisi } from '@/hooks/useDoEkspedisi';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import { CollapsibleBox } from '@/components/ui/collapsible-box';
import { DOEkspedisiRealtimeTracking } from './DOEkspedisiRealtimeTracking';

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

const parseDateString = (value?: string | null) => {
  if (!value) return null;
  const str = value.includes(' ') && !value.includes('T') ? value.replace(' ', 'T') : value;
  const date = new Date(str);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const date = parseDateString(value);
  if (!date) return value;
  return format(date, 'dd/MM/yyyy HH:mm');
};

const getDurationLabel = (start?: string | null, end?: string | null) => {
  if (!start || !end) return '-';

  const startDate = parseDateString(start);
  const endDate = parseDateString(end);
  if (!startDate || !endDate) return '-';

  const diffInMinutes = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)));
  const days = Math.floor(diffInMinutes / 1440);
  const hours = Math.floor((diffInMinutes % 1440) / 60);
  const minutes = diffInMinutes % 60;
  const parts = [
    days ? `${days} hari` : '',
    hours ? `${hours} jam` : '',
    minutes ? `${minutes} menit` : '',
  ].filter(Boolean);

  return parts.length ? parts.join(' ') : '0 menit';
};

function TimelineDateCard({
  title,
  description,
  startLabel,
  endLabel,
  startDate,
  endDate,
  tone,
  onEdit,
}: {
  title: string;
  description: string;
  startLabel: string;
  endLabel: string;
  startDate?: string | null;
  endDate?: string | null;
  tone: 'admin' | 'process';
  onEdit?: () => void;
}) {
  const isAdmin = tone === 'admin';
  const toneClassName = isAdmin
    ? 'border-blue-100 bg-blue-50/50 text-blue-700'
    : 'border-emerald-100 bg-emerald-50/50 text-emerald-700';
  const iconWrapperClassName = isAdmin
    ? 'bg-blue-100 text-blue-700'
    : 'bg-emerald-100 text-emerald-700';

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${iconWrapperClassName}`}>
          {isAdmin ? <CalendarClock className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-950">{title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-slate-100 bg-slate-50/70 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{startLabel}</p>
            {onEdit ? (
              <Button type="button" variant="ghost" size="icon" onClick={onEdit} aria-label={`Ubah ${startLabel}`} className="h-7 w-7 text-slate-500 hover:text-blue-700">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateTime(startDate)}</p>
        </div>
        <div className="rounded-md border border-slate-100 bg-slate-50/70 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{endLabel}</p>
            {onEdit ? (
              <Button type="button" variant="ghost" size="icon" onClick={onEdit} aria-label={`Ubah ${endLabel}`} className="h-7 w-7 text-slate-500 hover:text-blue-700">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateTime(endDate)}</p>
        </div>
      </div>

      <div className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${toneClassName}`}>
        <CheckCircle2 className="h-3.5 w-3.5" />
        Durasi: {getDurationLabel(startDate, endDate)}
      </div>
    </div>
  );
}

function ExpeditionDateOverview({ data, onEditTarget }: { data: DoEkspedisi; onEditTarget: () => void }) {
  const canEdit = String(data.status).toLowerCase() === 'draft';

  return (
    <CollapsibleBox title="Informasi Waktu Ekspedisi" description="Target waktu dan proses pengiriman ekspedisi" icon={CalendarDays} defaultExpanded>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <TimelineDateCard
          title="Target Jadwal Ekspedisi"
          description="Target waktu pengiriman yang ditentukan oleh admin sebelum DO diproses."
          startLabel="Target Mulai"
          endLabel="Target Selesai"
          startDate={data.targetStartDate}
          endDate={data.targetEndDate}
          tone="admin"
          onEdit={canEdit ? onEditTarget : undefined}
        />
        <TimelineDateCard
          title="Waktu Aktual Diproses"
          description="Waktu real saat DO ekspedisi mulai diproses hingga diselesaikan."
          startLabel="Mulai Diproses"
          endLabel="Selesai Diproses"
          startDate={data.startDate || data.date}
          endDate={data.endDate}
          tone="process"
        />
      </div>
    </CollapsibleBox>
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
  const [targetDialogOpen, setTargetDialogOpen] = React.useState(false);
  const updateMutation = useUpdateDoEkspedisi();

  const handleUpdateTarget = async ({ start, end }: { start: Date; end: Date }) => {
    try {
      await updateMutation.mutateAsync({
        id: data.id,
        payload: {
          target_start_date: format(start, 'yyyy-MM-dd HH:mm:ss'),
          target_end_date: format(end, 'yyyy-MM-dd HH:mm:ss'),
        },
      });
      toast.success('Target jadwal ekspedisi berhasil diperbarui.');
      setTargetDialogOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

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
  const customer = order?.customer || firstItem?.customer;

  return (
    <div className="space-y-6">
      <CollapsibleBox title="Detail Driver" description="Informasi kendaraan dan penanggung jawab pengiriman" icon={Truck} defaultExpanded>
        <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-3">
          <DetailField label="Kode DO" value={data.doCode || '-'} icon={ClipboardList} />
          <DetailField label="UJ Awal" value={formatCurrency(data.ujNominalBeforeClaim)} icon={WalletCards} />
          <DetailField label="Potongan Claim" value={<span className="text-rose-700">-{formatCurrency(data.claimDeductionNominal)}</span>} icon={ReceiptText} />
          <DetailField label="Potongan Kas Bon" value={<span className="text-rose-700">-{formatCurrency(data.cashAdvanceDeductionNominal)}</span>} icon={WalletCards} />
          <DetailField label="UJ Diterima Driver" value={<span className="text-emerald-700">{formatCurrency(data.ujNominal)}</span>} icon={WalletCards} />
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
      </CollapsibleBox>

      <DOEkspedisiRealtimeTracking data={data} />

      <ExpeditionDateOverview data={data} onEditTarget={() => setTargetDialogOpen(true)} />

      <DateTimeRangeDialog
        open={targetDialogOpen}
        onOpenChange={setTargetDialogOpen}
        title="Ubah Target Jadwal Ekspedisi"
        description="Atur target waktu mulai dan selesai pengiriman ekspedisi."
        startLabel="Target Mulai"
        endLabel="Target Selesai"
        initialStart={data.targetStartDate}
        initialEnd={data.targetEndDate}
        onSubmit={handleUpdateTarget}
        isSubmitting={updateMutation.isPending}
      />

      <CollapsibleBox title="Informasi Customer" description="Identitas customer dan rincian rute pengiriman" icon={ClipboardList} defaultExpanded>
        <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-3">
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
          <DetailField label="Nomor Telepon" value={customer?.phone || '-'} />
          <DetailField label="PIC Customer" value={customer?.pic || '-'} />
          <div className="md:col-span-3">
            <DetailField label="Alamat Customer" value={customer?.address || '-'} icon={MapPin} />
          </div>
          <DetailField
            label="Kode Order"
            value={
              data.orderCode ? (
                <CopyBox text={data.orderCode} />
              ) : (
                '-'
              )
            }
            icon={ClipboardList}
          />
          <DetailField label="Status Order" value={order?.status || '-'} />
          <DetailField label="Deskripsi Order" value={order?.description || '-'} />
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
              : item.loadContent || order?.loadContent
                ? [{
                  id: `${item.id}-${index}-fallback`,
                  loadContent: item.loadContent || order?.loadContent || '-',
                  qty: Number(item.qty || order?.qty || 0),
                }]
                : [];

            return (
              <div key={`${item.id}-${index}`} className="overflow-hidden rounded-md border border-slate-200">
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
                    {cargo.length > 0 ? (
                      <BaseTable<CargoRow>
                        data={cargo}
                        columns={cargoColumns}
                        headerRowClassName="bg-orange-50"
                        containerClassName="rounded-md border border-slate-200"
                      />
                    ) : (
                      <div className="rounded-md border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                        Data muatan tidak tersedia.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleBox>
    </div>
  );
}
