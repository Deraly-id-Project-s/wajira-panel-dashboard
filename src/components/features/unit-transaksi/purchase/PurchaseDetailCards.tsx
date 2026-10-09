import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UnitTransactionDetail, UnitTransactionItem } from '@/@types/unit-transaction.types';
import { Calendar, User, FileText, DollarSign, CreditCard } from 'lucide-react';
import { getHistoryTotalIdrEquivalent, getHistoryUsdAmount, getHistoryBcaIdrAmount, getHistoryCashIdrAmount } from '@/utils/payment-helpers';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { CopyBox } from '@/components/ui/copy-box';
import { useRouter } from 'next/router';
import { ReferenceLink } from '@/components/ui/reference-link';

interface Props {
  data: UnitTransactionDetail;
  billingHistories?: any[];
  unitItems?: UnitTransactionItem[];
  unitItem?: UnitTransactionItem | any;
  unitType?: { code?: string; name?: string; [key: string]: any } | null;
  stockQty?: number;
}

export function PurchaseDetailCards({ data, billingHistories = [], unitItems, unitItem, unitType, stockQty }: Props) {
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
    : Math.max(0, totalPembelian - historyPaid);

  const totalUsd = Number(data.unit_transaction_price_usd_total_actual && Number(data.unit_transaction_price_usd_total_actual) > 0
    ? data.unit_transaction_price_usd_total_actual
    : (data.unit_transaction_price_usd_total ?? 0));

  const kurangBayarUsd = billingSummary?.remaining_payment_usd !== undefined
    ? Number(billingSummary.remaining_payment_usd)
    : Math.max(0, totalUsd - debetBankUsd);

  const freightCost = Number(data.usd_cost_freight_total ?? 0);
  const boxPackingCost = Number(data.usd_cost_box_packing_total ?? 0);
  const adminCost = Number(data.usd_cost_admin_cost_total ?? 0);
  const ckdCost = Number(data.usd_cost_ckd_processing_cost_total ?? 0);
  const blSwitchCost = Number(data.usd_cost_bill_of_lading_switch_cost_total ?? 0);
  const customsCost = Number(data.usd_cost_customs_clearance_cost_total ?? 0);
  const otherCost = Number(data.usd_cost_other_total ?? 0);
  const totalUsdCost = Number(data.total_usd_cost ?? data.transaction_usd_cost_total ?? (freightCost + boxPackingCost + adminCost + ckdCost + blSwitchCost + customsCost + otherCost));

  const items: any[] = (unitItems && unitItems.length > 0)
    ? unitItems
    : (unitItem ? [unitItem] : (data.unit_transaction_items ?? []));

  const totalDiscountIdr = items.reduce((sum, item) => {
    const itemPrice = Number(item.price ?? 0);
    const itemQty = Number(item.qty_total ?? item.max_capacity ?? 1);
    const discountPercent = Number(item.price_discount ?? (data as any).price_discount ?? 0);
    return sum + (itemPrice * (discountPercent / 100) * itemQty);
  }, 0);

  const discountIdrPercentages = Array.from(new Set(items.map((i) => Number(i.price_discount ?? 0)).filter((p) => p > 0)));
  const fallbackSingleIdrDiscount = Number((data as any).price_discount ?? 0);
  const resolvedDiscountIdrPercent = discountIdrPercentages.length === 1
    ? discountIdrPercentages[0]
    : (discountIdrPercentages.length === 0 ? (fallbackSingleIdrDiscount > 0 ? fallbackSingleIdrDiscount : 0) : null);

  const totalDiscountUsd = items.reduce((sum, item) => {
    const itemPriceUsd = Number(item.price_usd && Number(item.price_usd) > 0
      ? item.price_usd
      : (Number(item.price_per_unit_usd ?? 0) * Number(item.qty_total ?? item.max_capacity ?? 1)));
    const discountUsdPercent = Number(item.price_discount_usd ?? item.price_usd_discount ?? (data as any).price_discount_usd ?? (data as any).price_usd_discount ?? 0);
    return sum + (itemPriceUsd * (discountUsdPercent / 100));
  }, 0);

  const discountUsdPercentages = Array.from(new Set(items.map((i) => Number(i.price_discount_usd ?? i.price_usd_discount ?? 0)).filter((p) => p > 0)));
  const fallbackSingleUsdDiscount = Number((data as any).price_discount_usd ?? (data as any).price_usd_discount ?? 0);
  const resolvedDiscountUsdPercent = discountUsdPercentages.length === 1
    ? discountUsdPercentages[0]
    : (discountUsdPercentages.length === 0 ? (fallbackSingleUsdDiscount > 0 ? fallbackSingleUsdDiscount : 0) : null);

  const activeUnitType = unitType ?? unitItem?.unit_type ?? (items.length === 1 ? items[0]?.unit_type : undefined);
  const activeUnitTypeCode = activeUnitType?.code ?? unitItem?.unit_type_code ?? (items.length === 1 ? items[0]?.unit_type_code : undefined);
  const activeUnitTypeName = activeUnitType?.name ?? unitItem?.unit_type_name ?? (items.length === 1 ? items[0]?.unit_type_name : undefined);
  const activeStockQty = stockQty ?? unitItem?.qty_total ?? (items.length === 1 ? items[0]?.qty_total : undefined);

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Informasi Invoice */}
      <Card className="rounded-md border border-slate-200 shadow-sm h-full">
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
            {activeUnitTypeCode && (
              <div className="space-y-1">
                <p>Kode Unit Tipe</p>
                <p className="text-sm font-semibold text-slate-900">
                  <CopyBox text={activeUnitTypeCode} />
                </p>
              </div>
            )}
            {activeUnitTypeName && (
              <div className="space-y-1">
                <p>Nama Unit Tipe</p>
                <p className="text-sm font-semibold text-slate-900">
                  {activeUnitTypeName}
                </p>
              </div>
            )}
            {activeStockQty !== undefined && activeStockQty !== null && (
              <div className="space-y-1">
                <p>Jumlah Stok</p>
                <p className="text-sm font-semibold text-slate-900">
                  {activeStockQty} Unit
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Detail Pembelian (IDR) */}
      <Card className="rounded-md border border-slate-200 shadow-sm h-full">
        <CardContent className="p-5 flex flex-col h-full gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-emerald-50">
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Detail Pembelian (IDR)</h3>
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
              <div className="flex items-center gap-1.5">
                <span>Diskon (IDR)</span>
                {resolvedDiscountIdrPercent !== null && resolvedDiscountIdrPercent > 0 && (
                  <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800 font-semibold text-[10px] px-1.5 py-0">
                    {resolvedDiscountIdrPercent}%
                  </Badge>
                )}
              </div>
              <span className="text-sm font-semibold text-slate-900">{currenciesFormat('idr', totalDiscountIdr)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total Biaya</span>
              <span className="text-sm font-semibold text-slate-900">{currenciesFormat('idr', totalBiaya)}</span>
            </div>
            <div className="border-t border-slate-100 my-1"></div>
            <div className="flex items-center justify-between text-slate-900">
              <span className="font-bold uppercase text-sm">TOTAL PEMBELIAN</span>
              <span className="text-sm font-bold">{currenciesFormat('idr', totalPembelian)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Detail Pembelian (USD) */}
      <Card className="rounded-md border border-slate-200 shadow-sm h-full">
        <CardContent className="p-5 flex flex-col h-full gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-amber-50">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Detail Pembelian (USD)</h3>
          </div>

          <div className="space-y-2.5 text-xs text-slate-500">
            <div className="flex items-center justify-between">
              <span>Biaya Freight (Pengiriman)</span>
              <span className="text-sm font-semibold text-slate-900">{currenciesFormat('usd', freightCost)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Biaya Box Packing (Peti)</span>
              <span className="text-sm font-semibold text-slate-900">{currenciesFormat('usd', boxPackingCost)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Biaya Administrasi</span>
              <span className="text-sm font-semibold text-slate-900">{currenciesFormat('usd', adminCost)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Biaya Pemrosesan CKD</span>
              <span className="text-sm font-semibold text-slate-900">{currenciesFormat('usd', ckdCost)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Biaya Switch B/L</span>
              <span className="text-sm font-semibold text-slate-900">{currenciesFormat('usd', blSwitchCost)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Biaya Bea Cukai</span>
              <span className="text-sm font-semibold text-slate-900">{currenciesFormat('usd', customsCost)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Biaya USD Lainnya</span>
              <span className="text-sm font-semibold text-slate-900">{currenciesFormat('usd', otherCost)}</span>
            </div>
            <div className="border-t border-slate-100 my-1"></div>
            <div className="flex items-center justify-between text-slate-900">
              <span className="font-bold text-sm">Total Biaya USD</span>
              <span className="text-sm font-bold text-amber-700">{currenciesFormat('usd', totalUsdCost)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span>Diskon (USD)</span>
                {resolvedDiscountUsdPercent !== null && resolvedDiscountUsdPercent > 0 && (
                  <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800 font-semibold text-[10px] px-1.5 py-0">
                    {resolvedDiscountUsdPercent}%
                  </Badge>
                )}
              </div>
              <span className="text-sm font-semibold text-slate-900">{currenciesFormat('usd', totalDiscountUsd)}</span>
            </div>
            {totalUsd > 0 && (
              <div className="flex items-center justify-between text-slate-900 pt-1">
                <span className="font-bold uppercase text-sm">TOTAL PEMBELIAN (USD)</span>
                <span className="text-sm font-bold text-amber-600">{currenciesFormat('usd', totalUsd)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Riwayat Pembayaran */}
      <Card className="rounded-md border border-slate-200 shadow-sm h-full">
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
