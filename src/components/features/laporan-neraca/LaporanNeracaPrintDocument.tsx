import { Fragment, useMemo } from 'react';

import type { DocumentTemplate } from '@/@types/document-template.types';
import type { BalanceAccountItem } from '@/@types/balance-report.types';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { getObjectStorageUrl } from '@/components/ui/storage-image';
import { cn } from '@/lib/utils';

export interface BalancePrintCategory {
  title: string;
  subtotalLabel: string;
  accounts: BalanceAccountItem[];
  totalIdr: number;
  totalUsd: number;
}

export interface BalancePrintSection {
  key: string;
  title: string;
  rows: BalanceAccountItem[];
  totalIdr: number;
  totalUsd: number;
}

interface LaporanNeracaPrintDocumentProps {
  template: DocumentTemplate | null;
  fallbackBackground?: string;
  companyName: string;
  periodLabel: string;
  printedAt: Date;
  currentAssets: BalancePrintCategory;
  fixedAssets: BalancePrintCategory;
  totalAssetsIdr: number;
  totalAssetsUsd: number;
  liabilities: BalancePrintCategory;
  equity: BalancePrintCategory;
  totalPassivaIdr: number;
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

const getLineAmount = (line: BalanceAccountItem) =>
  toNumber(line.amount ?? line.total ?? line.value);

const getLineIdentity = (line: BalanceAccountItem) => ({
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
    .replace(/<br\s*\/?>/gi, '\n')
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

const ROWS_PER_PAGE = 22;

export function LaporanNeracaPrintDocument({
  template,
  fallbackBackground,
  companyName,
  periodLabel,
  printedAt,
  currentAssets,
  fixedAssets,
  totalAssetsIdr,
  totalAssetsUsd,
  liabilities,
  equity,
  totalPassivaIdr,
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

  // Chunking for A4 page isolation
  const pages = useMemo(() => {
    const assetCount = currentAssets.accounts.length + fixedAssets.accounts.length;
    const passivaCount = liabilities.accounts.length + equity.accounts.length;
    const maxCount = Math.max(assetCount, passivaCount);

    if (maxCount <= ROWS_PER_PAGE) {
      return [{
        pageIndex: 0,
        currentAssetsAccounts: currentAssets.accounts,
        fixedAssetsAccounts: fixedAssets.accounts,
        liabilitiesAccounts: liabilities.accounts,
        equityAccounts: equity.accounts,
      }];
    }

    const totalPages = Math.ceil(maxCount / ROWS_PER_PAGE);
    const result = [];

    for (let p = 0; p < totalPages; p++) {
      const start = p * ROWS_PER_PAGE;
      const end = (p + 1) * ROWS_PER_PAGE;

      // Slice assets
      let curSlice: BalanceAccountItem[] = [];
      let fixSlice: BalanceAccountItem[] = [];
      const curLen = currentAssets.accounts.length;

      if (start < curLen) {
        curSlice = currentAssets.accounts.slice(start, Math.min(end, curLen));
        const rem = end - curLen;
        if (rem > 0) {
          fixSlice = fixedAssets.accounts.slice(0, rem);
        }
      } else {
        const fixStart = start - curLen;
        const fixEnd = end - curLen;
        fixSlice = fixedAssets.accounts.slice(fixStart, fixEnd);
      }

      // Slice liabilities & equity
      let liabSlice: BalanceAccountItem[] = [];
      let eqSlice: BalanceAccountItem[] = [];
      const liabLen = liabilities.accounts.length;

      if (start < liabLen) {
        liabSlice = liabilities.accounts.slice(start, Math.min(end, liabLen));
        const rem = end - liabLen;
        if (rem > 0) {
          eqSlice = equity.accounts.slice(0, rem);
        }
      } else {
        const eqStart = start - liabLen;
        const eqEnd = end - liabLen;
        eqSlice = equity.accounts.slice(eqStart, eqEnd);
      }

      result.push({
        pageIndex: p,
        currentAssetsAccounts: curSlice,
        fixedAssetsAccounts: fixSlice,
        liabilitiesAccounts: liabSlice,
        equityAccounts: eqSlice,
      });
    }

    return result;
  }, [currentAssets.accounts, fixedAssets.accounts, liabilities.accounts, equity.accounts]);

  return (
    <div className="accounting-print-root laporan-neraca-print-root" aria-hidden="true">
      {pages.map((pageData, pageIdx) => {
        const isLastPage = pageIdx === pages.length - 1;

        return (
          <section
            key={pageIdx}
            className="print-letter-page accounting-print-area laporan-neraca-print-area"
            aria-label={`Halaman ${pageIdx + 1}`}
          >
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

              <div className="mt-3 grid grid-cols-2 items-start gap-3 text-slate-900 text-[6pt]">
                {/* AKTIVA */}
                <div className="overflow-hidden border border-slate-400">
                  <div
                    className="px-2 py-1.5 text-center text-[7.5pt] font-bold uppercase tracking-[0.12em] text-white"
                    style={{ backgroundColor: tableColor }}
                  >
                    Aktiva
                  </div>
                  <table className="w-full table-fixed border-collapse leading-tight">
                    <colgroup>
                      <col className="w-[20%]" />
                      <col className="w-[42%]" />
                      <col className="w-[20%]" />
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
                      {/* ASET LANCAR */}
                      <SectionHeader title="Aset Lancar" />
                      {pageData.currentAssetsAccounts.length === 0 ? (
                        <EmptyRow text={pageIdx === 0 ? 'Tidak ada akun aset lancar' : '-'} />
                      ) : (
                        pageData.currentAssetsAccounts.map((line, index) => {
                          const identity = getLineIdentity(line);
                          const amount = getLineAmount(line);
                          const currency = getCurrency(line.type);
                          return (
                            <tr key={`cur-${line.id ?? index}`} className={index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                              <td className="border border-slate-300 px-1 py-1 font-mono">{identity.code}</td>
                              <td className="border border-slate-300 px-1 py-1 truncate">{identity.name}</td>
                              <td className="border border-slate-300 px-1 py-1 text-right tabular-nums">
                                {formatAmount(currency === 'idr' ? amount : 0, 'idr')}
                              </td>
                              <td className="border border-slate-300 px-1 py-1 text-right tabular-nums">
                                {formatAmount(currency === 'usd' ? amount : 0, 'usd')}
                              </td>
                            </tr>
                          );
                        })
                      )}
                      {isLastPage && (
                        <TotalRow
                          label="Jumlah Aset Lancar"
                          totalIdr={currentAssets.totalIdr}
                          totalUsd={currentAssets.totalUsd}
                        />
                      )}

                      {/* ASET TETAP */}
                      <SectionHeader title="Aset Tetap" />
                      {pageData.fixedAssetsAccounts.length === 0 ? (
                        <EmptyRow text={pageIdx === 0 ? 'Tidak ada akun aset tetap' : '-'} />
                      ) : (
                        pageData.fixedAssetsAccounts.map((line, index) => {
                          const identity = getLineIdentity(line);
                          const amount = getLineAmount(line);
                          const currency = getCurrency(line.type);
                          return (
                            <tr key={`fix-${line.id ?? index}`} className={index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                              <td className="border border-slate-300 px-1 py-1 font-mono">{identity.code}</td>
                              <td className="border border-slate-300 px-1 py-1 truncate">{identity.name}</td>
                              <td className="border border-slate-300 px-1 py-1 text-right tabular-nums">
                                {formatAmount(currency === 'idr' ? amount : 0, 'idr')}
                              </td>
                              <td className="border border-slate-300 px-1 py-1 text-right tabular-nums">
                                {formatAmount(currency === 'usd' ? amount : 0, 'usd')}
                              </td>
                            </tr>
                          );
                        })
                      )}
                      {isLastPage && (
                        <>
                          <TotalRow
                            label="Jumlah Aset Tetap"
                            totalIdr={fixedAssets.totalIdr}
                            totalUsd={fixedAssets.totalUsd}
                          />
                          <tr className="font-bold text-white" style={{ backgroundColor: tableColor }}>
                            <td className="border border-white/30 px-1 py-1.5" />
                            <td className="border border-white/30 px-1 py-1.5 uppercase tracking-wide">Total Aktiva</td>
                            <td className="border border-white/30 px-1 py-1.5 text-right tabular-nums">
                              {currenciesFormat('idr', totalAssetsIdr)}
                            </td>
                            <td className="border border-white/30 px-1 py-1.5 text-right tabular-nums">
                              {currenciesFormat('usd', totalAssetsUsd)}
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PASIVA */}
                <div className="overflow-hidden border border-slate-400">
                  <div
                    className="px-2 py-1.5 text-center text-[7.5pt] font-bold uppercase tracking-[0.12em] text-white"
                    style={{ backgroundColor: tableColor }}
                  >
                    Pasiva
                  </div>
                  <table className="w-full table-fixed border-collapse leading-tight">
                    <colgroup>
                      <col className="w-[20%]" />
                      <col className="w-[42%]" />
                      <col className="w-[20%]" />
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
                      {/* KEWAJIBAN */}
                      <SectionHeader title="Kewajiban" />
                      {pageData.liabilitiesAccounts.length === 0 ? (
                        <EmptyRow text={pageIdx === 0 ? 'Tidak ada akun kewajiban' : '-'} />
                      ) : (
                        pageData.liabilitiesAccounts.map((line, index) => {
                          const identity = getLineIdentity(line);
                          const amount = getLineAmount(line);
                          const currency = getCurrency(line.type);
                          return (
                            <tr key={`liab-${line.id ?? index}`} className={index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                              <td className="border border-slate-300 px-1 py-1 font-mono">{identity.code}</td>
                              <td className="border border-slate-300 px-1 py-1 truncate">{identity.name}</td>
                              <td className="border border-slate-300 px-1 py-1 text-right tabular-nums">
                                {formatAmount(currency === 'idr' ? amount : 0, 'idr')}
                              </td>
                              <td className="border border-slate-300 px-1 py-1 text-right tabular-nums">
                                {formatAmount(currency === 'usd' ? amount : 0, 'usd')}
                              </td>
                            </tr>
                          );
                        })
                      )}
                      {isLastPage && (
                        <TotalRow
                          label="Jumlah Kewajiban"
                          totalIdr={liabilities.totalIdr}
                          totalUsd={liabilities.totalUsd}
                        />
                      )}

                      {/* MODAL */}
                      <SectionHeader title="Modal" />
                      {pageData.equityAccounts.length === 0 ? (
                        <EmptyRow text={pageIdx === 0 ? 'Tidak ada akun modal' : '-'} />
                      ) : (
                        pageData.equityAccounts.map((line, index) => {
                          const identity = getLineIdentity(line);
                          const amount = getLineAmount(line);
                          const currency = getCurrency(line.type);
                          return (
                            <tr key={`eq-${line.id ?? index}`} className={index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                              <td className="border border-slate-300 px-1 py-1 font-mono">{identity.code}</td>
                              <td className="border border-slate-300 px-1 py-1 truncate">{identity.name}</td>
                              <td className="border border-slate-300 px-1 py-1 text-right tabular-nums">
                                {formatAmount(currency === 'idr' ? amount : 0, 'idr')}
                              </td>
                              <td className="border border-slate-300 px-1 py-1 text-right tabular-nums">
                                {formatAmount(currency === 'usd' ? amount : 0, 'usd')}
                              </td>
                            </tr>
                          );
                        })
                      )}
                      {isLastPage && (
                        <>
                          <TotalRow
                            label="Jumlah Modal"
                            totalIdr={equity.totalIdr}
                            totalUsd={equity.totalUsd}
                          />
                          <tr className="font-bold text-white" style={{ backgroundColor: tableColor }}>
                            <td className="border border-white/30 px-1 py-1.5" />
                            <td className="border border-white/30 px-1 py-1.5 uppercase tracking-wide">Total Pasiva</td>
                            <td className="border border-white/30 px-1 py-1.5 text-right tabular-nums">
                              {currenciesFormat('idr', totalPassivaIdr)}
                            </td>
                            <td className="border border-white/30 px-1 py-1.5 text-right tabular-nums">
                              {currenciesFormat('usd', totalPassivaUsd)}
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

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
                  <span>Dokumen laporan neraca · Aktiva dan Pasiva</span>
                  <span>Halaman {pageIdx + 1} dari {pages.length}</span>
                </div>
              </footer>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <tr className="bg-slate-50">
      <td colSpan={4} className="border border-slate-300 px-1.5 py-1 font-bold uppercase tracking-wide text-slate-800">
        {title}
      </td>
    </tr>
  );
}

function EmptyRow({ text }: { text?: string }) {
  return (
    <tr>
      <td className="border border-slate-300 px-1 py-1 text-center font-mono text-slate-400">-</td>
      <td className="border border-slate-300 px-1 py-1 italic text-slate-400">{text || 'Tidak ada rincian'}</td>
      <td className="border border-slate-300 px-1 py-1 text-right text-slate-400">-</td>
      <td className="border border-slate-300 px-1 py-1 text-right text-slate-400">-</td>
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
    <tr className="font-semibold bg-slate-50/80">
      <td className="border border-slate-300 px-1 py-1" />
      <td className="border border-slate-400 px-1 py-1 text-right uppercase text-slate-700">{label}</td>
      <td className="border border-slate-400 px-1 py-1 text-right tabular-nums text-slate-900 font-bold">
        {currenciesFormat('idr', totalIdr)}
      </td>
      <td className="border border-slate-400 px-1 py-1 text-right tabular-nums text-sky-700 font-medium">
        {currenciesFormat('usd', totalUsd)}
      </td>
    </tr>
  );
}
