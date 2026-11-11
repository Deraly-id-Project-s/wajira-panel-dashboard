import React from 'react';
import {
  CalendarDays,
  Building2,
  FileText,
  Coins,
  ExternalLink,
  Paperclip,
  Calculator,
} from 'lucide-react';
import type {
  GeneralJournal,
  GeneralJournalBillingCash,
} from '@/@types/general-journal.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CopyBox } from '@/components/ui/copy-box';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { cn } from '@/lib/utils';

interface Props {
  journal: GeneralJournal;
  cashes?: GeneralJournalBillingCash[];
  isPaid: boolean;
  isBalanced: boolean;
  isUsd: boolean;
  totalDebit: number;
  totalCredit: number;
  paidDebit?: number;
  paidCredit?: number;
  remainingDebit?: number;
  remainingCredit?: number;
  isDebitSettled?: boolean;
  isCreditSettled?: boolean;
  cashesCount?: number;
  paymentsCount?: number;
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
  cashes,
  isPaid,
  isBalanced,
  isUsd,
  totalDebit,
  totalCredit,
  remainingDebit = 0,
  remainingCredit = 0,
  proofUrl,
  onPreviewProof,
}: Props) {
  const currency = isUsd ? 'usd' : 'idr';
  const hasProof = Boolean(proofUrl || journal.payment_proof);
  const isProofAnImage = isImageFile(journal.payment_proof) || isImageFile(proofUrl);

  const primaryBilling = journal?.billings?.[0];
  const billingCashes: GeneralJournalBillingCash[] =
    primaryBilling?.cashes && primaryBilling.cashes.length > 0
      ? primaryBilling.cashes
      : cashes && cashes.length > 0
      ? cashes
      : [];

  // Nominal kredit setara dengan nominal debit transaksi (keseimbangan neraca)
  const nominalDebit = totalDebit;
  const nominalKredit = Number(journal?.total_credit ?? journal?.total_amount ?? journal?.amount ?? totalDebit);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
      {/* Kolom 1: Informasi Jurnal Umum (6 Kolom) */}
      <div className="lg:col-span-6 flex flex-col">
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

      {/* Kolom 2: Informasi Nominal Jurnal (6 Kolom) */}
      <div className="lg:col-span-6 flex flex-col">
        <Card className="rounded-md border-slate-200 shadow-xs flex-1 flex flex-col">
          <CardHeader className="border-b border-slate-100 py-3.5 px-5">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-slate-600" />
              <CardTitle className="text-sm font-semibold text-slate-900">
                Informasi Nominal Jurnal
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Rincian nominal debit, nominal kredit, sisa pembayaran, dan status transaksi
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
            {/* Grid Dinamis Kas: debit {cashes.name}, kredit {cashes.name}, serta sisa debit & sisa kredit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {billingCashes.length > 0 ? (
                billingCashes.map((c, idx) => {
                  const cashName =
                    c.cash?.cash_name ||
                    c.cash?.name ||
                    (c as any)?.name ||
                    c.cash?.code ||
                    `Kas #${idx + 1}`;
                  const cashAmount = Number(c.amount || 0);

                  return (
                    <React.Fragment key={c.id ?? idx}>
                      {/* Debit {cashes.name} */}
                      <div className="rounded-md border border-slate-200 bg-slate-50/70 p-3.5">
                        <p
                          className="text-xs font-medium uppercase tracking-wide text-slate-500 truncate"
                          title={`Debit ${cashName}`}
                        >
                          Debit {cashName}
                        </p>
                        <p className="mt-1.5 text-base font-bold text-slate-900 tabular-nums">
                          {currenciesFormat(currency, cashAmount)}
                        </p>
                      </div>

                      {/* Kredit {cashes.name} */}
                      <div className="rounded-md border border-slate-200 bg-slate-50/70 p-3.5">
                        <p
                          className="text-xs font-medium uppercase tracking-wide text-slate-500 truncate"
                          title={`Kredit ${cashName}`}
                        >
                          Kredit {cashName}
                        </p>
                        <p className="mt-1.5 text-base font-bold text-slate-900 tabular-nums">
                          {currenciesFormat(currency, cashAmount)}
                        </p>
                      </div>
                    </React.Fragment>
                  );
                })
              ) : (
                <>
                  {/* Fallback jika data kas rincian kosong */}
                  <div className="rounded-md border border-slate-200 bg-slate-50/70 p-3.5">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Nominal Debit
                    </p>
                    <p className="mt-1.5 text-base font-bold text-slate-900 tabular-nums">
                      {currenciesFormat(currency, nominalDebit)}
                    </p>
                  </div>

                  <div className="rounded-md border border-slate-200 bg-slate-50/70 p-3.5">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Nominal Kredit
                    </p>
                    <p className="mt-1.5 text-base font-bold text-slate-900 tabular-nums">
                      {currenciesFormat(currency, nominalKredit)}
                    </p>
                  </div>
                </>
              )}

              {/* Sisa Nominal Debit */}
              <div className="rounded-md border border-slate-200 bg-slate-50/70 p-3.5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Sisa Nominal Debit
                </p>
                <p
                  className={cn(
                    'mt-1.5 text-base font-bold tabular-nums',
                    remainingDebit <= 0 ? 'text-emerald-700' : 'text-amber-700',
                  )}
                >
                  {currenciesFormat(currency, remainingDebit)}
                </p>
              </div>

              {/* Sisa Nominal Kredit */}
              <div className="rounded-md border border-slate-200 bg-slate-50/70 p-3.5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Sisa Nominal Kredit
                </p>
                <p
                  className={cn(
                    'mt-1.5 text-base font-bold tabular-nums',
                    remainingCredit <= 0 ? 'text-emerald-700' : 'text-rose-700',
                  )}
                >
                  {currenciesFormat(currency, remainingCredit)}
                </p>
              </div>
            </div>

            {/* 5. Informasi Status Transaksi (Lunas / Belum Lunas) */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <span className="font-medium text-slate-500">Status Transaksi:</span>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'rounded-full px-3 py-1 font-semibold text-xs',
                    isPaid
                      ? isBalanced
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                      : 'border-rose-200 bg-rose-50 text-rose-700',
                  )}
                >
                  {isPaid
                    ? isBalanced
                      ? 'Lunas (Seimbang)'
                      : 'Lunas (Belum Seimbang)'
                    : 'Belum Lunas'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
