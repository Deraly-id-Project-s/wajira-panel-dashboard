import React from 'react';
import type { DocumentTemplate } from '@/@types/document-template.types';
import type { DoEkspedisi } from '@/@types/do-ekspedisi.types';
import { getObjectStorageUrl } from '@/components/ui/storage-image';

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

const getDoStatusLabel = (status: string) => {
  switch (String(status).toLowerCase()) {
    case 'draft':
      return 'Draft';
    case 'process':
      return 'Proses';
    case 'done':
      return 'Selesai';
    case 'failed':
      return 'Gagal';
    case 'pending':
      return 'Pending';
    default:
      return status || '-';
  }
};

export interface DOEkspedisiPrintDocumentProps {
  data: DoEkspedisi;
  template: DocumentTemplate | null;
  fallbackBackground?: string;
  companyName: string;
  printedAt: Date;
}

export const DOEkspedisiPrintDocument: React.FC<DOEkspedisiPrintDocumentProps> = ({
  data,
  template,
  fallbackBackground,
  companyName,
  printedAt,
}) => {
  if (!template) return null;

  const backgroundUrl = template.documentTemplate
    ? getObjectStorageUrl(template.documentTemplate)
    : fallbackBackground;
  const signatureUrl = getObjectStorageUrl(template.personSignature);
  const tableColor = /^#[0-9a-f]{6}$/i.test(template.tableColor) ? template.tableColor : '#1f4163';
  const headerInformation = htmlToPlainText(template.headerInformation);
  const footerInformation = htmlToPlainText(template.footerInformation);

  const order = data.orderList;
  const items =
    order?.tarifs && order.tarifs.length > 0
      ? order.tarifs.map((t, i) => ({
          id: t.id ?? i,
          loadingIn: t.loadingIn || order.loadingIn || '-',
          loadingOut: t.loadingOut || order.loadingOut || '-',
          destination: t.deliveryDestination || order.destination || '-',
          loadContent: t.loadContent || order.loadContent || '-',
          qty: t.qty ?? order.qty ?? 0,
        }))
      : data.items && data.items.length > 0
      ? data.items.map((item, i) => ({
          id: item.id ?? i,
          loadingIn: item.loadingIn || '-',
          loadingOut: item.loadingOut || '-',
          destination: item.destination || '-',
          loadContent: item.driverNote || '-',
          qty: 1,
        }))
      : [
          {
            id: 0,
            loadingIn: order?.loadingIn || '-',
            loadingOut: order?.loadingOut || '-',
            destination: order?.destination || '-',
            loadContent: order?.loadContent || '-',
            qty: order?.qty || 0,
          },
        ];

  return (
    <div className="accounting-print-root do-ekspedisi-detail-print-root" aria-hidden="true">
      <section
        className="print-letter-page accounting-print-area do-ekspedisi-detail-print-area"
        aria-label="Surat jalan delivery order ekspedisi"
      >
        {backgroundUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={backgroundUrl} alt="" className="print-letterhead" />
        )}

        <div className="accounting-print-content do-ekspedisi-detail-print-content">
          {/* Header */}
          <header className="border-b-2 pb-2 text-slate-950" style={{ borderColor: tableColor }}>
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-[7pt] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Surat Jalan / Delivery Order Ekspedisi
                </p>
                <h1 className="mt-0.5 text-[14pt] font-bold uppercase tracking-[0.08em]">
                  Delivery Order (DO)
                </h1>
                <p className="mt-0.5 text-[8.5pt] font-semibold uppercase text-slate-700">{companyName}</p>
              </div>
              <dl className="grid min-w-[65mm] grid-cols-[24mm_1fr] gap-x-2 gap-y-0.5 text-[7pt] leading-tight">
                <dt className="text-slate-500">No. DO</dt>
                <dd className="font-mono font-bold text-slate-900">: {data.doCode}</dd>
                <dt className="text-slate-500">No. Order</dt>
                <dd className="font-mono font-medium text-slate-900">: {data.orderCode}</dd>
                <dt className="text-slate-500">Tgl Kirim</dt>
                <dd className="font-medium">: {formatCompactDate(data.date)}</dd>
                <dt className="text-slate-500">Status DO</dt>
                <dd className="font-semibold text-slate-900">: {getDoStatusLabel(data.status)}</dd>
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

          {/* Delivery & Driver Metadata */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded border border-slate-300 p-2 text-[7pt] leading-snug">
              <p className="border-b border-slate-200 pb-1 font-bold uppercase text-slate-700">Armada & Pengemudi</p>
              <dl className="mt-1.5 grid grid-cols-[24mm_1fr] gap-x-2 gap-y-1">
                <dt className="text-slate-500">Nama Driver</dt>
                <dd className="font-semibold text-slate-900">{data.driver?.name || '-'}</dd>
                <dt className="text-slate-500">No. Telepon</dt>
                <dd>{data.driver?.phone || '-'}</dd>
                <dt className="text-slate-500">Kendaraan / Plat</dt>
                <dd className="font-medium">
                  {data.vehicle?.registrationNumber || '-'} {data.vehicle?.type ? `(${data.vehicle.type})` : ''}
                </dd>
              </dl>
            </div>

            <div className="rounded border border-slate-300 p-2 text-[7pt] leading-snug">
              <p className="border-b border-slate-200 pb-1 font-bold uppercase text-slate-700">Customer & Catatan</p>
              <dl className="mt-1.5 grid grid-cols-[24mm_1fr] gap-x-2 gap-y-1">
                <dt className="text-slate-500">Customer</dt>
                <dd className="font-semibold text-slate-900">{order?.customerName || '-'}</dd>
                <dt className="text-slate-500">Alamat</dt>
                <dd className="text-slate-800">{order?.customer?.address || '-'}</dd>
                <dt className="text-slate-500">Atensi Driver</dt>
                <dd className="text-slate-800">{data.driverNote || '-'}</dd>
              </dl>
            </div>
          </div>

          {/* Items / Route Table */}
          <div className="mt-3">
            <div className="mb-1 text-[7pt] font-bold uppercase text-slate-700">Rincian Barang & Lokasi Pengiriman</div>
            <div className="overflow-hidden border border-slate-400">
              <table className="w-full table-fixed border-collapse text-[6pt] leading-tight text-slate-900">
                <colgroup>
                  <col className="w-[5%]" />
                  <col className="w-[20%]" />
                  <col className="w-[20%]" />
                  <col className="w-[23%]" />
                  <col className="w-[22%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead>
                  <tr className="text-white" style={{ backgroundColor: tableColor }}>
                    <th className="border border-white/30 px-1 py-1 text-center font-semibold uppercase">No</th>
                    <th className="border border-white/30 px-1.5 py-1 text-left font-semibold uppercase">Loading In (Asal)</th>
                    <th className="border border-white/30 px-1.5 py-1 text-left font-semibold uppercase">Loading Out (Bongkar)</th>
                    <th className="border border-white/30 px-1.5 py-1 text-left font-semibold uppercase">Tujuan Kirim</th>
                    <th className="border border-white/30 px-1.5 py-1 text-left font-semibold uppercase">Muatan</th>
                    <th className="border border-white/30 px-1.5 py-1 text-center font-semibold uppercase">QTY</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={`${item.id}-${idx}`} className={idx % 2 === 1 ? 'bg-slate-50/80' : 'bg-white'}>
                      <td className="border border-slate-300 px-1 py-1 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-300 px-1.5 py-1">{item.loadingIn}</td>
                      <td className="border border-slate-300 px-1.5 py-1">{item.loadingOut}</td>
                      <td className="border border-slate-300 px-1.5 py-1 font-medium">{item.destination}</td>
                      <td className="border border-slate-300 px-1.5 py-1">{item.loadContent}</td>
                      <td className="border border-slate-300 px-1.5 py-1 text-center tabular-nums font-semibold">
                        {item.qty ? `${item.qty} PCS` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer & Signature Section */}
          <footer className="mt-auto pt-3 text-[7pt] text-slate-600">
            <div className="mb-[16mm] grid grid-cols-4 gap-4 text-center text-slate-800">
              <div>
                <p className="text-[6.5pt] uppercase text-slate-500">Pengirim / Gudang</p>
                <div className="h-[14mm]" />
                <p className="border-t border-slate-700 pt-1 font-semibold">Petugas Muat</p>
              </div>

              <div>
                <p className="text-[6.5pt] uppercase text-slate-500">Pengemudi (Driver)</p>
                <div className="h-[14mm]" />
                <p className="border-t border-slate-700 pt-1 font-semibold">{data.driver?.name || 'Driver'}</p>
              </div>

              <div>
                <p className="text-[6.5pt] uppercase text-slate-500">Penerima Barang</p>
                <div className="h-[14mm]" />
                <p className="border-t border-slate-700 pt-1 font-semibold">Nama & Stempel</p>
              </div>

              <div>
                <p className="text-[6.5pt] uppercase text-slate-500">Mengetahui</p>
                <div className="flex h-[14mm] items-center justify-center">
                  {signatureUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={signatureUrl} alt="" className="max-h-[14mm] max-w-[36mm] object-contain" />
                  )}
                </div>
                <p className="border-t border-slate-700 pt-1 font-semibold">{template.personSigner || 'Operasional'}</p>
              </div>
            </div>

            {footerInformation && (
              <p className="border-t border-slate-200 pt-1 max-w-[140mm] whitespace-pre-line text-[6pt] leading-snug">
                {footerInformation}
              </p>
            )}

            <div className="mt-1 flex items-center justify-between border-t border-slate-300 pt-1 text-[6pt]">
              <span>Dokumen Surat Jalan Ekspedisi · {companyName}</span>
              <span>Dicetak {formatCompactDate(printedAt)}</span>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
};

export default DOEkspedisiPrintDocument;
