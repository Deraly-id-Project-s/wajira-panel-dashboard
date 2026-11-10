import React from 'react';
import {
  CalendarDays,
  Building2,
  FileText,
  Wallet,
  CreditCard,
  Scale,
  Coins,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Paperclip,
} from 'lucide-react';
import type { GeneralJournal } from '@/@types/general-journal.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CopyBox } from '@/components/ui/copy-box';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { cn } from '@/lib/utils';

interface Props {
  journal: GeneralJournal;
  isPaid: boolean;
  isBalanced: boolean;
  isUsd: boolean;
  totalDebit: number;
  totalCredit: number;
  remainingAmount: number;
  cashesCount: number;
  paymentsCount: number;
  proofUrl?: string | null;
  onPreviewProof?: (url: string) => void;
}

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const isImageFile = (path?: string | null) => {
  if (!path) return false;
  const clean = path.split('?')[0]?.toLowerCase() ?? '';
  return /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(clean);
};

export default function GeneralJournalDetailCards({
  journal,
  isPaid,
  isBalanced,
  isUsd,
  totalDebit,
  totalCredit,
  remainingAmount,
  cashesCount,
  paymentsCount,
  proofUrl,
  onPreviewProof,
}: Props) {
  const currency = isUsd ? 'usd' : 'idr';
  const hasProof = Boolean(proofUrl || journal.payment_proof);
  const isProofAnImage = isImageFile(journal.payment_proof) || isImageFile(proofUrl);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
      {/* Kolom 1: Informasi Jurnal Umum (7 Kolom) */}
      <div className="lg:col-span-7 flex flex-col">
        <Card className="rounded-md border-slate-200 shadow-xs flex-1 flex flex-col">
          <CardHeader className="border-b border-slate-100 py-3.5 px-5">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />
              <CardTitle className="text-sm font-semibold text-slate-900">
                Informasi Jurnal Umum
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Data transaksi dan referensi dokumen jurnal memorial
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {/* Kode Jurnal */}
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Kode Jurnal
                </p>
                <div className="flex items-center gap-1.5">
                  <CopyBox text={journal.code || '-'} />
                </div>
              </div>

              {/* Tanggal Jurnal */}
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Tanggal Transaksi
                </p>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  <span>{formatDate(journal.date)}</span>
                </div>
              </div>

              {/* Perusahaan */}
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Perusahaan / Tenant
                </p>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span className="truncate">{journal.company?.name || 'Wajira'}</span>
                </div>
              </div>

              {/* Mata Uang */}
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Mata Uang Transaksi
                </p>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                  <Coins className="h-4 w-4 text-slate-400" />
                  <span>{isUsd ? 'USD - Dollar Amerika' : 'IDR - Rupiah Indonesia'}</span>
                </div>
              </div>
            </div>

            {/* Keterangan Jurnal */}
            <div className="border-t border-slate-100 pt-3 space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Keterangan Transaksi
              </p>
              <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {journal.note || <span className="text-slate-400 italic">Tidak ada catatan transaksi</span>}
              </div>
            </div>

            {/* Lampiran Bukti Dokumen */}
            {hasProof && proofUrl ? (
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50/70 p-3">
                  <div className="flex items-center gap-2 min-w-0 mr-2">
                    <Paperclip className="h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">
                        {journal.payment_proof || 'Bukti Dokumen Jurnal'}
                      </p>
                      <p className="text-[11px] text-slate-400">Lampiran bukti transaksi</p>
                    </div>
                  </div>

                  <div>
                    {isProofAnImage && onPreviewProof ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs bg-white"
                        onClick={() => onPreviewProof(proofUrl)}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Preview
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        asChild
                        className="h-8 gap-1.5 text-xs bg-white"
                      >
                        <a href={proofUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Buka File
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Kolom 2: Status Finansial & Neraca Jurnal (5 Kolom) */}
      <div className="lg:col-span-5 flex flex-col">
        <Card className="rounded-md border-slate-200 shadow-xs flex-1 flex flex-col">
          <CardHeader className="border-b border-slate-100 py-3.5 px-5">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-sm font-semibold text-slate-900">
                Neraca & Ringkasan Finansial
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Keseimbangan debet kas dan kredit pembayaran
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
            {/* Box Debet & Kredit Side by Side */}
            <div className="grid grid-cols-2 gap-3">
              {/* Box Debet */}
              <div className="rounded-md border border-emerald-100 bg-emerald-50/40 p-3.5">
                <div className="flex items-center justify-between text-emerald-700">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Debet (Kas)
                  </span>
                  <Wallet className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="mt-1.5 text-base font-bold text-emerald-800 tabular-nums">
                  {currenciesFormat(currency, totalDebit)}
                </p>
                <p className="mt-0.5 text-[11px] text-emerald-600">
                  {cashesCount} akun kas teralokasi
                </p>
              </div>

              {/* Box Kredit */}
              <div className="rounded-md border border-rose-100 bg-rose-50/40 p-3.5">
                <div className="flex items-center justify-between text-rose-700">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Kredit (Akun Lawan)
                  </span>
                  <CreditCard className="h-4 w-4 text-rose-600" />
                </div>
                <p className="mt-1.5 text-base font-bold text-rose-800 tabular-nums">
                  {currenciesFormat(currency, totalCredit)}
                </p>
                <p className="mt-0.5 text-[11px] text-rose-600">
                  {paymentsCount} alokasi pembayaran
                </p>
              </div>
            </div>

            {/* Status Keseimbangan (Balanced vs Belum Seimbang) */}
            <div
              className={cn(
                'rounded-md border p-3.5 transition-colors',
                isBalanced && totalDebit > 0
                  ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800'
                  : 'border-amber-200 bg-amber-50/60 text-amber-900',
              )}
            >
              <div className="flex items-start gap-2.5">
                {isBalanced && totalDebit > 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      {isBalanced && totalDebit > 0
                        ? 'Jurnal Seimbang (Balanced)'
                        : 'Belum Seimbang (Selisih)'}
                    </h4>
                    <span className="text-xs font-semibold tabular-nums">
                      {isBalanced && totalDebit > 0
                        ? 'Selisih: 0'
                        : `Sisa: ${currenciesFormat(currency, Math.max(0, remainingAmount))}`}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed opacity-90">
                    {isBalanced && totalDebit > 0
                      ? isPaid
                        ? 'Jurnal telah diposting resmi ke Laporan Keuangan.'
                        : 'Total debet dan kredit telah seimbang. Jurnal siap ditandai lunas (diposting).'
                      : 'Total kas (debet) dan pembayaran akun lawan (kredit) belum seimbang. Tambahkan akun lawan hingga selisih bernilai 0.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Posting Footer Info */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span>Status Transaksi:</span>
              <Badge
                variant="outline"
                className={cn(
                  'rounded-full px-2.5 py-0.5 font-semibold text-[11px]',
                  isPaid
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700',
                )}
              >
                {isPaid ? 'POSTED (LUNAS)' : 'DRAFT (BELUM DIPOSTING)'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
