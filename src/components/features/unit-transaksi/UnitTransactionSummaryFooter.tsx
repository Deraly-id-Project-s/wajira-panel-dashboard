import { TableRow, TableCell } from '@/components/ui/table';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { FilteredCurrency } from '@/components/ui/filtered-currency';

export interface SummaryItem {
  id?: string | number;
  qty_total?: number;
  qty?: number;
  price?: number;
  hargaJual?: number;
  price_usd?: number;
  price_per_unit_usd?: number;
  bbn_price?: number;
  biayaBbn?: number;
  expedition_fee?: number;
  biayaEkspedisi?: number;
  other_fee?: number;
  biayaLain?: number;
  dpp_total_price?: number;
  dpp?: number;
  ppn_total_price?: number;
  ppn?: number;
  price_total?: number;
  jumlah?: number;
}

interface UnitTransactionSummaryFooterProps {
  items: SummaryItem[];
  showCheckbox?: boolean;
  hasActions?: boolean;
  label?: string;
}

export function UnitTransactionSummaryFooter({
  items,
  showCheckbox = false,
  hasActions = true,
  label = 'Total',
}: UnitTransactionSummaryFooterProps) {
  if (!items || items.length === 0) return null;

  const totalQty = items.reduce(
    (sum, item) => sum + Number(item.qty_total ?? item.qty ?? 0),
    0,
  );

  const totalPriceIdr = items.reduce(
    (sum, item) =>
      sum +
      Number(item.price ?? item.hargaJual ?? 0) *
        Number(item.qty_total ?? item.qty ?? 1),
    0,
  );

  const totalPriceUsd = items.reduce((sum, item) => {
    const usd =
      Number(item.price_usd ?? 0) > 0
        ? Number(item.price_usd)
        : Number(item.price_per_unit_usd ?? 0) *
          Number(item.qty_total ?? item.qty ?? 1);
    return sum + usd;
  }, 0);

  const totalBbn = items.reduce(
    (sum, item) => sum + Number(item.bbn_price ?? item.biayaBbn ?? 0),
    0,
  );

  const totalExpedition = items.reduce(
    (sum, item) => sum + Number(item.expedition_fee ?? item.biayaEkspedisi ?? 0),
    0,
  );

  const totalOther = items.reduce(
    (sum, item) => sum + Number(item.other_fee ?? item.biayaLain ?? 0),
    0,
  );

  const totalDpp = items.reduce(
    (sum, item) => sum + Number(item.dpp_total_price ?? item.dpp ?? 0),
    0,
  );

  const totalPpn = items.reduce(
    (sum, item) => sum + Number(item.ppn_total_price ?? item.ppn ?? 0),
    0,
  );

  const totalSubTotalIdr = items.reduce((sum, item) => {
    const idrSubtotal = Number(
      item.price_total ??
        item.jumlah ??
        (Number(item.dpp_total_price ?? item.dpp ?? 0) +
          Number(item.ppn_total_price ?? item.ppn ?? 0) +
          Number(item.bbn_price ?? item.biayaBbn ?? 0) +
          Number(item.expedition_fee ?? item.biayaEkspedisi ?? 0) +
          Number(item.other_fee ?? item.biayaLain ?? 0)),
    );
    return sum + idrSubtotal;
  }, 0);

  const totalSubTotalUsd = items.reduce((sum, item) => {
    const usdSubtotal =
      Number(item.price_usd ?? 0) > 0
        ? Number(item.price_usd)
        : Number(item.price_per_unit_usd ?? 0) *
          Number(item.qty_total ?? item.qty ?? 1);
    return sum + usdSubtotal;
  }, 0);

  return (
    <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-semibold text-slate-900">
      <TableRow className="hover:bg-slate-50 border-none">
        {showCheckbox && (
          <TableCell className="sticky left-0 z-10 w-[44px] min-w-[44px] max-w-[44px] border-r border-slate-200 bg-slate-50 shadow-[4px_0_6px_-4px_rgba(0,0,0,0.05)] px-3 py-3 text-center sm:w-[50px] sm:min-w-[50px] sm:max-w-[50px] sm:px-4 sm:py-3.5" />
        )}
        <TableCell className="px-2.5 py-3 text-left font-bold text-slate-900 sm:px-4 sm:py-3.5">
          {label}
        </TableCell>
        <TableCell className="w-[100px] px-2.5 py-3 text-center font-bold text-slate-900 sm:px-4 sm:py-3.5">
          {totalQty} Unit
        </TableCell>
        <TableCell className="px-2.5 py-3 text-center font-bold text-slate-900 sm:px-4 sm:py-3.5">
          <FilteredCurrency idr={totalPriceIdr} usd={totalPriceUsd} />
        </TableCell>
        <TableCell className="px-2.5 py-3 text-center font-bold text-slate-900 sm:px-4 sm:py-3.5">
          {currenciesFormat('idr', totalBbn)}
        </TableCell>
        <TableCell className="px-2.5 py-3 text-center font-bold text-slate-900 sm:px-4 sm:py-3.5">
          {currenciesFormat('idr', totalExpedition)}
        </TableCell>
        <TableCell className="px-2.5 py-3 text-center font-bold text-slate-900 sm:px-4 sm:py-3.5">
          {currenciesFormat('idr', totalOther)}
        </TableCell>
        <TableCell className="px-2.5 py-3 text-center font-bold text-slate-900 sm:px-4 sm:py-3.5">
          {currenciesFormat('idr', totalDpp)}
        </TableCell>
        <TableCell className="px-2.5 py-3 text-center font-bold text-slate-900 sm:px-4 sm:py-3.5">
          {currenciesFormat('idr', totalPpn)}
        </TableCell>
        <TableCell className="px-2.5 py-3 text-center font-bold text-slate-900 sm:px-4 sm:py-3.5">
          <FilteredCurrency idr={totalSubTotalIdr} usd={totalSubTotalUsd} />
        </TableCell>
        {hasActions && (
          <TableCell className="sticky right-0 z-10 w-[80px] min-w-[80px] max-w-[80px] border-l border-slate-200 bg-slate-50 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)] px-2.5 py-3 sm:px-4 sm:py-3.5" />
        )}
      </TableRow>
    </tfoot>
  );
}

export default UnitTransactionSummaryFooter;
