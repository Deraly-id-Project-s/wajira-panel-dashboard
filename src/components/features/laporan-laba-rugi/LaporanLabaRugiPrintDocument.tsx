import { Fragment } from 'react';

import type { DocumentTemplate } from '@/@types/document-template.types';
import type { ProfitLossReportLine } from '@/@types/profit-loss-report.types';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { getObjectStorageUrl } from '@/components/ui/storage-image';
import { cn } from '@/lib/utils';

export interface ProfitLossPrintSection {
  key: 'revenue' | 'cogs' | 'opex' | 'noix';
  title: string;
  rows: ProfitLossReportLine[];
  total: number;
  totalUsd: number;
  deduction?: boolean;
}

interface LaporanLabaRugiPrintDocumentProps {
  template: DocumentTemplate | null;
  fallbackBackground?: string;
  companyName: string;
  periodLabel: string;
  sections: ProfitLossPrintSection[];
  grossProfit: number;
  grossProfitUsd: number;
  netIncome?: number;
  netIncomeUsd?: number;
  profitBeforeTax: number;
  profitBeforeTaxUsd: number;
  taxPercentage: number;
  taxAmount: number;
  taxAmountUsd: number;
  profitAfterTax: number;
  profitAfterTaxUsd: number;
  printedAt: Date;
}

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const getLineBaseAmount = (line: ProfitLossReportLine) =>
  toNumber(line.amount ?? line.total ?? line.value ?? line.balance);

const getLineCurrency = (line: ProfitLossReportLine) =>
  String(line.type ?? 'IDR').toUpperCase() === 'USD' ? 'usd' : 'idr';

const getLineUsdAmount = (line: ProfitLossReportLine) => {
  const explicitUsd = line.amount_usd ?? line.total_usd ?? line.value_usd ?? line.balance_usd;
  if (explicitUsd !== undefined && explicitUsd !== null) return toNumber(explicitUsd);
  return getLineCurrency(line) === 'usd' ? getLineBaseAmount(line) : 0;
};

const getLineIdrAmount = (line: ProfitLossReportLine) => {
  const hasExplicitUsd = [line.amount_usd, line.total_usd, line.value_usd, line.balance_usd]
    .some((value) => value !== undefined && value !== null);
  return !hasExplicitUsd && getLineCurrency(line) === 'usd' ? 0 : getLineBaseAmount(line);
};

const getLineIdentity = (line: ProfitLossReportLine) => ({
  code: line.account_code ?? line.code ?? '-',
  name: line.account_name ?? line.name ?? line.label ?? 'Akun',
});

const formatCompactDate = (date: Date) =>
  new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);

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

const formatAccountingAmount = (value: number, currency: 'idr' | 'usd', deduction = false) => {
  const formatted = currenciesFormat(currency, Math.abs(value));
  return deduction || value < 0 ? `(${formatted})` : formatted;
};

export function LaporanLabaRugiPrintDocument({
  template,
  fallbackBackground,
  companyName,
  periodLabel,
  sections,
  grossProfit,
  grossProfitUsd,
  profitBeforeTax,
  profitBeforeTaxUsd,
  taxPercentage,
  taxAmount,
  taxAmountUsd,
  profitAfterTax,
  profitAfterTaxUsd,
  printedAt,
}: LaporanLabaRugiPrintDocumentProps) {
  if (!template) return null;

  const backgroundUrl = template.documentTemplate
    ? getObjectStorageUrl(template.documentTemplate)
    : fallbackBackground;
  const signatureUrl = getObjectStorageUrl(template.personSignature);
  const tableColor = /^#[0-9a-f]{6}$/i.test(template.tableColor) ? template.tableColor : '#1f4163';
  const headerInformation = htmlToPlainText(template.headerInformation);
  const footerInformation = htmlToPlainText(template.footerInformation);
  const rowCount = sections.reduce((total, section) => total + section.rows.length, 0);

  return (
    <div className="accounting-print-root laporan-laba-rugi-print-root" aria-hidden="true">
      <section className="print-letter-page accounting-print-area laporan-laba-rugi-print-area">
        {backgroundUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={backgroundUrl} alt="" className="print-letterhead" />
        )}

        <div className="accounting-print-content laporan-laba-rugi-print-content">
          <header className="border-b-2 pb-2 text-slate-950" style={{ borderColor: tableColor }}>
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-[7pt] font-semibold uppercase tracking-[0.16em] text-slate-500">Laporan Keuangan</p>
                <h1 className="mt-0.5 text-[13pt] font-bold uppercase tracking-[0.08em]">Laporan Laba Rugi</h1>
                <p className="mt-0.5 text-[8pt] font-semibold uppercase text-slate-700">{companyName}</p>
              </div>
              <dl className="grid min-w-[58mm] grid-cols-[18mm_1fr] gap-x-2 gap-y-0.5 text-[7pt] leading-tight">
                <dt className="text-slate-500">Periode</dt>
                <dd className="font-medium">: {periodLabel}</dd>
                <dt className="text-slate-500">Dicetak</dt>
                <dd>: {formatCompactDate(printedAt)}</dd>
                <dt className="text-slate-500">Mata Uang</dt>
                <dd>: IDR / USD</dd>
              </dl>
            </div>
            {headerInformation && (
              <p className="mt-2 max-w-[175mm] whitespace-pre-line text-[7pt] leading-snug text-slate-600">
                {headerInformation}
              </p>
            )}
          </header>

          <div className="mt-3 overflow-hidden border border-slate-400">
            <table className={cn('w-full table-fixed border-collapse leading-tight text-slate-900', rowCount > 28 ? 'text-[6pt]' : 'text-[7pt]')}>
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[48%]" />
                <col className="w-[17%]" />
                <col className="w-[17%]" />
              </colgroup>
              <thead>
                <tr className="text-white" style={{ backgroundColor: tableColor }}>
                  <th className="border border-white/30 px-2 py-1.5 text-left font-semibold uppercase tracking-wide">Kode Akun</th>
                  <th className="border border-white/30 px-2 py-1.5 text-left font-semibold uppercase tracking-wide">Uraian</th>
                  <th className="border border-white/30 px-2 py-1.5 text-right font-semibold uppercase tracking-wide">IDR</th>
                  <th className="border border-white/30 px-2 py-1.5 text-right font-semibold uppercase tracking-wide">USD</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((section) => (
                  <Fragment key={section.key}>
                    <SectionRows section={section} tableColor={tableColor} />
                    {section.key === 'cogs' && (
                      <tr className="font-bold" style={{ backgroundColor: `${tableColor}12` }}>
                        <td className="border-x border-slate-300 px-2 py-2" />
                        <td className="border border-slate-400 px-2 py-2 uppercase tracking-wide">Laba Kotor</td>
                        <td className="border border-slate-400 px-2 py-2 text-right tabular-nums">{formatAccountingAmount(grossProfit, 'idr')}</td>
                        <td className="border border-slate-400 px-2 py-2 text-right tabular-nums">{formatAccountingAmount(grossProfitUsd, 'usd')}</td>
                      </tr>
                    )}
                  </Fragment>
                ))}

                <tr className="font-bold text-slate-900" style={{ backgroundColor: `${tableColor}18` }}>
                  <td className="border border-slate-400 px-2 py-2" />
                  <td className="border border-slate-400 px-2 py-2 uppercase tracking-[0.05em]">Laba (Rugi) Bersih Sebelum Pajak</td>
                  <td className="border border-slate-400 px-2 py-2 text-right tabular-nums">{formatAccountingAmount(profitBeforeTax, 'idr')}</td>
                  <td className="border border-slate-400 px-2 py-2 text-right tabular-nums">{formatAccountingAmount(profitBeforeTaxUsd, 'usd')}</td>
                </tr>

                {taxPercentage > 0 && (
                  <tr className="font-semibold text-slate-800" style={{ backgroundColor: `${tableColor}08` }}>
                    <td className="border border-slate-300 px-2 py-1.5" />
                    <td className="border border-slate-300 px-2 py-1.5 uppercase tracking-wide">Pajak ({taxPercentage}%)</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-right tabular-nums">{formatAccountingAmount(taxAmount, 'idr', true)}</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-right tabular-nums">{formatAccountingAmount(taxAmountUsd, 'usd', true)}</td>
                  </tr>
                )}

                <tr className="font-bold text-white" style={{ backgroundColor: tableColor }}>
                  <td className="border border-white/30 px-2 py-2.5" />
                  <td className="border border-white/30 px-2 py-2.5 uppercase tracking-[0.08em]">Laba (Rugi) Bersih Setelah Pajak</td>
                  <td className="border border-white/30 px-2 py-2.5 text-right tabular-nums">{formatAccountingAmount(profitAfterTax, 'idr')}</td>
                  <td className="border border-white/30 px-2 py-2.5 text-right tabular-nums">{formatAccountingAmount(profitAfterTaxUsd, 'usd')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <footer className="mt-auto pt-3 text-[7pt] text-slate-600">
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
            <div className="flex items-center justify-between border-t border-slate-300 pt-1.5 text-[6.5pt]">
              <span>Dokumen laporan laba rugi</span>
              <span>Halaman 1 dari 1</span>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}

function SectionRows({
  section,
  tableColor,
}: {
  section: ProfitLossPrintSection;
  tableColor: string;
}) {
  return (
    <>
      <tr style={{ backgroundColor: `${tableColor}0d` }}>
        <td colSpan={4} className="border border-slate-300 px-2 py-1.5 font-bold uppercase tracking-wide">
          {section.title}
        </td>
      </tr>
      {section.rows.length === 0 ? (
        <tr>
          <td className="border-x border-slate-300 px-2 py-1.5" />
          <td className="border border-slate-300 px-2 py-1.5 italic text-slate-400">Tidak ada transaksi</td>
          <td className="border border-slate-300 px-2 py-1.5 text-right">-</td>
          <td className="border border-slate-300 px-2 py-1.5 text-right">-</td>
        </tr>
      ) : (
        section.rows.map((line, index) => {
          const identity = getLineIdentity(line);
          const idrAmount = getLineIdrAmount(line);
          const usdAmount = getLineUsdAmount(line);

          return (
            <tr key={`${line.id ?? line.account_id ?? identity.code}-${index}`} className={index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
              <td className="border border-slate-300 px-2 py-1.5 font-mono">{identity.code}</td>
              <td className="border border-slate-300 px-2 py-1.5">{identity.name}</td>
              <td className="border border-slate-300 px-2 py-1.5 text-right tabular-nums">
                {formatAccountingAmount(idrAmount, 'idr', section.deduction)}
              </td>
              <td className="border border-slate-300 px-2 py-1.5 text-right tabular-nums">
                {formatAccountingAmount(usdAmount, 'usd', section.deduction)}
              </td>
            </tr>
          );
        })
      )}
      <tr className="font-semibold">
        <td className="border-x border-slate-300 px-2 py-1.5" />
        <td className="border border-slate-400 px-2 py-1.5 text-right uppercase">Total {section.title}</td>
        <td className="border border-slate-400 px-2 py-1.5 text-right tabular-nums">{formatAccountingAmount(section.total, 'idr', section.deduction)}</td>
        <td className="border border-slate-400 px-2 py-1.5 text-right tabular-nums">{formatAccountingAmount(section.totalUsd, 'usd', section.deduction)}</td>
      </tr>
    </>
  );
}
