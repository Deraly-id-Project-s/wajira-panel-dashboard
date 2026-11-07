import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, DollarSign, CreditCard, Calendar, User } from 'lucide-react';
import { SalesItem } from '../sales.data';
import { useRouter } from 'next/router';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import {
  getUsdTransactionSummary,
  getIdrTransactionSummary,
  isUnitUsdTransaction,
} from '@/utils/payment-helpers';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { TypeUnit } from '@/@types/type-unit.types';
import { cn } from '@/lib/utils';

interface Props {
  data: SalesItem;
  billingHistories?: any[];
  unitType?: TypeUnit;
  stockQty?: number;
}

export function SalesDetailCards({ data, billingHistories = [], unitType, stockQty }: Props) {
  const router = useRouter();
  const slugQuery = router.query.slug;
  const slug = Array.isArray(slugQuery) ? slugQuery[0] : slugQuery || '';

  const items = data.lineItems ?? [];
  const usdSummary = getUsdTransactionSummary(data, items, billingHistories);
  const idrSummary = getIdrTransactionSummary(data, items, billingHistories);

  const isUsdTransaction = isUnitUsdTransaction(data);

  const activeUnitTypeCode = unitType?.code ?? (data as any)?.unit_type?.code ?? (items.length === 1 ? (items[0] as any)?.unit_type?.code : undefined);
  const activeUnitTypeName = unitType?.name ?? (data as any)?.unit_type?.name ?? (items.length === 1 ? (items[0] as any)?.unit_type?.name : undefined);
  const activeStockQty = stockQty ?? (data as any)?.stockQty ?? (data as any)?.qty_total ?? (items.length === 1 ? items[0]?.qty : undefined);

  const visibleCardsCount = 3;
  const gridColsClass = "lg:grid-cols-3";

  return (
    <div className={cn(
      "grid gap-4 grid-cols-1 sm:grid-cols-2",
      gridColsClass
    )}>
      {/* Card 1: Informasi Invoice */}
      <Card className="rounded-md border border-slate-200 shadow-sm h-full">
        <CardContent className="p-5 flex flex-col h-full gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-md">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Informasi Invoice</h3>
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

      {/* Card 2: Detail Penjualan (IDR) */}
      {!isUsdTransaction && (
        <Card className="rounded-md border border-slate-200 shadow-sm h-full">
          <CardContent className="p-5 flex flex-col h-full gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-md">
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700">Detail Penjualan (IDR)</h3>
            </div>

            <div className="space-y-3 text-xs text-slate-500">
              <div className="flex items-center justify-between">
                <span>Total DPP</span>
                <span className="text-sm font-semibold text-slate-900">{currenciesFormat('idr', idrSummary.totalDpp)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total PPN</span>
                <span className="text-sm font-semibold text-slate-900">{currenciesFormat('idr', idrSummary.totalPpn)}</span>
              </div>
              <div className="border-t border-slate-100 my-1"></div>
              <div className="flex items-center justify-between text-slate-900">
                <span className="font-bold text-sm">Total HPP</span>
                <span className="text-sm font-bold">{currenciesFormat('idr', idrSummary.totalHpp)}</span>
              </div>
              {idrSummary.totalDiscountIdr > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span>Diskon (IDR)</span>
                    {idrSummary.discountIdrPercent !== null && idrSummary.discountIdrPercent > 0 && (
                      <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800 font-semibold text-[10px] px-1.5 py-0">
                        {idrSummary.discountIdrPercent}%
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{currenciesFormat('idr', idrSummary.totalDiscountIdr)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span>Total Biaya</span>
                <span className="text-sm font-semibold text-slate-900">{currenciesFormat('idr', idrSummary.totalBiaya)}</span>
              </div>
              <div className="border-t border-slate-100 my-1"></div>
              <div className="flex items-center justify-between text-slate-900">
                <span className="font-bold uppercase text-sm">TOTAL PENJUALAN</span>
                <span className="text-sm font-bold">{currenciesFormat('idr', idrSummary.brutoTotalIdr)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-900">
                <span className="font-bold uppercase text-sm">TOTAL PENJUALAN SETELAH DISKON</span>
                <span className="text-sm font-bold text-emerald-700">{currenciesFormat('idr', idrSummary.grandTotalIdr)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card 3: Detail Penjualan (USD) */}
      {isUsdTransaction && (
        <Card className="rounded-md border border-slate-200 shadow-sm h-full">
          <CardContent className="p-5 flex flex-col h-full gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-amber-50">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700">Detail Penjualan (USD)</h3>
            </div>

            <div className="space-y-2.5 text-xs text-slate-500">
              {usdSummary.baseUsd > 0 && (
                <div className="flex items-center justify-between">
                  <span>Subtotal Harga Unit (USD)</span>
                  <span className="text-sm font-semibold text-slate-900">{currenciesFormat('usd', usdSummary.baseUsd)}</span>
                </div>
              )}
              {usdSummary.costs.freight > 0 && (
                <div className="flex items-center justify-between">
                  <span>Biaya Freight (Pengiriman)</span>
                  <span className="text-sm font-semibold text-slate-900">{currenciesFormat('usd', usdSummary.costs.freight)}</span>
                </div>
              )}
              {usdSummary.costs.boxPacking > 0 && (
                <div className="flex items-center justify-between">
                  <span>Biaya Box Packing (Peti)</span>
                  <span className="text-sm font-semibold text-slate-900">{currenciesFormat('usd', usdSummary.costs.boxPacking)}</span>
                </div>
              )}
              {usdSummary.costs.admin > 0 && (
                <div className="flex items-center justify-between">
                  <span>Biaya Administrasi</span>
                  <span className="text-sm font-semibold text-slate-900">{currenciesFormat('usd', usdSummary.costs.admin)}</span>
                </div>
              )}
              {usdSummary.costs.ckd > 0 && (
                <div className="flex items-center justify-between">
                  <span>Biaya Pemrosesan CKD</span>
                  <span className="text-sm font-semibold text-slate-900">{currenciesFormat('usd', usdSummary.costs.ckd)}</span>
                </div>
              )}
              {usdSummary.costs.blSwitch > 0 && (
                <div className="flex items-center justify-between">
                  <span>Biaya Switch B/L</span>
                  <span className="text-sm font-semibold text-slate-900">{currenciesFormat('usd', usdSummary.costs.blSwitch)}</span>
                </div>
              )}
              {usdSummary.costs.customs > 0 && (
                <div className="flex items-center justify-between">
                  <span>Biaya Bea Cukai</span>
                  <span className="text-sm font-semibold text-slate-900">{currenciesFormat('usd', usdSummary.costs.customs)}</span>
                </div>
              )}
              {usdSummary.costs.other > 0 && (
                <div className="flex items-center justify-between">
                  <span>Biaya USD Lainnya</span>
                  <span className="text-sm font-semibold text-slate-900">{currenciesFormat('usd', usdSummary.costs.other)}</span>
                </div>
              )}
              {usdSummary.totalUsdCost > 0 && (
                <>
                  <div className="border-t border-slate-100 my-1"></div>
                  <div className="flex items-center justify-between text-slate-900">
                    <span className="font-bold text-sm">Total Biaya Tambahan USD</span>
                    <span className="text-sm font-bold text-amber-700">{currenciesFormat('usd', usdSummary.totalUsdCost)}</span>
                  </div>
                </>
              )}
              {usdSummary.brutoTotalUsd > 0 && (
                <>
                  <div className="border-t border-slate-100 my-1"></div>
                  <div className="flex items-center justify-between text-slate-900">
                    <span className="font-bold text-sm">Total Bruto (Kotor)</span>
                    <span className="text-sm font-bold text-slate-900">{currenciesFormat('usd', usdSummary.brutoTotalUsd)}</span>
                  </div>
                </>
              )}
              {usdSummary.totalDiscountUsd > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span>Diskon (USD)</span>
                    {usdSummary.discountUsdPercent !== null && usdSummary.discountUsdPercent > 0 && (
                      <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800 font-semibold text-[10px] px-1.5 py-0">
                        {usdSummary.discountUsdPercent}%
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{currenciesFormat('usd', usdSummary.totalDiscountUsd)}</span>
                </div>
              )}
              {usdSummary.grandTotalUsd > 0 && (
                <>
                  <div className="border-t border-slate-100 my-1"></div>
                  <div className="flex items-center justify-between text-slate-900 pt-0.5">
                    <span className="font-bold uppercase text-sm">GRAND TOTAL (USD)</span>
                    <span className="text-sm font-bold text-emerald-700">{currenciesFormat('usd', usdSummary.grandTotalUsd)}</span>
                  </div>
                </>
              )}
              {data.price_per_unit_usd ? (
                <div className="flex items-center justify-between text-xs text-amber-800 bg-amber-50/50 px-2 py-1 rounded border border-amber-100 mt-1">
                  <span className="font-medium">Harga Satuan (USD)</span>
                  <span className="font-bold">{currenciesFormat('usd', data.price_per_unit_usd)}</span>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card 4: Riwayat Pembayaran */}
      <Card className="rounded-md border border-slate-200 shadow-sm h-full">
        <CardContent className="p-5 flex flex-col h-full gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-purple-50">
              <CreditCard className="h-5 w-5 text-purple-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Riwayat Pembayaran</h3>
          </div>

          <div className="space-y-3 text-xs text-slate-500 flex-1 flex flex-col">
            {isUsdTransaction ? (
              <>
                <div className="flex items-center justify-between">
                  <span>Debet Bank USD</span>
                  <span className="text-sm font-semibold text-slate-900">{currenciesFormat('usd', usdSummary.totalPaidUsd)}</span>
                </div>
                <div className="flex items-center justify-between text-amber-800 bg-amber-50/50 px-2 py-1 rounded border border-amber-200/60 font-medium">
                  <span>Kurang Bayar USD</span>
                  <span className="font-semibold">{currenciesFormat('usd', usdSummary.remainingPaymentUsd)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span>Debet Bank IDR</span>
                  <span className="text-sm font-semibold text-slate-900">{currenciesFormat('idr', idrSummary.debetBankIdr)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Debet Cash IDR</span>
                  <span className="text-sm font-semibold text-slate-900">{currenciesFormat('idr', idrSummary.debetCashIdr)}</span>
                </div>
                <div className="flex items-center justify-between text-rose-800 bg-rose-50/50 px-2 py-1 rounded border border-rose-200/60 font-medium">
                  <span>Kurang Bayar IDR</span>
                  <span className="font-semibold">{currenciesFormat('idr', idrSummary.remainingPaymentIdr)}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
