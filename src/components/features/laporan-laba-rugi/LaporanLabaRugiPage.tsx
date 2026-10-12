import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { Download, Printer, RefreshCw, RotateCcw, SlidersHorizontal } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

import type {
  ProfitLossReportData,
  ProfitLossReportLine,
  ProfitLossReportSection,
  ProfitLossTemplateKey,
  ProfitLossTemplatePayload,
} from '@/@types/profit-loss-report.types';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange, type DateRangePickerMode } from '@/components/ui/date-range-picker';
import { SearchInput } from '@/components/ui/search-input';
import { Skeleton } from '@/components/ui/skeleton';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCompany } from '@/contexts/CompanyContext';
import { useProfitLossReport, useUpdateProfitLossTemplate } from '@/hooks/report/useProfitLossReport';
import { useReportTemplatePrint } from '@/hooks/useReportTemplatePrint';
import { exportProfitLossReport } from '@/services/report/profitLossReport.service';
import { getLetterheadByCompanyId, resolveCompanyId } from '@/lib/print-letterhead';
import { cn } from '@/lib/utils';
import { ReportTemplatePrintDialog } from '@/components/ui/report-template-print-dialog';
import {
  LaporanLabaRugiPrintDocument,
  type ProfitLossPrintSection,
} from '@/components/features/laporan-laba-rugi/LaporanLabaRugiPrintDocument';

type SectionKey = 'revenue' | 'cogs' | 'grossProfit' | 'opex' | 'noix';

interface ReportSectionConfig {
  key: SectionKey;
  title: string;
  description: string;
  templateKey: ProfitLossTemplateKey;
  dataKey: keyof ProfitLossReportData;
  tone: 'positive' | 'negative' | 'neutral';
  expectedType?: 'debet' | 'credit';
}

interface NormalizedSection {
  rows: ProfitLossReportLine[];
  total: number;
  totalUsd: number;
}

const EMPTY_VALUE = '__empty__';

const DEFAULT_TEMPLATE: ProfitLossTemplatePayload = {
  revenue_account_ids: [80, 183, 186, 181, 180],
  cogs_account_ids: [194, 191],
  gross_profit_account_ids: [],
  opex_account_ids: [],
  noix_account_ids: [190],
  tax: 0,
};

const EMPTY_REPORT_DATA: ProfitLossReportData = {};

const getCompanyName = (companyId?: number | null) => {
  if (companyId === 1) return 'PT WAJIRA JAGRATARA MORINDO';
  if (companyId === 3) return 'PT WAJIRA YANOTAMA';
  if (companyId === 4) return 'PT WAJIRA TRANSINDO';
  return 'PT WAJIRA';
};

const REPORT_SECTIONS: ReportSectionConfig[] = [
  {
    key: 'revenue',
    title: 'Pendapatan',
    description: 'Akun penjualan dan pendapatan utama.',
    templateKey: 'revenue_account_ids',
    dataKey: 'revenue_calc',
    tone: 'positive',
    expectedType: 'credit',
  },
  {
    key: 'cogs',
    title: 'Beban Pokok Usaha',
    description: 'Akun beban pokok usaha.',
    templateKey: 'cogs_account_ids',
    dataKey: 'cogs_calc',
    tone: 'negative',
    expectedType: 'debet',
  },
  {
    key: 'grossProfit',
    title: 'Laba Kotor Usaha',
    description: 'Akun penyesuaian laba kotor usaha.',
    templateKey: 'gross_profit_account_ids',
    dataKey: 'gross_calc',
    tone: 'neutral',
    expectedType: 'debet',
  },
  {
    key: 'opex',
    title: 'Beban Operasional',
    description: 'Akun beban operasional.',
    templateKey: 'opex_account_ids',
    dataKey: 'opex_calc',
    tone: 'negative',
    expectedType: 'debet',
  },
  {
    key: 'noix',
    title: 'Pendapatan/Beban Non Operasional',
    description: 'Akun di luar aktivitas operasional/diluar usaha.',
    templateKey: 'noix_account_ids',
    dataKey: 'noix_calc',
    tone: 'neutral',
    expectedType: 'debet',
  },
];

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const normalized = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(normalized) ? normalized : 0;
  }
  return 0;
};

const getLineBaseAmount = (line: ProfitLossReportLine): number =>
  toNumber(line.amount ?? line.total ?? line.value ?? line.balance);

const getLineCurrency = (line: ProfitLossReportLine) =>
  String(line.type ?? 'IDR').toUpperCase() === 'USD' ? 'usd' : 'idr';

const getLineUsdAmount = (line: ProfitLossReportLine): number => {
  const explicitUsd = line.amount_usd ?? line.total_usd ?? line.value_usd ?? line.balance_usd;
  if (explicitUsd !== undefined && explicitUsd !== null) return toNumber(explicitUsd);
  return getLineCurrency(line) === 'usd' ? getLineBaseAmount(line) : 0;
};

const getLineIdrAmount = (line: ProfitLossReportLine): number => {
  const hasExplicitUsd = [line.amount_usd, line.total_usd, line.value_usd, line.balance_usd]
    .some((value) => value !== undefined && value !== null);
  return !hasExplicitUsd && getLineCurrency(line) === 'usd' ? 0 : getLineBaseAmount(line);
};

const getUsdTotal = (rows: ProfitLossReportLine[]) =>
  rows.reduce((sum, line) => sum + getLineUsdAmount(line), 0);

const normalizeSection = (value: unknown): NormalizedSection => {
  if (Array.isArray(value)) {
    const rows = value as ProfitLossReportLine[];
    return {
      rows,
      total: rows.reduce((sum, line) => sum + getLineIdrAmount(line), 0),
      totalUsd: getUsdTotal(rows),
    };
  }

  if (typeof value === 'number' || typeof value === 'string') {
    return { rows: [], total: toNumber(value), totalUsd: 0 };
  }

  if (value && typeof value === 'object') {
    const section = value as ProfitLossReportSection;
    const rows = section.accounts ?? section.rows ?? section.items ?? section.data ?? [];
    const total = section.total ?? section.amount ?? section.value;
    const totalUsd = section.total_usd ?? section.amount_usd ?? section.value_usd;

    return {
      rows,
      total: total === undefined || total === null
        ? rows.reduce((sum, line) => sum + getLineIdrAmount(line), 0)
        : toNumber(total),
      totalUsd: totalUsd === undefined || totalUsd === null ? getUsdTotal(rows) : toNumber(totalUsd),
    };
  }

  return { rows: [], total: 0, totalUsd: 0 };
};

const getLineLabel = (line: ProfitLossReportLine) => {
  const code = line.account_code ?? line.code;
  const name = line.account_name ?? line.name ?? line.label ?? 'Akun';
  return code ? `${code} - ${name}` : name;
};

const uniqueNumbers = (values: Array<number | string | null | undefined>) =>
  values
    .map((value) => Number(value))
    .filter((value, index, array) => Number.isFinite(value) && value > 0 && array.indexOf(value) === index);

const buildTemplateState = (): Record<ProfitLossTemplateKey, number[]> => ({
  revenue_account_ids: [...DEFAULT_TEMPLATE.revenue_account_ids],
  cogs_account_ids: [...DEFAULT_TEMPLATE.cogs_account_ids],
  gross_profit_account_ids: [...DEFAULT_TEMPLATE.gross_profit_account_ids],
  opex_account_ids: [...DEFAULT_TEMPLATE.opex_account_ids],
  noix_account_ids: [...DEFAULT_TEMPLATE.noix_account_ids],
});

const buildTemplateStateFromReport = (reportData: ProfitLossReportData): Record<ProfitLossTemplateKey, number[]> => ({
  revenue_account_ids: uniqueNumbers(reportData.revenue_account_ids ?? DEFAULT_TEMPLATE.revenue_account_ids),
  cogs_account_ids: uniqueNumbers(reportData.cogs_account_ids ?? DEFAULT_TEMPLATE.cogs_account_ids),
  gross_profit_account_ids: uniqueNumbers(reportData.gross_profit_account_ids ?? DEFAULT_TEMPLATE.gross_profit_account_ids),
  opex_account_ids: uniqueNumbers(reportData.opex_account_ids ?? DEFAULT_TEMPLATE.opex_account_ids),
  noix_account_ids: uniqueNumbers(reportData.noix_account_ids ?? DEFAULT_TEMPLATE.noix_account_ids),
});

function AmountSummary({
  idrValue,
  usdValue,
  className,
}: {
  idrValue: number;
  usdValue: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-lg font-bold">{currenciesFormat('idr', idrValue)}</p>
      <p className="mt-1 text-sm font-semibold text-sky-700">{currenciesFormat('usd', usdValue)}</p>
    </div>
  );
};

function SectionViewer({
  config,
  reportSection,
}: {
  config: ReportSectionConfig;
  reportSection: NormalizedSection;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white">
      <div className="grid gap-4 border-b border-slate-100 p-4 lg:grid-cols-[minmax(260px,1fr)_220px] lg:items-start">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{config.title}</h2>
          <p className="mt-1 text-sm text-slate-500">{config.description}</p>
        </div>
        <div className="lg:text-right">
          <p className="text-xs font-semibold uppercase text-slate-500">Total</p>
          <AmountSummary
            idrValue={reportSection.total}
            usdValue={reportSection.totalUsd}
            className={cn(
              'mt-1',
              config.tone === 'positive' && 'text-emerald-700',
              config.tone === 'negative' && 'text-rose-700',
              config.tone === 'neutral' && 'text-slate-900',
            )}
          />
        </div>
      </div>

      <div className="p-4">
        <div className="overflow-hidden rounded-md border border-slate-200">
          <div className="grid grid-cols-[1fr_150px_130px] bg-slate-50 px-3 py-2 text-xs font-semibold uppercase text-slate-500">
            <span>Akun</span>
            <span className="text-right">IDR</span>
            <span className="text-right">USD</span>
          </div>
          {reportSection.rows.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-slate-500">Belum ada rincian dari laporan.</div>
          ) : (
            reportSection.rows.map((line, index) => (
              <div
                key={`${line.id ?? line.account_id ?? index}`}
                className="grid grid-cols-[1fr_150px_130px] gap-3 border-t border-slate-100 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate text-slate-700">{getLineLabel(line)}</span>
                <span className="text-right font-medium text-slate-900">
                  {currenciesFormat('idr', getLineIdrAmount(line))}
                </span>
                <span className="text-right font-medium text-sky-700">
                  {currenciesFormat('usd', getLineUsdAmount(line))}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default function LaporanLabaRugiPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const resolvedCompanyId = resolveCompanyId(router.query.slug, companyId);
  const selectedPrintBackground = getLetterheadByCompanyId(resolvedCompanyId);
  const templatePrint = useReportTemplatePrint(selectedPrintBackground);

  const [templateState, setTemplateState] = useState<Record<ProfitLossTemplateKey, number[]>>(
    buildTemplateState,
  );
  const [taxInput, setTaxInput] = useState<string>('0');
  const [isExporting, setIsExporting] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [dateMode, setDateMode] = useState<DateRangePickerMode>('date');

  const reportFilters = useMemo(() => ({
    start_date: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null,
    end_date: dateRange?.to
      ? format(dateRange.to, 'yyyy-MM-dd')
      : dateRange?.from
        ? format(dateRange.from, 'yyyy-MM-dd')
        : null,
  }), [dateRange]);

  const reportQuery = useProfitLossReport(
    resolvedCompanyId,
    reportFilters,
    Boolean(resolvedCompanyId),
  );
  const updateTemplateMutation = useUpdateProfitLossTemplate(resolvedCompanyId);

  const reportData = reportQuery.data?.data ?? EMPTY_REPORT_DATA;
  useEffect(() => {
    if (!reportQuery.data?.data) return;
    const data = reportQuery.data.data;
    setTemplateState(buildTemplateStateFromReport(data));
    const rawTax = data.tax ?? data.tax_percentage ?? data.template?.tax ?? 0;
    setTaxInput(String(rawTax ?? 0));
  }, [reportQuery.data?.data]);

  const normalizedSections = useMemo(() => {
    return REPORT_SECTIONS.reduce<Record<SectionKey, NormalizedSection>>((acc, section) => {
      acc[section.key] = normalizeSection(reportData[section.dataKey]);
      return acc;
    }, {} as Record<SectionKey, NormalizedSection>);
  }, [reportData]);

  const filteredSections = useMemo(() => {
    const keyword = searchInput.trim().toLowerCase();
    if (!keyword) return normalizedSections;

    return REPORT_SECTIONS.reduce<Record<SectionKey, NormalizedSection>>((acc, section) => {
      const currentSection = normalizedSections[section.key];
      acc[section.key] = {
        ...currentSection,
        rows: currentSection.rows.filter((line) => getLineLabel(line).toLowerCase().includes(keyword)),
      };
      return acc;
    }, {} as Record<SectionKey, NormalizedSection>);
  }, [normalizedSections, searchInput]);

  const explicitNetIncome = reportData.profit_loss_before_tax ?? reportData.net_income ?? reportData.net_profit ?? reportData.profit_loss;
  const explicitNetIncomeUsd = reportData.profit_loss_before_tax_usd
    ?? reportData.net_income_usd
    ?? reportData.net_profit_usd
    ?? reportData.profit_loss_usd;

  const profitBeforeTax = explicitNetIncome !== undefined && explicitNetIncome !== null ? toNumber(explicitNetIncome) : (
    normalizedSections.revenue.total
    - normalizedSections.cogs.total
    - normalizedSections.opex.total
    + normalizedSections.noix.total
  );

  const profitBeforeTaxUsd = explicitNetIncomeUsd !== undefined && explicitNetIncomeUsd !== null ? toNumber(explicitNetIncomeUsd) : (
    normalizedSections.revenue.totalUsd
    - normalizedSections.cogs.totalUsd
    - normalizedSections.opex.totalUsd
    + normalizedSections.noix.totalUsd
  );

  const grossProfitTotal = reportData.gross_calc !== undefined && reportData.gross_calc !== null
    ? normalizedSections.grossProfit.total
    : normalizedSections.revenue.total - normalizedSections.cogs.total;
  const grossProfitUsdTotal = reportData.gross_calc !== undefined && reportData.gross_calc !== null
    ? normalizedSections.grossProfit.totalUsd
    : normalizedSections.revenue.totalUsd - normalizedSections.cogs.totalUsd;

  const taxPercentage = toNumber(taxInput);
  const taxAmount = reportData.tax_amount !== undefined && reportData.tax_amount !== null
    ? toNumber(reportData.tax_amount)
    : (profitBeforeTax > 0 ? profitBeforeTax * (taxPercentage / 100) : 0);
  const taxAmountUsd = reportData.tax_amount_usd !== undefined && reportData.tax_amount_usd !== null
    ? toNumber(reportData.tax_amount_usd)
    : (profitBeforeTaxUsd > 0 ? profitBeforeTaxUsd * (taxPercentage / 100) : 0);

  const profitAfterTax = reportData.profit_loss_after_tax !== undefined && reportData.profit_loss_after_tax !== null
    ? toNumber(reportData.profit_loss_after_tax)
    : (profitBeforeTax - taxAmount);
  const profitAfterTaxUsd = reportData.profit_loss_after_tax_usd !== undefined && reportData.profit_loss_after_tax_usd !== null
    ? toNumber(reportData.profit_loss_after_tax_usd)
    : (profitBeforeTaxUsd - taxAmountUsd);

  const printSections = useMemo<ProfitLossPrintSection[]>(() => [
    {
      key: 'revenue',
      title: 'Pendapatan',
      rows: normalizedSections.revenue.rows,
      total: normalizedSections.revenue.total,
      totalUsd: normalizedSections.revenue.totalUsd,
    },
    {
      key: 'cogs',
      title: 'Harga Pokok Penjualan',
      rows: normalizedSections.cogs.rows,
      total: normalizedSections.cogs.total,
      totalUsd: normalizedSections.cogs.totalUsd,
      deduction: true,
    },
    {
      key: 'opex',
      title: 'Biaya Operasional',
      rows: normalizedSections.opex.rows,
      total: normalizedSections.opex.total,
      totalUsd: normalizedSections.opex.totalUsd,
      deduction: true,
    },
    {
      key: 'noix',
      title: 'Pendapatan/Beban Non Operasional',
      rows: normalizedSections.noix.rows,
      total: normalizedSections.noix.total,
      totalUsd: normalizedSections.noix.totalUsd,
    },
  ], [normalizedSections]);

  const periodLabel = reportFilters.start_date
    ? `${dateRange?.from ? format(dateRange.from, 'dd MMM yyyy') : '-'}${reportFilters.end_date !== reportFilters.start_date && dateRange?.to ? ` – ${format(dateRange.to, 'dd MMM yyyy')}` : ''}`
    : 'Semua periode';

  const handleSync = async () => {
    if (!resolvedCompanyId) {
      toast.error('Company belum dipilih.');
      return;
    }

    const payload: ProfitLossTemplatePayload = {
      revenue_account_ids: uniqueNumbers(templateState.revenue_account_ids),
      cogs_account_ids: uniqueNumbers(templateState.cogs_account_ids),
      gross_profit_account_ids: uniqueNumbers(templateState.gross_profit_account_ids),
      opex_account_ids: uniqueNumbers(templateState.opex_account_ids),
      noix_account_ids: uniqueNumbers(templateState.noix_account_ids),
      tax: taxInput !== '' ? toNumber(taxInput) : 0,
    };

    try {
      await updateTemplateMutation.mutateAsync(payload);
      toast.success('Template laporan laba rugi berhasil disinkronkan.');
    } catch (error) {
      toast.error((error as Error)?.message || 'Gagal sinkron template laporan laba rugi.');
    }
  };

  const handleExport = async () => {
    if (!resolvedCompanyId) {
      toast.error('Company belum dipilih.');
      return;
    }

    setIsExporting(true);
    try {
      await exportProfitLossReport(resolvedCompanyId, reportFilters);
      toast.success('Export laporan laba rugi berhasil diproses.');
    } catch (error) {
      toast.error((error as Error)?.message || 'Gagal export laporan laba rugi.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <PageHeader
          title="Laporan Laba Rugi"
          subtitle="Ringkasan pendapatan, HPP, biaya, dan laba bersih berdasarkan template akun."
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => void reportQuery.refetch()}
                disabled={reportQuery.isFetching}
              >
                <RefreshCw className={cn('h-4 w-4', reportQuery.isFetching && 'animate-spin')} />
                Muat Ulang
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleExport}
                disabled={isExporting || !resolvedCompanyId}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={templatePrint.openPrintDialog}
                disabled={reportQuery.isLoading}
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button
                type="button"
                onClick={handleSync}
                disabled={updateTemplateMutation.isPending || !resolvedCompanyId}
              >
                <RefreshCw className={cn('h-4 w-4', updateTemplateMutation.isPending && 'animate-spin')} />
                Sinkron
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={() => {
                  const slug = router.query.slug ? String(router.query.slug) : '';
                  void router.push(`/dashboard/${slug}/laporan/laporan-laba-rugi/template`);
                }}
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Sesuaikan template
              </Button>
            </>
          }
        />

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 no-print">
          <SearchInput
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            placeholder="Cari kode atau nama akun"
            aria-label="Cari akun laporan laba rugi"
            wrapperClassName="w-full sm:w-[280px]"
          />

          <div className="w-full sm:w-[320px]">
            <DatePickerWithRange
              date={dateRange}
              onChange={setDateRange}
              enablePeriodFilter
              mode={dateMode}
              onModeChange={(nextMode) => {
                setDateMode(nextMode);
                setDateRange(undefined);
              }}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-9 w-full sm:w-auto"
            onClick={() => {
              setSearchInput('');
              setDateRange(undefined);
              setDateMode('date');
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Pendapatan</p>
            <AmountSummary
              idrValue={normalizedSections.revenue.total}
              usdValue={normalizedSections.revenue.totalUsd}
              className="mt-2 text-emerald-700 [&>p:first-child]:text-xl"
            />
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Laba Kotor</p>
            <AmountSummary
              idrValue={grossProfitTotal}
              usdValue={grossProfitUsdTotal}
              className="mt-2 text-slate-900 [&>p:first-child]:text-xl"
            />
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Biaya Operasional</p>
            <AmountSummary
              idrValue={normalizedSections.opex.total}
              usdValue={normalizedSections.opex.totalUsd}
              className="mt-2 text-rose-700 [&>p:first-child]:text-xl"
            />
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Laba Sebelum Pajak</p>
            <AmountSummary
              idrValue={profitBeforeTax}
              usdValue={profitBeforeTaxUsd}
              className={cn('mt-2 [&>p:first-child]:text-xl', profitBeforeTax < 0 ? 'text-rose-700' : 'text-slate-900')}
            />
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Laba Setelah Pajak</p>
            <AmountSummary
              idrValue={profitAfterTax}
              usdValue={profitAfterTaxUsd}
              className={cn('mt-2 [&>p:first-child]:text-xl', profitAfterTax < 0 ? 'text-rose-700' : 'text-emerald-700')}
            />
          </div>
        </div>

        {reportQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-40 w-full rounded-md" />
            <Skeleton className="h-40 w-full rounded-md" />
            <Skeleton className="h-40 w-full rounded-md" />
          </div>
        ) : reportQuery.isError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
            Gagal memuat laporan laba rugi.
          </div>
        ) : (
          <div className="space-y-4">
            {REPORT_SECTIONS.map((section) => (
              <SectionViewer
                key={section.key}
                config={section}
                reportSection={filteredSections[section.key]}
              />
            ))}
          </div>
        )}

        {/* Form Tax & Perhitungan Laba Rugi Bersih (Bagian Bawah) */}
        <section className="rounded-md border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Perhitungan Pajak & Laba Rugi Bersih</h2>
              <p className="text-sm text-slate-500">
                Atur persentase pajak (menerima masukan bilangan desimal) untuk menyesuaikan nominal Laba / (Rugi) Bersih Setelah Pajak.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="tax-input-field" className="text-sm font-medium text-slate-700 whitespace-nowrap">
                Pajak (%):
              </Label>
              <div className="relative w-36">
                <Input
                  id="tax-input-field"
                  type="number"
                  step="any"
                  min="0"
                  max="100"
                  value={taxInput}
                  onChange={(e) => setTaxInput(e.target.value)}
                  placeholder="0"
                  className="pr-8 text-right font-semibold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">%</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Laba / (Rugi) Bersih Sebelum Pajak
              </p>
              <AmountSummary
                idrValue={profitBeforeTax}
                usdValue={profitBeforeTaxUsd}
                className={cn('mt-2 [&>p:first-child]:text-xl', profitBeforeTax < 0 ? 'text-rose-700' : 'text-slate-900')}
              />
            </div>

            <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
                Beban Pajak ({taxPercentage}%)
              </p>
              <AmountSummary
                idrValue={taxAmount}
                usdValue={taxAmountUsd}
                className="mt-2 text-amber-800 [&>p:first-child]:text-xl"
              />
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
                Laba / (Rugi) Bersih Setelah Pajak
              </p>
              <AmountSummary
                idrValue={profitAfterTax}
                usdValue={profitAfterTaxUsd}
                className={cn('mt-2 [&>p:first-child]:text-xl', profitAfterTax < 0 ? 'text-rose-700' : 'text-emerald-800')}
              />
            </div>
          </div>
        </section>

        <LaporanLabaRugiPrintDocument
          template={templatePrint.selectedTemplate}
          fallbackBackground={selectedPrintBackground}
          companyName={getCompanyName(resolvedCompanyId)}
          periodLabel={periodLabel}
          sections={printSections}
          grossProfit={grossProfitTotal}
          grossProfitUsd={grossProfitUsdTotal}
          profitBeforeTax={profitBeforeTax}
          profitBeforeTaxUsd={profitBeforeTaxUsd}
          taxPercentage={taxPercentage}
          taxAmount={taxAmount}
          taxAmountUsd={taxAmountUsd}
          profitAfterTax={profitAfterTax}
          profitAfterTaxUsd={profitAfterTaxUsd}
          printedAt={templatePrint.printedAt}
        />

        <ReportTemplatePrintDialog
          open={templatePrint.isDialogOpen}
          onOpenChange={templatePrint.setIsDialogOpen}
          selectedTemplateId={templatePrint.selectedTemplateId}
          onTemplateChange={templatePrint.setSelectedTemplateId}
          onPrint={templatePrint.printWithSelectedTemplate}
          isPreparingPrint={templatePrint.isPreparingPrint}
          reportName="laporan laba rugi"
        />
      </div>
    </DashboardLayout>
  );
}
