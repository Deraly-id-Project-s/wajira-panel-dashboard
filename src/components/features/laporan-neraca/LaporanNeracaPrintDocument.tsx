import { Fragment } from 'react';

import type { DocumentTemplate } from '@/@types/document-template.types';
import type {
  BalanceReportAccountLine,
  BalanceReportCashCalcItem,
} from '@/@types/balance-report.types';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { getObjectStorageUrl } from '@/components/ui/storage-image';
import { cn } from '@/lib/utils';

export interface BalancePrintSection {
  key: string;
  title: string;
  rows: BalanceReportAccountLine[];
  totalIdr: number;
  totalUsd: number;
}

interface LaporanNeracaPrintDocumentProps {
  template: DocumentTemplate | null;
  fallbackBackground?: string;
  companyName: string;
  printedAt: Date;
  cashRows: BalanceReportCashCalcItem[];
  cashTotalIdr: number;
  cashTotalUsd: number;
  assetSections: BalancePrintSection[];
  liabilitySections: BalancePrintSection[];
  totalAssets: number;
  totalAssetsUsd: number;
  totalPassiva: number;
  totalPassivaUsd: number;
}

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const getCurrency = (type?: string | null): 'idr' | 'usd' =>
  String(type ?? 'IDR').toUpperCase() === 'USD' ? 'usd' : 'idr';

const getLineAmount = (line: BalanceReportAccountLine) =>
  toNumber(line.amount ?? line.total ?? line.value);

const getLineIdentity = (line: BalanceReportAccountLine) => ({
  code: line.account_code ?? line.code ?? '-',
  name: line.account_name ?? line.name ?? 'Akun',
});

const formatCompactDate = (date: Date) =>
  new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

const formatAmount = (value: number, currency: 'idr' | 'usd') =>
  value === 0 ? '-' : currenciesFormat(currency, value);

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

export function LaporanNeracaPrintDocument({
  template,
  fallbackBackground,
  companyName,
  printedAt,
  cashRows,
  cashTotalIdr,
  cashTotalUsd,
  assetSections,
  liabilitySections,
  totalAssets,
  totalAssetsUsd,
  totalPassiva,
  totalPassivaUsd,
}: LaporanNeracaPrintDocumentProps) {
  if (!template) return null;

  const backgroundUrl = template.documentTemplate
    ? getObjectStorageUrl(template.documentTemplate)
    : fallbackBackground;
  const signatureUrl = getObjectStorageUrl(template.personSignature);
  const tableColor = /^#[0-9a-f]{6}$/i.test(template.tableColor) ? template.tableColor : '#1f4163';
  const headerInformation = htmlToPlainText(template.headerInformation);
  const footerInformation = htmlToPlainText(template.footerInformation);
  const rowCount = cashRows.length
    + assetSections.reduce((total, section) => total + section.rows.length, 0)
    + liabilitySections.reduce((total, section) => total + section.rows.length, 0);

  return (
    <div className="accounting-print-root laporan-neraca-print-root" aria-hidden="true">
      <section className="print-letter-page accounting-print-area laporan-neraca-print-area">
        {backgroundUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={backgroundUrl} alt="" className="print-letterhead" />
        )}

        <div className="accounting-print-content laporan-neraca-print-content">
          <header className="border-b-2 pb-2 text-slate-950" style={{ borderColor: tableColor }}>
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-[7pt] font-semibold uppercase tracking-[0.16em] text-slate-500">Laporan Keuangan</p>
                <h1 className="mt-0.5 text-[13pt] font-bold uppercase tracking-[0.08em]">Laporan Neraca</h1>
                <p className="mt-0.5 text-[8pt] font-semibold uppercase text-slate-700">{companyName}</p>
              </div>
              <dl className="grid min-w-[58mm] grid-cols-[20mm_1fr] gap-x-2 gap-y-0.5 text-[7pt] leading-tight">
                <dt className="text-slate-500">Posisi</dt>
                <dd className="font-medium">: Saat ini</dd>
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

          <div className={cn(
            'mt-3 grid grid-cols-2 items-start gap-3 text-slate-900',
            rowCount > 30 ? 'text-[5.5pt]' : 'text-[6.5pt]',
          )}>
            <BalanceSide
              title="Aktiva"
              cashRows={cashRows}
              cashTotalIdr={cashTotalIdr}
              cashTotalUsd={cashTotalUsd}
              sections={assetSections}
              grandTotalLabel="Total Aktiva"
              grandTotalIdr={totalAssets}
              grandTotalUsd={totalAssetsUsd}
              tableColor={tableColor}
            />
            <BalanceSide
              title="Passiva"
              sections={liabilitySections}
              grandTotalLabel="Total Passiva"
              grandTotalIdr={totalPassiva}
              grandTotalUsd={totalPassivaUsd}
              tableColor={tableColor}
            />
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
              <span>Dokumen laporan neraca · Aktiva dan Passiva</span>
              <span>Halaman 1 dari 1</span>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}

function BalanceSide({
  title,
  cashRows,
  cashTotalIdr = 0,
  cashTotalUsd = 0,
  sections,
  grandTotalLabel,
  grandTotalIdr,
  grandTotalUsd,
  tableColor,
}: {
  title: string;
  cashRows?: BalanceReportCashCalcItem[];
  cashTotalIdr?: number;
  cashTotalUsd?: number;
  sections: BalancePrintSection[];
  grandTotalLabel: string;
  grandTotalIdr: number;
  grandTotalUsd: number;
  tableColor: string;
}) {
  return (
    <div className="overflow-hidden border border-slate-400">
      <div className="px-2 py-1.5 text-center text-[8pt] font-bold uppercase tracking-[0.12em] text-white" style={{ backgroundColor: tableColor }}>
        {title}
      </div>
      <table className="w-full table-fixed border-collapse leading-tight">
        <colgroup>
          <col className="w-[18%]" />
          <col className="w-[42%]" />
          <col className="w-[22%]" />
          <col className="w-[18%]" />
        </colgroup>
        <thead>
          <tr className="bg-slate-100 text-slate-700">
            <th className="border border-slate-300 px-1 py-1 text-left font-semibold uppercase">Kode</th>
            <th className="border border-slate-300 px-1 py-1 text-left font-semibold uppercase">Akun</th>
            <th className="border border-slate-300 px-1 py-1 text-right font-semibold uppercase">IDR</th>
            <th className="border border-slate-300 px-1 py-1 text-right font-semibold uppercase">USD</th>
          </tr>
        </thead>
        <tbody>
          {cashRows && (
            <>
              <SectionHeader title="Kas dan Setara Kas" />
              {cashRows.length === 0 ? (
                <EmptyRow />
              ) : cashRows.map((row, index) => {
                const currency = getCurrency(row.type);
                const amount = toNumber(row.value);
                return (
                  <tr key={row.id ?? index} className={index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                    <td className="border border-slate-300 px-1 py-1 font-mono">{row.cash_code ?? '-'}</td>
                    <td className="border border-slate-300 px-1 py-1">{row.cash_name}</td>
                    <td className="border border-slate-300 px-1 py-1 text-right tabular-nums">{formatAmount(currency === 'idr' ? amount : 0, 'idr')}</td>
                    <td className="border border-slate-300 px-1 py-1 text-right tabular-nums">{formatAmount(currency === 'usd' ? amount : 0, 'usd')}</td>
                  </tr>
                );
              })}
              <TotalRow label="Total Kas dan Setara Kas" totalIdr={cashTotalIdr} totalUsd={cashTotalUsd} />
            </>
          )}

          {sections.map((section) => (
            <Fragment key={section.key}>
              <SectionHeader title={section.title} />
              {section.rows.length === 0 ? (
                <EmptyRow />
              ) : section.rows.map((line, index) => {
                const identity = getLineIdentity(line);
                const amount = getLineAmount(line);
                const currency = getCurrency(line.type);
                return (
                  <tr key={`${line.id ?? line.account_id ?? identity.code}-${index}`} className={index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                    <td className="border border-slate-300 px-1 py-1 font-mono">{identity.code}</td>
                    <td className="border border-slate-300 px-1 py-1">{identity.name}</td>
                    <td className="border border-slate-300 px-1 py-1 text-right tabular-nums">{formatAmount(currency === 'idr' ? amount : 0, 'idr')}</td>
                    <td className="border border-slate-300 px-1 py-1 text-right tabular-nums">{formatAmount(currency === 'usd' ? amount : 0, 'usd')}</td>
                  </tr>
                );
              })}
              <TotalRow label={`Total ${section.title}`} totalIdr={section.totalIdr} totalUsd={section.totalUsd} />
            </Fragment>
          ))}

          <tr className="font-bold text-white" style={{ backgroundColor: tableColor }}>
            <td className="border border-white/30 px-1 py-1.5" />
            <td className="border border-white/30 px-1 py-1.5 uppercase tracking-wide">{grandTotalLabel}</td>
            <td className="border border-white/30 px-1 py-1.5 text-right tabular-nums">{currenciesFormat('idr', grandTotalIdr)}</td>
            <td className="border border-white/30 px-1 py-1.5 text-right tabular-nums">{currenciesFormat('usd', grandTotalUsd)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <tr className="bg-slate-50">
      <td colSpan={4} className="border border-slate-300 px-1.5 py-1 font-bold uppercase tracking-wide">
        {title}
      </td>
    </tr>
  );
}

function EmptyRow() {
  return (
    <tr>
      <td className="border border-slate-300 px-1 py-1" />
      <td className="border border-slate-300 px-1 py-1 italic text-slate-400">Tidak ada rincian</td>
      <td className="border border-slate-300 px-1 py-1 text-right">-</td>
      <td className="border border-slate-300 px-1 py-1 text-right">-</td>
    </tr>
  );
}

function TotalRow({
  label,
  totalIdr,
  totalUsd,
}: {
  label: string;
  totalIdr: number;
  totalUsd: number;
}) {
  return (
    <tr className="font-semibold">
      <td className="border border-slate-300 px-1 py-1" />
      <td className="border border-slate-400 px-1 py-1 text-right uppercase">{label}</td>
      <td className="border border-slate-400 px-1 py-1 text-right tabular-nums">{currenciesFormat('idr', totalIdr)}</td>
      <td className="border border-slate-400 px-1 py-1 text-right tabular-nums">{currenciesFormat('usd', totalUsd)}</td>
    </tr>
  );
}
