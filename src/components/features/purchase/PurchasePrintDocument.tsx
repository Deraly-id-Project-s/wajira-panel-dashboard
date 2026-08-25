import { useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import { Download, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import type { UnitTransactionDetail, UnitTransactionItemDetail } from '@/@types/unit-transaction.types';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/currency';

interface Props {
  purchase: UnitTransactionDetail;
  items: UnitTransactionItemDetail[];
  letterheadUrl: string;
  companyName: string;
  hideControls?: boolean;
  printRef?: React.RefObject<HTMLDivElement | null>;
}

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

const formatDisplayDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export default function PurchasePrintDocument({
  purchase,
  items,
  letterheadUrl,
  companyName,
  hideControls = false,
  printRef,
}: Props) {
  const localPrintRef = useRef<HTMLDivElement>(null);

  const totalBruto = Number(purchase.unit_transaction_bruto_total ?? purchase.unit_transaction_item_bruto_total ?? 0);
  const totalDpp = Number(purchase.unit_transaction_item_total_dpp ?? 0);
  const totalPpn = Number(purchase.unit_transaction_item_total_ppn ?? 0);

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
      if (!letterheadUrl) return;
      try {
        const image = await loadImageAsDataUrl(letterheadUrl);
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
      pdf.setFillColor(31, 65, 99);
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
      pdf.text('Nomor PO', 20, 52);
      pdf.text(':', 45, 52);
      pdf.setFont('helvetica', 'bold');
      pdf.text(purchase.code, 48, 52);

      pdf.setFont('helvetica', 'normal');
      pdf.text('Perihal', 20, 58);
      pdf.text(':', 45, 58);
      pdf.text('Pemesanan / Pembelian Unit Motor', 48, 58);

      pdf.text('Gudang Tujuan', 20, 64);
      pdf.text(':', 45, 64);
      pdf.text(purchase.warehouse?.name || '-', 48, 64);
      pdf.text(`Yogyakarta, ${formatLongDate(purchase.created_at)}`, 145, 52);

      pdf.text('Kepada', 145, 64);
      pdf.text('Yth. Supplier:', 145, 69);
      pdf.setFont('helvetica', 'bold');
      pdf.text(purchase.person?.name || '-', 145, 74, { maxWidth: 45 });

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('PURCHASE ORDER', pageWidth / 2, 95, { align: 'center' });
      pdf.line(pageWidth / 2 - 15, 96.5, pageWidth / 2 + 15, 96.5);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.text('Dengan hormat,', 20, 105);
      pdf.text('Bersama ini kami sampaikan rincian pemesanan/pembelian unit motor dengan detail sebagai berikut:', 20, 110);

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
      if (sigY + 30 > 240) {
        pdf.addPage();
        await drawLetterhead();
        sigY = 50;
      }

      pdf.setFont('helvetica', 'normal');
      pdf.text('Dibuat Oleh,', 30, sigY);
      pdf.text('Disetujui Oleh,', 145, sigY);

      pdf.line(20, sigY + 25, 70, sigY + 25);
      pdf.line(130, sigY + 25, 180, sigY + 25);

      pdf.text('Administrasi Pembelian', 28, sigY + 29);
      pdf.text('Supplier / Partner', 143, sigY + 29);

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
        className="relative mx-auto overflow-hidden bg-white shadow-md border print-letter-page"
        style={{ width: '210mm', minHeight: '297mm' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={letterheadUrl}
          alt="Letterhead"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="relative min-h-[297mm] px-[20mm] pt-[42mm] pb-[42mm] flex flex-col justify-between">
          <div>
            <div className="flex justify-between text-[10pt] text-slate-900">
              <div className="space-y-1">
                <div>
                  <span className="inline-block w-[28mm]">Nomor PO</span>: <strong>{purchase.code}</strong>
                </div>
                <div>
                  <span className="inline-block w-[28mm]">Perihal</span>: Pemesanan / Pembelian Unit Motor
                </div>
                <div>
                  <span className="inline-block w-[28mm]">Tujuan</span>: {purchase.warehouse?.name || '-'}
                </div>
              </div>
              <div>Yogyakarta, {formatLongDate(purchase.created_at)}</div>
            </div>

            <div className="mt-7 text-[10pt] text-slate-900">
              <div>Kepada</div>
              <div>
                Yth. Supplier: <strong>{purchase.person?.name || '-'}</strong>
              </div>
              <div>Di Tempat</div>
            </div>

            <div className="mt-8 text-center text-[12pt] font-semibold tracking-[0.18em] text-slate-900">
              <span className="border-b border-slate-900 uppercase">PURCHASE ORDER</span>
            </div>

            <div className="mt-6 text-[9.5pt] text-slate-900">
              <p>Dengan hormat,</p>
              <p className="mt-1">
                Bersama ini kami sampaikan rincian pemesanan/pembelian unit motor dengan detail sebagai berikut:
              </p>
            </div>

            <div className="mt-5 overflow-hidden rounded-[12px] border border-slate-200">
              <table className="w-full border-collapse text-[8.5pt]">
                <thead>
                  <tr className="button-theme-1!">
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
          </div>

          <div className="mt-12 grid grid-cols-2 text-center text-[10pt] text-slate-900">
            <div className="space-y-16">
              <div>Dibuat Oleh,</div>
              <div className="font-semibold underline">Administrasi Pembelian</div>
            </div>
            <div className="space-y-16">
              <div>Disetujui Oleh,</div>
              <div className="font-semibold underline">Supplier / Partner</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
