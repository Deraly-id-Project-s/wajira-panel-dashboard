import { useMemo } from 'react';

import type { DocumentTemplate } from '@/@types/document-template.types';
import type { LedgerReportItem } from '@/@types/ledger-report.types';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { getObjectStorageUrl } from '@/components/ui/storage-image';

const ROWS_PER_PAGE = 20;

interface LaporanBukuBesarPrintDocumentProps {
  data: LedgerReportItem[];
  template: DocumentTemplate | null;
  fallbackBackground?: string;
  companyName: string;
  accountLabel: string;
  periodLabel: string;
  openingBalance: number;
  endingBalance: number;
  openingBalanceUsd: number;
  endingBalanceUsd: number;
  reportPage: number;
  reportTotal: number;
  printedAt: Date;
}

const formatCompactDate = (value: string | Date | null | undefined) => {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};

const money = (value?: number | null) => currenciesFormat('idr', Number(value) || 0);

const htmlToPlainText = (value?: string | null) =>
  (value ?? '')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export function LaporanBukuBesarPrintDocument({
  data,
  template,
  fallbackBackground,
  companyName,
  accountLabel,
  periodLabel,
  openingBalance,
  endingBalance,
  openingBalanceUsd,
  endingBalanceUsd,
  reportPage,
  reportTotal,
  printedAt,
}: LaporanBukuBesarPrintDocumentProps) {
  const pages = useMemo(() => {
    if (data.length === 0) return [[]];
    return Array.from({ length: Math.ceil(data.length / ROWS_PER_PAGE) }, (_, index) =>
      data.slice(index * ROWS_PER_PAGE, (index + 1) * ROWS_PER_PAGE),
    );
  }, [data]);

  const movement = useMemo(
    () => data.reduce(
      (result, item) => ({
        debit: result.debit + (Number(item.debit) || 0),
        credit: result.credit + (Number(item.credit) || 0),
        debitUsd: result.debitUsd + (Number(item.debit_usd) || 0),
        creditUsd: result.creditUsd + (Number(item.credit_usd) || 0),
      }),
      { debit: 0, credit: 0, debitUsd: 0, creditUsd: 0 },
    ),
    [data],
  );

  if (!template) return null;

  const backgroundUrl = template.documentTemplate
    ? getObjectStorageUrl(template.documentTemplate)
    : fallbackBackground;
  const signatureUrl = getObjectStorageUrl(template.personSignature);
  const tableColor = /^#[0-9a-f]{6}$/i.test(template.tableColor) ? template.tableColor : '#1f4163';
  const headerInformation = htmlToPlainText(template.headerInformation);
  const footerInformation = htmlToPlainText(template.footerInformation);

  return (
    <div className="accounting-print-root laporan-buku-besar-print-root" aria-hidden="true">
      {pages.map((rows, pageIndex) => {
        const isLastPage = pageIndex === pages.length - 1;

        return (
          <section key={pageIndex} className="print-letter-page accounting-print-area laporan-buku-besar-print-area">
            {backgroundUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={backgroundUrl} alt="" className="print-letterhead" />
            )}

            <div className="accounting-print-content laporan-buku-besar-print-content">
              <header className="border-b-2 pb-2 text-slate-950" style={{ borderColor: tableColor }}>
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-[7pt] font-semibold uppercase tracking-[0.16em] text-slate-500">Laporan Akuntansi</p>
                    <h1 className="mt-0.5 text-[13pt] font-bold uppercase tracking-[0.08em]">Buku Besar</h1>
                    <p className="mt-0.5 text-[8pt] font-semibold uppercase text-slate-700">{companyName}</p>
                  </div>
                  <dl className="grid min-w-[68mm] grid-cols-[20mm_1fr] gap-x-2 gap-y-0.5 text-[7pt] leading-tight">
                    <dt className="text-slate-500">Periode</dt>
                    <dd className="font-medium">: {periodLabel}</dd>
                    <dt className="text-slate-500">Akun</dt>
                    <dd className="font-medium">: {accountLabel}</dd>
                    <dt className="text-slate-500">Dicetak</dt>
                    <dd>: {formatCompactDate(printedAt)}</dd>
                  </dl>
                </div>
                {headerInformation && (
                  <p className="mt-2 max-w-[175mm] whitespace-pre-line text-[7pt] leading-snug text-slate-600">
                    {headerInformation}
                  </p>
                )}
              </header>

              <div className="mt-3 overflow-hidden border border-slate-400">
                <table className="w-full table-fixed border-collapse text-[6pt] leading-tight text-slate-900">
                  <colgroup>
                    <col className="w-[6%]" />
                    <col className="w-[7%]" />
                    <col className="w-[10%]" />
                    <col className="w-[9%]" />
                    <col className="w-[12%]" />
                    <col className="w-[10%]" />
                    <col className="w-[8%]" />
                    <col className="w-[8%]" />
                    <col className="w-[8%]" />
                    <col className="w-[7%]" />
                    <col className="w-[7%]" />
                    <col className="w-[8%]" />
                  </colgroup>
                  <thead>
                    <tr className="text-white" style={{ backgroundColor: tableColor }}>
                      {['Tanggal', 'Kode Akun', 'Nama Akun', 'Kode Transaksi', 'Keterangan', 'Jenis Transaksi', 'Saldo Awal IDR', 'Debit IDR', 'Kredit IDR', 'Debit USD', 'Kredit USD', 'Saldo Akhir IDR'].map((label, index) => (
                        <th key={label} className={`border border-white/30 px-1 py-1.5 font-semibold uppercase tracking-wide ${index >= 6 ? 'text-right' : 'text-left'}`}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="border border-slate-300 px-2 py-8 text-center text-slate-500">
                          Tidak ada mutasi akun pada filter yang dipilih.
                        </td>
                      </tr>
                    ) : rows.map((item, index) => (
                      <tr key={item.uuid ?? item.id ?? index} className={index % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                        <td className="border border-slate-300 px-1 py-1.5 text-center tabular-nums">{formatCompactDate(item.payment_at)}</td>
                        <td className="border border-slate-300 px-1 py-1.5 font-mono">{item.account?.code || '-'}</td>
                        <td className="border border-slate-300 px-1 py-1.5">{item.account?.name || '-'}</td>
                        <td className="border border-slate-300 px-1 py-1.5 font-mono">{item.cash_flow?.code || '-'}</td>
                        <td className="border border-slate-300 px-1 py-1.5">{item.note || '-'}</td>
                        <td className="border border-slate-300 px-1 py-1.5">{item.cash_flow?.note || '-'}</td>
                        <td className="border border-slate-300 px-1 py-1.5 text-right tabular-nums">{money(item.cash_position_before)}</td>
                        <td className="border border-slate-300 px-1 py-1.5 text-right tabular-nums">{Number(item.debit) > 0 ? money(item.debit) : '-'}</td>
                        <td className="border border-slate-300 px-1 py-1.5 text-right tabular-nums">{Number(item.credit) > 0 ? money(item.credit) : '-'}</td>
                        <td className="border border-slate-300 px-1 py-1.5 text-right tabular-nums">{Number(item.debit_usd) > 0 ? currenciesFormat('usd', item.debit_usd) : '-'}</td>
                        <td className="border border-slate-300 px-1 py-1.5 text-right tabular-nums">{Number(item.credit_usd) > 0 ? currenciesFormat('usd', item.credit_usd) : '-'}</td>
                        <td className="border border-slate-300 px-1 py-1.5 text-right font-medium tabular-nums">{money(item.cash_position_after)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {isLastPage && (
                <section className="ml-auto mt-4 w-[90mm] text-[7pt] text-slate-900" aria-label="Ringkasan saldo buku besar">
                  <div className="border-b px-2 pb-1.5 text-[7pt] font-bold uppercase tracking-[0.12em]" style={{ borderColor: tableColor }}>
                    Ringkasan Saldo
                  </div>
                  <dl className="grid grid-cols-[1fr_38mm] border-b border-slate-300 px-2 py-1.5">
                    <dt>Saldo awal periode</dt>
                    <dd className="text-right font-medium tabular-nums">{money(openingBalance)}</dd>
                    <dt className="text-slate-500">Mutasi debit — halaman aktif</dt>
                    <dd className="text-right tabular-nums">{money(movement.debit)}</dd>
                    <dt className="text-slate-500">Mutasi kredit — halaman aktif</dt>
                    <dd className="text-right tabular-nums">({money(movement.credit)})</dd>
                    <dt className="text-sky-700">Saldo awal USD</dt>
                    <dd className="text-right font-medium tabular-nums text-sky-700">{currenciesFormat('usd', openingBalanceUsd)}</dd>
                    <dt className="text-sky-700">Mutasi debit USD — halaman aktif</dt>
                    <dd className="text-right tabular-nums text-sky-700">{currenciesFormat('usd', movement.debitUsd)}</dd>
                    <dt className="text-sky-700">Mutasi kredit USD — halaman aktif</dt>
                    <dd className="text-right tabular-nums text-sky-700">({currenciesFormat('usd', movement.creditUsd)})</dd>
                  </dl>
                  <dl className="grid grid-cols-[1fr_38mm] border-b-4 border-double px-2 py-2 text-[8pt] font-bold" style={{ borderColor: tableColor }}>
                    <dt>Saldo akhir periode</dt>
                    <dd className="text-right tabular-nums">{money(endingBalance)}</dd>
                    <dt className="text-sky-700">Saldo akhir USD</dt>
                    <dd className="text-right tabular-nums text-sky-700">{currenciesFormat('usd', endingBalanceUsd)}</dd>
                  </dl>
                </section>
              )}

              <footer className="mt-auto pt-3 text-[7pt] text-slate-600">
                {isLastPage && (
                  <div className="mb-[8mm] flex items-end justify-between gap-8">
                    <p className="max-w-[115mm] whitespace-pre-line leading-snug">{footerInformation}</p>
                    <div className="min-w-[45mm] text-center text-slate-800">
                      <p>Mengetahui,</p>
                      <div className="flex h-[16mm] items-center justify-center">
                        {signatureUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={signatureUrl} alt="" className="max-h-[16mm] max-w-[38mm] object-contain" />
                        )}
                      </div>
                      <p className="border-t border-slate-700 pt-1 font-semibold">{template.personSigner || '-'}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-slate-300 pt-1.5 text-[6.5pt]">
                  <span>Data halaman aplikasi {reportPage} · {reportTotal} total mutasi</span>
                  <span>Halaman {pageIndex + 1} dari {pages.length}</span>
                </div>
              </footer>
            </div>
          </section>
        );
      })}
    </div>
  );
}
