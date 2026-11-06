import { CollapsibleBox } from '@/components/ui/collapsible-box';
import { Input } from '@/components/ui/input';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock } from 'lucide-react';

export interface BillingCostSummaryProps {
  type: 'purchase' | 'sales';
  isUsd: boolean;
  isPaid: boolean;
  totalTagihanUsd: number;
  totalPaidUsd: number;
  remainingPaymentUsd: number;
  totalTagihanIdr: number;
  totalPaidIdr: number;
  remainingPaymentIdr: number;
  totalDpp?: number;
  totalPpn?: number;
  brutoTotalUsd?: number;
  totalDiscountUsd?: number;
  discountUsdPercent?: number | null;
  brutoTotalIdr?: number;
  totalDiscountIdr?: number;
  discountIdrPercent?: number | null;
}

export function BillingCostSummary({
  type,
  isUsd,
  isPaid,
  totalTagihanUsd,
  totalPaidUsd,
  remainingPaymentUsd,
  totalTagihanIdr,
  totalPaidIdr,
  remainingPaymentIdr,
  totalDpp = 0,
  totalPpn = 0,
  brutoTotalUsd = 0,
  totalDiscountUsd = 0,
  discountUsdPercent = null,
  brutoTotalIdr = 0,
  totalDiscountIdr = 0,
  discountIdrPercent = null,
}: BillingCostSummaryProps) {
  const isPurchase = type === 'purchase';
  const transactionTypeLabel = isPurchase ? 'Pembelian' : 'Penjualan';

  const hasDiscountUsd = totalDiscountUsd > 0;
  const resolvedBrutoUsd = brutoTotalUsd > 0 ? brutoTotalUsd : (hasDiscountUsd ? totalTagihanUsd + totalDiscountUsd : totalTagihanUsd);

  const hasDiscountIdr = totalDiscountIdr > 0;
  const resolvedBrutoIdr = brutoTotalIdr > 0 ? brutoTotalIdr : (hasDiscountIdr ? totalTagihanIdr + totalDiscountIdr : totalTagihanIdr);

  return (
    <div className="space-y-6">
      {/* ── Section: Biaya Tagihan ── */}
      <CollapsibleBox
        title="Biaya Transaksi"
        description="Ringkasan nilai transaksi dan komponen biaya"
        defaultExpanded={true}
        actions={
          <div className="flex items-center gap-2">
            {isUsd && (
              <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 text-xs font-semibold">
                Transaksi USD
              </Badge>
            )}
            {isPaid ? (
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs gap-1 font-semibold">
                <CheckCircle2 className="h-3 w-3" />
                Lunas
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 text-xs gap-1 font-semibold">
                <Clock className="h-3 w-3" />
                Belum Lunas
              </Badge>
            )}
          </div>
        }
      >
        {isUsd ? (
          hasDiscountUsd || resolvedBrutoUsd > totalTagihanUsd ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-600">Total Bruto (USD)</p>
                <Input
                  value={currenciesFormat('usd', resolvedBrutoUsd)}
                  disabled
                  className="font-semibold text-slate-900 bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-slate-600">Total Diskon (USD)</p>
                  {discountUsdPercent !== null && discountUsdPercent > 0 && (
                    <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800 font-semibold text-[10px] px-1.5 py-0">
                      {discountUsdPercent}%
                    </Badge>
                  )}
                </div>
                <Input
                  value={currenciesFormat('usd', totalDiscountUsd)}
                  disabled
                  className="font-medium text-slate-900 bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-600">Grand Total (USD)</p>
                <Input
                  value={currenciesFormat('usd', totalTagihanUsd)}
                  disabled
                  className="font-bold text-emerald-700 bg-emerald-50/40 border-emerald-200"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-600">Total Terbayar (USD)</p>
                <Input
                  value={currenciesFormat('usd', totalPaidUsd)}
                  disabled
                  className="font-medium text-slate-900 bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-600">Sisa Tagihan (USD)</p>
                <Input
                  value={currenciesFormat('usd', remainingPaymentUsd)}
                  disabled
                  className={`font-semibold ${remainingPaymentUsd > 0 ? 'text-amber-700 bg-amber-50/50 border-amber-200' : 'text-slate-500 bg-slate-50 border-slate-200'}`}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-600">Total {transactionTypeLabel} (USD)</p>
                <Input
                  value={currenciesFormat('usd', totalTagihanUsd)}
                  disabled
                  className="font-semibold text-slate-900 bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-600">Total Terbayar (USD)</p>
                <Input
                  value={currenciesFormat('usd', totalPaidUsd)}
                  disabled
                  className="font-medium text-emerald-700 bg-emerald-50/50 border-emerald-200"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-600">Sisa Tagihan (USD)</p>
                <Input
                  value={currenciesFormat('usd', remainingPaymentUsd)}
                  disabled
                  className={`font-semibold ${remainingPaymentUsd > 0 ? 'text-amber-700 bg-amber-50/50 border-amber-200' : 'text-slate-500 bg-slate-50 border-slate-200'}`}
                />
              </div>
            </div>
          )
        ) : (
          hasDiscountIdr ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-600">Total {isPurchase ? 'Beli' : 'Jual'} (DPP)</p>
                <Input value={currenciesFormat('idr', totalDpp)} disabled className="bg-slate-50 border-slate-200" />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-600">Total PPN</p>
                <Input value={currenciesFormat('idr', totalPpn)} disabled className="bg-slate-50 border-slate-200" />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-600">Total Bruto (IDR)</p>
                <Input
                  value={currenciesFormat('idr', resolvedBrutoIdr)}
                  disabled
                  className="font-semibold text-slate-900 bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-slate-600">Total Diskon (IDR)</p>
                  {discountIdrPercent !== null && discountIdrPercent > 0 && (
                    <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800 font-semibold text-[10px] px-1.5 py-0">
                      {discountIdrPercent}%
                    </Badge>
                  )}
                </div>
                <Input
                  value={currenciesFormat('idr', totalDiscountIdr)}
                  disabled
                  className="font-medium text-slate-900 bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-600">Grand Total (IDR)</p>
                <Input
                  value={currenciesFormat('idr', totalTagihanIdr)}
                  disabled
                  className="font-bold text-emerald-700 bg-emerald-50/40 border-emerald-200"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-600">Total Terbayar (IDR)</p>
                <Input
                  value={currenciesFormat('idr', totalPaidIdr)}
                  disabled
                  className="font-medium text-slate-900 bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-600">Sisa Tagihan (IDR)</p>
                <Input
                  value={currenciesFormat('idr', remainingPaymentIdr)}
                  disabled
                  className={`font-semibold ${remainingPaymentIdr > 0 ? 'text-amber-700 bg-amber-50/50 border-amber-200' : 'text-slate-500 bg-slate-50 border-slate-200'}`}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-600">Total {isPurchase ? 'Beli' : 'Jual'} (DPP)</p>
                <Input value={currenciesFormat('idr', totalDpp)} disabled className="bg-slate-50 border-slate-200" />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-600">Total PPN</p>
                <Input value={currenciesFormat('idr', totalPpn)} disabled className="bg-slate-50 border-slate-200" />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-600">Total Biaya (Grand Total)</p>
                <Input
                  value={currenciesFormat('idr', totalTagihanIdr)}
                  disabled
                  className="font-semibold text-slate-900 bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-600">Total Terbayar (IDR)</p>
                <Input
                  value={currenciesFormat('idr', totalPaidIdr)}
                  disabled
                  className="font-medium text-emerald-700 bg-emerald-50/50 border-emerald-200"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-600">Sisa Tagihan (IDR)</p>
                <Input
                  value={currenciesFormat('idr', remainingPaymentIdr)}
                  disabled
                  className={`font-semibold ${remainingPaymentIdr > 0 ? 'text-amber-700 bg-amber-50/50 border-amber-200' : 'text-slate-500 bg-slate-50 border-slate-200'}`}
                />
              </div>
            </div>
          )
        )}
      </CollapsibleBox>
    </div>
  );
}
