import { Card, CardContent } from '@/components/ui/card';

import { FileText, DollarSign, CreditCard, Calendar, User, Motorbike } from 'lucide-react';
import { SalesItem } from '../sales.data';
import { useRouter } from 'next/router';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { getHistoryTotalIdrEquivalent, getHistoryUsdAmount, getHistoryBcaIdrAmount, getHistoryCashIdrAmount } from '@/utils/payment-helpers';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { TypeUnit } from '@/@types/type-unit.types';

interface Props {
  data: SalesItem;
  billingHistories?: any[];
  unitType?: TypeUnit;
}

export function SalesDetailCards({ data, billingHistories = [], unitType }: Props) {
  const router = useRouter();
  const totalDppFromItems = (data.lineItems ?? []).reduce((sum, item) => sum + Number(item.dpp ?? 0), 0);
  const totalPpnFromItems = (data.lineItems ?? []).reduce((sum, item) => sum + Number(item.ppn ?? 0), 0);
  const totalDpp = totalDppFromItems > 0 ? totalDppFromItems : Number(data.totalDpp ?? 0);
  const totalPpn = totalPpnFromItems > 0 ? totalPpnFromItems : Number(data.totalPpn ?? 0);
  const totalHpp = Number(data.totalHpp ?? 0) || (totalDpp + totalPpn);
  const totalBiaya = Number(data.totalBiaya ?? 0);
  const totalJual = Number(data.totalJual ?? 0);

  const slugQuery = router.query.slug;
  const slug = Array.isArray(slugQuery) ? slugQuery[0] : slugQuery || '';

  const billingSummary = data.billing_summary;

  const historyPaid = billingHistories.reduce((sum, item) => sum + getHistoryTotalIdrEquivalent(item), 0);
  const debetBankUsd = billingSummary?.total_paid_usd !== undefined
    ? Number(billingSummary.total_paid_usd)
    : (billingSummary?.total_usd_payment !== undefined
      ? Number(billingSummary.total_usd_payment)
      : billingHistories.reduce((sum, item) => sum + getHistoryUsdAmount(item), 0));

  const debetBankIdr = billingSummary?.total_bca_payment !== undefined
    ? Number(billingSummary.total_bca_payment)
    : billingHistories.reduce((sum, item) => sum + getHistoryBcaIdrAmount(item), 0);

  const debetCashIdr = billingSummary?.total_cash_payment !== undefined
    ? Number(billingSummary.total_cash_payment)
    : billingHistories.reduce((sum, item) => sum + getHistoryCashIdrAmount(item), 0);

  const kurangBayarIdr = billingSummary?.remaining_payment !== undefined
    ? Number(billingSummary.remaining_payment)
    : Math.max(0, totalJual - historyPaid);

  const totalUsd = Number(data.unit_transaction_price_usd_total_actual && Number(data.unit_transaction_price_usd_total_actual) > 0
    ? data.unit_transaction_price_usd_total_actual
    : (data.unit_transaction_price_usd_total ?? data.price_usd ?? 0));

  const kurangBayarUsd = billingSummary?.remaining_payment_usd !== undefined
    ? Number(billingSummary.remaining_payment_usd)
    : Math.max(0, totalUsd - debetBankUsd);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Card 1: Informasi Penjualan */}
      <Card className="rounded-md border border-slate-200 shadow-sm h-full">
        <CardContent className="p-5 flex flex-col h-full gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-md">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Informasi Penjualan</h3>
          </div>

          <div className="space-y-3 text-xs text-slate-500">
            <div className="space-y-1">
              <p>Nomor Invoice</p>
              <p className="text-sm font-semibold text-slate-900">
                <CopyBox text={data.kodeJual} />
              </p>
            </div>

            <div className="space-y-1">
              <p>Tanggal</p>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span>{data.tanggal}</span>
              </div>
            </div>

            <div className="space-y-1">
              <p>Customer</p>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <User className="h-4 w-4 text-slate-500" />
                <ReferenceLink href={`/dashboard/${slug}/master/customer?search=${data.customer}`}>
                  {data.customer}
                </ReferenceLink>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Detail Penjualan */}
      <Card className="rounded-md border border-slate-200 shadow-sm h-full">
        <CardContent className="p-5 flex flex-col h-full gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-md">
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Detail Penjualan</h3>
          </div>

          <div className="space-y-3 text-xs text-slate-500">
            <div className="flex items-center justify-between">
              <span>Total DPP</span>
              <span className="text-sm font-semibold text-slate-900">{currenciesFormat('idr', totalDpp)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total PPN</span>
              <span className="text-sm font-semibold text-slate-900">{currenciesFormat('idr', totalPpn)}</span>
            </div>
            <div className="border-t border-slate-100 my-1"></div>
            <div className="flex items-center justify-between text-slate-900">
              <span className="font-bold text-sm">Total HPP</span>
              <span className="text-sm font-bold">{currenciesFormat('idr', totalHpp)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total Biaya</span>
              <span className="text-sm font-semibold text-slate-900">{currenciesFormat('idr', totalBiaya)}</span>
            </div>
            <div className="border-t border-slate-100 my-1"></div>
            <div className="flex items-center justify-between text-slate-900">
              <span className="font-bold uppercase text-sm">TOTAL PENJUALAN</span>
              <span className="text-sm font-bold">{currenciesFormat('idr', totalJual)}</span>
            </div>
            {totalUsd > 0 && (
              <>
                <div className="border-t border-slate-100 my-1"></div>
                <div className="flex items-center justify-between text-slate-900">
                  <span className="font-bold uppercase text-sm">TOTAL HARGA (USD)</span>
                  <span className="text-sm font-bold text-amber-600">{currenciesFormat('usd', totalUsd)}</span>
                </div>
              </>
            )}
            {data.price_per_unit_usd ? (
              <div className="flex items-center justify-between text-xs text-amber-800 bg-amber-50/50 px-2 py-1 rounded border border-amber-100">
                <span className="font-medium">Harga Satuan (USD)</span>
                <span className="font-bold">{currenciesFormat('usd', data.price_per_unit_usd)}</span>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Riwayat Pembayaran */}
      <Card className="rounded-md border border-slate-200 shadow-sm h-full">
        <CardContent className="p-5 flex flex-col h-full gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-purple-50">
              <CreditCard className="h-5 w-5 text-purple-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Riwayat Pembayaran</h3>
          </div>

          <div className="space-y-3 text-xs text-slate-500 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <span>Debet Bank USD</span>
              <span className="text-sm font-semibold text-slate-900">{currenciesFormat('usd', debetBankUsd)}</span>
            </div>
            {(totalUsd > 0 || (billingSummary?.remaining_payment_usd !== undefined && Number(billingSummary.remaining_payment_usd) > 0) || debetBankUsd > 0) && (
              <div className="flex items-center justify-between text-amber-800 bg-amber-50/50 px-2 py-1 rounded border border-amber-200/60 font-medium">
                <span>Kurang Bayar USD</span>
                <span className="font-semibold">{currenciesFormat('usd', kurangBayarUsd)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span>Debet Bank IDR</span>
              <span className="text-sm font-semibold text-slate-900">{currenciesFormat('idr', debetBankIdr)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Debet Cash IDR</span>
              <span className="text-sm font-semibold text-slate-900">{currenciesFormat('idr', debetCashIdr)}</span>
            </div>
            <div className="flex items-center justify-between text-rose-800 bg-rose-50/50 px-2 py-1 rounded border border-rose-200/60 font-medium">
              <span>Kurang Bayar IDR</span>
              <span className="font-semibold">{currenciesFormat('idr', kurangBayarIdr)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
