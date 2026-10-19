import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  ArrowLeft,
  Calendar,
  Check,
  Copy,
  Layers,
  Plus,
  RotateCcw,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

import type {
  MonthKey,
  ProfitLossTemplateKey,
  ProfitLossYearConfig,
  SaveProfitLossTemplateYearPayload,
} from '@/@types/profit-loss-report.types';
import type { Account } from '@/@types/account.types';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CollapsibleBox } from '@/components/ui/collapsible-box';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SearchableMultipleSelect } from '@/components/ui/searchable-multiple-select';
import { useCompany } from '@/contexts/CompanyContext';
import { useAccounts } from '@/hooks/useAccount';
import {
  useCreateProfitLossTemplateYear,
  useProfitLossTemplate,
  useUpdateProfitLossTemplateYear,
} from '@/hooks/report/useProfitLossReport';
import { resolveCompanyId } from '@/lib/print-letterhead';
import { cn } from '@/lib/utils';

const MONTHS: { key: MonthKey; label: string }[] = [
  { key: 'january', label: 'Januari' },
  { key: 'february', label: 'Februari' },
  { key: 'march', label: 'Maret' },
  { key: 'april', label: 'April' },
  { key: 'may', label: 'Mei' },
  { key: 'june', label: 'Juni' },
  { key: 'july', label: 'Juli' },
  { key: 'august', label: 'Agustus' },
  { key: 'september', label: 'September' },
  { key: 'october', label: 'Oktober' },
  { key: 'november', label: 'November' },
  { key: 'december', label: 'Desember' },
];

interface CalcGroupMeta {
  key: ProfitLossTemplateKey;
  title: string;
  description: string;
}

const CALC_GROUPS: CalcGroupMeta[] = [
  {
    key: 'revenue_account_ids',
    title: 'Pendapatan',
    description: 'Penjualan & pendapatan utama.',
  },
  {
    key: 'cogs_account_ids',
    title: 'Beban Pokok Usaha',
    description: 'Harga pokok penjualan / HPP.',
  },
  {
    key: 'opex_account_ids',
    title: 'Beban Operasional',
    description: 'Beban operasional kantor & logistik.',
  },
  {
    key: 'non_opex_account_ids',
    title: 'Beban Non-Operasional',
    description: 'Beban di luar kegiatan operasional utama (bunga pinjaman, dsb).',
  },
];

const createEmptyMonthlyAccounts = (): Record<MonthKey, number[]> => ({
  january: [],
  february: [],
  march: [],
  april: [],
  may: [],
  june: [],
  july: [],
  august: [],
  september: [],
  october: [],
  november: [],
  december: [],
});

const createEmptyYearConfig = (): ProfitLossYearConfig => ({
  revenue_account_ids: createEmptyMonthlyAccounts(),
  cogs_account_ids: createEmptyMonthlyAccounts(),
  opex_account_ids: createEmptyMonthlyAccounts(),
  non_opex_account_ids: createEmptyMonthlyAccounts(),
  tax: null,
});

function AccountMultipleSelect({
  values,
  accounts,
  disabledValues,
  placeholder,
  onChange,
}: {
  values: number[];
  accounts: Account[];
  disabledValues?: string[];
  placeholder?: string;
  onChange: (values: number[]) => void;
}) {
  const accountOptions = useMemo(() => {
    return accounts.map((account) => {
      const isDebet = account.type === 'debit' || account.type === 'debet';
      const typeLabel = isDebet ? 'DEBIT' : 'KREDIT';
      const codeStr = account.code ? ` ${account.code}` : '';
      // Format: [{type}] {name} {code}
      return {
        value: String(account.id),
        label: `[${typeLabel}] ${account.name}${codeStr}`.trim(),
      };
    });
  }, [accounts]);

  const placeholderText = placeholder || 'Pilih akun...';
  const searchPlaceholderText = 'Cari akun...';

  return (
    <SearchableMultipleSelect
      values={values.map(String)}
      options={accountOptions}
      disabledValues={disabledValues}
      disabledLabel="Sudah digunakan"
      placeholder={placeholderText}
      searchPlaceholder={searchPlaceholderText}
      emptyText="Akun tidak ditemukan."
      className="bg-white"
      onChange={(nextValues) => {
        const nextIds = nextValues.map(Number).filter((id) => !isNaN(id) && id > 0);
        onChange(nextIds);
      }}
    />
  );
}

export default function LaporanLabaRugiTemplatePage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const resolvedCompanyId = resolveCompanyId(router.query.slug, companyId);
  const currentYearNumber = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState<number>(currentYearNumber);
  const [yearConfig, setYearConfig] = useState<ProfitLossYearConfig>(createEmptyYearConfig);
  const [taxInput, setTaxInput] = useState<string>('');
  const [isAddYearOpen, setIsAddYearOpen] = useState(false);
  const [newYearInput, setNewYearInput] = useState<string>(String(currentYearNumber + 1));

  // Copy modal state
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [copyActiveTab, setCopyActiveTab] = useState<'year' | 'month'>('year');
  const [copySourceYear, setCopySourceYear] = useState<string>('');
  const [copySourceMonth, setCopySourceMonth] = useState<MonthKey>('january');
  const [copyTargetMonthMode, setCopyTargetMonthMode] = useState<'all' | MonthKey>('all');

  // Reset month modal state
  const [resetMonthTarget, setResetMonthTarget] = useState<MonthKey | null>(null);

  // Queries
  const templateQuery = useProfitLossTemplate(resolvedCompanyId, undefined, Boolean(resolvedCompanyId));
  const accountQuery = useAccounts({
    page: 1,
    perPage: 1000,
    search: '',
    company_id: resolvedCompanyId ?? undefined,
    enabled: Boolean(resolvedCompanyId),
  });
  const accounts = useMemo(() => accountQuery.data?.data ?? [], [accountQuery.data?.data]);

  // Mutations
  const createYearMutation = useCreateProfitLossTemplateYear(resolvedCompanyId);
  const updateYearMutation = useUpdateProfitLossTemplateYear(resolvedCompanyId, selectedYear);

  const existingYears = useMemo(() => {
    const list = templateQuery.data?.data?.template?.profit_loss_template_years ?? [];
    const years = list.map((item) => Number(item.year)).filter((y) => !isNaN(y) && y > 0);
    if (!years.includes(selectedYear)) {
      years.push(selectedYear);
    }
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [templateQuery.data?.data?.template?.profit_loss_template_years, selectedYear]);

  // Available source years for copy (all configured years except selectedYear)
  const availableSourceYears = useMemo(() => {
    const list = templateQuery.data?.data?.template?.profit_loss_template_years ?? [];
    return list
      .map((item) => Number(item.year))
      .filter((y) => !isNaN(y) && y > 0 && y !== selectedYear)
      .sort((a, b) => b - a);
  }, [templateQuery.data?.data?.template?.profit_loss_template_years, selectedYear]);

  // Synchronize year config when selectedYear or templateQuery changes
  useEffect(() => {
    const templateData = templateQuery.data?.data?.template;
    if (!templateData) return;

    const matchedYear = templateData.profit_loss_template_years?.find(
      (item) => Number(item.year) === Number(selectedYear),
    );

    if (matchedYear && matchedYear.config) {
      const merged: ProfitLossYearConfig = {
        revenue_account_ids: { ...createEmptyMonthlyAccounts(), ...(matchedYear.config.revenue_account_ids || {}) },
        cogs_account_ids: { ...createEmptyMonthlyAccounts(), ...(matchedYear.config.cogs_account_ids || {}) },
        opex_account_ids: { ...createEmptyMonthlyAccounts(), ...(matchedYear.config.opex_account_ids || {}) },
        non_opex_account_ids: { ...createEmptyMonthlyAccounts(), ...(matchedYear.config.non_opex_account_ids || {}) },
        tax: matchedYear.config.tax ?? null,
      };
      setYearConfig(merged);
      setTaxInput(
        matchedYear.config.tax !== null && matchedYear.config.tax !== undefined
          ? String(matchedYear.config.tax)
          : '',
      );
    } else {
      setYearConfig(createEmptyYearConfig());
      setTaxInput('');
    }
  }, [selectedYear, templateQuery.data?.data?.template]);

  const handleAccountChange = (
    groupKey: ProfitLossTemplateKey,
    monthKey: MonthKey,
    nextIds: number[],
  ) => {
    setYearConfig((prev) => ({
      ...prev,
      [groupKey]: {
        ...(prev[groupKey] || createEmptyMonthlyAccounts()),
        [monthKey]: nextIds,
      },
    }));
  };

  // Action: Salin berdasarkan tahun
  const handleCopyFromYear = () => {
    const srcYear = Number(copySourceYear);
    if (!srcYear) {
      toast.error('Pilih tahun asal yang ingin disalin.');
      return;
    }

    const templateData = templateQuery.data?.data?.template;
    const sourceMatched = templateData?.profit_loss_template_years?.find(
      (item) => Number(item.year) === srcYear,
    );

    if (!sourceMatched || !sourceMatched.config) {
      toast.error(`Konfigurasi tahun ${srcYear} tidak ditemukan.`);
      return;
    }

    const sourceConfig = sourceMatched.config;
    const cloned: ProfitLossYearConfig = {
      revenue_account_ids: { ...createEmptyMonthlyAccounts(), ...(sourceConfig.revenue_account_ids || {}) },
      cogs_account_ids: { ...createEmptyMonthlyAccounts(), ...(sourceConfig.cogs_account_ids || {}) },
      opex_account_ids: { ...createEmptyMonthlyAccounts(), ...(sourceConfig.opex_account_ids || {}) },
      non_opex_account_ids: { ...createEmptyMonthlyAccounts(), ...(sourceConfig.non_opex_account_ids || {}) },
      tax: sourceConfig.tax ?? null,
    };

    setYearConfig(cloned);
    setTaxInput(sourceConfig.tax !== null && sourceConfig.tax !== undefined ? String(sourceConfig.tax) : '');
    setIsCopyDialogOpen(false);
    toast.success(`Konfigurasi template berhasil disalin dari tahun ${srcYear} ke tahun ${selectedYear}!`);
  };

  // Action: Salin template antar bulan
  const handleCopyMonthTemplate = () => {
    const sanitizeList = (ids?: number[]) => (ids || []).filter((id) => Number(id) > 0);
    const sourceRev = sanitizeList(yearConfig.revenue_account_ids[copySourceMonth]);
    const sourceCogs = sanitizeList(yearConfig.cogs_account_ids[copySourceMonth]);
    const sourceOpex = sanitizeList(yearConfig.opex_account_ids[copySourceMonth]);
    const sourceNonOpex = sanitizeList(yearConfig.non_opex_account_ids?.[copySourceMonth]);

    const newRev = { ...yearConfig.revenue_account_ids };
    const newCogs = { ...yearConfig.cogs_account_ids };
    const newOpex = { ...yearConfig.opex_account_ids };
    const newNonOpex = { ...(yearConfig.non_opex_account_ids || createEmptyMonthlyAccounts()) };

    const sourceLabel = MONTHS.find((m) => m.key === copySourceMonth)?.label ?? copySourceMonth;

    if (copyTargetMonthMode === 'all') {
      MONTHS.forEach(({ key }) => {
        newRev[key] = [...sourceRev];
        newCogs[key] = [...sourceCogs];
        newOpex[key] = [...sourceOpex];
        newNonOpex[key] = [...sourceNonOpex];
      });
      toast.success(`Konfigurasi akun dari bulan ${sourceLabel} berhasil disalin ke seluruh bulan!`);
    } else {
      const targetMonthKey = copyTargetMonthMode;
      newRev[targetMonthKey] = [...sourceRev];
      newCogs[targetMonthKey] = [...sourceCogs];
      newOpex[targetMonthKey] = [...sourceOpex];
      newNonOpex[targetMonthKey] = [...sourceNonOpex];
      const targetLabel = MONTHS.find((m) => m.key === targetMonthKey)?.label ?? targetMonthKey;
      toast.success(`Konfigurasi akun dari bulan ${sourceLabel} berhasil disalin ke bulan ${targetLabel}!`);
    }

    setYearConfig((prev) => ({
      ...prev,
      revenue_account_ids: newRev,
      cogs_account_ids: newCogs,
      opex_account_ids: newOpex,
      non_opex_account_ids: newNonOpex,
    }));

    setIsCopyDialogOpen(false);
  };

  // Action: Reset seluruh akun dari masing-masing grup pada bulan tertentu
  const handleConfirmResetMonth = () => {
    if (!resetMonthTarget) return;

    const targetLabel = MONTHS.find((m) => m.key === resetMonthTarget)?.label ?? resetMonthTarget;

    setYearConfig((prev) => ({
      ...prev,
      revenue_account_ids: { ...prev.revenue_account_ids, [resetMonthTarget]: [] },
      cogs_account_ids: { ...prev.cogs_account_ids, [resetMonthTarget]: [] },
      opex_account_ids: { ...prev.opex_account_ids, [resetMonthTarget]: [] },
      non_opex_account_ids: { ...(prev.non_opex_account_ids || createEmptyMonthlyAccounts()), [resetMonthTarget]: [] },
    }));

    toast.success(`Seluruh akun pada bulan ${targetLabel} berhasil dikosongkan.`);
    setResetMonthTarget(null);
  };

  const sanitizeGroupAccounts = (
    monthlyData?: Record<MonthKey, number[]>,
  ): Record<MonthKey, number[]> => {
    const result: Record<MonthKey, number[]> = {} as Record<MonthKey, number[]>;
    for (const m of MONTHS) {
      const list = monthlyData?.[m.key] || [];
      result[m.key] = Array.from(new Set(list.filter((id) => Number(id) > 0)));
    }
    return result;
  };

  const handleSave = async () => {
    if (!resolvedCompanyId) {
      toast.error('Perusahaan belum dipilih.');
      return;
    }

    // Validasi: satu akun tidak boleh masuk ke lebih dari satu grup kalkulasi pada bulan yang sama
    for (const m of MONTHS) {
      const seenAccounts = new Map<number, string>();
      for (const group of CALC_GROUPS) {
        const list = yearConfig[group.key]?.[m.key] || [];
        for (const id of list) {
          const numId = Number(id);
          if (numId > 0) {
            if (seenAccounts.has(numId)) {
              const prevGroupTitle = seenAccounts.get(numId);
              const accObj = accounts.find((a) => Number(a.id) === numId);
              const accLabel = accObj ? `${accObj.code} - ${accObj.name}` : `ID ${numId}`;
              toast.error(
                `Akun [${accLabel}] tidak boleh digunakan di lebih dari satu grup pada bulan ${m.label} (sudah dipilih di "${prevGroupTitle}" dan "${group.title}").`,
              );
              return;
            }
            seenAccounts.set(numId, group.title);
          }
        }
      }
    }

    const templateData = templateQuery.data?.data?.template;
    const isExistingInDb = templateData?.profit_loss_template_years?.some(
      (item) => Number(item.year) === Number(selectedYear),
    );

    const parsedTax = taxInput.trim() === '' ? null : Number(taxInput);

    const payload: SaveProfitLossTemplateYearPayload = {
      year: selectedYear,
      tax: !isNaN(Number(parsedTax)) ? parsedTax : null,
      revenue_account_ids: sanitizeGroupAccounts(yearConfig.revenue_account_ids),
      cogs_account_ids: sanitizeGroupAccounts(yearConfig.cogs_account_ids),
      opex_account_ids: sanitizeGroupAccounts(yearConfig.opex_account_ids),
      non_opex_account_ids: sanitizeGroupAccounts(yearConfig.non_opex_account_ids),
    };

    try {
      if (isExistingInDb) {
        await updateYearMutation.mutateAsync(payload);
        toast.success(`Konfigurasi template laba rugi tahun ${selectedYear} berhasil diperbarui.`);
      } else {
        await createYearMutation.mutateAsync(payload);
        toast.success(`Konfigurasi template laba rugi tahun ${selectedYear} berhasil dibuat.`);
      }
      await templateQuery.refetch();
    } catch (error) {
      toast.error((error as Error)?.message || 'Gagal menyimpan konfigurasi template.');
    }
  };

  const handleAddNewYearConfirm = () => {
    const yr = Number(newYearInput.trim());
    if (isNaN(yr) || yr < 2000 || yr > 2100) {
      toast.error('Masukkan tahun yang valid antara 2000 - 2100.');
      return;
    }
    setSelectedYear(yr);
    setIsAddYearOpen(false);
  };

  const isSaving = createYearMutation.isPending || updateYearMutation.isPending;

  const backToReport = () => {
    const slug = router.query.slug ? String(router.query.slug) : '';
    void router.push(`/dashboard/${slug}/laporan/laporan-laba-rugi`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Sesuaikan Template Laba Rugi"
          subtitle="Atur daftar akun untuk masing-masing grup kalkulasi per bulan dalam tahunan."
          breadcrumbs={[
            { label: 'Laporan Laba Rugi', onClick: backToReport },
            { label: 'Sesuaikan Template' },
          ]}
          onBack={backToReport}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={backToReport}
                disabled={isSaving}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (availableSourceYears.length > 0 && !copySourceYear) {
                    setCopySourceYear(String(availableSourceYears[0]));
                  }
                  setIsCopyDialogOpen(true);
                }}
                title="Buka opsi salin template dan salin antar tahun"
              >
                <Copy className="mr-2 h-4 w-4" />
                Salin Konfigurasi
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={handleSave}
                disabled={isSaving || !resolvedCompanyId}
              >
                <Save className={cn('mr-2 h-4 w-4', isSaving && 'animate-spin')} />
                Simpan Konfigurasi
              </Button>
            </div>
          }
        />

        {/* Top Control Bar: Select Tahun & Global Tax */}
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 items-end">
            {/* Select Tahun */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="year-select" className="text-sm font-semibold text-slate-800">
                  Tahun Konfigurasi
                </Label>
                <Button
                  type="button"
                  variant="default"
                  onClick={() => setIsAddYearOpen(true)}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Tambah Tahun
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={String(selectedYear)}
                  onValueChange={(val) => setSelectedYear(Number(val))}
                >
                  <SelectTrigger id="year-select" className="w-full">
                    <SelectValue placeholder="Pilih tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingYears.map((yr) => (
                      <SelectItem key={yr} value={String(yr)}>
                        Tahun {yr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Input Pajak Tahunan */}
            <div className="space-y-2">
              <Label htmlFor="tax-input" className="text-sm font-semibold text-slate-800">
                Pajak Tahun {selectedYear} (%)
              </Label>
              <div className="relative">
                <Input
                  id="tax-input"
                  type="number"
                  step="any"
                  min="0"
                  max="100"
                  value={taxInput}
                  onChange={(e) => setTaxInput(e.target.value)}
                  placeholder="Contoh: 11"
                  className="pr-8 font-medium"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  %
                </span>
              </div>
            </div>

            {/* Status Keterangan & Shortcut Salin */}
            <div className="space-y-1.5 pb-1">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                <span>
                  Mengedit template tahun <strong>{selectedYear}</strong>.
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Menampilkan data akun berdasarkan bulan untuk tahun terkait.
              </p>
            </div>
          </div>
        </section>

        {/* Loading State */}
        {templateQuery.isLoading || accountQuery.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        ) : (
          /* Daftar 12 Bulan Menggunakan CollapsibleBox dengan Kalkulasi Grup Inline Ringkas */
          <div className="space-y-4">
            {MONTHS.map((month, monthIndex) => {
              const monthKey = month.key;
              const currentMonthIndex = new Date().getMonth(); // 0 = Jan
              const isDefaultExpanded = monthIndex === currentMonthIndex || monthIndex === 0;

              // Hitung total akun terkonfigurasi di bulan ini
              const totalAccountsInMonth =
                (yearConfig.revenue_account_ids[monthKey]?.filter((id) => Number(id) > 0).length || 0) +
                (yearConfig.cogs_account_ids[monthKey]?.filter((id) => Number(id) > 0).length || 0) +
                (yearConfig.opex_account_ids[monthKey]?.filter((id) => Number(id) > 0).length || 0) +
                (yearConfig.non_opex_account_ids?.[monthKey]?.filter((id) => Number(id) > 0).length || 0);

              return (
                <CollapsibleBox
                  key={monthKey}
                  title={month.label}
                  description={`${totalAccountsInMonth} akun terkonfigurasi`}
                  icon={Calendar}
                  defaultExpanded={isDefaultExpanded}
                  actions={
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs font-semibold',
                          totalAccountsInMonth > 0
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-slate-50 text-slate-500',
                        )}
                      >
                        {totalAccountsInMonth} Akun
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setResetMonthTarget(monthKey);
                        }}
                        disabled={totalAccountsInMonth === 0}
                        className="h-7 text-xs px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 disabled:text-slate-300 hidden sm:inline-flex"
                        title={
                          totalAccountsInMonth > 0
                            ? `Reset seluruh akun pada bulan ${month.label}`
                            : 'Belum ada akun untuk direset'
                        }
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        Reset Data Akun
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCopySourceMonth(monthKey);
                          setCopyActiveTab('month');
                          setIsCopyDialogOpen(true);
                        }}
                        className="h-7 text-xs px-2 text-slate-600 hover:text-orange-700 hover:bg-orange-50 hidden sm:inline-flex"
                        title={`Salin konfigurasi bulan ${month.label} ke bulan lain`}
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        Salin
                      </Button>
                    </div>
                  }
                >
                  {/* Container Grup Kalkulasi Inline Ringkas */}
                  <div className="divide-y divide-slate-100 bg-white rounded-md border border-slate-100 px-3 sm:px-4">
                    {CALC_GROUPS.map((group) => {
                      const accountIds = yearConfig[group.key]?.[monthKey] || [];
                      const activeCount = accountIds.filter((id) => Number(id) > 0).length;

                      // Kumpulkan seluruh ID akun aktif dari grup kalkulasi LAIN pada bulan yang sama
                      const otherGroupsAccountIds = CALC_GROUPS
                        .filter((g) => g.key !== group.key)
                        .flatMap((g) =>
                          (yearConfig[g.key]?.[monthKey] || []).filter((id) => Number(id) > 0),
                        );

                      return (
                        <div
                          key={`${monthKey}-${group.key}`}
                          className="flex flex-col lg:flex-row lg:items-start gap-3 sm:gap-4 py-3.5"
                        >
                          {/* Kolom Kiri: Header Grup Inline */}
                          <div className="w-full lg:w-60 xl:w-64 shrink-0 space-y-1">
                            <span className="text-sm font-semibold text-slate-900">{group.title}</span>
                            <p className="text-xs text-slate-500">{group.description}</p>
                            <span className="inline-block text-[11px] font-medium text-slate-400">
                              {activeCount} akun aktif
                            </span>
                          </div>

                          {/* Kolom Kanan: Multiple Select Akun */}
                          <div className="flex-1 min-w-0">
                            <AccountMultipleSelect
                              values={accountIds}
                              accounts={accounts}
                              disabledValues={otherGroupsAccountIds.map(String)}
                              placeholder={`Pilih akun ${group.title.toLowerCase()}...`}
                              onChange={(next) => {
                                handleAccountChange(group.key, monthKey, next);
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleBox>
              );
            })}
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-end gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm no-print">
          <Button
            type="button"
            variant="outline"
            onClick={backToReport}
            disabled={isSaving}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleSave}
            disabled={isSaving || !resolvedCompanyId}
          >
            <Save className={cn('mr-2 h-4 w-4', isSaving && 'animate-spin')} />
            Simpan Konfigurasi
          </Button>
        </div>
      </div>

      {/* Dialog Tambah Tahun Baru */}
      <Dialog open={isAddYearOpen} onOpenChange={setIsAddYearOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Tahun Konfigurasi</DialogTitle>
            <DialogDescription>
              Masukkan tahun baru untuk menambahkan template kalkulasi laba rugi tahun tersebut.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <Label htmlFor="new-year-field">Tahun (4 Digit)</Label>
            <Input
              id="new-year-field"
              type="number"
              min="2000"
              max="2100"
              value={newYearInput}
              onChange={(e) => setNewYearInput(e.target.value)}
              placeholder="Contoh: 2027"
              className="font-semibold"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddYearOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={handleAddNewYearConfirm}
            >
              <Check className="mr-1.5 h-4 w-4" />
              Pilih Tahun
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Fitur Salin: Copy Berdasarkan Tahun & Copy Template Bulan */}
      <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Salin Konfigurasi & Template</DialogTitle>
            <DialogDescription>
              Pilih metode penyalinan untuk mempercepat pengaturan konfigurasi akun.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={copyActiveTab}
            onValueChange={(val) => setCopyActiveTab(val as 'year' | 'month')}
            className="w-full mt-2"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="year" className="text-xs sm:text-sm">
                <Calendar className="mr-1.5 h-3.5 w-3.5" />
                Salin Berdasarkan Tahun
              </TabsTrigger>
              <TabsTrigger value="month" className="text-xs sm:text-sm">
                <Layers className="mr-1.5 h-3.5 w-3.5" />
                Salin Template Bulan
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Salin Berdasarkan Tahun */}
            <TabsContent value="year" className="space-y-4 pt-3">
              <p className="text-xs text-slate-500">
                Salin seluruh konfigurasi 12 bulan dan nilai pajak dari tahun lain yang sudah tersimpan ke tahun yang sedang aktif saat ini (<strong>Tahun {selectedYear}</strong>).
              </p>

              {availableSourceYears.length === 0 ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  Belum ada tahun lain yang tersimpan di sistem untuk disalin. Silakan atur konfigurasi secara manual atau tambahkan tahun lain terlebih dahulu.
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="source-year-select">Pilih Tahun Asal</Label>
                  <Select
                    value={copySourceYear}
                    onValueChange={(val) => setCopySourceYear(val)}
                  >
                    <SelectTrigger id="source-year-select">
                      <SelectValue placeholder="Pilih tahun asal..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSourceYears.map((yr) => (
                        <SelectItem key={yr} value={String(yr)}>
                          Tahun {yr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCopyDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  variant="default"
                  onClick={handleCopyFromYear}
                  disabled={availableSourceYears.length === 0 || !copySourceYear}
                >
                  <Copy className="mr-1.5 h-4 w-4" />
                  Terapkan ke Tahun {selectedYear}
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* TAB 2: Salin Template Bulan */}
            <TabsContent value="month" className="space-y-4 pt-3">
              <p className="text-xs text-slate-500">
                Salin susunan akun dari satu bulan terpilih ke bulan lain pada tahun <strong>{selectedYear}</strong>.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="source-month-select">Bulan Asal (Sumber)</Label>
                  <Select
                    value={copySourceMonth}
                    onValueChange={(val) => setCopySourceMonth(val as MonthKey)}
                  >
                    <SelectTrigger id="source-month-select">
                      <SelectValue placeholder="Pilih bulan sumber" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m.key} value={m.key}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="target-month-select">Target Penerima</Label>
                  <Select
                    value={copyTargetMonthMode}
                    onValueChange={(val) => setCopyTargetMonthMode(val as 'all' | MonthKey)}
                  >
                    <SelectTrigger id="target-month-select">
                      <SelectValue placeholder="Pilih target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Bulan Lainnya</SelectItem>
                      {MONTHS.filter((m) => m.key !== copySourceMonth).map((m) => (
                        <SelectItem key={m.key} value={m.key}>
                          Hanya Bulan {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCopyDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  variant="default"
                  onClick={handleCopyMonthTemplate}
                >
                  <Copy className="mr-1.5 h-4 w-4" />
                  Salin Akun Bulan
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Reset Data Akun Bulan */}
      <AlertDialog
        open={Boolean(resetMonthTarget)}
        onOpenChange={(open) => {
          if (!open) setResetMonthTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Reset Data Akun Bulan {MONTHS.find((m) => m.key === resetMonthTarget)?.label}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin mereset seluruh akun pada bulan{' '}
              <strong>
                {MONTHS.find((m) => m.key === resetMonthTarget)?.label} {selectedYear}
              </strong>
              ? Tindakan ini akan mengosongkan semua akun dari masing-masing grup kalkulasi di bulan ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResetMonthTarget(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmResetMonth}
              className="bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500"
            >
              Ya, Reset Akun
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
