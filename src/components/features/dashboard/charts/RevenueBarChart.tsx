import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useDashboardData } from '@/hooks/useDashboardData';

/**
 * Custom Tooltip Component - Exact Figma Specs
 * Background: #000000, Text: #FFFFFF
 * Padding: 8px horizontal, 6px vertical
 * Border radius: 8px
 */
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number }> | undefined; label?: string }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="relative">
      <div
        style={{
          backgroundColor: '#000000',
          color: '#FFFFFF',
          padding: '6px 8px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '500',
        }}
      >
        <p className="mb-1">{label}</p>
        <div className="space-y-0.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <div className="h-2 w-2 rounded-md" style={{ backgroundColor: entry.color }} />
              <span className="text-xs">{entry.name}:</span>
              <span className="text-xs font-semibold">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Tooltip Arrow */}
      <div
        style={{
          position: 'absolute',
          bottom: '-4px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderTop: '4px solid #000000',
        }}
      />
    </div>
  );
}

/**
 * Revenue Bar Chart - Exact Figma Specifications
 *
 * SPECS:
 * - Height: 400px
 * - Width: 837px
 * - Bar width: 12px
 * - Bar radius: 2px
 * - Bar gap: 17px
 * - Colors: BCA IDR #B0160D, BCA USD #ECB45B, CASH #1C3A58
 * - Y-axis: 0-100, interval 10, font 12px, color #737373
 * - Grid: 1px, #E5E5E5
 */
export function RevenueBarChart() {
  const { data, isLoading } = useDashboardData();

  if (isLoading) {
    return (
      <Card className="h-full rounded-md">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Tren Keuangan Bulanan</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <div className="h-full animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full rounded-md shadow-sm" style={{ maxWidth: '837px' }}>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Tren Keuangan Bulanan</CardTitle>
      </CardHeader>

      <CardContent style={{ height: '400px' }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={320}>
          <BarChart
            data={data?.monthlyRevenue || []}
            barCategoryGap={17} // Gap between groups
            barSize={12} // Bar width
          >
            {/* Grid Lines - Horizontal, #E5E5E5 */}
            <CartesianGrid strokeDasharray="0" stroke="#E5E5E5" strokeWidth={1} vertical={false} />

            {/* X-Axis */}
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} dy={10} />

            {/* Y-Axis: 0-100, interval 10 */}
            <YAxis domain={[0, 100]} ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} width={30} />

            {/* Custom Tooltip */}
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} position={{ y: -80 }} />

            {/* Bars - Exact Colors */}
            <Bar dataKey="bcaIdr" name="BCA IDR" fill="#B0160D" radius={[2, 2, 0, 0]} />
            <Bar dataKey="bcaUsd" name="BCA USD" fill="#ECB45B" radius={[2, 2, 0, 0]} />
            <Bar dataKey="cash" name="CASH" fill="#1C3A58" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        {/* Legend - Horizontal at bottom */}
        <div className="mx-4 flex items-center justify-center gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '2px',
                backgroundColor: '#B0160D',
              }}
            />
            <span style={{ fontSize: '12px', color: '#737373' }}>BCA IDR</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '2px',
                backgroundColor: '#ECB45B',
              }}
            />
            <span style={{ fontSize: '12px', color: '#737373' }}>BCA USD</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '2px',
                backgroundColor: '#1C3A58',
              }}
            />
            <span style={{ fontSize: '12px', color: '#737373' }}>CASH</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
