import * as React from 'react';
import type { DoInvoice } from '@/@types/do-invoice.types';
import type { DocumentTemplate } from '@/@types/document-template.types';
import { getObjectStorageUrl } from '@/components/ui/storage-image';
import { formatInvoiceDate, formatInvoiceMoney, htmlToPlainText } from './do-invoice.utils';

interface DoInvoicePrintDocumentProps {
  invoice: DoInvoice;
  template: DocumentTemplate | null;
  fallbackBackground: string;
  companyName: string;
  printedAt: Date;
}

const ROWS_PER_PRINT_PAGE = 18;

export function DoInvoicePrintDocument({ invoice, template, fallbackBackground, companyName, printedAt }: DoInvoicePrintDocumentProps) {
  const pages = React.useMemo(() => {
    const rows = invoice.expeditions.length ? invoice.expeditions : [null];
    return Array.from({ length: Math.ceil(rows.length / ROWS_PER_PRINT_PAGE) }, (_, index) =>
      rows.slice(index * ROWS_PER_PRINT_PAGE, (index + 1) * ROWS_PER_PRINT_PAGE),
    );
  }, [invoice.expeditions]);

  if (!template) return null;
  const backgroundUrl = template.documentTemplate ? getObjectStorageUrl(template.documentTemplate) : fallbackBackground;
  const signatureUrl = getObjectStorageUrl(template.personSignature);
  const tableColor = /^#[0-9a-f]{6}$/i.test(template.tableColor) ? template.tableColor : '#1f4163';
  const headerInformation = htmlToPlainText(template.headerInformation);
  const footerInformation = htmlToPlainText(template.footerInformation);

  return (
    <div className="accounting-print-root do-invoice-print-root" aria-hidden="true">
      {pages.map((rows, pageIndex) => {
        const isLastPage = pageIndex === pages.length - 1;
        return (
          <section key={pageIndex} className="print-letter-page accounting-print-area do-invoice-print-area" aria-label={`Halaman ${pageIndex + 1}`}>
            {backgroundUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={backgroundUrl} alt="" className="print-letterhead" />
            ) : null}
            <div className="accounting-print-content do-invoice-print-content">
              <header className="border-b-2 pb-2 text-slate-950" style={{ borderColor: tableColor }}>
                <div className="flex items-start justify-between gap-5">
                  <div><p className="text-[7pt] font-semibold uppercase tracking-[0.16em] text-slate-500">Dokumen Tagihan</p><h1 className="mt-0.5 text-[13pt] font-bold uppercase tracking-[0.08em]">DO Invoice</h1><p className="text-[8pt] font-semibold uppercase text-slate-700">{companyName}</p></div>
                  <dl className="grid min-w-[68mm] grid-cols-[22mm_1fr] gap-x-2 gap-y-0.5 text-[7pt]"><dt className="text-slate-500">Nomor</dt><dd>: {invoice.code}</dd><dt className="text-slate-500">Tanggal</dt><dd>: {formatInvoiceDate(invoice.date)}</dd><dt className="text-slate-500">Dicetak</dt><dd>: {formatInvoiceDate(printedAt.toISOString())}</dd></dl>
                </div>
                {headerInformation ? <p className="mt-2 whitespace-pre-line text-[7pt] leading-snug text-slate-600">{headerInformation}</p> : null}
              </header>
              <div className="mt-3 grid grid-cols-2 gap-4 text-[8pt]"><div><p className="text-slate-500">Kepada</p><p className="font-semibold">{invoice.customer?.name || invoice.orderList?.customer?.name || '-'}</p><p>{invoice.customer?.address || invoice.orderList?.customer?.address || ''}</p></div><div><p><span className="text-slate-500">Perihal:</span> {invoice.subject || '-'}</p><p><span className="text-slate-500">Order List:</span> {invoice.orderList?.code || '-'}</p></div></div>
              {invoice.letterContent ? <p className="mt-3 whitespace-pre-line text-[7.5pt] leading-relaxed">{htmlToPlainText(invoice.letterContent)}</p> : null}
              <div className="mt-3 overflow-hidden border border-slate-400">
                <table className="w-full table-fixed border-collapse text-[6.5pt] leading-tight text-slate-900">
                  <colgroup><col className="w-[6%]" /><col className="w-[14%]" /><col className="w-[18%]" /><col className="w-[22%]" /><col className="w-[18%]" /><col className="w-[22%]" /></colgroup>
                  <thead><tr className="text-white" style={{ backgroundColor: tableColor }}><th className="border border-white/30 p-1.5">No</th><th className="border border-white/30 p-1.5">Tanggal</th><th className="border border-white/30 p-1.5">No. DO</th><th className="border border-white/30 p-1.5">Driver / Armada</th><th className="border border-white/30 p-1.5">Tujuan</th><th className="border border-white/30 p-1.5 text-right">Nominal</th></tr></thead>
                  <tbody>
                    {rows.map((row, index) => <tr key={row?.id ?? index} className={index % 2 ? 'bg-slate-50/80' : 'bg-white'}><td className="border border-slate-300 p-1.5 text-center">{pageIndex * ROWS_PER_PRINT_PAGE + index + 1}</td><td className="border border-slate-300 p-1.5">{formatInvoiceDate(row?.date)}</td><td className="border border-slate-300 p-1.5">{row?.noSuratDo || '-'}</td><td className="border border-slate-300 p-1.5">{row ? `${row.driver?.name || '-'} / ${row.vehicle?.registrationNumber || '-'}` : '-'}</td><td className="border border-slate-300 p-1.5">{row?.destination || '-'}</td><td className="border border-slate-300 p-1.5 text-right tabular-nums">{formatInvoiceMoney(row?.totalAmount)}</td></tr>)}
                    {isLastPage ? <><tr><td colSpan={5} className="border border-slate-400 p-1.5 text-right">Biaya Lain</td><td className="border border-slate-400 p-1.5 text-right">{formatInvoiceMoney(invoice.otherFee)}</td></tr><tr><td colSpan={5} className="border border-slate-400 p-1.5 text-right">Biaya Tambahan</td><td className="border border-slate-400 p-1.5 text-right">{formatInvoiceMoney(invoice.additionalFee)}</td></tr><tr className="font-bold" style={{ backgroundColor: `${tableColor}14` }}><td colSpan={5} className="border border-slate-400 p-2 text-right uppercase">Grand Total</td><td className="border border-slate-400 p-2 text-right">{formatInvoiceMoney(invoice.nominal || invoice.billing?.grandTotal)}</td></tr></> : null}
                  </tbody>
                </table>
              </div>
              <footer className="mt-auto pt-3 text-[7pt] text-slate-600">
                {isLastPage ? <div className="mb-[24mm] flex items-end justify-between gap-8"><p className="max-w-[115mm] whitespace-pre-line leading-snug">{footerInformation}</p><div className="min-w-[45mm] text-center text-slate-800"><p>Mengetahui,</p><div className="flex h-[16mm] items-center justify-center">{signatureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={signatureUrl} alt="" className="max-h-[16mm] max-w-[38mm] object-contain" />
                ) : null}</div><p className="border-t border-slate-700 pt-1 font-semibold">{template.personSigner || '-'}</p></div></div> : null}
                <div className="flex items-center justify-between border-t border-slate-300 pt-1.5 text-[6.5pt]"><span>{invoice.code}</span><span>Halaman {pageIndex + 1} dari {pages.length}</span></div>
              </footer>
            </div>
          </section>
        );
      })}
    </div>
  );
}
