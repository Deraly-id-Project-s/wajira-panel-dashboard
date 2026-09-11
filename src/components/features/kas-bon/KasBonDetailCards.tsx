import {
  CalendarDays,
  CircleUserRound,
  ClipboardList,
  FileText,
  ReceiptText,
  WalletCards,
} from 'lucide-react';
import type {
  DriverCashAdvance,
  DriverCashAdvanceBilling,
} from '@/@types/driver-cash-advance.types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { formatKasBonDate } from './kas-bon.utils';

interface DetailFieldProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
}

function DetailField({ label, value, icon: Icon }: DetailFieldProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-slate-400" /> : null}
        <span className="min-w-0 break-words">{value ?? '-'}</span>
      </div>
    </div>
  );
}

interface DetailSectionProps {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function DetailSection({ title, description, icon: Icon, children }: DetailSectionProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="space-y-6 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-orange-100 p-2 text-orange-700">
            <Icon className="h-5 w-5" />
          </div>
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

export function KasBonDetailCards({
  data,
  billing,
}: {
  data: DriverCashAdvance;
  billing?: DriverCashAdvanceBilling | null;
}) {
  const isDriverRequest = Boolean(data.is_driver_request ?? data.isDriverRequest);

  return (
    <div className="space-y-6">
      <DetailSection
        title="Informasi Kas Bon"
        description="Rincian pengajuan dan persetujuan kas bon driver"
        icon={ClipboardList}
      >
        <div className="grid grid-cols-1 gap-x-12 gap-y-6 border-t border-slate-100 pt-5 md:grid-cols-3">
          <DetailField label="Nama Driver" value={data.driver?.name || '-'} icon={CircleUserRound} />
          <DetailField label="Kode Driver" value={data.driver?.code || '-'} />
          <DetailField
            label="Sumber Pengajuan"
            value={
              <Badge
                variant="outline"
                className={
                  isDriverRequest
                    ? 'border-blue-200 bg-blue-50 font-medium text-blue-700'
                    : 'border-slate-200 bg-slate-100 font-medium text-slate-700'
                }
              >
                {isDriverRequest ? 'Driver' : 'Kantor'}
              </Badge>
            }
          />
          <DetailField label="Subjek" value={data.subject || '-'} icon={FileText} />
          <DetailField label="Tanggal Klaim" value={formatKasBonDate(data.claimDate)} icon={CalendarDays} />
          <DetailField
            label="Status Approval"
            value={
              <Badge
                variant="outline"
                className={
                  data.isApprove
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700'
                }
              >
                {data.isApprove ? 'Disetujui' : 'Menunggu'}
              </Badge>
            }
          />
          <DetailField label="Nominal Klaim" value={currenciesFormat('idr', data.claimNominal)} icon={WalletCards} />
          <DetailField label="Nominal Disetujui" value={currenciesFormat('idr', data.approveNominal)} icon={WalletCards} />
          <DetailField label="Tanggal Approve" value={formatKasBonDate(data.approveDate)} icon={CalendarDays} />
          <div className="border-t border-slate-100 pt-4 md:col-span-3">
            <DetailField label="Deskripsi" value={data.description || '-'} icon={FileText} />
          </div>
        </div>
      </DetailSection>

      <DetailSection
        title="Ringkasan Pembayaran"
        description="Rekap tagihan dan pembayaran kas bon driver"
        icon={ReceiptText}
      >
        <div className="grid grid-cols-1 gap-x-12 gap-y-6 border-t border-slate-100 pt-5 md:grid-cols-3">
          <DetailField
            label="Total Tagihan"
            value={currenciesFormat('idr', billing?.grandTotal ?? data.nominal)}
            icon={WalletCards}
          />
          <DetailField
            label="Total Dibayar"
            value={<span className="text-emerald-700">{currenciesFormat('idr', billing?.totalPaid ?? data.paidNominal)}</span>}
            icon={WalletCards}
          />
          <DetailField
            label="Sisa Tagihan"
            value={<span className="text-rose-700">{currenciesFormat('idr', billing?.remainingPayment ?? data.billingRemainingNominal)}</span>}
            icon={WalletCards}
          />
          <DetailField label="Pembayaran Cash" value={currenciesFormat('idr', billing?.totalCashPayment ?? 0)} />
          <DetailField label="Pembayaran BCA IDR" value={currenciesFormat('idr', billing?.totalBcaCashPayment ?? 0)} />
          <DetailField label="Pembayaran BCA USD" value={currenciesFormat('usd', billing?.totalUsdPayment ?? 0)} />
          <DetailField label="Jumlah Pembayaran" value={`${billing?.totalPaymentCount ?? 0} transaksi`} />
          <DetailField label="Pembayaran Terakhir" value={formatKasBonDate(billing?.lastPaymentAt)} icon={CalendarDays} />
        </div>
      </DetailSection>
    </div>
  );
}
