import * as React from 'react';
import type { DriverCashAdvanceBillingHistory } from '@/@types/driver-cash-advance.types';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { formatKasBonDate } from './kas-bon.utils';

const cashAmount = (history: DriverCashAdvanceBillingHistory, code: string) =>
  history.cashes.find((cash) => cash.code === code)?.pivot.amount ?? 0;

export function KasBonPaymentHistoryTable({ histories }: { histories: DriverCashAdvanceBillingHistory[] }) {
  const columns = React.useMemo<ColumnDef<DriverCashAdvanceBillingHistory>[]>(() => [
    { header: 'Tanggal', cell: (item) => formatKasBonDate(item.paymentAt) },
    { header: 'BCA USD', alignment: 'right', cell: (item) => currenciesFormat('usd', cashAmount(item, 'bca_usd')) },
    { header: 'BCA IDR', alignment: 'right', cell: (item) => currenciesFormat('idr', cashAmount(item, 'bca_idr')) },
    { header: 'Cash IDR', alignment: 'right', cell: (item) => currenciesFormat('idr', cashAmount(item, 'cash_idr')) },
    { header: 'Catatan', cell: (item) => item.note || '-' },
  ], []);

  return <BaseTable data={histories} columns={columns} />;
}
