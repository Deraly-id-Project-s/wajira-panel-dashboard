import { CalendarDays, CircleUserRound, FileText, WalletCards } from 'lucide-react';
import type { DriverCashAdvance, DriverCashAdvanceBilling } from '@/@types/driver-cash-advance.types';
import { SectionCard } from '@/components/common/SectionCard';
import { Badge } from '@/components/ui/badge';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { formatKasBonDate } from './kas-bon.utils';

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className="text-sm font-semibold text-slate-900">{value ?? '-'}</div>
    </div>
  );
}

export function KasBonDetailCards({ data, billing }: { data: DriverCashAdvance; billing?: DriverCashAdvanceBilling | null }) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <SectionCard title="Informasi Kas Bon">
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <DetailItem label="Driver" value={<span className="inline-flex items-center gap-2"><CircleUserRound className="h-4 w-4 text-slate-400" />{data.driver?.name || '-'}</span>} />
          <DetailItem label="Kode Driver" value={data.driver?.code || '-'} />
          <DetailItem
            label="Sumber Pengajuan"
            value={
              <Badge
                variant="outline"
                className={
                  Boolean(data.is_driver_request ?? data.isDriverRequest)
                    ? 'border-blue-200 bg-blue-50 text-blue-700 font-medium'
                    : 'border-slate-200 bg-slate-100 text-slate-700 font-medium'
                }
              >
                {Boolean(data.is_driver_request ?? data.isDriverRequest) ? 'Driver' : 'Kantor'}
              </Badge>
            }
          />
          <DetailItem label="Subjek" value={data.subject || '-'} />
          <DetailItem label="Tanggal Klaim" value={<span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-slate-400" />{formatKasBonDate(data.claimDate)}</span>} />
          <DetailItem label="Nominal Klaim" value={currenciesFormat('idr', data.claimNominal)} />
          <DetailItem label="Nominal Disetujui" value={currenciesFormat('idr', data.approveNominal)} />
          <DetailItem label="Status Approval" value={<Badge variant="outline" className={data.isApprove ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}>{data.isApprove ? 'Disetujui' : 'Menunggu'}</Badge>} />
          <DetailItem label="Tanggal Approve" value={formatKasBonDate(data.approveDate)} />
          <div className="sm:col-span-2 border-t border-slate-100 pt-4">
            <DetailItem label="Deskripsi" value={<span className="inline-flex items-start gap-2 font-normal leading-relaxed text-slate-600"><FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />{data.description || '-'}</span>} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Ringkasan Pembayaran">
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <DetailItem label="Total Tagihan" value={<span className="inline-flex items-center gap-2"><WalletCards className="h-4 w-4 text-slate-400" />{currenciesFormat('idr', billing?.grandTotal ?? data.nominal)}</span>} />
          <DetailItem label="Total Dibayar" value={<span className="text-emerald-700">{currenciesFormat('idr', billing?.totalPaid ?? data.paidNominal)}</span>} />
          <DetailItem label="Sisa Tagihan" value={<span className="text-rose-700">{currenciesFormat('idr', billing?.remainingPayment ?? data.billingRemainingNominal)}</span>} />
          <DetailItem label="Pembayaran Cash" value={currenciesFormat('idr', billing?.totalCashPayment ?? 0)} />
          <DetailItem label="Pembayaran BCA IDR" value={currenciesFormat('idr', billing?.totalBcaCashPayment ?? 0)} />
          <DetailItem label="Pembayaran BCA USD" value={currenciesFormat('usd', billing?.totalUsdPayment ?? 0)} />
          <DetailItem label="Jumlah Pembayaran" value={`${billing?.totalPaymentCount ?? 0} transaksi`} />
          <DetailItem label="Pembayaran Terakhir" value={formatKasBonDate(billing?.lastPaymentAt)} />
        </div>
      </SectionCard>
    </div>
  );
}
