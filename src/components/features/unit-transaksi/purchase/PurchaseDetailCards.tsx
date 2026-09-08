import { Card, CardContent } from '@/components/ui/card';

import { UnitTransactionDetail } from '@/@types/unit-transaction.types';
import { Calendar, User, FileText, DollarSign, CreditCard } from 'lucide-react';
import { getHistoryTotalIdrEquivalent, getHistoryUsdAmount, getHistoryBcaIdrAmount, getHistoryCashIdrAmount } from '@/utils/payment-helpers';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { CopyBox } from '@/components/ui/copy-box';
import { useRouter } from 'next/router';
import { ReferenceLink } from '@/components/ui/reference-link';

interface Props {
  data: UnitTransactionDetail;
  billingHistories?: any[];
}

export function PurchaseDetailCards({ data, billingHistories = [] }: Props) {
  const totalDpp = Number(data.unit_transaction_item_total_dpp ?? 0);
  const totalPpn = Number(data.unit_transaction_item_total_ppn ?? 0);
  const totalHpp = totalDpp + totalPpn;
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';

  const biayaBbn = Number(data?.transaction_bbn_total ?? 0);
  const biayaEkspedisi = Number(data?.expedition_fee_total ?? 0);
  const biayaLainnya = Number(data?.transaction_other_fee ?? 0);
  const totalBiaya = Number(data?.total_operational_fee ?? 0);

  const totalPembelian = totalHpp + totalBiaya;

  const historyPaid = billingHistories.reduce((sum, item) => sum + getHistoryTotalIdrEquivalent(item), 0);
  const kurangBayar = Math.max(0, totalPembelian - historyPaid);

  const debetBankUsd = billingHistories.reduce((sum, item) => sum + getHistoryUsdAmount(item), 0);
  const debetBankIdr = billingHistories.reduce((sum, item) => sum + getHistoryBcaIdrAmount(item), 0);
  const debetCashIdr = billingHistories.reduce((sum, item) => sum + getHistoryCashIdrAmount(item), 0);

  const totalUsd = Number(data.unit_transaction_price_usd_total_actual && Number(data.unit_transaction_price_usd_total_actual) > 0
    ? data.unit_transaction_price_usd_total_actual
    : (data.unit_transaction_price_usd_total ?? 0));
  const kurangBayarUsd = Math.max(0, totalUsd - debetBankUsd);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Card 1: Informasi Invoice */}
      <Card className="rounded-lg border border-slate-200 shadow-sm h-full">
        <CardContent className="p-5 flex flex-col h-full gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-blue-50">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Informasi Invoice</h3>
          </div>

          <div className="space-y-3 text-xs text-slate-500">
            <div className="space-y-1">
              <p>Nomor Invoice</p>
              <p className="text-sm font-semibold text-slate-900">
                <CopyBox text={data.code} />
              </p>
            </div>
            <div className="space-y-1">
              <p>Tanggal</p>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Calendar className="h-4 w-4 text-slate-500" />
                {data.created_at ? new Date(data.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
              </div>
            </div>
            <div className="space-y-1">
              <p>Supplier</p>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <User className="h-4 w-4 text-slate-500" />
                <span className="uppercase">
                  <ReferenceLink href={`/dashboard/${slug}/master/supplier?search=${data?.person?.name}`}>
                    {data?.person?.name ?? '-'}
                  </ReferenceLink>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Detail Pembelian */}
      <Card className="rounded-lg border border-slate-200 shadow-sm h-full">
        <CardContent className="p-5 flex flex-col h-full gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-emerald-50">
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Detail Pembelian</h3>
          </div>

          <div className="space-y-3 text-xs text-slate-500">
            <div className="flex items-center justify-between">
              <span>Total DPP</span>
              <span className="text-sm font-semibold text-slate-900">{currenciesFormat('idr', (totalDpp))}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total PPN</span>
              <span className="text-sm font-semibold text-slate-900">{currenciesFormat('idr', (totalPpn))}</span>
            </div>
            <div className="border-t border-slate-100 my-1"></div>
            <div className="flex items-center justify-between text-slate-900">
              <span className="font-bold text-sm">Total HPP</span>
              <span className="text-sm font-bold">{currenciesFormat('idr', (totalHpp))}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total Biaya</span>
              <span className="text-sm font-semibold text-slate-900">{currenciesFormat('idr', (totalBiaya))}</span>
            </div>
            <div className="border-t border-slate-100 my-1"></div>
            <div className="flex items-center justify-between text-slate-900">
              <span className="font-bold uppercase text-sm">TOTAL PEMBELIAN</span>
              <span className="text-sm font-bold">{currenciesFormat('idr', (totalPembelian))}</span>
            </div>
            {totalUsd > 0 && (
              <>
                <div className="border-t border-slate-100 my-1"></div>
                <div className="flex items-center justify-between text-slate-900">
                  <span className="font-bold uppercase text-sm">TOTAL USD</span>
                  <span className="text-sm font-bold text-amber-600">{currenciesFormat('usd', totalUsd)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-amber-800 bg-amber-50/50 px-2 py-1 rounded border border-amber-100 mt-2">
                  <span className="font-medium">Total Harga (USD)</span>
                  <span className="font-bold">{currenciesFormat('usd', totalUsd)}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Riwayat Pembayaran */}
      <Card className="rounded-lg border border-slate-200 shadow-sm h-full">
        <CardContent className="p-5 flex flex-col h-full gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-purple-50">
              <CreditCard className="h-5 w-5 text-purple-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Riwayat Pembayaran</h3>
          </div>

          <div className="space-y-3 text-xs text-slate-500">
            <div className="flex items-center justify-between">
              <span>Debet Bank USD</span>
              <span className="text-sm font-semibold text-slate-900">{currenciesFormat('usd', (debetBankUsd))}</span>
            </div>
            {totalUsd > 0 && (
              <div className="flex items-center justify-between text-amber-800 bg-amber-50/30 px-2 py-0.5 rounded border border-amber-100/50">
                <span>Kurang Bayar USD</span>
                <span className="font-semibold">{currenciesFormat('usd', kurangBayarUsd)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span>Debet Bank IDR</span>
              <span className="text-sm font-semibold text-slate-900">{currenciesFormat('idr', (debetBankIdr))}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Debet Cash IDR</span>
              <span className="text-sm font-semibold text-slate-900">{currenciesFormat('idr', (debetCashIdr))}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div >
  );
}
