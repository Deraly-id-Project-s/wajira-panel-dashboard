import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FinanceSeriesPoint, FinanceSeriesValues } from '@/@types/dashboard';
import { formatCompactNumber } from '@/lib/utils/format';

interface FinanceChartProps {
  data: FinanceSeriesPoint[];
  isLoading?: boolean;
}

type ChartMode = 'income' | 'expense';
type TransactionType = 'sales' | 'purchase';

const SERIES_META = [
  { key: 'bcaUsd', label: 'BCA USD', color: '#B0160D' },
  { key: 'bcaIdr', label: 'BCA IDR', color: '#ECB45B' },
  { key: 'cash', label: 'CASH IDR', color: '#1C3A58' },
] as const;

const MONTH_ORDER = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const monthLabel = (month: string) => month.slice(0, 3);

const tooltipFormatter = (value: number) => new Intl.NumberFormat('id-ID').format(value);

/**
 * Resolve the correct FinanceSeriesValues from a series point.
 *
 * Backward compatible:
 * - If item[mode][transactionType] exists → use nested structure
 * - Otherwise → fallback to flat item[mode] (old data shape)
 */
function resolveSeriesValues(
  item: FinanceSeriesPoint,
  mode: ChartMode,
  transactionType: TransactionType,
): FinanceSeriesValues {
  const modeData = item[mode];
  const nested = modeData[transactionType];
  if (nested) return nested;
  // Fallback: use flat structure (backward compat)
  return {
    bcaUsd: modeData.bcaUsd,
    bcaIdr: modeData.bcaIdr,
    cash: modeData.cash,
  };
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md bg-primary px-3 py-2 text-xs text-white shadow-lg">
      <div className="space-y-1">
        {payload.map((item: any) => (
          <div key={item.name} className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <span className="inline-block h-2 w-2 rounded-md" style={{ backgroundColor: item.color }} />
            <span className="font-medium">{item.name}</span>
            <span className="font-semibold">Rp {tooltipFormatter(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonChart() {
  return (
    <Card className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Grafik</p>
          <p className="text-xs text-slate-500">Memvisualisasikan pemasukan vs pengeluaran</p>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-36 animate-pulse rounded-md bg-slate-100" />
          <div className="h-10 w-36 animate-pulse rounded-md bg-slate-100" />
        </div>
      </div>
      <div className="h-80 animate-pulse rounded-md bg-slate-100" />
    </Card>
  );
}

export function FinanceChart({ data, isLoading }: FinanceChartProps) {
  const [mode, setMode] = useState<ChartMode>('income');
  const [transactionType, setTransactionType] = useState<TransactionType>('sales');

  const chartData = useMemo(() => {
    return (data || []).map((item) => {
      const values = resolveSeriesValues(item, mode, transactionType);
      return {
        month: item.month, // Tampilkan label tanggal/hari secara langsung
        'BCA USD': values.bcaUsd,
        'BCA IDR': values.bcaIdr,
        'CASH IDR': values.cash,
      };
    });
  }, [data, mode, transactionType]);

  if (isLoading) return <SkeletonChart />;
  if (!data?.length) {
    return (
      <Card className="rounded-md border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-4">
          <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="font-medium text-slate-900 text-lg">Belum ada data grafik</p>
        <p className="text-sm mt-1 text-slate-500">Tidak ada data untuk periode ini</p>
      </Card>
    );
  }

  return (
    <Card className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-base font-semibold text-slate-900">Grafik</p>
          <p className="text-sm text-slate-500">Pilih tipe arus kas untuk melihat trennya.</p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter 1: Mode (Pemasukan / Pengeluaran) */}
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <span className="text-sm font-medium text-slate-600">Tampilkan</span>
            <Select value={mode} onValueChange={(val: ChartMode) => setMode(val)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Pemasukan</SelectItem>
                <SelectItem value="expense">Pengeluaran</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter 2: Transaction Type (Penjualan / Pembelian) */}
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <span className="text-sm font-medium text-slate-600">Tipe</span>
            <Select value={transactionType} onValueChange={(val: TransactionType) => setTransactionType(val)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">Penjualan</SelectItem>
                <SelectItem value="purchase">Pembelian</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={320}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              width={65}
              domain={[0, 'auto']}
              tickFormatter={(value) => formatCompactNumber(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            {SERIES_META.map((series) => (
              <Line key={series.key} type="monotone" dataKey={series.label} stroke={series.color} strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-6">
        {SERIES_META.map((series) => (
          <div key={series.key} className="flex items-center gap-2 text-sm text-slate-600">
            <span className="inline-block h-2.5 w-2.5 rounded-md" style={{ backgroundColor: series.color }} />
            {series.label}
          </div>
        ))}
      </div>
    </Card>
  );
}
