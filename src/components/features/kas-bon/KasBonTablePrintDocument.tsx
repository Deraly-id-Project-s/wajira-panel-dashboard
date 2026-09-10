import { useMemo } from 'react';
import type { DocumentTemplate } from '@/@types/document-template.types';
import type { DriverCashAdvance } from '@/@types/driver-cash-advance.types';
import { getObjectStorageUrl } from '@/components/ui/storage-image';
import { currenciesFormat } from '@/components/ui/currenciesFormat';

const ROWS_PER_PRINT_PAGE = 22;

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

export interface KasBonTablePrintDocumentProps {
  data: DriverCashAdvance[];
  template: DocumentTemplate | null;
  fallbackBackground?: string;
  companyName: string;
  periodLabel: string;
  reportPage: number;
  reportTotal: number;
  printedAt: Date;
}

export function KasBonTablePrintDocument({
  data,
  template,
  fallbackBackground,
  companyName,
  periodLabel,
  reportPage,
  reportTotal,
  printedAt,
}: KasBonTablePrintDocumentProps) {
  const pages = useMemo(() => {
    if (data.length === 0) return [[]];
    return Array.from({ length: Math.ceil(data.length / ROWS_PER_PRINT_PAGE) }, (_, index) =>
      data.slice(index * ROWS_PER_PRINT_PAGE, (index + 1) * ROWS_PER_PRINT_PAGE),
    );
  }, [data]);

  const totals = useMemo(
    () =>
      data.reduce(
        (acc, item) => {
          const approved =
            item.approveNominal !== undefined && item.approveNominal !== null
              ? Number(item.approveNominal)
              : item.isApprove
              ? Number(item.claimNominal) || 0
              : 0;
          const remaining =
            item.remainingNominal !== undefined && item.remainingNominal !== null
              ? Number(item.remainingNominal)
              : Number(item.billings?.[0]?.remainingPayment) || 0;

          return {
            claim: acc.claim + (Number(item.claimNominal) || 0),
            approve: acc.approve + approved,
            remaining: acc.remaining + remaining,
          };
        },
        { claim: 0, approve: 0, remaining: 0 },
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
    <div className="accounting-print-root kas-bon-table-print-root" aria-hidden="true">
      {pages.map((rows, pageIndex) => {
        const isLastPage = pageIndex === pages.length - 1;

        return (
          <section
            key={pageIndex}
            className="print-letter-page accounting-print-area kas-bon-table-print-area"
            aria-label={`Kas bon halaman ${pageIndex + 1}`}
          >
            {backgroundUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={backgroundUrl} alt="" className="print-letterhead" />
            )}

            <div className="accounting-print-content kas-bon-table-print-content">
              <header className="border-b-2 pb-2 text-slate-950" style={{ borderColor: tableColor }}>
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-[7pt] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Laporan Driver Cash Advance
                    </p>
                    <h1 className="mt-0.5 text-[13pt] font-bold uppercase tracking-[0.08em]">
                      Daftar Kas Bon Driver
                    </h1>
                    <p className="mt-0.5 text-[8pt] font-semibold uppercase text-slate-700">{companyName}</p>
                  </div>
                  <dl className="grid min-w-[60mm] grid-cols-[20mm_1fr] gap-x-2 gap-y-0.5 text-[7pt] leading-tight">
                    <dt className="text-slate-500">Periode</dt>
                    <dd className="font-medium">: {periodLabel}</dd>
                    <dt className="text-slate-500">Total Data</dt>
                    <dd className="font-medium">: {data.length} transaksi</dd>
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
                    <col className="w-[4%]" />
                    <col className="w-[12%]" />
                    <col className="w-[10%]" />
                    <col className="w-[16%]" />
                    <col className="w-[8%]" />
                    <col className="w-[13%]" />
                    <col className="w-[10%]" />
                    <col className="w-[13%]" />
                    <col className="w-[8%]" />
                    <col className="w-[6%]" />
                  </colgroup>
                  <thead>
                    <tr className="text-white" style={{ backgroundColor: tableColor }}>
                      <th className="border border-white/30 px-1 py-1.5 text-center font-semibold uppercase">No</th>
                      <th className="border border-white/30 px-1.5 py-1.5 text-left font-semibold uppercase">Kode Kas Bon</th>
                      <th className="border border-white/30 px-1.5 py-1.5 text-center font-semibold uppercase">Tgl Klaim</th>
                      <th className="border border-white/30 px-1.5 py-1.5 text-left font-semibold uppercase">Driver</th>
                      <th className="border border-white/30 px-1.5 py-1.5 text-center font-semibold uppercase">Pengajuan</th>
                      <th className="border border-white/30 px-1.5 py-1.5 text-right font-semibold uppercase">Diajukan</th>
                      <th className="border border-white/30 px-1.5 py-1.5 text-center font-semibold uppercase">Approval</th>
                      <th className="border border-white/30 px-1.5 py-1.5 text-right font-semibold uppercase">Disetujui</th>
                      <th className="border border-white/30 px-1.5 py-1.5 text-right font-semibold uppercase">Sisa</th>
                      <th className="border border-white/30 px-1.5 py-1.5 text-center font-semibold uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="border border-slate-300 px-2 py-8 text-center text-slate-500">
                          Tidak ada data kas bon yang dapat dicetak.
                        </td>
                      </tr>
                    ) : (
                      rows.map((item, rowIndex) => {
                        const globalIndex = pageIndex * ROWS_PER_PRINT_PAGE + rowIndex + 1;
                        const isApproved = item.isApprove;
                        const isDriver = Boolean(item.is_driver_request ?? item.isDriverRequest);
                        const approvedNominal =
                          item.approveNominal !== undefined && item.approveNominal !== null
                            ? item.approveNominal
                            : isApproved
                            ? item.claimNominal
                            : null;
                        const remaining =
                          item.remainingNominal !== undefined && item.remainingNominal !== null
                            ? item.remainingNominal
                            : item.billings?.[0]?.remainingPayment ?? 0;
                        const isPaid = item.isPaid || (item.billings && item.billings[0]?.isPaid);

                        return (
                          <tr
                            key={item.id ?? rowIndex}
                            className={rowIndex % 2 === 1 ? 'bg-slate-50/80' : 'bg-white'}
                          >
                            <td className="border border-slate-300 px-1 py-1 text-center font-mono">{globalIndex}</td>
                            <td className="border border-slate-300 px-1.5 py-1 font-mono font-medium">
                              {item.code || `KB-${item.id}`}
                            </td>
                            <td className="border border-slate-300 px-1.5 py-1 text-center tabular-nums">
                              {formatCompactDate(item.claimDate)}
                            </td>
                            <td className="border border-slate-300 px-1.5 py-1 font-medium truncate">
                              {item.driver?.name || '-'}
                            </td>
                            <td className="border border-slate-300 px-1 py-1 text-center">
                              <span
                                className={`inline-block rounded px-1 py-0.5 text-[5.5pt] font-semibold uppercase ${
                                  isDriver ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {isDriver ? 'Driver' : 'Kantor'}
                              </span>
                            </td>
                            <td className="border border-slate-300 px-1.5 py-1 text-right tabular-nums">
                              {currenciesFormat('idr', item.claimNominal)}
                            </td>
                            <td className="border border-slate-300 px-1 py-1 text-center">
                              <span
                                className={`inline-block rounded px-1 py-0.5 text-[5.5pt] font-semibold uppercase ${
                                  isApproved === true
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : isApproved === false
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {isApproved === true ? 'Disetujui' : isApproved === false ? 'Ditolak' : 'Menunggu'}
                              </span>
                            </td>
                            <td className="border border-slate-300 px-1.5 py-1 text-right tabular-nums">
                              {approvedNominal !== null && approvedNominal !== undefined
                                ? currenciesFormat('idr', approvedNominal)
                                : '-'}
                            </td>
                            <td className="border border-slate-300 px-1.5 py-1 text-right tabular-nums">
                              {currenciesFormat('idr', remaining)}
                            </td>
                            <td className="border border-slate-300 px-1 py-1 text-center font-medium">
                              <span
                                className={`inline-block rounded px-1 py-0.5 text-[5.5pt] font-semibold uppercase ${
                                  isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {isPaid ? 'Lunas' : 'Belum'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                    {isLastPage && data.length > 0 && (
                      <tr className="font-bold" style={{ backgroundColor: `${tableColor}14` }}>
                        <td colSpan={5} className="border border-slate-400 px-1.5 py-2 text-right uppercase tracking-wide">
                          Total
                        </td>
                        <td className="border border-slate-400 px-1.5 py-2 text-right tabular-nums">
                          {currenciesFormat('idr', totals.claim)}
                        </td>
                        <td className="border border-slate-400 px-1.5 py-2"></td>
                        <td className="border border-slate-400 px-1.5 py-2 text-right tabular-nums">
                          {currenciesFormat('idr', totals.approve)}
                        </td>
                        <td className="border border-slate-400 px-1.5 py-2 text-right tabular-nums">
                          {currenciesFormat('idr', totals.remaining)}
                        </td>
                        <td className="border border-slate-400 px-1.5 py-2"></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <footer className="mt-auto pt-3 text-[7pt] text-slate-600">
                {isLastPage && (
                  <div className="mb-[20mm] flex items-end justify-between gap-8">
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
                  <span>Data halaman aplikasi {reportPage} · {reportTotal} total data kas bon</span>
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
