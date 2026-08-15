import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { Eye, FileDown, FileCheck, FileText, FileSpreadsheet, FileX, FileUp, FileEdit, RotateCw } from 'lucide-react';

import { FinanceOverview } from '@/components/features/dashboard/FinanceOverview';
import { FinanceChart } from '@/components/features/dashboard/FinanceChart';
import { CustomerOverviewCard, ProductOverviewCard } from '@/components/features/dashboard/CustomerProductOverview';
import { UnitTypeSalesTrendChart } from '@/components/features/dashboard/charts/UnitTypeSalesTrendChart';
import { UnitTransactionTrendChart } from '@/components/features/dashboard/charts/UnitTransactionTrendChart';

import { TransactionTable } from '@/components/features/dashboard/TransactionTable';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { dashboardService } from '@/lib/api/dashboard.service';
import { LoadingState } from '@/components/ui/loading-state';

interface StatDetail {
  bpkb: number;
  stnk: number;
  skpd: number;
  tnkb: number;
}

interface VehicleDocumentStats {
  submission_stats?: StatDetail;
  complete_stats?: StatDetail;
  process_stats?: StatDetail;
  pending_stats?: StatDetail;
  total_pengajuan?: number;
  selesai?: number;
  proses?: number;
  tertunda?: number;
}

interface RegistrationStats {
  invoice_stats: number;
  bpkb_register_stats: number;
  stnk_register_stats: number;
  skpd_register_stats: number;
  bpkb_outstanding_stats: number;
  stnk_outstanding_stats: number;
  skpd_outstanding_stats: number;
}

function VehicleDocumentOverviewCard({
  companyId,
  startDate,
  endDate,
}: {
  companyId: string;
  startDate: string | null;
  endDate: string | null;
}) {
  const { data, isLoading, isError } = useQuery<VehicleDocumentStats>({
    queryKey: ['vehicle-document-stats', companyId, startDate, endDate],
    queryFn: async () => {
      const response = await apiClient.get('/wapi/stats/vehicle-document-stats', {
        params: {
          company_id: companyId,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
      });
      return response.data.data;
    },
    enabled: ['3', '4'].includes(companyId),
  });

  if (isLoading) {
    return <div className="h-44 animate-pulse rounded-[20px] bg-slate-100" />;
  }

  if (isError || !data) {
    return null;
  }

  const sumStats = (stats?: StatDetail | number) => {
    if (stats === null || stats === undefined) return 0;
    if (typeof stats === 'number') return stats;
    return (stats.bpkb || 0) + (stats.stnk || 0) + (stats.skpd || 0) + (stats.tnkb || 0);
  };

  return (
    <Card className="rounded-[20px] border border-slate-200 bg-white p-7 shadow-sm">
      <h3 className="mb-8 text-center text-[17px] font-bold text-slate-900">Overview Dokumen</h3>
      <div className="grid grid-cols-4 gap-4 text-center items-center">
        <div className="flex flex-col items-center justify-start">
          <p className="mb-3 text-[13px] font-medium text-slate-800">Total Pengajuan</p>
          <p className="text-2xl font-bold text-slate-955">{sumStats(data.submission_stats ?? data.total_pengajuan)}</p>
        </div>
        <div className="flex flex-col items-center justify-start">
          <p className="mb-3 text-[13px] font-medium text-slate-800">Selesai</p>
          <p className="text-2xl font-bold text-[#10b981]">{sumStats(data.complete_stats ?? data.selesai)}</p>
        </div>
        <div className="flex flex-col items-center justify-start">
          <p className="mb-3 text-[13px] font-medium text-slate-800">Proses</p>
          <p className="text-2xl font-bold text-[#f59e0b]">{sumStats(data.process_stats ?? data.proses)}</p>
        </div>
        <div className="flex flex-col items-center justify-start">
          <p className="mb-3 text-[13px] font-medium text-slate-800">Tertunda</p>
          <p className="text-2xl font-bold text-[#ef4444]">{sumStats(data.pending_stats ?? data.tertunda)}</p>
        </div>
      </div>
    </Card>
  );
}

function StatCard({
  title,
  value,
  accentColor,
  iconBg,
  icon: Icon,
}: {
  title: string;
  value: number;
  accentColor: string;
  iconBg: string;
  icon: React.ComponentType<{ className?: string; color?: string }>;
}) {
  return (
    <Card className="relative overflow-hidden rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between h-[150px]">
      <div className="absolute top-0 left-0 right-0 h-[8px]" style={{ backgroundColor: accentColor }} />

      <div className="flex items-center justify-start mb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-md" style={{ backgroundColor: iconBg }}>
          <Icon className="h-5 w-5" color={accentColor} />
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-[26px] font-bold text-slate-900 leading-tight">
          {value.toLocaleString('id-ID')}
        </span>
        <p className="text-[13px] font-medium text-slate-600">{title}</p>
      </div>
    </Card>
  );
}

function VehicleRegistrationOverview({
  companyId,
  startDate,
  endDate,
}: {
  companyId: string;
  startDate: string | null;
  endDate: string | null;
}) {
  const { data, isLoading, isError } = useQuery<RegistrationStats>({
    queryKey: ['vehicle-registration-stats', companyId, startDate, endDate],
    queryFn: async () => {
      const response = await apiClient.get('/wapi/stats/vehicle-registration-stats', {
        params: {
          company_id: companyId,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
      });
      return response.data.data;
    },
    enabled: ['3', '4'].includes(companyId),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-[150px] animate-pulse rounded-[20px] bg-slate-100" />
          ))}
        </div>
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-[150px] animate-pulse rounded-[20px] bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Row 1 */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Faktur Masuk"
          value={data.invoice_stats}
          accentColor="#2563eb"
          iconBg="#eff6ff"
          icon={FileDown}
        />
        <StatCard
          title="Daftar BPKB"
          value={data.bpkb_register_stats}
          accentColor="#10b981"
          iconBg="#ecfdf5"
          icon={FileCheck}
        />
        <StatCard
          title="Daftar STNK"
          value={data.stnk_register_stats}
          accentColor="#f59e0b"
          iconBg="#fffbeb"
          icon={FileText}
        />
        <StatCard
          title="Daftar SKPD"
          value={data.skpd_register_stats}
          accentColor="#6b7280"
          iconBg="#f9fafb"
          icon={FileSpreadsheet}
        />
      </div>

      {/* Row 2 */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Outstanding BPKB"
          value={data.bpkb_outstanding_stats}
          accentColor="#ef4444"
          iconBg="#fef2f2"
          icon={FileX}
        />
        <StatCard
          title="Outstanding STNK"
          value={data.stnk_outstanding_stats}
          accentColor="#ef4444"
          iconBg="#fef2f2"
          icon={FileUp}
        />
        <StatCard
          title="Outstanding SKPD"
          value={data.skpd_outstanding_stats}
          accentColor="#ef4444"
          iconBg="#fef2f2"
          icon={FileEdit}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [dateRangeState, setDateRangeState] = useState<DateRange | undefined>(undefined);
  const [activeDateRange, setActiveDateRange] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });
  const [isFiltering, setIsFiltering] = useState(false);
  const [isRefreshingCache, setIsRefreshingCache] = useState(false);

  const { companyId } = useCompany();
  const { data, isLoading, isError } = useDashboardData(activeDateRange.start, activeDateRange.end);

  const handleShowData = () => {
    setIsFiltering(true);
    const startDate = dateRangeState?.from ? format(dateRangeState.from, 'yyyy-MM-dd') : null;
    const endDate = dateRangeState?.to ? format(dateRangeState.to, 'yyyy-MM-dd') : null;
    setActiveDateRange({ start: startDate, end: endDate });
    setTimeout(() => setIsFiltering(false), 100);
  };

  const handleRefreshCache = async () => {
    if (!companyId) return;
    setIsRefreshingCache(true);
    try {
      await dashboardService.refreshCache(companyId);
      toast.success('Cache berhasil diperbarui');
      queryClient.invalidateQueries();
    } catch {
      toast.error('Gagal memperbarui cache');
    } finally {
      setIsRefreshingCache(false);
    }
  };

  const isLoadingDisplay = isLoading || isFiltering;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <PageHeader title="Overview Keuangan" />

          <div className="flex items-center gap-3">
            <DatePickerWithRange date={dateRangeState} onChange={setDateRangeState} />
            <Button
              variant="outline"
              className="bg-[#f8f9fa] shadow-sm text-gray-700 gap-2 shrink-0"
              onClick={handleShowData}
              disabled={isLoadingDisplay}
            >
              {isLoadingDisplay ? <LoadingState variant="inline" text={null} /> : <Eye className="h-4 w-4" />}
              Show
            </Button>
            <Button
              variant="outline"
              className="bg-[#f8f9fa] shadow-sm text-gray-700 gap-2 shrink-0 hover:bg-slate-100"
              onClick={handleRefreshCache}
              disabled={isRefreshingCache || isLoadingDisplay}
            >
              <RotateCw className={`h-4 w-4 ${isRefreshingCache ? 'animate-spin' : ''}`} />
              Refresh Cache
            </Button>
          </div>
        </div>

        <FinanceOverview accounts={data?.accounts || []} isLoading={isLoadingDisplay} isError={isError} />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-3">
            <FinanceChart data={data?.financeSeries || []} isLoading={isLoadingDisplay} />
          </div>
          {/* <div className="lg:col-span-2">
            <FinanceChart data={data?.financeSeries || []} isLoading={isLoading} />
          </div>
          <IncomeDonutChart /> */}
        </div>

        {/* company_id = [1,2,5] */}
        {companyId && ['1', '2', '5'].includes(companyId) && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <CustomerOverviewCard data={data?.customers} isLoading={isLoadingDisplay} />
              <ProductOverviewCard data={data?.products} isLoading={isLoadingDisplay} />
            </div>
            <UnitTransactionTrendChart companyId={companyId} startDate={activeDateRange.start} endDate={activeDateRange.end} />
            <TransactionTable data={data?.transactions || []} isLoading={isLoadingDisplay} />
            <UnitTypeSalesTrendChart companyId={companyId} startDate={activeDateRange.start} endDate={activeDateRange.end} />
          </div>
        )}

        {/* company_id = 3 or 4 */}
        {companyId && ['3', '4'].includes(companyId) && (
          <>
            <VehicleDocumentOverviewCard
              companyId={companyId}
              startDate={activeDateRange.start}
              endDate={activeDateRange.end}
            />
            <VehicleRegistrationOverview
              companyId={companyId}
              startDate={activeDateRange.start}
              endDate={activeDateRange.end}
            />
          </>
        )}

        {/* <CashflowSummary data={data?.cashflow} isLoading={isLoadingDisplay} /> */}
      </div>
    </DashboardLayout>
  );
}
