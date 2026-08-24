import { useRef } from 'react';
import jsPDF from 'jspdf';
import { Download, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import type { SalesItem } from '@/components/features/sales/sales.data';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/currency';
import type { DocumentTemplate } from '@/@types/document-template.types';
import { getObjectStorageUrl } from '@/components/ui/storage-image';

interface PrintItem {
  id: string | number;
  unit_type_name?: string;
  color?: string;
  chassis_number?: string;
  machine_number?: string;
  price?: number;
  price_usd?: number;
}

interface Props {
  sales: SalesItem;
  items: PrintItem[];
  letterheadUrl: string;
  companyName: string;
  hideControls?: boolean;
  printRef?: React.RefObject<HTMLDivElement | null>;
  documentTemplate: DocumentTemplate;
}

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '');
  return [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16)) as [number, number, number];
};

const htmlToText = (html?: string) => html?.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, '').trim() ?? '';

const formatLongDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export default function SalesPrintDocument({
  sales,
  items,
  letterheadUrl,
  companyName,
  hideControls = false,
  printRef,
  documentTemplate,
}: Props) {
  const localPrintRef = useRef<HTMLDivElement>(null);

  const totalBruto = Number(sales.totalJual ?? 0);
  const totalDpp = Number(sales.totalDpp ?? 0);
  const totalPpn = Number(sales.totalPpn ?? 0);
  const backgroundUrl = documentTemplate.documentTemplate ? getObjectStorageUrl(documentTemplate.documentTemplate) : letterheadUrl;
  const signatureUrl = documentTemplate.personSignature ? getObjectStorageUrl(documentTemplate.personSignature) : null;

  const handlePrint = useReactToPrint({
    contentRef: printRef || localPrintRef,
    documentTitle: `SalesInvoice-${sales.kodeJual}`,
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
      if (!backgroundUrl) return;
      try {
        const image = await loadImageAsDataUrl(backgroundUrl);
        pdf.addImage(image, 'JPEG', 0, 0, pageWidth, pageHeight);
      } catch (err) {
        console.error('Failed to load letterhead image', err);
      }
    };

    const drawTableHeader = (y: number) => {
      const columns: { label: string; width: number; align: 'left' | 'center' | 'right' }[] = [
        { label: 'NO', width: 10, align: 'center' },
        { label: 'TIPE UNIT', width: 45, align: 'left' },
        { label: 'WARNA', width: 28, align: 'left' },
        { label: 'NO RANGKA', width: 45, align: 'left' },
        { label: 'NO MESIN', width: 35, align: 'left' },
        { label: 'HARGA', width: 32, align: 'center' },
      ];

      let x = 10;
      pdf.setFillColor(...hexToRgb(documentTemplate.tableColor || '#1f4163'));
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);

      columns.forEach((column) => {
        pdf.rect(x, y, column.width, 8, 'F');
        pdf.rect(x, y, column.width, 8);
        pdf.text(column.label, x + (column.align === 'center' ? column.width / 2 : column.align === 'right' ? column.width - 2 : 2), y + 5.5, {
          align: column.align === 'center' ? 'center' : column.align === 'right' ? 'right' : 'left',
        });
        x += column.width;
      });

      pdf.setTextColor(0, 0, 0);
      return columns;
    };

    try {
      await drawLetterhead();

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('Nomor Invoice', 20, 52);
      pdf.text(':', 45, 52);
      pdf.setFont('helvetica', 'bold');
      pdf.text(sales.kodeJual, 48, 52);

      pdf.setFont('helvetica', 'normal');
      pdf.text('Perihal', 20, 58);
      pdf.text(':', 45, 58);
      pdf.text(documentTemplate.subject || 'Penjualan / Penyerahan Unit Motor', 48, 58);

      pdf.text('Gudang Asal', 20, 64);
      pdf.text(':', 45, 64);
      pdf.text(sales.warehouse || '-', 48, 64);
      pdf.text(`Yogyakarta, ${formatLongDate(sales.tanggal)}`, 145, 52);

      pdf.text('Kepada', 145, 64);
      pdf.text('Yth. Customer:', 145, 69);
      pdf.setFont('helvetica', 'bold');
      pdf.text(sales.customer || '-', 145, 74, { maxWidth: 45 });

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text(documentTemplate.subject || 'SALES INVOICE', pageWidth / 2, 95, { align: 'center' });
      pdf.line(pageWidth / 2 - 15, 96.5, pageWidth / 2 + 15, 96.5);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.text('Dengan hormat,', 20, 105);
      const headerText = htmlToText(documentTemplate.headerInformation) || 'Bersama ini kami sampaikan rincian penjualan unit motor dengan detail sebagai berikut:';
      pdf.text(pdf.splitTextToSize(headerText, 170), 20, 110);

      let tableY = 118;
      let columns = drawTableHeader(tableY);
      tableY += 8;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');

      for (let index = 0; index < items.length; index += 1) {
        const row = items[index];
        const priceUsdVal = Number((row as any).price_usd || 0);
        const priceDisplay = priceUsdVal > 0
          ? `${formatCurrency(row.price ?? 0)} / ${formatCurrency(priceUsdVal, 'USD')}`
          : formatCurrency(row.price ?? 0);

        const values = [
          String(index + 1),
          row.unit_type_name || '-',
          row.color || '-',
          row.chassis_number || '-',
          row.machine_number || '-',
          priceDisplay,
        ];

        const rowHeight = 8;
        if (tableY + rowHeight > 260) {
          pdf.addPage();
          await drawLetterhead();
          tableY = 44;
          columns = drawTableHeader(tableY);
          tableY += 8;
        }

        let x = 10;
        columns.forEach((column, columnIndex) => {
          pdf.rect(x, tableY, column.width, rowHeight);
          const align = column.align;
          const textX = align === 'center' ? x + column.width / 2 : align === 'right' ? x + column.width - 2 : x + 2;
          pdf.text(String(values[columnIndex] || '-'), textX, tableY + 5.5, { align });
          x += column.width;
        });
        tableY += rowHeight;
      }

      if (tableY + 35 > 260) {
        pdf.addPage();
        await drawLetterhead();
        tableY = 44;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.rect(130, tableY + 2, 70, 7);
      pdf.text('TOTAL DPP', 133, tableY + 6.5);
      pdf.text(formatCurrency(totalDpp), 182.5, tableY + 6.5, { align: 'center' });

      pdf.rect(130, tableY + 9, 70, 7);
      pdf.text('TOTAL PPN', 133, tableY + 13.5);
      pdf.text(formatCurrency(totalPpn), 182.5, tableY + 13.5, { align: 'center' });

      pdf.rect(130, tableY + 16, 70, 7);
      pdf.text('TOTAL BRUTO', 133, tableY + 20.5);
      pdf.text(formatCurrency(totalBruto), 182.5, tableY + 20.5, { align: 'center' });

      const totalPriceUsd = items.reduce((sum, item) => sum + Number((item as any).price_usd || 0), 0);
      if (totalPriceUsd > 0) {
        pdf.rect(130, tableY + 23, 70, 7);
        pdf.text('TOTAL BRUTO (USD)', 133, tableY + 27.5);
        pdf.text(formatCurrency(totalPriceUsd, 'USD'), 182.5, tableY + 27.5, { align: 'center' });
        tableY += 7;
      }

      // Signatures
      let sigY = tableY + 20;
      const footerText = htmlToText(documentTemplate.footerInformation);
      if (footerText) {
        pdf.setFont('helvetica', 'normal');
        pdf.text(pdf.splitTextToSize(footerText, 100), 20, sigY);
        sigY += 18;
      }
      if (sigY + 30 > 240) {
        pdf.addPage();
        await drawLetterhead();
        sigY = 50;
      }

      pdf.setFont('helvetica', 'normal');
      pdf.text('Dibuat Oleh,', 30, sigY);
      pdf.text('Diterima Oleh,', 145, sigY);

      if (signatureUrl) {
        try {
          const signatureImage = await loadImageAsDataUrl(signatureUrl);
          pdf.addImage(signatureImage, signatureImage.startsWith('data:image/png') ? 'PNG' : 'JPEG', 132, sigY + 3, 38, 18);
        } catch {
          // Keep the signer name visible if the image cannot be loaded.
        }
      }

      pdf.line(20, sigY + 25, 70, sigY + 25);
      pdf.line(130, sigY + 25, 180, sigY + 25);

      pdf.text('Administrasi Penjualan', 28, sigY + 29);
      pdf.text(documentTemplate.personSigner || 'Customer / Partner', 143, sigY + 29);

      pdf.save(`SalesInvoice-${sales.kodeJual}.pdf`);
    } catch (error) {
      console.error('Failed to download sales PDF', error);
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
          <Button type="button" onClick={() => window.print()} variant="outline" className="w-full sm:w-auto">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      )}

      <div
        ref={printRef || localPrintRef}
        className="relative mx-auto overflow-hidden bg-white shadow-md border print-letter-page"
        style={{ width: '210mm', minHeight: '297mm' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={backgroundUrl}
          alt="Document template"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="relative min-h-[297mm] px-[20mm] pt-[42mm] pb-[42mm] flex flex-col justify-between">
          <div>
            <div className="flex justify-between text-[10pt] text-slate-900">
              <div className="space-y-1">
                <div>
                  <span className="inline-block w-[28mm]">Nomor Invoice</span>: <strong>{sales.kodeJual}</strong>
                </div>
                <div>
                  <span className="inline-block w-[28mm]">Perihal</span>: {documentTemplate.subject || 'Penjualan / Penyerahan Unit Motor'}
                </div>
                <div>
                  <span className="inline-block w-[28mm]">Asal Gudang</span>: {sales.warehouse || '-'}
                </div>
              </div>
              <div>Yogyakarta, {formatLongDate(sales.tanggal)}</div>
            </div>

            <div className="mt-7 text-[10pt] text-slate-900">
              <div>Kepada</div>
              <div>
                Yth. Customer: <strong>{sales.customer || '-'}</strong>
              </div>
              <div>Di Tempat</div>
            </div>

            <div className="mt-8 text-center text-[12pt] font-semibold tracking-[0.18em] text-slate-900">
              <span className="border-b border-slate-900 uppercase">{documentTemplate.subject || 'SALES INVOICE'}</span>
            </div>

            <div className="mt-6 text-[9.5pt] text-slate-900">
              <p>Dengan hormat,</p>
              <div className="mt-1 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: documentTemplate.headerInformation }} />
            </div>

            <div className="mt-5 overflow-hidden rounded-[12px] border border-slate-200">
              <table className="w-full border-collapse text-[8.5pt]">
                <thead>
                  <tr style={{ backgroundColor: documentTemplate.tableColor || '#1f4163' }} className="text-white">
                    <th className="border border-white/20 px-2 py-2.5 text-center font-semibold w-[40px]">NO</th>
                    <th className="border border-white/20 px-3 py-2.5 text-left font-semibold">TIPE UNIT</th>
                    <th className="border border-white/20 px-3 py-2.5 text-left font-semibold">WARNA</th>
                    <th className="border border-white/20 px-3 py-2.5 text-left font-semibold">NO RANGKA</th>
                    <th className="border border-white/20 px-3 py-2.5 text-left font-semibold">NO MESIN</th>
                    <th className="border border-white/20 px-3 py-2.5 text-center font-semibold">HARGA</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, index) => (
                    <tr key={row.id ?? index} className="border-slate-200">
                      <td className="border border-slate-200 px-2 py-2 text-center">{index + 1}</td>
                      <td className="border border-slate-200 px-3 py-2">{row.unit_type_name || '-'}</td>
                      <td className="border border-slate-200 px-3 py-2">{row.color || '-'}</td>
                      <td className="border border-slate-200 px-3 py-2 font-mono">{row.chassis_number || '-'}</td>
                      <td className="border border-slate-200 px-3 py-2 font-mono">{row.machine_number || '-'}</td>
                      <td className="border border-slate-200 px-3 py-2 text-center">
                        <div>{formatCurrency(row.price ?? 0)}</div>
                        {(row as any).price_usd ? (
                          <div className="text-[7.5pt] text-amber-700 font-semibold mt-0.5" title="Harga USD">
                            {formatCurrency(Number((row as any).price_usd), 'USD')}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-semibold text-slate-900 bg-slate-50">
                    <td colSpan={5} className="border border-slate-200 px-3 py-2 text-right">TOTAL DPP</td>
                    <td className="border border-slate-200 px-3 py-2 text-center">{formatCurrency(totalDpp)}</td>
                  </tr>
                  <tr className="font-semibold text-slate-900 bg-slate-50">
                    <td colSpan={5} className="border border-slate-200 px-3 py-2 text-right">TOTAL PPN</td>
                    <td className="border border-slate-200 px-3 py-2 text-center">{formatCurrency(totalPpn)}</td>
                  </tr>
                  <tr className="font-semibold text-slate-900 bg-emerald-50/50">
                    <td colSpan={5} className="border border-slate-200 px-3 py-2.5 text-right">TOTAL BRUTO</td>
                    <td className="border border-slate-200 px-3 py-2.5 text-center">{formatCurrency(totalBruto)}</td>
                  </tr>
                  {(() => {
                    const totalPriceUsd = items.reduce((sum, item) => sum + Number((item as any).price_usd || 0), 0);
                    return totalPriceUsd > 0 ? (
                      <tr className="font-bold text-amber-900 bg-amber-50/50">
                        <td colSpan={5} className="border border-slate-200 px-3 py-2.5 text-right">TOTAL BRUTO (USD)</td>
                        <td className="border border-slate-200 px-3 py-2.5 text-center">{formatCurrency(totalPriceUsd, 'USD')}</td>
                      </tr>
                    ) : null;
                  })()}
                </tbody>
              </table>
            </div>
            {documentTemplate.footerInformation && (
              <div className="mt-6 rounded border border-slate-200 p-3 text-[9pt] prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: documentTemplate.footerInformation }} />
            )}
          </div>

          <div className="mt-12 text-right text-[10pt] text-slate-900">
            <div>Hormat kami,</div>
            {signatureUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={signatureUrl} alt="Tanda tangan" className="ml-auto h-20 w-40 object-contain" />
            )}
            <div className="font-semibold underline">{documentTemplate.personSigner || '-'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
