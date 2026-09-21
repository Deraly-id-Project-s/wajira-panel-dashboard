import { useMemo } from 'react';

import type { DocumentTemplate } from '@/@types/document-template.types';
import type { JournalReportItem } from '@/@types/journal-report.types';
import { getObjectStorageUrl } from '@/components/ui/storage-image';
import { currenciesFormat } from '@/components/ui/currenciesFormat';

const ROWS_PER_PRINT_PAGE = 24;

const formatCompactDate = (value: string | Date | null | undefined) => {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

// Template rich text is intentionally converted to plain text. React will escape
// the result, keeping report printing safe even when template HTML is untrusted.
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

interface LaporanJurnalPrintDocumentProps {
  data: JournalReportItem[];
  template: DocumentTemplate | null;
  fallbackBackground?: string;
  companyName: string;
  accountLabel: string;
  periodLabel: string;
  reportPage: number;
  reportTotal: number;
  printedAt: Date;
}

export function LaporanJurnalPrintDocument({
  data,
  template,
  fallbackBackground,
  companyName,
  accountLabel,
  periodLabel,
  reportPage,
  reportTotal,
  printedAt,
}: LaporanJurnalPrintDocumentProps) {
  const pages = useMemo(() => {
    if (data.length === 0) return [[]];
    return Array.from({ length: Math.ceil(data.length / ROWS_PER_PRINT_PAGE) }, (_, index) =>
      data.slice(index * ROWS_PER_PRINT_PAGE, (index + 1) * ROWS_PER_PRINT_PAGE),
    );
  }, [data]);

  const totals = useMemo(
    () =>
      data.reduce(
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
    <div className="accounting-print-root laporan-jurnal-print-root" aria-hidden="true">
      {pages.map((rows, pageIndex) => {
        const isLastPage = pageIndex === pages.length - 1;

        return (
          <section
            key={pageIndex}
            className="print-letter-page accounting-print-area laporan-jurnal-print-area"
            aria-label={`Laporan jurnal halaman ${pageIndex + 1}`}
          >
            {backgroundUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={backgroundUrl} alt="" className="print-letterhead" />
            )}

            <div className="accounting-print-content laporan-jurnal-print-content">
              <header className="border-b-2 pb-2 text-slate-950" style={{ borderColor: tableColor }}>
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-[7pt] font-semibold uppercase tracking-[0.16em] text-slate-500">Laporan Akuntansi</p>
                    <h1 className="mt-0.5 text-[13pt] font-bold uppercase tracking-[0.08em]">Laporan Jurnal</h1>
                    <p className="mt-0.5 text-[8pt] font-semibold uppercase text-slate-700">{companyName}</p>
                  </div>
                  <dl className="grid min-w-[60mm] grid-cols-[20mm_1fr] gap-x-2 gap-y-0.5 text-[7pt] leading-tight">
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
                    <col className="w-[7%]" />
                    <col className="w-[11%]" />
                    <col className="w-[11%]" />
                    <col className="w-[12%]" />
                    <col className="w-[15%]" />
                    <col className="w-[12%]" />
                    <col className="w-[8%]" />
                    <col className="w-[8%]" />
                    <col className="w-[8%]" />
                    <col className="w-[8%]" />
                  </colgroup>
                  <thead>
                    <tr className="text-white" style={{ backgroundColor: tableColor }}>
                      {['Tanggal', 'Kode Transaksi', 'Kode Akun', 'Nama Akun', 'Keterangan', 'Jenis Transaksi', 'Debit IDR', 'Kredit IDR', 'Debit USD', 'Kredit USD'].map((label) => (
                        <th key={label} className="border border-white/30 px-1.5 py-1.5 text-left font-semibold uppercase tracking-wide last:text-right">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="border border-slate-300 px-2 py-8 text-center text-slate-500">
                          Tidak ada data jurnal pada filter yang dipilih.
                        </td>
                      </tr>
                    ) : (
                      rows.map((item, rowIndex) => (
                        <tr key={item.uuid ?? item.id ?? rowIndex} className={rowIndex % 2 === 1 ? 'bg-slate-50/80' : 'bg-white'}>
                          <td className="border border-slate-300 px-1.5 py-1.5 text-center tabular-nums">{formatCompactDate(item.payment_at)}</td>
                          <td className="border border-slate-300 px-1.5 py-1.5 font-mono">{item.cash_flow?.code || '-'}</td>
                          <td className="border border-slate-300 px-1.5 py-1.5 font-mono">{item.account?.code || '-'}</td>
                          <td className="border border-slate-300 px-1.5 py-1.5">{item.account?.name || '-'}</td>
                          <td className="border border-slate-300 px-1.5 py-1.5">{item.note || '-'}</td>
                          <td className="border border-slate-300 px-1.5 py-1.5">{item.cash_flow?.note || '-'}</td>
                          <td className="border border-slate-300 px-1.5 py-1.5 text-right font-medium tabular-nums">
                            {Number(item.debit) > 0 ? currenciesFormat('idr', item.debit) : '-'}
                          </td>
                          <td className="border border-slate-300 px-1.5 py-1.5 text-right font-medium tabular-nums">
                            {Number(item.credit) > 0 ? currenciesFormat('idr', item.credit) : '-'}
                          </td>
                          <td className="border border-slate-300 px-1.5 py-1.5 text-right font-medium tabular-nums">
                            {Number(item.debit_usd) > 0 ? currenciesFormat('usd', item.debit_usd) : '-'}
                          </td>
                          <td className="border border-slate-300 px-1.5 py-1.5 text-right font-medium tabular-nums">
                            {Number(item.credit_usd) > 0 ? currenciesFormat('usd', item.credit_usd) : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                    {isLastPage && data.length > 0 && (
                      <tr className="font-bold" style={{ backgroundColor: `${tableColor}14` }}>
                        <td colSpan={6} className="border border-slate-400 px-1.5 py-2 text-right uppercase tracking-wide">Grand Total</td>
                        <td className="border border-slate-400 px-1.5 py-2 text-right tabular-nums">{currenciesFormat('idr', totals.debit)}</td>
                        <td className="border border-slate-400 px-1.5 py-2 text-right tabular-nums">{currenciesFormat('idr', totals.credit)}</td>
                        <td className="border border-slate-400 px-1.5 py-2 text-right tabular-nums">{currenciesFormat('usd', totals.debitUsd)}</td>
                        <td className="border border-slate-400 px-1.5 py-2 text-right tabular-nums">{currenciesFormat('usd', totals.creditUsd)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <footer className="mt-auto pt-3 text-[7pt] text-slate-600">
                {isLastPage && (
                  <div className="mb-[24mm] flex items-end justify-between gap-8">
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
                <div className="mt-2 flex items-center justify-between border-t border-slate-300 pt-1.5 text-[6.5pt]">
                  <span>Data halaman aplikasi {reportPage} · {reportTotal} total transaksi</span>
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
