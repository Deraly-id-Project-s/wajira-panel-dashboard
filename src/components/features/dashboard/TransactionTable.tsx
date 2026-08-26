import { TransactionEntry } from '@/types/dashboard';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMemo, useState } from 'react';
import { formatDate } from '@/lib/utils/format';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import router from 'next/router';
import { currenciesFormat } from '@/components/ui/currenciesFormat';

interface TransactionTableProps {
  data: TransactionEntry[];
  isLoading?: boolean;
}

type FilterMode = 'all' | 'income' | 'expense';

export function TransactionTable({ data, isLoading }: TransactionTableProps) {
  const { slug } = router.query;
  const [filter, setFilter] = useState<FilterMode>('expense');

  const filtered = useMemo(() => {
    if (!data) return [];
    if (filter === 'all') return data;
    return data.filter((item) => item.type === filter);
  }, [data, filter]);

  const columns: ColumnDef<TransactionEntry>[] = useMemo(
    () => [
      {
        header: 'Nota',
        accessorKey: 'note',
        sortable: true,
        alignment: 'left',
        cell: (item) => <CopyBox text={item.note} />
      },
      {
        header: 'Tanggal',
        accessorKey: 'date',
        sortable: true,
        alignment: 'left',
        cell: (item) => <span className="text-slate-700">{formatDate(item.date)}</span>
      },
      {
        header: 'Penjualan',
        accessorKey: 'sale',
        sortable: true,
        alignment: 'left',
        cell: (item) => <span className="text-slate-700">{item.sale}</span>
      },
      {
        header: 'Customer',
        accessorKey: 'customer',
        sortable: true,
        alignment: 'left',
        cell: (item) => <ReferenceLink href={`/dashboard/${slug}/customers?search=${item.customer}`}>{item.customer}</ReferenceLink>
      },
      {
        header: 'Total',
        accessorKey: 'total',
        sortable: true,
        alignment: 'right',
        cell: (item) => currenciesFormat('idr', item.total)
      }
    ],
    [slug]
  );

  return (
    <Card className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-900">
          {filter === 'income' ? 'Detail Pemasukan' : filter === 'expense' ? 'Detail Pengeluaran' : 'Semua Transaksi'}
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">Tampilkan</span>
          <Select value={filter} onValueChange={(val: FilterMode) => setFilter(val)}>
            <SelectTrigger className="w-40 bg-white border-slate-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Pemasukan</SelectItem>
              <SelectItem value="expense">Pengeluaran</SelectItem>
              <SelectItem value="all">Semua</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <BaseTable
        data={filtered}
        columns={columns}
        loading={isLoading}
        showLimitChange={false}
        containerClassName="border-slate-200"
        headerRowClassName="bg-slate-100"
      />
    </Card>
  );
}
