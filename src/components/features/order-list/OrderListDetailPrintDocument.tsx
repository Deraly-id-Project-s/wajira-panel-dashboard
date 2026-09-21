import React from 'react';
import type { DocumentTemplate } from '@/@types/document-template.types';
import type { OrderList, OrderListTarifItem } from '@/@types/order-list.types';
import { getObjectStorageUrl } from '@/components/ui/storage-image';
import { currenciesFormat } from '@/components/ui/currenciesFormat';

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

const getOrderStatusText = (status: string) => {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'deliver':
      return 'Dikirim';
    case 'process':
      return 'Diproses';
    case 'done':
      return 'Selesai';
    case 'reject':
      return 'Ditolak';
    default:
      return status;
  }
};

export interface OrderListDetailPrintDocumentProps {
  data: OrderList;
  template: DocumentTemplate | null;
  fallbackBackground?: string;
  companyName: string;
  printedAt: Date;
}

export function OrderListDetailPrintDocument({
  data,
  template,
  fallbackBackground,
  companyName,
  printedAt,
}: OrderListDetailPrintDocumentProps) {
  if (!template) return null;

  const backgroundUrl = template.documentTemplate
    ? getObjectStorageUrl(template.documentTemplate)
    : fallbackBackground;
  const signatureUrl = getObjectStorageUrl(template.personSignature);
  const tableColor = /^#[0-9a-f]{6}$/i.test(template.tableColor) ? template.tableColor : '#1f4163';
  const headerInformation = htmlToPlainText(template.headerInformation);
  const footerInformation = htmlToPlainText(template.footerInformation);

  const routes: OrderListTarifItem[] = data.tarifs ?? [];
  const totalBill = Number(data.billInvoice || 0) + Number(data.ppn || 0) - Number(data.pph || 0);

  return (
    <div className="accounting-print-root order-list-detail-print-root" aria-hidden="true">
      <section
        className="print-letter-page accounting-print-area order-list-detail-print-area"
        aria-label="Surat perintah kerja order ekspedisi"
      >
        {backgroundUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={backgroundUrl} alt="" className="print-letterhead" />
        )}

        <div className="accounting-print-content order-list-detail-print-content">
          {/* Header */}
          <header className="border-b-2 pb-2 text-slate-950" style={{ borderColor: tableColor }}>
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-[7pt] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Surat Perintah Kerja (SPK) Ekspedisi
                </p>
                <h1 className="mt-0.5 text-[14pt] font-bold uppercase tracking-[0.08em]">
                  Order Pengiriman / Ekspedisi
                </h1>
                <p className="mt-0.5 text-[8.5pt] font-semibold uppercase text-slate-700">{companyName}</p>
              </div>
              <dl className="grid min-w-[65mm] grid-cols-[24mm_1fr] gap-x-2 gap-y-0.5 text-[7pt] leading-tight">
                <dt className="text-slate-500">No. Order</dt>
                <dd className="font-mono font-bold text-slate-900">: {data.code}</dd>
                <dt className="text-slate-500">Tgl Order</dt>
                <dd className="font-medium">: {formatCompactDate(data.createdAt)}</dd>
                <dt className="text-slate-500">Status Order</dt>
                <dd className="font-semibold text-slate-900">: {getOrderStatusText(data.status)}</dd>
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

          {/* Customer & Route Details */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded border border-slate-300 p-2 text-[7pt] leading-snug">
              <p className="border-b border-slate-200 pb-1 font-bold uppercase text-slate-700">Informasi Customer</p>
              <dl className="mt-1.5 grid grid-cols-[24mm_1fr] gap-x-2 gap-y-1">
                <dt className="text-slate-500">Customer</dt>
                <dd className="font-semibold text-slate-900">{data.customer?.name || '-'}</dd>
                <dt className="text-slate-500">Kode Customer</dt>
                <dd>{data.customer?.code || '-'}</dd>
                <dt className="text-slate-500">Alamat</dt>
                <dd className="text-slate-800">{data.customer?.address || '-'}</dd>
              </dl>
            </div>

            <div className="rounded border border-slate-300 p-2 text-[7pt] leading-snug">
              <p className="border-b border-slate-200 pb-1 font-bold uppercase text-slate-700">Rute & Instruksi</p>
              <dl className="mt-1.5 grid grid-cols-[24mm_1fr] gap-x-2 gap-y-1">
                <dt className="text-slate-500">Asal (Muat)</dt>
                <dd className="font-medium">{data.loadingIn || '-'}</dd>
                <dt className="text-slate-500">Tujuan Akhir</dt>
                <dd className="font-medium">{data.deliveryDestination || data.loadingOut || '-'}</dd>
                <dt className="text-slate-500">Catatan Order</dt>
                <dd className="text-slate-800">{data.note || '-'}</dd>
              </dl>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[7pt]">
            <div className="rounded border border-slate-300 bg-slate-50 p-2">
              <div className="text-[6.5pt] font-semibold uppercase tracking-wider text-slate-500">UJ Driver</div>
              <div className="mt-1 font-bold text-[8.5pt] text-slate-900">
                {currenciesFormat('idr', data.ujDriver)}
              </div>
            </div>
            <div className="rounded border border-slate-300 bg-slate-50 p-2">
              <div className="text-[6.5pt] font-semibold uppercase tracking-wider text-slate-500">Tagihan Order</div>
              <div className="mt-1 font-bold text-[8.5pt] text-slate-900">
                {currenciesFormat('idr', data.billInvoice)}
              </div>
            </div>
            <div className="rounded border border-slate-300 bg-blue-50/50 p-2">
              <div className="text-[6.5pt] font-semibold uppercase tracking-wider text-blue-700">PPN / PPH</div>
              <div className="mt-1 font-bold text-[8.5pt] text-blue-900">
                {currenciesFormat('idr', data.ppn)} / {currenciesFormat('idr', data.pph ?? 0)}
              </div>
            </div>
            <div className="rounded border border-slate-300 bg-emerald-50/50 p-2">
              <div className="text-[6.5pt] font-semibold uppercase tracking-wider text-emerald-700">Total Tagihan</div>
              <div className="mt-1 font-bold text-[8.5pt] text-emerald-900">
                {currenciesFormat('idr', totalBill)}
              </div>
            </div>
          </div>

          {/* Rute & Muatan Breakdown Table */}
          <div className="mt-3">
            <div className="mb-1 text-[7pt] font-bold uppercase text-slate-700">Rincian Rute & Muatan</div>
            <div className="overflow-hidden border border-slate-400">
              <table className="w-full table-fixed border-collapse text-[6pt] leading-tight text-slate-900">
                <colgroup>
                  <col className="w-[4%]" />
                  <col className="w-[18%]" />
                  <col className="w-[18%]" />
                  <col className="w-[18%]" />
                  <col className="w-[16%]" />
                  <col className="w-[14%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead>
                  <tr className="text-white" style={{ backgroundColor: tableColor }}>
                    <th className="border border-white/30 px-1 py-1 text-center font-semibold uppercase">No</th>
                    <th className="border border-white/30 px-1.5 py-1 text-left font-semibold uppercase">Loading In</th>
                    <th className="border border-white/30 px-1.5 py-1 text-left font-semibold uppercase">Loading Out</th>
                    <th className="border border-white/30 px-1.5 py-1 text-left font-semibold uppercase">Tujuan Kirim</th>
                    <th className="border border-white/30 px-1.5 py-1 text-left font-semibold uppercase">Kendaraan / Plat</th>
                    <th className="border border-white/30 px-1.5 py-1 text-left font-semibold uppercase">Driver</th>
                    <th className="border border-white/30 px-1.5 py-1 text-center font-semibold uppercase">Muatan & Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="border border-slate-300 px-2 py-4 text-center text-slate-500">
                        Belum ada rincian rute untuk order ini.
                      </td>
                    </tr>
                  ) : (
                    routes.map((r, idx) => {
                      const cargoList =
                        r.tarifItems && r.tarifItems.length > 0
                          ? r.tarifItems.map((ci) => `${ci.loadContent} (${ci.qty} pcs)`).join(', ')
                          : r.loadContent
                          ? `${r.loadContent} (${r.qty || 0} pcs)`
                          : '-';

                      return (
                        <tr key={r.id ?? idx} className={idx % 2 === 1 ? 'bg-slate-50/80' : 'bg-white'}>
                          <td className="border border-slate-300 px-1 py-1 text-center font-mono">{idx + 1}</td>
                          <td className="border border-slate-300 px-1.5 py-1">{r.loadingIn || '-'}</td>
                          <td className="border border-slate-300 px-1.5 py-1">{r.loadingOut || '-'}</td>
                          <td className="border border-slate-300 px-1.5 py-1 font-medium">{r.deliveryDestination || '-'}</td>
                          <td className="border border-slate-300 px-1.5 py-1">
                            {r.vehicle?.registrationNumber || '-'} {r.vehicle?.type ? `(${r.vehicle.type})` : ''}
                          </td>
                          <td className="border border-slate-300 px-1.5 py-1">{r.driver?.name || '-'}</td>
                          <td className="border border-slate-300 px-1.5 py-1 text-center">{cargoList}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer & Signature Section */}
          <footer className="mt-auto pt-3 text-[7pt] text-slate-600">
            <div className="mb-[16mm] grid grid-cols-4 gap-4 text-center text-slate-800">
              <div>
                <p className="text-[6.5pt] uppercase text-slate-500">Dibuat Oleh</p>
                <div className="h-[14mm]" />
                <p className="border-t border-slate-700 pt-1 font-semibold">Admin Order</p>
              </div>

              <div>
                <p className="text-[6.5pt] uppercase text-slate-500">Pengemudi (Driver)</p>
                <div className="h-[14mm]" />
                <p className="border-t border-slate-700 pt-1 font-semibold">Driver Ekspedisi</p>
              </div>

              <div>
                <p className="text-[6.5pt] uppercase text-slate-500">Pelanggan / Customer</p>
                <div className="h-[14mm]" />
                <p className="border-t border-slate-700 pt-1 font-semibold">{data.customer?.name || 'Customer'}</p>
              </div>

              <div>
                <p className="text-[6.5pt] uppercase text-slate-500">Mengetahui</p>
                <div className="flex h-[14mm] items-center justify-center">
                  {signatureUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={signatureUrl} alt="" className="max-h-[14mm] max-w-[36mm] object-contain" />
                  )}
                </div>
                <p className="border-t border-slate-700 pt-1 font-semibold">{template.personSigner || 'Management'}</p>
              </div>
            </div>

            {footerInformation && (
              <p className="border-t border-slate-200 pt-1 max-w-[140mm] whitespace-pre-line text-[6pt] leading-snug">
                {footerInformation}
              </p>
            )}

            <div className="mt-1 flex items-center justify-between border-t border-slate-300 pt-1 text-[6pt]">
              <span>Dokumen Order Ekspedisi · {companyName}</span>
              <span>Dicetak {formatCompactDate(printedAt)}</span>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}
