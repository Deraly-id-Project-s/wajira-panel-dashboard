import { useRef } from 'react';
import jsPDF from 'jspdf';
import { Download, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import type { UnitTransactionDetail, UnitTransactionItemDetail } from '@/@types/unit-transaction.types';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/currency';
import type { DocumentTemplate } from '@/@types/document-template.types';
import { getObjectStorageUrl, StorageImage } from '@/components/ui/storage-image';

interface Props {
  purchase: UnitTransactionDetail;
  items: UnitTransactionItemDetail[];
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

const formatLongDate = (dateStr?: string, lang?: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatDisplayDate = (dateStr?: string, lang?: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const translations = {
  id: {
    invoiceNumber: 'Nomor PO',
    subjectLabel: 'Perihal',
    destinationWarehouse: 'Gudang Tujuan',
    salutation: 'Dengan hormat,',
    toLabel: 'Kepada',
    ythSupplier: 'Yth. Supplier',
    diTempat: 'Di Tempat',
    dibuatOleh: 'Dibuat Oleh,',
    disetujuiOleh: 'Disetujui Oleh,',
    administrasiPembelian: 'Administrasi Pembelian',
    tableHeaders: ['NO', 'TIPE UNIT', 'WARNA', 'NO RANGKA', 'NO MESIN', 'HARGA'],
    total: 'TOTAL',
    closing: 'Hormat kami,',
    lembar: 'Lembar',
    lampiran: 'Lampiran',
    bersambung: 'Bersambung ke Lampiran...',
  },
  en: {
    invoiceNumber: 'PO Number',
    subjectLabel: 'Subject',
    destinationWarehouse: 'Destination Warehouse',
    salutation: 'Dear Sir/Madam,',
    toLabel: 'To',
    ythSupplier: 'Dear Supplier',
    diTempat: 'In Place',
    dibuatOleh: 'Created By,',
    disetujuiOleh: 'Approved By,',
    administrasiPembelian: 'Purchase Administration',
    tableHeaders: ['NO', 'UNIT TYPE', 'COLOR', 'FRAME NO', 'ENGINE NO', 'PRICE'],
    total: 'TOTAL',
    closing: 'Sincerely yours,',
    lembar: 'Sheet',
    lampiran: 'Attachment',
    bersambung: 'Continued on Attachment...',
  }
};

export default function PurchasePrintDocument({
  purchase,
  items,
  letterheadUrl,
  companyName,
  hideControls = false,
  printRef,
  documentTemplate,
}: Props) {
  const localPrintRef = useRef<HTMLDivElement>(null);
  const currentLang = (documentTemplate.language === 'en' ? 'en' : 'id') as 'id' | 'en';
  const t = translations[currentLang];

  const totalBruto = Number(purchase.unit_transaction_bruto_total ?? purchase.unit_transaction_item_bruto_total ?? 0);
  const totalDpp = Number(purchase.unit_transaction_item_total_dpp ?? 0);
  const totalPpn = Number(purchase.unit_transaction_item_total_ppn ?? 0);
  const backgroundUrl = documentTemplate.documentTemplate ? getObjectStorageUrl(documentTemplate.documentTemplate) : letterheadUrl;
  const signatureUrl = documentTemplate.personSignature ? getObjectStorageUrl(documentTemplate.personSignature) : null;

  const handlePrint = useReactToPrint({
    contentRef: printRef || localPrintRef,
    documentTitle: `PurchaseOrder-${purchase.code}`,
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

    const drawHeaderInfo = (subjectText: string, lembarValue: string) => {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(t.invoiceNumber, 20, 52);
      pdf.text(':', 45, 52);
      pdf.setFont('helvetica', 'bold');
      pdf.text(purchase.code, 48, 52);

      pdf.setFont('helvetica', 'normal');
      pdf.text(t.subjectLabel, 20, 58);
      pdf.text(':', 45, 58);
      pdf.text(subjectText, 48, 58);

      pdf.text(t.destinationWarehouse, 20, 64);
      pdf.text(':', 45, 64);
      pdf.text(purchase.warehouse?.name || '-', 48, 64);

      pdf.text(t.lembar, 20, 70);
      pdf.text(':', 45, 70);
      pdf.text(lembarValue, 48, 70);

      pdf.text(`Yogyakarta, ${formatLongDate(purchase.created_at, documentTemplate.language)}`, 145, 52);

      pdf.text(t.toLabel, 145, 64);
      pdf.text(`${t.ythSupplier}:`, 145, 69);
      pdf.setFont('helvetica', 'bold');
      pdf.text(purchase.person?.name || '-', 145, 74, { maxWidth: 45 });

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text(subjectText, pageWidth / 2, 95, { align: 'center' });
      pdf.line(pageWidth / 2 - 15, 96.5, pageWidth / 2 + 15, 96.5);
    };

    const drawTableHeader = (y: number) => {
      const columns: { label: string; width: number; align: 'left' | 'center' | 'right' }[] = [
        { label: 'NO', width: 10, align: 'center' },
        { label: t.tableHeaders[1], width: 45, align: 'left' },
        { label: t.tableHeaders[2], width: 28, align: 'left' },
        { label: t.tableHeaders[3], width: 45, align: 'left' },
        { label: t.tableHeaders[4], width: 35, align: 'left' },
        { label: t.tableHeaders[5], width: 32, align: 'center' },
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
      // Draw Page 1
      await drawLetterhead();

      const page1Subject = (documentTemplate.subject || 'PURCHASE ORDER').toUpperCase();
      const page1Lembar = items.length > 5 ? `1 / 2` : '1';
      drawHeaderInfo(page1Subject, page1Lembar);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.text(t.salutation, 20, 105);
      const headerText = htmlToText(documentTemplate.headerInformation) || 'Bersama ini kami sampaikan rincian pemesanan/pembelian unit motor dengan detail sebagai berikut:';
      pdf.text(pdf.splitTextToSize(headerText, 170), 20, 110);

      let tableY = 118;
      const columns = drawTableHeader(tableY);
      tableY += 8;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');

      const page1Items = items.slice(0, 5);
      for (let index = 0; index < page1Items.length; index += 1) {
        const row = page1Items[index];
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

      if (items.length <= 5) {
        // Draw totals on Page 1
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

        pdf.setFont('helvetica', 'normal');
        pdf.text(t.dibuatOleh, 30, sigY);
        pdf.text(t.disetujuiOleh, 145, sigY);

        if (signatureUrl) {
          try {
            const signatureImage = await loadImageAsDataUrl(signatureUrl);
            pdf.addImage(signatureImage, signatureImage.startsWith('data:image/png') ? 'PNG' : 'JPEG', 132, sigY + 3, 38, 18);
          } catch { }
        }

        pdf.line(20, sigY + 25, 70, sigY + 25);
        pdf.line(130, sigY + 25, 180, sigY + 25);

        pdf.text(t.administrasiPembelian, 28, sigY + 29);
        pdf.text(documentTemplate.personSigner || 'Supplier / Partner', 143, sigY + 29);
      } else {
        // More than 5 items. Page 1 draws "Bersambung ke Lampiran..."
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(10);
        pdf.text(t.bersambung, 20, tableY + 10);

        // Draw Page 2 (Lampiran)
        pdf.addPage();
        await drawLetterhead();

        const page2Subject = `${documentTemplate.subject || 'PURCHASE ORDER'} (${t.lampiran})`.toUpperCase();
        const page2Lembar = `2 / 2 (${t.lampiran})`;
        drawHeaderInfo(page2Subject, page2Lembar);

        let tableY2 = 118;
        const columns2 = drawTableHeader(tableY2);
        tableY2 += 8;
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');

        const page2Items = items.slice(5);
        for (let index = 0; index < page2Items.length; index += 1) {
          const row = page2Items[index];
          const priceUsdVal = Number((row as any).price_usd || 0);
          const priceDisplay = priceUsdVal > 0
            ? `${formatCurrency(row.price ?? 0)} / ${formatCurrency(priceUsdVal, 'USD')}`
            : formatCurrency(row.price ?? 0);

          const values = [
            String(index + 6),
            row.unit_type_name || '-',
            row.color || '-',
            row.chassis_number || '-',
            row.machine_number || '-',
            priceDisplay,
          ];

          const rowHeight = 8;
          let x = 10;
          columns2.forEach((column, columnIndex) => {
            pdf.rect(x, tableY2, column.width, rowHeight);
            const align = column.align;
            const textX = align === 'center' ? x + column.width / 2 : align === 'right' ? x + column.width - 2 : x + 2;
            pdf.text(String(values[columnIndex] || '-'), textX, tableY2 + 5.5, { align });
            x += column.width;
          });
          tableY2 += rowHeight;
        }

        // Draw totals on Page 2
        pdf.setFont('helvetica', 'bold');
        pdf.rect(130, tableY2 + 2, 70, 7);
        pdf.text('TOTAL DPP', 133, tableY2 + 6.5);
        pdf.text(formatCurrency(totalDpp), 182.5, tableY2 + 6.5, { align: 'center' });

        pdf.rect(130, tableY2 + 9, 70, 7);
        pdf.text('TOTAL PPN', 133, tableY2 + 13.5);
        pdf.text(formatCurrency(totalPpn), 182.5, tableY2 + 13.5, { align: 'center' });

        pdf.rect(130, tableY2 + 16, 70, 7);
        pdf.text('TOTAL BRUTO', 133, tableY2 + 20.5);
        pdf.text(formatCurrency(totalBruto), 182.5, tableY2 + 20.5, { align: 'center' });

        const totalPriceUsd = items.reduce((sum, item) => sum + Number((item as any).price_usd || 0), 0);
        if (totalPriceUsd > 0) {
          pdf.rect(130, tableY2 + 23, 70, 7);
          pdf.text('TOTAL BRUTO (USD)', 133, tableY2 + 27.5);
          pdf.text(formatCurrency(totalPriceUsd, 'USD'), 182.5, tableY2 + 27.5, { align: 'center' });
          tableY2 += 7;
        }

        // Signatures on Page 2
        let sigY2 = tableY2 + 20;
        const footerText = htmlToText(documentTemplate.footerInformation);
        if (footerText) {
          pdf.setFont('helvetica', 'normal');
          pdf.text(pdf.splitTextToSize(footerText, 100), 20, sigY2);
          sigY2 += 18;
        }

        pdf.setFont('helvetica', 'normal');
        pdf.text(t.dibuatOleh, 30, sigY2);
        pdf.text(t.disetujuiOleh, 145, sigY2);

        if (signatureUrl) {
          try {
            const signatureImage = await loadImageAsDataUrl(signatureUrl);
            pdf.addImage(signatureImage, signatureImage.startsWith('data:image/png') ? 'PNG' : 'JPEG', 132, sigY2 + 3, 38, 18);
          } catch { }
        }

        pdf.line(20, sigY2 + 25, 70, sigY2 + 25);
        pdf.line(130, sigY2 + 25, 180, sigY2 + 25);

        pdf.text(t.administrasiPembelian, 28, sigY2 + 29);
        pdf.text(documentTemplate.personSigner || 'Supplier / Partner', 143, sigY2 + 29);
      }

      pdf.save(`PurchaseOrder-${purchase.code}.pdf`);
    } catch (error) {
      console.error('Failed to download purchase PDF', error);
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
        className="flex flex-col gap-8 no-print:bg-slate-100 no-print:p-8"
      >
        {/* Page 1 */}
        <div
          className="relative mx-auto overflow-hidden bg-white shadow-md border print-letter-page print:shadow-none print:border-none print:m-0"
          style={{ width: '210mm', height: '297mm' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={backgroundUrl}
            alt="Document template"
            className="absolute inset-0"
            style={{ width: '210mm', height: '297mm' }}
          />

          <div className="relative h-[297mm] px-[20mm] pt-[42mm] pb-[20mm] flex flex-col justify-between text-slate-900">
            <div>
              <div className="flex justify-between text-[10pt]">
                <div className="space-y-1">
                  <div>
                    <span className="inline-block w-[28mm]">{t.invoiceNumber}</span>: <strong>{purchase.code}</strong>
                  </div>
                  <div>
                    <span className="inline-block w-[28mm]">{t.subjectLabel}</span>: {documentTemplate.subject || 'Pemesanan / Pembelian Unit Motor'}
                  </div>
                  <div>
                    <span className="inline-block w-[28mm]">{t.destinationWarehouse}</span>: {purchase.warehouse?.name || '-'}
                  </div>
                  <div>
                    <span className="inline-block w-[28mm]">{t.lembar}</span>: <strong>{items.length > 5 ? '1 / 2' : '1'}</strong>
                  </div>
                </div>
                <div>Yogyakarta, {formatLongDate(purchase.created_at, documentTemplate.language)}</div>
              </div>

              <div className="mt-6 text-[10pt]">
                <div>{t.toLabel}</div>
                <div>
                  {t.ythSupplier}: <strong>{purchase.person?.name || '-'}</strong>
                </div>
                <div>{t.diTempat}</div>
              </div>

              <div className="mt-6 text-center text-[12pt] font-semibold tracking-[0.18em]">
                <span className="border-b border-slate-900 uppercase">{documentTemplate.subject || 'PURCHASE ORDER'}</span>
              </div>

              <div className="mt-5 text-[9.5pt]">
                <p>{t.salutation}</p>
                <div className="mt-1 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: documentTemplate.headerInformation }} />
              </div>

              <div className="mt-4 overflow-hidden rounded-[12px] border border-slate-200">
                <table className="w-full border-collapse text-[8.5pt]">
                  <thead>
                    <tr style={{ backgroundColor: documentTemplate.tableColor || '#1f4163' }} className="text-white">
                      <th className="border border-white/20 px-2 py-2.5 text-center font-semibold w-[40px]">{t.tableHeaders[0]}</th>
                      <th className="border border-white/20 px-3 py-2.5 text-left font-semibold">{t.tableHeaders[1]}</th>
                      <th className="border border-white/20 px-3 py-2.5 text-left font-semibold">{t.tableHeaders[2]}</th>
                      <th className="border border-white/20 px-3 py-2.5 text-left font-semibold">{t.tableHeaders[3]}</th>
                      <th className="border border-white/20 px-3 py-2.5 text-left font-semibold">{t.tableHeaders[4]}</th>
                      <th className="border border-white/20 px-3 py-2.5 text-center font-semibold">{t.tableHeaders[5]}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.slice(0, 5).map((row, index) => (
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
                    {items.length <= 5 && (
                      <>
                        <tr className="font-semibold bg-slate-50">
                          <td colSpan={5} className="border border-slate-200 px-3 py-2 text-right">TOTAL DPP</td>
                          <td className="border border-slate-200 px-3 py-2 text-center">{formatCurrency(totalDpp)}</td>
                        </tr>
                        <tr className="font-semibold bg-slate-50">
                          <td colSpan={5} className="border border-slate-200 px-3 py-2 text-right">TOTAL PPN</td>
                          <td className="border border-slate-200 px-3 py-2 text-center">{formatCurrency(totalPpn)}</td>
                        </tr>
                        <tr className="font-semibold bg-emerald-50/50">
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
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {items.length <= 5 && documentTemplate.footerInformation && (
                <div className="mt-4 rounded border border-slate-200 p-3 text-[9pt] prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: documentTemplate.footerInformation }} />
              )}
            </div>

            {items.length <= 5 ? (
              <div className="text-end text-sm mt-4">
                <p className='mr-12'>{t.closing}</p>
                <div className="flex mr-[12.3px] items-center justify-end">
                  <StorageImage src={signatureUrl} alt="Tanda tangan" width={160} height={85} className="max-h-20 max-w-36 object-contain" />
                </div>
                <p className="mr-12 font-semibold underline">{documentTemplate.personSigner || '-'}</p>
              </div>
            ) : (
              <div className="text-left text-sm italic text-slate-500 mt-4">
                {t.bersambung}
              </div>
            )}
          </div>
        </div>

        {/* Page 2 (Lampiran) */}
        {items.length > 5 && (
          <div
            className="relative mx-auto overflow-hidden bg-white shadow-md border print-letter-page print:shadow-none print:border-none print:m-0 print:break-before-page"
            style={{ width: '210mm', height: '297mm' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={backgroundUrl}
              alt="Document template"
              className="absolute inset-0"
              style={{ width: '210mm', height: '297mm' }}
            />

            <div className="relative h-[297mm] px-[20mm] pt-[42mm] pb-[20mm] flex flex-col text-slate-900">
              <div>
                <div className="flex justify-between text-[10pt]">
                  <div className="space-y-1">
                    <div>
                      <span className="inline-block w-[28mm]">{t.invoiceNumber}</span>: <strong>{purchase.code}</strong>
                    </div>
                    <div>
                      <span className="inline-block w-[28mm]">{t.subjectLabel}</span>: {documentTemplate.subject || 'Pemesanan / Pembelian Unit Motor'} ({t.lampiran})
                    </div>
                    <div>
                      <span className="inline-block w-[28mm]">{t.destinationWarehouse}</span>: {purchase.warehouse?.name || '-'}
                    </div>
                    <div>
                      <span className="inline-block w-[28mm]">{t.lembar}</span>: <strong>2 / 2 ({t.lampiran})</strong>
                    </div>
                  </div>
                  <div>Yogyakarta, {formatLongDate(purchase.created_at, documentTemplate.language)}</div>
                </div>

                <div className="mt-6 text-[10pt]">
                  <div>{t.toLabel}</div>
                  <div>
                    {t.ythSupplier}: <strong>{purchase.person?.name || '-'}</strong>
                  </div>
                  <div>{t.diTempat}</div>
                </div>

                <div className="mt-6 text-center text-[12pt] font-semibold tracking-[0.18em]">
                  <span className="border-b border-slate-900 uppercase">{documentTemplate.subject || 'PURCHASE ORDER'} ({t.lampiran})</span>
                </div>

                <div className="mt-5 overflow-hidden rounded-[12px] border border-slate-200">
                  <table className="w-full border-collapse text-[8.5pt]">
                    <thead>
                      <tr style={{ backgroundColor: documentTemplate.tableColor || '#1f4163' }} className="text-white">
                        <th className="border border-white/20 px-2 py-2.5 text-center font-semibold w-[40px]">{t.tableHeaders[0]}</th>
                        <th className="border border-white/20 px-3 py-2.5 text-left font-semibold">{t.tableHeaders[1]}</th>
                        <th className="border border-white/20 px-3 py-2.5 text-left font-semibold">{t.tableHeaders[2]}</th>
                        <th className="border border-white/20 px-3 py-2.5 text-left font-semibold">{t.tableHeaders[3]}</th>
                        <th className="border border-white/20 px-3 py-2.5 text-left font-semibold">{t.tableHeaders[4]}</th>
                        <th className="border border-white/20 px-3 py-2.5 text-center font-semibold">{t.tableHeaders[5]}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.slice(5).map((row, index) => (
                        <tr key={row.id ?? index} className="border-slate-200">
                          <td className="border border-slate-200 px-2 py-2 text-center">{index + 6}</td>
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
                      <tr className="font-semibold bg-slate-50">
                        <td colSpan={5} className="border border-slate-200 px-3 py-2 text-right">TOTAL DPP</td>
                        <td className="border border-slate-200 px-3 py-2 text-center">{formatCurrency(totalDpp)}</td>
                      </tr>
                      <tr className="font-semibold bg-slate-50">
                        <td colSpan={5} className="border border-slate-200 px-3 py-2 text-right">TOTAL PPN</td>
                        <td className="border border-slate-200 px-3 py-2 text-center">{formatCurrency(totalPpn)}</td>
                      </tr>
                      <tr className="font-semibold bg-emerald-50/50">
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
                  <div className="mt-4 rounded border border-slate-200 p-3 text-[9pt] prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: documentTemplate.footerInformation }} />
                )}
              </div>

              <div className="text-end text-sm">
                <p className='mr-12'>{t.closing}</p>
                <div className="flex mr-[12.3px] items-center justify-end">
                  <StorageImage src={signatureUrl} alt="Tanda tangan" width={160} height={85} className="max-h-20 max-w-36 object-contain" />
                </div>
                <p className="mr-12 font-semibold underline">{documentTemplate.personSigner || '-'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
