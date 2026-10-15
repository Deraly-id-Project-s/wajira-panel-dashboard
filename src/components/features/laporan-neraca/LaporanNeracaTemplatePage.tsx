import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  ArrowLeft,
  Calendar,
  Check,
  Copy,
  Plus,
  RotateCcw,
  Save,
  Scale,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import type {
  BalanceSheetConfig,
  BalanceTemplateKey,
  CreateBalanceYearPayload,
} from '@/@types/balance-report.types';
import type { Account } from '@/@types/account.types';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SearchableMultipleSelect } from '@/components/ui/searchable-multiple-select';
import { useCompany } from '@/contexts/CompanyContext';
import { useAccounts } from '@/hooks/useAccount';
import {
  useBalanceTemplate,
  useCreateBalanceYearConfig,
  useDeleteBalanceYearConfig,
  useUpdateBalanceYearConfig,
} from '@/hooks/report/useBalanceReport';
import { resolveCompanyId } from '@/lib/print-letterhead';
import { cn } from '@/lib/utils';

interface CalcGroupMeta {
  key: BalanceTemplateKey;
  title: string;
  side: 'aktiva' | 'pasiva';
  description: string;
  expectedType: 'debit' | 'credit';
}

const CALC_GROUPS: CalcGroupMeta[] = [
  {
    key: 'current_asset_account_ids',
    title: 'Aset Lancar',
    side: 'aktiva',
    description: 'Kas, Bank, Piutang Usaha, Uang Muka, Perlengkapan, dan setara kas.',
    expectedType: 'debit',
  },
  {
    key: 'fixed_asset_account_ids',
    title: 'Aset Tetap',
    side: 'aktiva',
    description: 'Kendaraan, Truk Ekspedisi, Peralatan Operasional, Gedung, dan Akumulasi Penyusutan.',
    expectedType: 'debit',
  },
  {
    key: 'liability_account_ids',
    title: 'Kewajiban',
    side: 'pasiva',
    description: 'Hutang Usaha, Hutang Bank, Hutang Pajak, dan Hutang Lain-lain.',
    expectedType: 'credit',
  },
  {
    key: 'equity_account_ids',
    title: 'Modal',
    side: 'pasiva',
    description: 'Modal Disetor Pemilik, Laba Ditahan, dan Prive.',
    expectedType: 'credit',
  },
];

const createEmptyConfig = (): BalanceSheetConfig => ({
  current_asset_account_ids: [],
  fixed_asset_account_ids: [],
  liability_account_ids: [],
  equity_account_ids: [],
});

function AccountMultipleSelect({
  values,
  accounts,
  disabledValues,
  placeholder,
  expectedType,
  onChange,
}: {
  values: number[];
  accounts: Account[];
  disabledValues?: string[];
  placeholder?: string;
  expectedType?: 'debit' | 'credit';
  onChange: (values: number[]) => void;
}) {
  const accountOptions = useMemo(() => {
    return accounts.map((account) => {
      const isDebet = account.type === 'debit' || account.type === 'debet';
      const typeLabel = isDebet ? 'DEBIT' : 'KREDIT';
      const codeStr = account.code ? ` ${account.code}` : '';
      return {
        value: String(account.id),
        label: `[${typeLabel}] ${account.name}${codeStr}`.trim(),
      };
    });
  }, [accounts]);

  return (
    <SearchableMultipleSelect
      values={values.map(String)}
      options={accountOptions}
      disabledValues={disabledValues}
      disabledLabel="Sudah digunakan"
      placeholder={placeholder || 'Pilih akun...'}
      searchPlaceholder="Cari akun..."
      emptyText="Akun tidak ditemukan."
      className="bg-white"
      onChange={(nextValues) => {
        const nextIds = nextValues.map(Number).filter((id) => !isNaN(id) && id > 0);
        onChange(nextIds);
      }}
    />
  );
}

export default function LaporanNeracaTemplatePage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const resolvedCompanyId = resolveCompanyId(router.query.slug, companyId);
  const currentYearNumber = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState<number>(currentYearNumber);
  const [config, setConfig] = useState<BalanceSheetConfig>(createEmptyConfig);
  const [isAddYearOpen, setIsAddYearOpen] = useState(false);
  const [newYearInput, setNewYearInput] = useState<string>(String(currentYearNumber + 1));

  // Copy modal
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [copySourceYear, setCopySourceYear] = useState<string>('');

  // Delete year modal
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Queries
  const templateQuery = useBalanceTemplate(resolvedCompanyId, undefined, Boolean(resolvedCompanyId));
  const accountQuery = useAccounts({
    page: 1,
    perPage: 1000,
    search: '',
    company_id: resolvedCompanyId ?? undefined,
    enabled: Boolean(resolvedCompanyId),
  });
  const accounts = useMemo(() => accountQuery.data?.data ?? [], [accountQuery.data?.data]);

  // Mutations
  const createYearMutation = useCreateBalanceYearConfig(resolvedCompanyId);
  const updateYearMutation = useUpdateBalanceYearConfig(resolvedCompanyId, selectedYear);
  const deleteYearMutation = useDeleteBalanceYearConfig(resolvedCompanyId);

  const existingYears = useMemo(() => {
    const list = templateQuery.data?.data?.template?.ballance_template_years ?? [];
    const years = list.map((item) => Number(item.year)).filter((y) => !isNaN(y) && y > 0);
    if (!years.includes(selectedYear)) {
      years.push(selectedYear);
    }
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [templateQuery.data?.data?.template?.ballance_template_years, selectedYear]);

  const isSelectedYearInDb = useMemo(() => {
    const list = templateQuery.data?.data?.template?.ballance_template_years ?? [];
    return list.some((item) => Number(item.year) === Number(selectedYear));
  }, [templateQuery.data?.data?.template?.ballance_template_years, selectedYear]);

  // Available source years for copy
  const availableSourceYears = useMemo(() => {
    const list = templateQuery.data?.data?.template?.ballance_template_years ?? [];
    return list
      .map((item) => Number(item.year))
      .filter((y) => !isNaN(y) && y > 0 && y !== selectedYear)
      .sort((a, b) => b - a);
  }, [templateQuery.data?.data?.template?.ballance_template_years, selectedYear]);

  // Synchronize config when selectedYear or templateQuery changes
  useEffect(() => {
    const templateData = templateQuery.data?.data?.template;
    if (!templateData) return;

    const matchedYear = templateData.ballance_template_years?.find(
      (item) => Number(item.year) === Number(selectedYear),
    );

    if (matchedYear && matchedYear.config) {
      const merged: BalanceSheetConfig = {
        current_asset_account_ids: Array.isArray(matchedYear.config.current_asset_account_ids)
          ? matchedYear.config.current_asset_account_ids.map(Number).filter((n) => n > 0)
          : [],
        fixed_asset_account_ids: Array.isArray(matchedYear.config.fixed_asset_account_ids)
          ? matchedYear.config.fixed_asset_account_ids.map(Number).filter((n) => n > 0)
          : [],
        liability_account_ids: Array.isArray(matchedYear.config.liability_account_ids)
          ? matchedYear.config.liability_account_ids.map(Number).filter((n) => n > 0)
          : [],
        equity_account_ids: Array.isArray(matchedYear.config.equity_account_ids)
          ? matchedYear.config.equity_account_ids.map(Number).filter((n) => n > 0)
          : [],
      };
      setConfig(merged);
    } else {
      setConfig(createEmptyConfig());
    }
  }, [selectedYear, templateQuery.data?.data?.template]);

  const handleGroupAccountsChange = (groupKey: BalanceTemplateKey, nextIds: number[]) => {
    setConfig((prev) => ({
      ...prev,
      [groupKey]: nextIds,
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
    const sourceMatched = templateData?.ballance_template_years?.find(
      (item) => Number(item.year) === srcYear,
    );

    if (!sourceMatched || !sourceMatched.config) {
      toast.error(`Konfigurasi tahun ${srcYear} tidak ditemukan.`);
      return;
    }

    const src = sourceMatched.config;
    const cloned: BalanceSheetConfig = {
      current_asset_account_ids: Array.isArray(src.current_asset_account_ids) ? [...src.current_asset_account_ids] : [],
      fixed_asset_account_ids: Array.isArray(src.fixed_asset_account_ids) ? [...src.fixed_asset_account_ids] : [],
      liability_account_ids: Array.isArray(src.liability_account_ids) ? [...src.liability_account_ids] : [],
      equity_account_ids: Array.isArray(src.equity_account_ids) ? [...src.equity_account_ids] : [],
    };

    setConfig(cloned);
    setIsCopyDialogOpen(false);
    toast.success(`Konfigurasi template neraca berhasil disalin dari tahun ${srcYear} ke tahun ${selectedYear}!`);
  };

  // Action: Hapus konfigurasi tahun
  const handleDeleteYear = async () => {
    if (!resolvedCompanyId) return;

    try {
      await deleteYearMutation.mutateAsync(selectedYear);
      toast.success(`Konfigurasi tahun ${selectedYear} berhasil dihapus.`);
      setIsDeleteDialogOpen(false);
      await templateQuery.refetch();
    } catch (error) {
      toast.error((error as Error)?.message || 'Gagal menghapus konfigurasi tahun.');
    }
  };

  // Action: Simpan konfigurasi
  const handleSave = async () => {
    if (!resolvedCompanyId) {
      toast.error('Perusahaan belum dipilih.');
      return;
    }

    // Validasi: 1 akun tidak boleh masuk ke lebih dari 1 grup neraca
    const seenAccounts = new Map<number, string>();
    for (const group of CALC_GROUPS) {
      const list = config[group.key] || [];
      for (const id of list) {
        const numId = Number(id);
        if (numId > 0) {
          if (seenAccounts.has(numId)) {
            const prevGroupTitle = seenAccounts.get(numId);
            const accObj = accounts.find((a) => Number(a.id) === numId);
            const accLabel = accObj ? `${accObj.code} - ${accObj.name}` : `ID ${numId}`;
            toast.error(
              `Akun [${accLabel}] tidak boleh digunakan di lebih dari satu kategori neraca (sudah dipilih di "${prevGroupTitle}" dan "${group.title}").`,
            );
            return;
          }
          seenAccounts.set(numId, group.title);
        }
      }
    }

    const cleanIds = (arr?: number[]) =>
      Array.from(new Set((arr || []).filter((id) => Number(id) > 0)));

    const payload: CreateBalanceYearPayload = {
      year: selectedYear,
      current_asset_account_ids: cleanIds(config.current_asset_account_ids),
      fixed_asset_account_ids: cleanIds(config.fixed_asset_account_ids),
      liability_account_ids: cleanIds(config.liability_account_ids),
      equity_account_ids: cleanIds(config.equity_account_ids),
    };

    try {
      if (isSelectedYearInDb) {
        await updateYearMutation.mutateAsync(payload);
        toast.success(`Konfigurasi template neraca tahun ${selectedYear} berhasil diperbarui.`);
      } else {
        await createYearMutation.mutateAsync(payload);
        toast.success(`Konfigurasi template neraca tahun ${selectedYear} berhasil dibuat.`);
      }
      await templateQuery.refetch();
    } catch (error) {
      toast.error((error as Error)?.message || 'Gagal menyimpan konfigurasi template neraca.');
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
    void router.push(`/dashboard/${slug}/laporan/ballance-report`);
  };

  // Collect other group account IDs for mutual exclusion
  const getOtherGroupAccountIds = (currentGroupKey: BalanceTemplateKey) => {
    return CALC_GROUPS
      .filter((g) => g.key !== currentGroupKey)
      .flatMap((g) => (config[g.key] || []).filter((id) => Number(id) > 0));
  };

  const totalConfiguredAccounts =
    (config.current_asset_account_ids?.length || 0) +
    (config.fixed_asset_account_ids?.length || 0) +
    (config.liability_account_ids?.length || 0) +
    (config.equity_account_ids?.length || 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Sesuaikan Template Laporan Neraca"
          subtitle="Atur daftar akun untuk masing-masing grup neraca (Aktiva dan Pasiva) per tahun buku."
          breadcrumbs={[
            { label: 'Laporan Neraca', onClick: backToReport },
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
                disabled={availableSourceYears.length === 0}
                title="Salin pemetaan akun dari tahun lain"
              >
                <Copy className="mr-2 h-4 w-4" />
                Salin dari Tahun Lain
              </Button>
              {isSelectedYearInDb && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isSaving || deleteYearMutation.isPending}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  title="Hapus konfigurasi tahun ini"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus Tahun
                </Button>
              )}
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

        {/* Top Control Bar: Select Tahun */}
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-xs">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 items-end">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="year-select" className="text-sm font-semibold text-slate-800">
                  Tahun Konfigurasi
                </Label>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => setIsAddYearOpen(true)}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Tambah Tahun
                </Button>
              </div>

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

            <div className="space-y-1.5 pb-1">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                <span>
                  Mengedit template neraca tahun <strong>{selectedYear}</strong>.
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Status: {isSelectedYearInDb ? (
                  <span className="font-semibold text-emerald-700">Tersimpan di sistem ({totalConfiguredAccounts} akun)</span>
                ) : (
                  <span className="font-semibold text-amber-700">Konfigurasi baru (belum disimpan)</span>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Loading State */}
        {templateQuery.isLoading || accountQuery.isLoading ? (
          <div className="grid gap-5 xl:grid-cols-2">
            <Skeleton className="h-80 w-full rounded-md" />
            <Skeleton className="h-80 w-full rounded-md" />
          </div>
        ) : (
          /* Main 2-Column Template Layout (Aktiva & Pasiva) */
          <div className="grid gap-6 xl:grid-cols-2">
            {/* KOLOM KIRI: AKTIVA */}
            <div className="rounded-lg border border-slate-300 bg-white overflow-hidden shadow-xs">
              <div className="border-b border-slate-300 bg-slate-50 px-5 py-3.5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Scale className="h-4 w-4 text-slate-600" />
                    Aktiva (Aset)
                  </h2>
                  <p className="text-xs text-slate-500">Saldo normal: DEBIT (Nominal = Debit - Kredit)</p>
                </div>
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold text-xs">
                  {(config.current_asset_account_ids?.length || 0) + (config.fixed_asset_account_ids?.length || 0)} Akun
                </Badge>
              </div>

              <div className="divide-y divide-slate-100 p-5 space-y-5">
                {CALC_GROUPS.filter((g) => g.side === 'aktiva').map((group) => {
                  const accountIds = config[group.key] || [];
                  const otherIds = getOtherGroupAccountIds(group.key);

                  return (
                    <div key={group.key} className="space-y-2.5 pt-4 first:pt-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{group.title}</h3>
                          <p className="text-xs text-slate-500">{group.description}</p>
                        </div>
                        <span className="text-xs font-semibold text-slate-500">
                          {accountIds.length} terpilih
                        </span>
                      </div>

                      <AccountMultipleSelect
                        values={accountIds}
                        accounts={accounts}
                        disabledValues={otherIds.map(String)}
                        expectedType={group.expectedType}
                        placeholder={`Pilih akun ${group.title.toLowerCase()}...`}
                        onChange={(next) => handleGroupAccountsChange(group.key, next)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* KOLOM KANAN: PASIVA */}
            <div className="rounded-lg border border-slate-300 bg-white overflow-hidden shadow-xs">
              <div className="border-b border-slate-300 bg-slate-50 px-5 py-3.5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-slate-600" />
                    Pasiva (Kewajiban & Modal)
                  </h2>
                  <p className="text-xs text-slate-500">Saldo normal: KREDIT (Nominal = Kredit - Debit)</p>
                </div>
                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 font-semibold text-xs">
                  {(config.liability_account_ids?.length || 0) + (config.equity_account_ids?.length || 0)} Akun
                </Badge>
              </div>

              <div className="divide-y divide-slate-100 p-5 space-y-5">
                {CALC_GROUPS.filter((g) => g.side === 'pasiva').map((group) => {
                  const accountIds = config[group.key] || [];
                  const otherIds = getOtherGroupAccountIds(group.key);

                  return (
                    <div key={group.key} className="space-y-2.5 pt-4 first:pt-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{group.title}</h3>
                          <p className="text-xs text-slate-500">{group.description}</p>
                        </div>
                        <span className="text-xs font-semibold text-slate-500">
                          {accountIds.length} terpilih
                        </span>
                      </div>

                      <AccountMultipleSelect
                        values={accountIds}
                        accounts={accounts}
                        disabledValues={otherIds.map(String)}
                        expectedType={group.expectedType}
                        placeholder={`Pilih akun ${group.title.toLowerCase()}...`}
                        onChange={(next) => handleGroupAccountsChange(group.key, next)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-end gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-xs no-print">
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
              Masukkan tahun baru untuk menambahkan template neraca tahun tersebut.
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

      {/* Dialog Salin Konfigurasi dari Tahun Lain */}
      <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Salin Konfigurasi dari Tahun Lain</DialogTitle>
            <DialogDescription>
              Salin seluruh pemetaan akun Aset Lancar, Aset Tetap, Kewajiban, dan Modal dari tahun yang sudah tersimpan ke tahun yang sedang aktif (<strong>Tahun {selectedYear}</strong>).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <Label htmlFor="copy-source-year">Pilih Tahun Sumber</Label>
            <Select value={copySourceYear} onValueChange={setCopySourceYear}>
              <SelectTrigger id="copy-source-year">
                <SelectValue placeholder="Pilih tahun sumber" />
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

          <DialogFooter>
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
              disabled={!copySourceYear}
            >
              <Copy className="mr-1.5 h-4 w-4" />
              Salin Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog Hapus Konfigurasi Tahun */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Konfigurasi Tahun {selectedYear}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus pemetaan akun neraca untuk tahun {selectedYear}. Data transaksi tidak akan terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteYear}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
