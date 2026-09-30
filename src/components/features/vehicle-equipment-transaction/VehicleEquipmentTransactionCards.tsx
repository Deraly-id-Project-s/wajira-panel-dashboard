import { CreditCard, Package, ReceiptText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CopyBox } from '@/components/ui/copy-box';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { formatDate } from '@/lib/utils/format';
import type { VehicleEquipmentTransaction } from '@/@types/vehicle-equipment-transaction.types';

interface VehicleEquipmentTransactionCardsProps {
  transaction: VehicleEquipmentTransaction;
  partyLabel: string;
}

export default function VehicleEquipmentTransactionCards({ transaction, partyLabel }: VehicleEquipmentTransactionCardsProps) {
  const equipment = transaction.vehicle_equipment;
  const billing = transaction.goods_transaction_billing;
  const summary = transaction.billing_summary;
  const bruto = transaction.transaction_bruto_total ?? transaction.qty * transaction.price;
  const netto = transaction.transaction_netto_total ?? bruto - bruto * (transaction.discount / 100);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="rounded-md border-slate-200 shadow-sm">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-blue-50 p-2"><ReceiptText className="h-5 w-5 text-blue-600" /></div>
            <h3 className="text-sm font-semibold text-slate-700">Informasi Transaksi</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div><span className="text-xs text-slate-400">Kode</span><p className="font-semibold"><CopyBox text={transaction.code || '-'} /></p></div>
            <div><span className="text-xs text-slate-400">Tanggal</span><p className="font-semibold">{formatDate(transaction.transaction_date)}</p></div>
            <div><span className="text-xs text-slate-400">{partyLabel}</span><p className="font-semibold">{transaction.person?.name || '-'}</p></div>
            <div><span className="text-xs text-slate-400">No Nota</span><p className="font-semibold">{transaction.nota_number || '-'}</p></div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-md border-slate-200 shadow-sm">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-amber-50 p-2"><Package className="h-5 w-5 text-amber-600" /></div>
            <h3 className="text-sm font-semibold text-slate-700">Detail Perlengkapan</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div><span className="text-xs text-slate-400">Kode</span><p className="font-semibold"><CopyBox text={equipment?.code || '-'} /></p></div>
            <div><span className="text-xs text-slate-400">Nama</span><p className="font-semibold">{equipment?.name || '-'}</p></div>
            <div><span className="text-xs text-slate-400">Qty</span><p className="font-semibold">{transaction.qty}</p></div>
            <div><span className="text-xs text-slate-400">Harga</span><p className="font-semibold">{currenciesFormat('idr', transaction.price)}</p></div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-md border-slate-200 shadow-sm">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-emerald-50 p-2"><CreditCard className="h-5 w-5 text-emerald-600" /></div>
            <h3 className="text-sm font-semibold text-slate-700">Ringkasan Billing</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-3"><span className="text-slate-500">Bruto</span><span className="font-semibold">{currenciesFormat('idr', bruto)}</span></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Diskon</span><span className="font-semibold">{transaction.discount}%</span></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Netto</span><span className="font-semibold">{currenciesFormat('idr', netto)}</span></div>
            <div className="flex justify-between gap-3 border-t pt-2"><span className="text-slate-500">Dibayar</span><span className="font-semibold">{currenciesFormat('idr', summary?.total_paid ?? 0)}</span></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Sisa</span><span className="font-semibold">{currenciesFormat('idr', Number(billing?.is_remaining_payment ?? summary?.remaining_payment ?? 0))}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
