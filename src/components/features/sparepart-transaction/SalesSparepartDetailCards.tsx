import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { formatDate } from '@/lib/utils/format';
import type { SparepartTransaction } from '@/@types/sparepart-transaction.types';
import { Calendar, CreditCard, FileText, Package, User, Warehouse } from 'lucide-react';
import { useRouter } from 'next/router';

interface Props {
  transaction: SparepartTransaction;
}

export function SalesSparepartDetailCards({ transaction }: Props) {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';

  const sparepartBilling = transaction.sparepart_transaction_billing;
  const totalTagihan = Number(
    sparepartBilling?.grand_total ??
      transaction.billing_summary?.grand_total ??
      transaction.transaction_netto_total ??
      0
  );
  const totalPaid = Number(transaction.billing_summary?.total_paid ?? 0);
  const remainingPayment = Number(
    sparepartBilling?.is_remaining_payment ??
      transaction.billing_summary?.remaining_payment ??
      0
  );

  const customerName = transaction.person?.name || transaction.customer?.name || '-';
  const sparepartName = transaction.sparepart?.name || '-';
  const sparepartCode = transaction.sparepart?.code;
  const unitType = transaction.sparepart?.unit_type || '';

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Card 1: Informasi Transaksi */}
      <Card className="h-full rounded-md border border-slate-200 shadow-sm">
        <CardContent className="flex h-full flex-col gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-blue-50 p-2">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Informasi Transaksi</h3>
          </div>

          <div className="space-y-3 text-xs text-slate-500">
            <div className="space-y-1">
              <p>Nomor Transaksi</p>
              <div className="text-sm font-semibold text-slate-900">
                <CopyBox text={transaction.code || '-'} />
              </div>
            </div>

            <div className="space-y-1">
              <p>Tanggal Transaksi</p>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Calendar className="h-4 w-4 text-slate-500" />
                {formatDate(transaction.transaction_date || transaction.created_at)}
              </div>
            </div>

            <div className="space-y-1">
              <p>No Nota Referensi</p>
              <p className="text-sm font-semibold text-slate-900">
                {transaction.nota_number || '-'}
              </p>
            </div>

            <div className="space-y-1">
              <p>Customer</p>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <User className="h-4 w-4 shrink-0 text-slate-500" />
                <span className="truncate uppercase">
                  {customerName !== '-' ? (
                    <ReferenceLink
                      href={`/dashboard/${slug}/master/customer?search=${encodeURIComponent(customerName)}`}
                    >
                      {customerName}
                    </ReferenceLink>
                  ) : (
                    '-'
                  )}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p>Gudang Pengeluaran</p>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Warehouse className="h-4 w-4 shrink-0 text-slate-500" />
                <span>{transaction.warehouse?.name || '-'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Detail Penjualan & Sparepart */}
      <Card className="h-full rounded-md border border-slate-200 shadow-sm">
        <CardContent className="flex h-full flex-col gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-emerald-50 p-2">
              <Package className="h-5 w-5 text-emerald-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Detail Penjualan</h3>
          </div>

          <div className="space-y-3 text-xs text-slate-500">
            <div className="space-y-1">
              <p>Sparepart</p>
              <div className="text-sm font-semibold text-slate-900">
                {sparepartName !== '-' ? (
                  <ReferenceLink
                    href={`/dashboard/${slug}/master/sparepart?search=${encodeURIComponent(sparepartName)}`}
                  >
                    {sparepartName} {sparepartCode ? `(${sparepartCode})` : ''}
                  </ReferenceLink>
                ) : (
                  '-'
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span>Kuantitas (Qty)</span>
              <span className="text-sm font-semibold text-slate-900">
                {transaction.qty} {unitType}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Harga Satuan</span>
              <span className="text-sm font-semibold text-slate-900">
                {currenciesFormat('idr', transaction.price)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Diskon</span>
              <span className="text-sm font-semibold text-slate-900">
                {transaction.discount || 0}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Total Bruto</span>
              <span className="text-sm font-semibold text-slate-900">
                {currenciesFormat('idr', transaction.transaction_bruto_total)}
              </span>
            </div>

            <div className="my-1 border-t border-slate-100" />

            <div className="flex items-center justify-between text-slate-900">
              <span className="text-sm font-bold uppercase">TOTAL PENJUALAN</span>
              <span className="text-sm font-bold">
                {currenciesFormat('idr', transaction.transaction_netto_total)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Ringkasan Tagihan & Pembayaran */}
      <Card className="h-full rounded-md border border-slate-200 shadow-sm">
        <CardContent className="flex h-full flex-col gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-purple-50 p-2">
              <CreditCard className="h-5 w-5 text-purple-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Ringkasan Pembayaran</h3>
          </div>

          <div className="space-y-3 text-xs text-slate-500">
            <div className="flex items-center justify-between">
              <span>Total Tagihan</span>
              <span className="text-sm font-semibold text-slate-900">
                {currenciesFormat('idr', totalTagihan)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Total Dibayar</span>
              <span className="text-sm font-semibold text-emerald-600">
                {currenciesFormat('idr', totalPaid)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Sisa Pembayaran</span>
              <span className="text-sm font-semibold text-rose-600">
                {currenciesFormat('idr', remainingPayment)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Tipe Pembayaran</span>
              <Badge variant="outline" className="text-xs font-semibold capitalize">
                {transaction.billing_type || 'Cash'}
              </Badge>
            </div>

            {transaction.note && (
              <div className="space-y-1 pt-1">
                <p>Catatan</p>
                <p className="text-sm font-medium text-slate-700 break-words">
                  {transaction.note}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
