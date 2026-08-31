import { useMemo } from 'react';

import type { LedgerReportItem } from '@/@types/ledger-report.types';
import { currenciesFormat } from '@/components/ui/currenciesFormat';

const ROWS_PER_PAGE = 20;
const REPORT_COLOR = '#1f4163';

interface LaporanBukuBesarPrintDocumentProps {
  data: LedgerReportItem[];
  backgroundUrl?: string;
  companyName: string;
  accountLabel: string;
  periodLabel: string;
  openingBalance: number;
  endingBalance: number;
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

export function LaporanBukuBesarPrintDocument({
  data,
  backgroundUrl,
  companyName,
  accountLabel,
  periodLabel,
  openingBalance,
  endingBalance,
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
      }),
      { debit: 0, credit: 0 },
    ),
    [data],
  );

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
              <header className="border-b-2 pb-2 text-slate-950" style={{ borderColor: REPORT_COLOR }}>
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
              </header>

              <div className="mt-3 overflow-hidden border border-slate-400">
                <table className="w-full table-fixed border-collapse text-[6pt] leading-tight text-slate-900">
                  <colgroup>
                    <col className="w-[7%]" />
                    <col className="w-[8%]" />
                    <col className="w-[12%]" />
                    <col className="w-[11%]" />
                    <col className="w-[15%]" />
                    <col className="w-[13%]" />
                    <col className="w-[9%]" />
                    <col className="w-[8%]" />
                    <col className="w-[8%]" />
                    <col className="w-[9%]" />
                  </colgroup>
                  <thead>
                    <tr className="text-white" style={{ backgroundColor: REPORT_COLOR }}>
                      {['Tanggal', 'Kode Akun', 'Nama Akun', 'Kode Transaksi', 'Keterangan', 'Jenis Transaksi', 'Saldo Awal', 'Debit', 'Kredit', 'Saldo Akhir'].map((label, index) => (
                        <th key={label} className={`border border-white/30 px-1 py-1.5 font-semibold uppercase tracking-wide ${index >= 6 ? 'text-right' : 'text-left'}`}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="border border-slate-300 px-2 py-8 text-center text-slate-500">
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
                        <td className="border border-slate-300 px-1 py-1.5 text-right font-medium tabular-nums">{money(item.cash_position_after)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {isLastPage && (
                <section className="ml-auto mt-4 w-[90mm] text-[7pt] text-slate-900" aria-label="Ringkasan saldo buku besar">
                  <div className="border-b px-2 pb-1.5 text-[7pt] font-bold uppercase tracking-[0.12em]" style={{ borderColor: REPORT_COLOR }}>
                    Ringkasan Saldo
                  </div>
                  <dl className="grid grid-cols-[1fr_38mm] border-b border-slate-300 px-2 py-1.5">
                    <dt>Saldo awal periode</dt>
                    <dd className="text-right font-medium tabular-nums">{money(openingBalance)}</dd>
                    <dt className="text-slate-500">Mutasi debit — halaman aktif</dt>
                    <dd className="text-right tabular-nums">{money(movement.debit)}</dd>
                    <dt className="text-slate-500">Mutasi kredit — halaman aktif</dt>
                    <dd className="text-right tabular-nums">({money(movement.credit)})</dd>
                  </dl>
                  <dl className="grid grid-cols-[1fr_38mm] border-b-4 border-double px-2 py-2 text-[8pt] font-bold" style={{ borderColor: REPORT_COLOR }}>
                    <dt>Saldo akhir periode</dt>
                    <dd className="text-right tabular-nums">{money(endingBalance)}</dd>
                  </dl>
                </section>
              )}

              <footer className="mt-auto flex items-center justify-between border-t border-slate-300 pt-1.5 text-[6.5pt] text-slate-600">
                <span>Data halaman aplikasi {reportPage} · {reportTotal} total mutasi</span>
                <span>Halaman {pageIndex + 1} dari {pages.length}</span>
              </footer>
            </div>
          </section>
        );
      })}
    </div>
  );
}
