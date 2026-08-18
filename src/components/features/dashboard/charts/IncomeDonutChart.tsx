import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useDashboardData } from '@/hooks/useDashboardData';
import { formatNumber } from '@/lib/utils/format';

/**
 * Exact Figma Colors - CLOCKWISE ORDER
 * BCA IDR → #ECB45B (gold)
 * BCA USD → #B0160D (red)
 * CASH → #1C3A58 (navy)
 */
const COLORS = ['#ECB45B', '#B0160D', '#1C3A58'];

/**
 * Custom Tooltip
 */
function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name?: string; value?: number }> | undefined }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      style={{
        backgroundColor: '#000000',
        color: '#FFFFFF',
        padding: '6px 8px',
        borderRadius: '8px',
        fontSize: '12px',
      }}
    >
      <p className="font-medium">{payload[0].name}</p>
      <p className="text-xs">{formatNumber(payload[0].value as number)}</p>
    </div>
  );
}

/**
 * Income Donut Chart - Exact Figma Specifications
 *
 * SPECS:
 * - Diameter: 187px
 * - Thickness: ~20px
 * - Inner radius: ~73px, Outer radius: ~93px
 * - Colors (clockwise): BCA IDR #ECB45B, BCA USD #B0160D, CASH #1C3A58
 * - Legend: 10px indicator, 2px radius, 1px border #E5E5E5, 8px radius, 12px padding, 12px font
 */
export function IncomeDonutChart() {
  const { data, isLoading } = useDashboardData();

  if (isLoading) {
    return (
      <Card className="h-full rounded-md">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Pemasukan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[187px] animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full rounded-md shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Pemasukan</CardTitle>
      </CardHeader>

      <CardContent>
        {/* Donut Chart - 187px diameter */}
        <div style={{ height: '187px' }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={187}>
            <PieChart>
              <Pie
                data={data?.incomeBreakdown || []}
                dataKey="value"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={73} // Donut hole
                outerRadius={93} // ~20px thickness
                paddingAngle={0}
                startAngle={90}
                endAngle={450}
              >
                {(data?.incomeBreakdown || []).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend - Exact Figma Specs */}
        <div className="mt-4 space-y-2">
          {(data?.incomeBreakdown || []).map((item, i) => (
            <div
              key={item.category}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid #E5E5E5',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                {/* Indicator: 10px, 2px radius */}
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    backgroundColor: COLORS[i % COLORS.length],
                  }}
                />
                {/* Label: 12px font */}
                <span style={{ fontSize: '12px', fontWeight: '500' }}>{item.category}</span>
              </div>
              {/* Value: 12px font, semibold */}
              <span style={{ fontSize: '12px', fontWeight: '600' }}>{formatNumber(item.value)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
