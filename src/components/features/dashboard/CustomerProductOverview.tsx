import { CustomerOverview, ProductOverview } from '@/@types/dashboard';
import { Card } from '@/components/ui/card';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { ReferenceLink } from '@/components/ui/reference-link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown, Package } from 'lucide-react';
import router from 'next/router';
import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface CustomerOverviewCardProps {
  data?: CustomerOverview;
  isLoading?: boolean;
}

interface ProductOverviewCardProps {
  data?: ProductOverview;
  isLoading?: boolean;
}

const DONUT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
];

function StatItem({
  label,
  value,
  value2
}: {
  label: string;
  value: React.ReactNode;
  value2?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-start text-center">
      <p className="mb-2 text-[13px] font-medium text-slate-500">{label}</p>
      <div className="flex flex-col items-center gap-1">
        <p className="text-base font-bold text-slate-900">{value}</p>
        {value2 && <p className="text-base font-bold text-slate-900">{value2}</p>}
      </div>
    </div>
  );
}

function LoadingCard() {
  return <div className="h-80 animate-pulse rounded-[20px] bg-slate-100" />;
}

function CustomProductTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];

  return (
    <div className="rounded-lg bg-slate-900 px-3 py-2 text-white shadow-xl text-xs space-y-1">
      <p className="font-semibold text-slate-200">{item.name}</p>
      <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
        <span className="text-slate-400">Total Terjual:</span>
        <span className="font-bold text-emerald-400">{item.value.toLocaleString('id-ID')} unit</span>
      </div>
      {item.payload.actual !== undefined && (
        <div className="text-[11px] text-slate-300">
          Actual: <span className="font-semibold">{item.payload.actual}</span> | Forecast: <span className="font-semibold">{item.payload.forecast}</span>
        </div>
      )}
    </div>
  );
}

export function CustomerOverviewCard({ data, isLoading }: CustomerOverviewCardProps) {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

  if (isLoading) return <LoadingCard />;
  if (!data) return null;

  const { slug } = router.query;

  const sortedCustomers = [...data.topCustomers].sort((a, b) => {
    if (sortOrder === 'asc') return a.revenue - b.revenue;
    if (sortOrder === 'desc') return b.revenue - a.revenue;
    return 0; // Default if null
  });

  const toggleSort = () => {
    if (sortOrder === null) setSortOrder('desc');
    else if (sortOrder === 'desc') setSortOrder('asc');
    else setSortOrder(null);
  };

  return (
    <Card className="rounded-[20px] border border-slate-200 bg-white p-7 shadow-sm">
      <h3 className="mb-8 text-center text-[17px] font-bold text-slate-900">Overview Customer</h3>
      <div className="mb-8 grid grid-cols-3 gap-4 items-start">
        <StatItem label="Jumlah Customer" value={data.totalCustomers.toString()} />
        <StatItem
          label="Total Pendapatan"
          value={currenciesFormat('idr', data.totalRevenue.idr)}
          value2={currenciesFormat('usd', data.totalRevenue.usd)}
        />
        <StatItem label="Rata-rata pendapatan dari customer" value={data.averageRevenue.toString()} />
      </div>

      <div className="overflow-x-auto rounded-md border-none">
        <Table>
          <TableHeader className="bg-[#f8f9fa]">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="h-10 text-[13px] font-medium text-slate-700">Nama Customer</TableHead>
              <TableHead
                className="h-10 text-right text-[13px] font-medium text-slate-700 cursor-pointer select-none transition-colors hover:text-slate-900"
                onClick={toggleSort}
              >
                <div className="flex items-center justify-end gap-2">
                  Pemasukan
                  <ArrowUpDown className={`h-3 w-3 ${sortOrder !== null ? 'text-slate-700' : 'text-slate-300'}`} />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCustomers.map((customer, idx) => (
              <TableRow key={`${customer.name}-${idx}`} className="border-b border-slate-50 last:border-none hover:bg-slate-50/50">
                <TableCell className="py-[14px] text-[13px] font-medium text-slate-800"><ReferenceLink href={`/dashboard/${slug}/customers?search=${customer.name}`}>{customer.name}</ReferenceLink></TableCell>
                <TableCell className="py-[14px] text-right text-[13px] text-slate-700">{currenciesFormat('idr', customer.revenue)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

export function ProductOverviewCard({ data, isLoading }: ProductOverviewCardProps) {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

  const sortedProducts = useMemo(() => {
    if (!data?.topProducts) return [];
    return [...data.topProducts].sort((a, b) => {
      if (sortOrder === 'asc') return a.quantity - b.quantity;
      if (sortOrder === 'desc') return b.quantity - a.quantity;
      return 0;
    });
  }, [data?.topProducts, sortOrder]);

  const donutData = useMemo(() => {
    if (!data?.topProducts || data.topProducts.length === 0) {
      return [];
    }
    return data.topProducts
      .map((p) => ({
        name: p.name,
        value: p.quantity,
        actual: p.actual,
        forecast: p.forecast,
      }))
      .filter((item) => item.value > 0);
  }, [data?.topProducts]);

  if (isLoading) return <LoadingCard />;
  if (!data) return null;

  const toggleSort = () => {
    if (sortOrder === null) setSortOrder('desc');
    else if (sortOrder === 'desc') setSortOrder('asc');
    else setSortOrder(null);
  };

  console.log(data);

  return (
    <Card className="rounded-[20px] border border-slate-200 bg-white p-7 shadow-sm h-full flex flex-col justify-between">
      <div>
        <h3 className="mb-6 text-center text-[17px] font-bold text-slate-900">Overview Produk</h3>

        {/* Donut Chart Component */}
        <div className="mb-6 flex flex-col items-center justify-center">
          {donutData.length > 0 ? (
            <>
              <div className="relative h-[180px] w-full max-w-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      startAngle={90}
                      endAngle={450}
                    >
                      {donutData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomProductTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-slate-900">{data.totalSold}</span>
                  <span className="text-[11px] font-medium text-slate-500">Terjual</span>
                </div>
              </div>

              {/* Chart Legend */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 max-w-full">
                {donutData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                    />
                    <span className="font-medium text-slate-700">{item.name}:</span>
                    <span className="font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-slate-400">
              <Package className="h-10 w-10 mb-1 opacity-50" />
              <p className="text-xs">Belum ada data penjualan produk</p>
            </div>
          )}
        </div>

        {/* Statistics Grid */}
        <div className="mb-6 grid grid-cols-2 gap-4 items-start border-t border-slate-100 pt-6">
          <StatItem label="Jumlah Jenis Produk" value={data.totalProducts.toString()} />
          <StatItem label="Total Produk Terjual" value={data.totalSold.toLocaleString('id-ID')} />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-md border-none">
          <Table>
            <TableHeader className="bg-[#f8f9fa]">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="h-10 text-[13px] font-medium text-slate-700">Nama Produk</TableHead>
                <TableHead className="h-10 text-[13px] font-medium text-slate-700">Merk</TableHead>
                <TableHead
                  className="h-10 text-right text-[13px] font-medium text-slate-700 cursor-pointer select-none transition-colors hover:text-slate-900"
                  onClick={toggleSort}
                >
                  <div className="flex items-center justify-end gap-2">
                    Quantity
                    <ArrowUpDown className={`h-3 w-3 ${sortOrder !== null ? 'text-slate-700' : 'text-slate-300'}`} />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProducts.map((product, idx) => (
                <TableRow key={`${product.name}-${idx}`} className="border-b border-slate-50 last:border-none hover:bg-slate-50/50">
                  <TableCell className="py-[14px] text-[13px] font-medium text-slate-800">{product.name}</TableCell>
                  <TableCell className="py-[14px] text-[13px] text-slate-600">{product.brandName || '-'}</TableCell>
                  <TableCell className="py-[14px] text-right text-[13px] text-slate-700">{product.quantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
}
