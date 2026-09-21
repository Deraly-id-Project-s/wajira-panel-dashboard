'use client';

import { useMemo, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useProductTransactionOverview } from '@/hooks/useDashboardData';
import { TrendingUp, FileDown, FileUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

interface Props { startDate: string | null; endDate: string | null; companyId?: string | null }
type ProductType = 'unit_type' | 'sparepart';
type SeriesKey = `${ProductType}_${'sales' | 'purchase'}`;

const SERIES = [
  { key: 'unit_type_sales' as SeriesKey, type: 'unit_type' as ProductType, metric: 'sales_transaction_count', label: 'Penjualan Unit Type', color: '#10B981' },
  { key: 'unit_type_purchase' as SeriesKey, type: 'unit_type' as ProductType, metric: 'purchase_transaction_count', label: 'Pembelian Unit Type', color: '#3B82F6' },
  { key: 'sparepart_sales' as SeriesKey, type: 'sparepart' as ProductType, metric: 'sales_transaction_count', label: 'Penjualan Sparepart', color: '#F59E0B' },
  { key: 'sparepart_purchase' as SeriesKey, type: 'sparepart' as ProductType, metric: 'purchase_transaction_count', label: 'Pembelian Sparepart', color: '#8B5CF6' },
] as const;

const formatDate = (value: string) => {
  try { return value.length === 10 ? format(parseISO(value), 'dd MMM', { locale: id }) : format(parseISO(`${value}-01`), 'MMM yyyy', { locale: id }); }
  catch { return value; }
};

const periodLabel = (start: string | null, end: string | null) => {
  if (!start && !end) return 'Semua Periode';
  const fmt = (value: string) => format(parseISO(value), 'dd MMM yyyy', { locale: id });
  return start && end ? `${fmt(start)} - ${fmt(end)}` : start ? `Mulai ${fmt(start)}` : `Hingga ${fmt(end as string)}`;
};

function TooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-md bg-slate-900 px-4 py-3 text-xs text-white shadow-2xl space-y-2">
    <p className="border-b border-slate-700 pb-1.5 font-semibold text-slate-200">{formatDate(label || '')}</p>
    {payload.map((entry: any) => <div key={entry.dataKey} className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-slate-300"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />{entry.name}</span>
      <b>{entry.value} transaksi</b>
    </div>)}
  </div>;
}

export function UnitTransactionTrendChart({ startDate, endDate, companyId }: Props) {
  const { data, isLoading } = useProductTransactionOverview({ company_id: companyId, start_date: startDate, end_date: endDate });
  const [enabled, setEnabled] = useState<Record<SeriesKey, boolean>>(() => Object.fromEntries(SERIES.map((series) => [series.key, true])) as Record<SeriesKey, boolean>);

  const chartData = useMemo(() => {
    const rows = new Map<string, Record<string, string | number>>();
    (data?.transaction_trend || []).forEach((point) => {
      const row = rows.get(point.label) || { label: point.label };
      SERIES.filter((series) => series.type === point.product_type).forEach((series) => { row[series.key] = Number(point[series.metric] || 0); });
      rows.set(point.label, row);
    });
    return Array.from(rows.values());
  }, [data]);

  const totals = useMemo(() => SERIES.reduce((result, series) => {
    if (enabled[series.key]) result[series.key] = (data?.transaction_trend || []).filter((point) => point.product_type === series.type).reduce((sum, point) => sum + Number(point[series.metric] || 0), 0);
    return result;
  }, {} as Record<string, number>), [data, enabled]);
  const visibleSeries = SERIES.filter((series) => enabled[series.key]);

  return <Card className="rounded-md border border-slate-200 bg-white p-7 shadow-sm">
    <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 p-0 pb-6">
      <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-600"><TrendingUp className="h-5 w-5" /></div><div><CardTitle className="text-[17px] font-bold text-slate-900">Trend Jual Beli Produk</CardTitle><p className="mt-0.5 text-xs text-slate-500">Tren transaksi unit type dan sparepart</p></div></div>
      <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">{periodLabel(startDate, endDate)}</div>
    </CardHeader>
    <CardContent className="space-y-6 p-0 pt-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Summary icon={FileUp} label="Total Penjualan" value={Object.entries(totals).filter(([key]) => key.endsWith('_sales')).reduce((sum, [, value]) => sum + value, 0)} color="emerald" /><Summary icon={FileDown} label="Total Pembelian" value={Object.entries(totals).filter(([key]) => key.endsWith('_purchase')).reduce((sum, [, value]) => sum + value, 0)} color="blue" /></div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 border-y border-slate-100 py-3">{SERIES.map((series) => <label key={series.key} className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700"><Checkbox checked={enabled[series.key]} onCheckedChange={(checked) => setEnabled((current) => ({ ...current, [series.key]: checked === true }))} /><span className="h-2 w-2 rounded-full" style={{ backgroundColor: series.color }} />{series.label}</label>)}</div>
      {isLoading ? <div className="h-80 animate-pulse rounded-md bg-slate-100" /> : chartData.length === 0 || visibleSeries.length === 0 ? <div className="py-12 text-center text-sm text-slate-500">{visibleSeries.length === 0 ? 'Tidak ada statistik yang dipilih' : 'Belum ada data statistik transaksi'}</div> : <div className="h-[320px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" /><XAxis dataKey="label" tickFormatter={formatDate} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#CBD5E1' }} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} /><Tooltip content={<TooltipContent />} />{visibleSeries.map((series) => <Line key={series.key} dataKey={series.key} name={series.label} type="monotone" stroke={series.color} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />)}</LineChart></ResponsiveContainer></div>}
    </CardContent>
  </Card>;
}

function Summary({ icon: Icon, label, value, color }: { icon: typeof FileUp; label: string; value: number; color: 'emerald' | 'blue' }) {
  const colorClass = color === 'emerald' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700';
  return <div className="flex items-center gap-3 rounded-md border border-slate-100 bg-slate-50/70 p-3.5"><div className={`flex h-9 w-9 items-center justify-center rounded-md ${colorClass}`}><Icon className="h-4 w-4" /></div><div><p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p><p className="text-base font-bold text-slate-900">{value.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">transaksi</span></p></div></div>;
}
