'use client';

import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useProductTransactionOverview } from '@/hooks/useDashboardData';
import { BarChart3, Calendar as CalendarIcon, PackageCheck, TrendingUp } from 'lucide-react';

interface Props { companyId?: string | null; startDate: string | null; endDate: string | null }
type ProductKey = string;
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1', '#F97316', '#14B8A6'];

const formatDate = (value: string) => {
  try { return value.length === 10 ? format(parseISO(value), 'dd MMM', { locale: id }) : format(parseISO(`${value}-01`), 'MMM yyyy', { locale: id }); }
  catch { return value; }
};

function ProductTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return <div className="max-h-56 min-w-[190px] space-y-2 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs text-white shadow-2xl"><p className="border-b border-slate-700 pb-1.5 font-semibold text-slate-200">{formatDate(label || '')}</p>{payload.map((entry: any) => <div key={entry.dataKey} className="flex items-center justify-between gap-3"><span className="flex min-w-0 items-center gap-1.5 text-slate-300"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} /><span className="truncate">{entry.name}</span></span><b>{Number(entry.value || 0).toLocaleString('id-ID')}</b></div>)}</div>;
}

export function UnitTypeSalesTrendChart({ companyId, startDate, endDate }: Props) {
  const { data, isLoading } = useProductTransactionOverview({ company_id: companyId, start_date: startDate, end_date: endDate });
  const products = useMemo(() => data?.product_trend || [], [data?.product_trend]);
  const [enabled, setEnabled] = useState<Record<ProductKey, boolean>>({});

  const activeProducts = useMemo(() => products.filter((product) => enabled[`${product.product_type}:${product.product_id}`] !== false), [products, enabled]);
  const chartData = useMemo(() => {
    const rows = new Map<string, Record<string, string | number>>();
    activeProducts.forEach((product) => product.trend.forEach((point) => { const row = rows.get(point.label) || { label: point.label }; row[`${product.product_type}:${product.product_id}`] = Number(point.sales_qty || 0); rows.set(point.label, row); }));
    return Array.from(rows.values());
  }, [activeProducts]);
  const totalSold = activeProducts.reduce((sum, product) => sum + product.trend.reduce((inner, point) => inner + Number(point.sales_qty || 0), 0), 0);
  const topProduct = activeProducts.reduce<{ name: string; value: number } | null>((top, product) => { const value = product.trend.reduce((sum, point) => sum + Number(point.sales_qty || 0), 0); return !top || value > top.value ? { name: product.product_name, value } : top; }, null);

  return <Card className="rounded-[20px] border border-slate-200 bg-white p-7 shadow-sm"><CardHeader className="flex flex-col justify-between gap-4 border-b border-slate-100 p-0 pb-6 md:flex-row md:items-center"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><TrendingUp className="h-5 w-5" /></div><div><CardTitle className="text-[17px] font-bold text-slate-900">Trend Penjualan Produk</CardTitle><p className="mt-0.5 text-xs text-slate-500">Grafik unit type dan sparepart terjual berdasarkan filter dashboard</p></div></div></CardHeader><CardContent className="space-y-6 p-0 pt-6"><div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><Metric icon={PackageCheck} label="Total Terjual" value={totalSold} suffix="item" /><Metric icon={BarChart3} label="Produk Terlaris" value={topProduct?.name || '-'} /><Metric icon={CalendarIcon} label="Varian Produk" value={activeProducts.length} suffix="produk" /></div><div className="max-h-28 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/50 p-3"><div className="flex flex-wrap gap-x-5 gap-y-2">{products.map((product, index) => { const key = `${product.product_type}:${product.product_id}`; return <label key={key} className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700"><Checkbox checked={enabled[key] !== false} onCheckedChange={(checked) => setEnabled((current) => ({ ...current, [key]: checked === true }))} /><span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} /><span>{product.product_type === 'sparepart' ? 'Sparepart' : 'Unit Type'}: {product.product_name}</span></label>; })}</div></div>{isLoading ? <div className="h-80 animate-pulse rounded-xl bg-slate-100" /> : chartData.length === 0 ? <div className="py-12 text-center text-sm text-slate-500">Belum ada data statistik penjualan produk</div> : <div className="h-[320px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" /><XAxis dataKey="label" tickFormatter={formatDate} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#CBD5E1' }} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} /><Tooltip content={<ProductTooltip />} />{activeProducts.map((product, index) => { const key = `${product.product_type}:${product.product_id}`; return <Bar key={key} dataKey={key} name={`${product.product_type === 'sparepart' ? 'Sparepart' : 'Unit Type'}: ${product.product_name}`} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} maxBarSize={48} />; })}</BarChart></ResponsiveContainer></div>}</CardContent></Card>;
}

function Metric({ icon: Icon, label, value, suffix }: { icon: typeof PackageCheck; label: string; value: string | number; suffix?: string }) { return <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700"><Icon className="h-4 w-4" /></div><div className="min-w-0"><p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p><p className="truncate text-base font-bold text-slate-900">{typeof value === 'number' ? value.toLocaleString('id-ID') : value} {suffix && <span className="text-xs font-normal text-slate-500">{suffix}</span>}</p></div></div>; }
