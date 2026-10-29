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
}: BillingCostSummaryProps) {
  const isPurchase = type === 'purchase';
  const transactionTypeLabel = isPurchase ? 'Pembelian' : 'Penjualan';

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
              <p className="text-xs font-medium text-slate-600">Kurang Bayar (USD)</p>
              <Input
                value={currenciesFormat('usd', remainingPaymentUsd)}
                disabled
                className={`font-semibold ${remainingPaymentUsd > 0 ? 'text-amber-700 bg-amber-50/50 border-amber-200' : 'text-slate-500 bg-slate-50 border-slate-200'}`}
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
              <p className="text-xs font-medium text-slate-600">Kurang Bayar (IDR)</p>
              <Input
                value={currenciesFormat('idr', remainingPaymentIdr)}
                disabled
                className={`font-semibold ${remainingPaymentIdr > 0 ? 'text-amber-700 bg-amber-50/50 border-amber-200' : 'text-slate-500 bg-slate-50 border-slate-200'}`}
              />
            </div>
          </div>
        )}
      </CollapsibleBox>
    </div>
  );
}
