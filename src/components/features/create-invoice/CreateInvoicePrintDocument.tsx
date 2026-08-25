import { useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import { Download, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import type { CreateInvoicePrintPayload } from '@/@types/create-invoice.types';
import { Button } from '@/components/ui/button';
import { formatDisplayDate, formatLongDate, formatMoney, formatInvoiceMoney } from './create-invoice.utils';

interface Props {
  payload: CreateInvoicePrintPayload;
  letterheadUrl: string;
  hideControls?: boolean;
}

const COMPANY_BANK_NAME = 'PT. WAJIRA JAGRATARA TRANSINDO';
const COMPANY_BANK_ACCOUNT = '456-631-1313';
const COMPANY_CONFIRMATION_NUMBER = '0878-8353-1313';

export function CreateInvoicePrintDocument({ payload, letterheadUrl, hideControls = false }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const isUsd = Boolean(payload.draft?.isUsd);
  const rateUsd = Number(payload.draft?.rateUsd ?? 16000);
  const totalInvoice = useMemo(() => payload.rows.reduce((sum, row) => sum + row.invoiceExpedition, 0), [payload.rows]);
  const totalPpn = useMemo(() => payload.rows.reduce((sum, row) => sum + row.ppn, 0), [payload.rows]);
  const totalAmount = useMemo(() => payload.rows.reduce((sum, row) => sum + row.totalAmount, 0), [payload.rows]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${payload.invoiceCode}`,
    pageStyle: `
      @page { size: A4; margin: 0; }
      @media print {
        html, body { width: 210mm; height: 297mm; margin: 0; padding: 0; }
        .no-print { display: none !important; }
      }
    `,
  });

  const loadImageAsDataUrl = async (url: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleDownload = async () => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const drawLetterhead = async () => {
      if (!letterheadUrl) return;
      const image = await loadImageAsDataUrl(letterheadUrl);
      pdf.addImage(image, 'JPEG', 0, 0, pageWidth, pageHeight);
    };

    const drawTableHeader = (y: number) => {
      const columns: Array<{ label: string; width: number; align: 'left' | 'center' | 'right' }> = [
        { label: 'NO', width: 6, align: 'center' },
        { label: 'TGL', width: 12, align: 'center' },
        { label: 'NOPOL', width: 14, align: 'left' },
        { label: 'TYPE', width: 10, align: 'left' },
        { label: 'DRIVER', width: 18, align: 'left' },
        { label: 'MUAT', width: 14, align: 'left' },
        { label: 'TUJUAN', width: 18, align: 'left' },
        { label: 'BONGKAR', width: 14, align: 'left' },
        { label: 'NO DO', width: 14, align: 'left' },
        { label: 'DESKRIPSI', width: 18, align: 'left' },
        { label: 'QTY', width: 8, align: 'center' },
        { label: isUsd ? 'INV ($)' : 'INV', width: 18, align: 'center' },
        { label: isUsd ? 'PPN ($)' : 'PPN', width: 14, align: 'center' },
        { label: isUsd ? 'TOTAL ($)' : 'TOTAL', width: 18, align: 'center' },
      ];

      let x = 8;
      pdf.setFillColor(31, 65, 99);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6);

      columns.forEach((column) => {
        pdf.rect(x, y, column.width, 8, 'F');
        pdf.rect(x, y, column.width, 8);
        pdf.text(column.label, x + column.width / 2, y + 5, { align: 'center' });
        x += column.width;
      });

      pdf.setTextColor(0, 0, 0);
      return columns;
    };

    try {
      await drawLetterhead();

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text('Nomor', 20, 52);
      pdf.text(':', 40, 52);
      pdf.setFont('helvetica', 'bold');
      pdf.text(payload.invoiceCode, 44, 52);

      pdf.setFont('helvetica', 'normal');
      pdf.text('Lampiran', 20, 57);
      pdf.text(':', 40, 57);
      pdf.text(payload.draft.attachmentLabel || '-', 44, 57);

      pdf.text('Perihal', 20, 62);
      pdf.text(':', 40, 62);
      pdf.text(payload.draft.subject, 44, 62);
      pdf.text(`Yogyakarta, ${formatLongDate(payload.draft.date)}`, 145, 52);

      pdf.text('Kepada', 145, 64);
      pdf.text('Yth.', 145, 69);
      pdf.setFont('helvetica', 'bold');
      pdf.text(payload.customerName, 155, 69, { maxWidth: 38 });

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('INVOICE', pageWidth / 2, 95, { align: 'center' });
      pdf.line(pageWidth / 2 - 9, 96.5, pageWidth / 2 + 9, 96.5);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.2);
      const letterLines = pdf.splitTextToSize(payload.draft.letterContent, 165);
      let y = 106;
      letterLines.forEach((line: string) => {
        pdf.text(line, 20, y);
        y += 4.5;
      });

      pdf.text(`No. REK BCA : ${COMPANY_BANK_ACCOUNT}`, 26, y + 3);
      pdf.text(`Nama : ${COMPANY_BANK_NAME}`, 26, y + 8);
      pdf.text(`Konfirmasi transfer : ${COMPANY_CONFIRMATION_NUMBER}`, 26, y + 13);
      if (isUsd) {
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Kurs Konversi : 1 USD = ${formatInvoiceMoney(rateUsd, false)}`, 26, y + 18);
      }

      let tableY = y + 20;
      let columns = drawTableHeader(tableY);
      tableY += 8;
      pdf.setFontSize(5.8);
      pdf.setFont('helvetica', 'normal');

      for (let index = 0; index < payload.rows.length; index += 1) {
        const row = payload.rows[index];
        const values = [
          String(index + 1),
          formatDisplayDate(row.date),
          row.noPolisi,
          row.type,
          row.driver,
          row.loadingIn,
          row.destination,
          row.loadingOut,
          row.noSuratDo,
          row.description,
          String(row.qty),
          formatInvoiceMoney(row.invoiceExpedition, isUsd, rateUsd),
          formatInvoiceMoney(row.ppn, isUsd, rateUsd),
          formatInvoiceMoney(row.totalAmount, isUsd, rateUsd),
        ];

        const rowHeight = 8;
        if (tableY + rowHeight > 270) {
          pdf.addPage();
          await drawLetterhead();
          tableY = 44;
          columns = drawTableHeader(tableY);
          tableY += 8;
        }

        let x = 8;
        columns.forEach((column, columnIndex) => {
          pdf.rect(x, tableY, column.width, rowHeight);
          const align = column.align;
          const textX = align === 'center' ? x + column.width / 2 : align === 'right' ? x + column.width - 1 : x + 1;
          pdf.text(String(values[columnIndex] || '-'), textX, tableY + 5, { align });
          x += column.width;
        });
        tableY += rowHeight;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.rect(152, tableY + 2, 48, 7);
      pdf.text(isUsd ? 'TOTAL INV (USD)' : 'TOTAL INVOICE', 174, tableY + 6.5, { align: 'center' });
      pdf.rect(152, tableY + 9, 48, 7);
      pdf.text(formatInvoiceMoney(totalInvoice, isUsd, rateUsd), 198, tableY + 13.5, { align: 'right' });
      pdf.rect(152, tableY + 16, 48, 7);
      pdf.text(formatInvoiceMoney(totalPpn, isUsd, rateUsd), 198, tableY + 20.5, { align: 'right' });
      pdf.rect(152, tableY + 23, 48, 7);
      pdf.text(formatInvoiceMoney(totalAmount, isUsd, rateUsd), 198, tableY + 27.5, { align: 'right' });

      pdf.save(`Invoice-${payload.invoiceCode}.pdf`);
    } catch (error) {
      console.error('Failed to download invoice PDF', error);
    }
  };

  return (
    <div className="space-y-4">
      {!hideControls && (
        <div className="no-print flex items-center justify-end gap-3">
          <Button type="button" onClick={handleDownload} variant="outline" className="w-full sm:w-auto">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          <Button type="button" onClick={() => handlePrint()} variant="outline" className="w-full sm:w-auto">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      )}

      <div ref={printRef} className="relative mx-auto overflow-hidden bg-white shadow-md border print-letter-page" style={{ width: '210mm', minHeight: '297mm' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={letterheadUrl} alt="Letterhead" className="absolute inset-0 h-full w-full object-cover" />

        <div className="relative min-h-[297mm] px-[20mm] pt-[42mm]">
          <div className="flex justify-between text-[10pt] text-slate-900">
            <div className="space-y-1">
              <div><span className="inline-block w-[24mm]">Nomor</span>: <strong>{payload.invoiceCode}</strong></div>
              <div><span className="inline-block w-[24mm]">Lampiran</span>: {payload.draft.attachmentLabel || '-'}</div>
              <div><span className="inline-block w-[24mm]">Perihal</span>: {payload.draft.subject}</div>
            </div>
            <div>Yogyakarta, {formatLongDate(payload.draft.date)}</div>
          </div>

          <div className="mt-7 text-[10pt] text-slate-900">
            <div>Kepada</div>
            <div>Yth. <strong>{payload.customerName}</strong></div>
            <div>Di Tempat</div>
          </div>

          <div className="mt-7 text-center text-[12pt] font-semibold tracking-[0.18em] text-slate-900">
            <span className="border-b border-slate-900">INVOICE</span>
          </div>

          <div className="mt-7 whitespace-pre-line text-[9pt] leading-6 text-slate-900">{payload.draft.letterContent}</div>

          <div className="mt-5 text-[9pt] leading-6 text-slate-900 flex justify-between items-end">
            <div>
              <div>No. REK BCA : {COMPANY_BANK_ACCOUNT}</div>
              <div>Nama : {COMPANY_BANK_NAME}</div>
              <div>Konfirmasi transfer : {COMPANY_CONFIRMATION_NUMBER}</div>
              {isUsd && (
                <div className="font-semibold text-amber-950 mt-1">
                  Kurs Konversi: 1 USD = {formatInvoiceMoney(rateUsd, false)}
                </div>
              )}
            </div>
            {isUsd && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-md px-4 py-2.5 text-xs font-semibold text-right">
                <div>INVOICE MATA UANG: USD</div>
                <div>KURS ACUAN: 1 USD = {formatInvoiceMoney(rateUsd, false)}</div>
              </div>
            )}
          </div>

          <div className="mt-5 overflow-hidden rounded-[16px] border border-slate-200">
            <table className="w-full border-collapse text-[7.2pt]">
              <thead>
                <tr className="button-theme-1!">
                  {['NO', 'TANGGAL', 'NO POLISI', 'TYPE', 'DRIVER', 'LOADING IN', 'TUJUAN KIRIM', 'LOADING OUT', 'NO SURAT DO', 'DESKRIPSI', 'QTY', isUsd ? 'INV EKSPEDISI (USD)' : 'INV EKSPEDISI', isUsd ? 'PPN (USD)' : 'PPN', isUsd ? 'TOTAL (USD)' : 'TOTAL'].map((header) => (
                    <th key={header} className="border border-white/20 px-1 py-2 text-center font-semibold">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payload.rows.map((row, index) => (
                  <tr key={`${row.invoiceId}-${row.expeditionId}-${index}`} className="border-slate-200">
                    <td className="border border-slate-200 px-1 py-2 text-center">{index + 1}</td>
                    <td className="border border-slate-200 px-1 py-2 text-center">{formatDisplayDate(row.date)}</td>
                    <td className="border border-slate-200 px-1 py-2">{row.noPolisi}</td>
                    <td className="border border-slate-200 px-1 py-2">{row.type}</td>
                    <td className="border border-slate-200 px-1 py-2">{row.driver}</td>
                    <td className="border border-slate-200 px-1 py-2">{row.loadingIn}</td>
                    <td className="border border-slate-200 px-1 py-2">{row.destination}</td>
                    <td className="border border-slate-200 px-1 py-2">{row.loadingOut}</td>
                    <td className="border border-slate-200 px-1 py-2">{row.noSuratDo}</td>
                    <td className="border border-slate-200 px-1 py-2">{row.description}</td>
                    <td className="border border-slate-200 px-1 py-2 text-center">{row.qty}</td>
                    <td className="border border-slate-200 px-1 py-2 text-center">{formatInvoiceMoney(row.invoiceExpedition, isUsd, rateUsd)}</td>
                    <td className="border border-slate-200 px-1 py-2 text-center">{formatInvoiceMoney(row.ppn, isUsd, rateUsd)}</td>
                    <td className="border border-slate-200 px-1 py-2 text-center">{formatInvoiceMoney(row.totalAmount, isUsd, rateUsd)}</td>
                  </tr>
                ))}
                <tr className="bg-[#effaf3] font-semibold text-slate-900">
                  <td colSpan={11} className="border border-slate-200 px-2 py-3 text-center">TOTAL PAYMENT {isUsd ? '(USD)' : ''}</td>
                  <td className="border border-slate-200 px-2 py-3 text-right">{formatInvoiceMoney(totalInvoice, isUsd, rateUsd)}</td>
                  <td className="border border-slate-200 px-2 py-3 text-right">{formatInvoiceMoney(totalPpn, isUsd, rateUsd)}</td>
                  <td className="border border-slate-200 px-2 py-3 text-right">{formatInvoiceMoney(totalAmount, isUsd, rateUsd)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
