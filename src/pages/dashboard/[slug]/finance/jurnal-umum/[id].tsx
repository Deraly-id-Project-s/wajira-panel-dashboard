import { useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Pencil,
  Scale,
  Building2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyBox } from '@/components/ui/copy-box';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { ImagePreview } from '@/components/ui/image-preview';
import { LoadingState } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import ToggleGeneralJournalPostingDialog from '@/components/features/general-journal/ToggleGeneralJournalPostingDialog';
import { useGeneralJournalDetail } from '@/hooks/useGeneralJournal';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import type { GeneralJournalBilling } from '@/@types/general-journal.types';
import { cn } from '@/lib/utils';

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const buildProofUrl = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const base = process.env.NEXT_PUBLIC_API_URL ?? 'https://wajirabackend.hawk-dev.com';
  return `${base.replace(/\/$/, '')}/storage/${path.replace(/^\/+/, '')}`;
};

const isImageProof = (value?: string | null) => {
  if (!value) return false;
  const cleanValue = value.split('?')[0]?.toLowerCase() ?? '';
  return /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(cleanValue);
};

export default function GeneralJournalDetailPage() {
  const router = useRouter();
  const { slug, id: rawId } = router.query;
  const journalId = typeof rawId === 'string' ? Number(rawId) : undefined;
  const basePath = typeof slug === 'string'
    ? `/dashboard/${slug}/finance/jurnal-umum`
    : '/dashboard';

  const { hasPermission } = usePermissionGuard();
  const canEdit = hasPermission('finance:edit');

  const [isToggleOpen, setIsToggleOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const detailQuery = useGeneralJournalDetail(journalId, {
    enabled: typeof journalId === 'number' && Number.isFinite(journalId),
    refetchInterval: false,
  });

  const journal = detailQuery.data;
  const isPaid = Boolean(journal?.is_paid);
  const proofUrl = buildProofUrl(journal?.payment_proof);

  const billings = useMemo(() => journal?.billings ?? [], [journal?.billings]);

  const billingColumns = useMemo<ColumnDef<GeneralJournalBilling>[]>(() => {
    const isUsd = Boolean(journal?.is_usd_transaction);

    const baseColumns: ColumnDef<GeneralJournalBilling>[] = [
      {
        header: 'KODE AKUN',
        alignment: 'left',
        cell: (item) => (
          <span className="font-semibold text-slate-800">
            {item.account?.code || '-'}
          </span>
        ),
      },
      {
        header: 'NAMA AKUN',
        alignment: 'left',
        cell: (item) => (
          <div>
            <p className="font-medium text-slate-800">{item.account?.name || '-'}</p>
            {item.account?.type ? (
              <span className="text-[11px] text-slate-400 capitalize">
                Tipe: {item.account.type}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        header: 'POSISI',
        alignment: 'center',
        cell: (item) => (
          <span
            className={cn(
              'px-2 py-0.5 rounded text-xs font-semibold uppercase',
              item.type === 'debet'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200',
            )}
          >
            {item.type === 'debet' ? 'Debet' : 'Kredit'}
          </span>
        ),
      },
    ];

    if (isUsd) {
      baseColumns.push(
        {
          header: 'NOMINAL USD',
          alignment: 'right',
          cell: (item) => (
            <span
              className={cn(
                'font-semibold',
                item.type === 'debet' ? 'text-emerald-600' : 'text-rose-600',
              )}
            >
              {currenciesFormat('usd', item.amount)}
            </span>
          ),
        },
        {
          header: 'EKUIVALEN IDR',
          alignment: 'right',
          cell: (item) => (
            <span className="font-medium text-slate-700">
              {currenciesFormat('idr', item.amount_original || item.amount)}
            </span>
          ),
        },
      );
    } else {
      baseColumns.push(
        {
          header: 'NOMINAL DEBET',
          alignment: 'right',
          cell: (item) => (
            item.type === 'debet' ? (
              <span className="font-semibold text-emerald-600">
                {currenciesFormat('idr', item.amount)}
              </span>
            ) : (
              <span className="text-slate-300">-</span>
            )
          ),
        },
        {
          header: 'NOMINAL KREDIT',
          alignment: 'right',
          cell: (item) => (
            item.type === 'credit' ? (
              <span className="font-semibold text-rose-600">
                {currenciesFormat('idr', item.amount)}
              </span>
            ) : (
              <span className="text-slate-300">-</span>
            )
          ),
        },
      );
    }

    baseColumns.push({
      header: 'KETERANGAN BARIS',
      alignment: 'left',
      cell: (item) => (
        <span className="text-xs text-slate-600">
          {item.note || '-'}
        </span>
      ),
    });

    return baseColumns;
  }, [journal?.is_usd_transaction]);

  if (detailQuery.isLoading || !router.isReady) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" text="Memuat detail jurnal umum..." />
      </DashboardLayout>
    );
  }

  if (detailQuery.isError || !journal) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader
            title="Detail Jurnal Umum"
            subtitle="Data jurnal tidak dapat ditampilkan"
            onBack={() => void router.push(basePath)}
          />
          <Card className="rounded-md border-red-200 bg-red-50 shadow-none">
            <CardContent className="p-6 text-sm text-red-700">
              <p className="font-medium">Data jurnal umum tidak ditemukan.</p>
              <p className="mt-1 text-red-600">Periksa kembali ID jurnal pada URL.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Detail Jurnal Umum {journal.code} - Wajira Dashboard</title>
      </Head>

      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Jurnal Umum', onClick: () => void router.push(basePath) },
            { label: 'Detail Jurnal' },
          ]}
          title="Detail Jurnal Umum"
          subtitle={
            <div className="flex flex-wrap items-center gap-2">
              <span>{journal.code}</span>
              <Badge
                variant="outline"
                className={cn(
                  isPaid
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700',
                )}
              >
                {isPaid ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : null}
                {isPaid ? 'Posted (Laporan Diakui)' : 'Draft (Belum Diposting)'}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  journal.is_usd_transaction
                    ? 'border-blue-200 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-slate-200 bg-slate-50 text-slate-700 font-medium',
                )}
              >
                {journal.is_usd_transaction ? 'Transaksi USD ($)' : 'Transaksi IDR (Rp)'}
              </Badge>
            </div>
          }
          onBack={() => void router.push(basePath)}
          actions={
            <>
              {!isPaid && canEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void router.push(`${basePath}/${journal.id}/edit`)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Jurnal
                </Button>
              ) : null}

              {canEdit ? (
                <Button
                  type="button"
                  variant={isPaid ? 'outline' : 'default'}
                  onClick={() => {
                    setTargetStatus(!isPaid);
                    setIsToggleOpen(true);
                  }}
                  disabled={!isPaid && (!journal.is_balanced || Number(journal.total_debit) <= 0)}
                >
                  {isPaid ? 'Batal Posting Jurnal' : 'Posting Jurnal'}
                </Button>
              ) : null}
            </>
          }
        />

        {/* Overview Header Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-md border-slate-200 shadow-none">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-medium text-slate-400">Kode Jurnal</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <CopyBox text={journal.code} />
                  {journal.is_usd_transaction ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                      USD
                    </span>
                  ) : null}
                </div>
              </div>
              <FileText className="h-6 w-6 text-slate-400" />
            </CardContent>
          </Card>

          <Card className="rounded-md border-slate-200 shadow-none">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-medium text-slate-400">Nominal Transaksi</p>
                <p className={cn("mt-1 text-base font-bold", journal.is_usd_transaction ? "text-blue-700" : "text-slate-800")}>
                  {journal.is_usd_transaction
                    ? currenciesFormat('usd', journal.amount)
                    : currenciesFormat('idr', journal.amount || journal.total_debit)}
                </p>
                {journal.is_usd_transaction && journal.amount_original ? (
                  <p className="text-[11px] text-slate-400">
                    ~ {currenciesFormat('idr', journal.amount_original)}
                  </p>
                ) : null}
              </div>
              <Scale className={cn("h-6 w-6", journal.is_usd_transaction ? "text-blue-500" : "text-slate-400")} />
            </CardContent>
          </Card>

          <Card className="rounded-md border-emerald-100 bg-emerald-50/30 shadow-none">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-medium text-emerald-700">
                  Total Debet {journal.is_usd_transaction ? '(IDR)' : ''}
                </p>
                <p className="mt-1 text-base font-bold text-emerald-800">
                  {currenciesFormat('idr', journal.total_debit)}
                </p>
              </div>
              <Scale className="h-6 w-6 text-emerald-500" />
            </CardContent>
          </Card>

          <Card className="rounded-md border-rose-100 bg-rose-50/30 shadow-none">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-medium text-rose-700">
                  Total Kredit {journal.is_usd_transaction ? '(IDR)' : ''}
                </p>
                <p className="mt-1 text-base font-bold text-rose-800">
                  {currenciesFormat('idr', journal.total_credit)}
                </p>
              </div>
              <Scale className="h-6 w-6 text-rose-500" />
            </CardContent>
          </Card>
        </div>

        {/* Rincian Transaksi */}
        <Card className="rounded-md border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Daftar Akun Entri Jurnal</CardTitle>
                <CardDescription className="text-xs">
                  Daftar akun debet dan kredit memorial yang dicatat
                </CardDescription>
              </div>
              <span
                className={cn(
                  'px-2.5 py-1 rounded text-xs font-semibold inline-flex items-center gap-1',
                  journal.is_balanced
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200',
                )}
              >
                {journal.is_balanced ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Jurnal Seimbang (Balanced)
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3.5 w-3.5" /> Jurnal Tidak Seimbang
                  </>
                )}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <BaseTable data={billings} columns={billingColumns} loading={false} />
          </CardContent>
        </Card>

        {/* Informasi Tambahan & Bukti */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-md border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 py-4">
              <CardTitle className="text-sm font-semibold">Keterangan Jurnal</CardTitle>
            </CardHeader>
            <CardContent className="p-5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {journal.note || <span className="text-slate-400 italic">Tidak ada catatan</span>}
            </CardContent>
          </Card>

          <Card className="rounded-md border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 py-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Bukti Dokumen Pendukung</CardTitle>
                <CardDescription className="text-xs mt-0.5">Lampiran fisik/digital</CardDescription>
              </div>
              {proofUrl ? (
                isImageProof(journal.payment_proof) || isImageProof(proofUrl) ? (
                  <Button variant="outline" size="sm" onClick={() => setPreviewUrl(proofUrl)} type="button">
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    Preview
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <a href={proofUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      Lihat File
                    </a>
                  </Button>
                )
              ) : null}
            </CardHeader>
            <CardContent className="p-5">
              {proofUrl ? (
                <div className="rounded-md border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                  <p className="font-medium text-slate-800 break-all">{journal.payment_proof}</p>
                  <p className="mt-1 text-slate-400">File tersimpan aman di server.</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Tidak ada bukti dokumen yang dilampirkan.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <ToggleGeneralJournalPostingDialog
          open={isToggleOpen}
          onOpenChange={setIsToggleOpen}
          data={journal}
          targetStatus={targetStatus}
        />
        <ImagePreview open={previewUrl !== null} onClose={() => setPreviewUrl(null)} src={previewUrl} />
      </div>
    </DashboardLayout>
  );
}
