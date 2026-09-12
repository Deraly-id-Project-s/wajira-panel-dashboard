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

const formatCurrency = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

interface ReconciliationRow {
  id: string;
  date?: string | null;
  category: string;
  subject: string;
  description: string;
  nominal?: number | null;
  tone: 'addition' | 'deduction' | 'information';
}

const RECONCILIATION_ROWS_PER_PAGE = 13;

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

  const reconciliationRows: ReconciliationRow[] = [
    ...(data.expeditionExpenses ?? []).map((expense) => ({
      id: `expense-${expense.id}`,
      category: 'Biaya Tambahan',
      subject: expense.subject || '-',
      description: expense.description || '-',
      nominal: expense.nominal,
      tone: 'addition' as const,
    })),
    ...(data.expeditionClaims ?? []).map((claim) => ({
      id: `claim-${claim.id}`,
      category: 'Claim Ekspedisi',
      subject: claim.subject || '-',
      description: claim.description || '-',
      nominal: claim.claimNominal,
      tone: 'information' as const,
    })),
    ...(data.driverExpeditionClaims ?? []).map((application) => ({
      id: `claim-application-${application.id}`,
      date: application.date,
      category: 'Potongan Claim DO',
      subject: application.claim?.subject || application.claim?.sourceExpeditionCode || '-',
      description: `${application.type === 'transfer' ? 'Transfer' : 'Tunai'}${application.claim?.description ? ` · ${application.claim.description}` : ''}`,
      nominal: application.nominal,
      tone: 'deduction' as const,
    })),
    ...(data.driverCashAdvanceClaims ?? []).map((application) => ({
      id: `cash-advance-${application.id}`,
      date: application.date,
      category: 'Potongan Kas Bon',
      subject: application.cashAdvance?.subject || application.cashAdvance?.code || '-',
      description: `${application.type === 'transfer' ? 'Transfer' : 'Tunai'}${application.cashAdvance?.description ? ` · ${application.cashAdvance.description}` : ''}`,
      nominal: application.nominal,
      tone: 'deduction' as const,
    })),
    ...(data.driverNotes ?? []).map((note) => ({
      id: `note-${note.id}`,
      date: note.effectiveDate,
      category: 'Catatan Driver',
      subject: note.subject || '-',
      description: note.description || '-',
      nominal: null,
      tone: 'information' as const,
    })),
  ];
  const reconciliationPages = reconciliationRows.length
    ? Array.from(
        { length: Math.ceil(reconciliationRows.length / RECONCILIATION_ROWS_PER_PAGE) },
        (_, index) => reconciliationRows.slice(
          index * RECONCILIATION_ROWS_PER_PAGE,
          (index + 1) * RECONCILIATION_ROWS_PER_PAGE,
        ),
      )
    : [[]];

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

      {reconciliationPages.map((rows, pageIndex) => {
        const isLastPage = pageIndex === reconciliationPages.length - 1;
        return (
          <section
            key={`reconciliation-${pageIndex}`}
            className="print-letter-page accounting-print-area do-ekspedisi-detail-print-area"
            aria-label={`Rekonsiliasi DO halaman ${pageIndex + 1}`}
          >
            {backgroundUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={backgroundUrl} alt="" className="print-letterhead" />
            )}

            <div className="accounting-print-content do-ekspedisi-detail-print-content">
              <header className="border-b-2 pb-2 text-slate-950" style={{ borderColor: tableColor }}>
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-[7pt] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Rekonsiliasi Operasional Ekspedisi
                    </p>
                    <h1 className="mt-0.5 text-[13pt] font-bold uppercase tracking-[0.08em]">
                      Biaya, Potongan, Claim & Catatan
                    </h1>
                    <p className="mt-0.5 text-[8pt] font-semibold uppercase text-slate-700">{companyName}</p>
                  </div>
                  <dl className="grid min-w-[62mm] grid-cols-[23mm_1fr] gap-x-2 gap-y-0.5 text-[7pt] leading-tight">
                    <dt className="text-slate-500">No. DO</dt>
                    <dd className="font-mono font-bold">: {data.doCode}</dd>
                    <dt className="text-slate-500">Driver</dt>
                    <dd className="font-medium">: {data.driver?.name || '-'}</dd>
                    <dt className="text-slate-500">Halaman</dt>
                    <dd>: {pageIndex + 1} dari {reconciliationPages.length}</dd>
                  </dl>
                </div>
                {headerInformation && (
                  <p className="mt-2 max-w-[175mm] whitespace-pre-line text-[7pt] leading-snug text-slate-600">
                    {headerInformation}
                  </p>
                )}
              </header>

              {pageIndex === 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2 text-[6.5pt]">
                  <div className="rounded border border-slate-300 p-2">
                    <p className="uppercase text-slate-500">UJ Awal</p>
                    <p className="mt-1 font-bold text-slate-900">{formatCurrency(data.ujNominalBeforeClaim)}</p>
                  </div>
                  <div className="rounded border border-rose-200 bg-rose-50/50 p-2">
                    <p className="uppercase text-rose-600">Potongan Claim</p>
                    <p className="mt-1 font-bold text-rose-700">-{formatCurrency(data.claimDeductionNominal)}</p>
                  </div>
                  <div className="rounded border border-rose-200 bg-rose-50/50 p-2">
                    <p className="uppercase text-rose-600">Potongan Kas Bon</p>
                    <p className="mt-1 font-bold text-rose-700">-{formatCurrency(data.cashAdvanceDeductionNominal)}</p>
                  </div>
                  <div className="rounded border border-emerald-200 bg-emerald-50/50 p-2">
                    <p className="uppercase text-emerald-700">UJ Diterima</p>
                    <p className="mt-1 font-bold text-emerald-800">{formatCurrency(data.ujNominal)}</p>
                  </div>
                </div>
              )}

              <div className="mt-3 overflow-hidden border border-slate-400">
                <table className="w-full table-fixed border-collapse text-[6pt] leading-tight text-slate-900">
                  <colgroup>
                    <col className="w-[5%]" />
                    <col className="w-[14%]" />
                    <col className="w-[19%]" />
                    <col className="w-[20%]" />
                    <col className="w-[28%]" />
                    <col className="w-[14%]" />
                  </colgroup>
                  <thead>
                    <tr className="text-white" style={{ backgroundColor: tableColor }}>
                      <th className="border border-white/30 px-1 py-1.5 text-center uppercase">No</th>
                      <th className="border border-white/30 px-1 py-1.5 text-left uppercase">Tanggal</th>
                      <th className="border border-white/30 px-1 py-1.5 text-left uppercase">Kategori</th>
                      <th className="border border-white/30 px-1 py-1.5 text-left uppercase">Subjek</th>
                      <th className="border border-white/30 px-1 py-1.5 text-left uppercase">Keterangan</th>
                      <th className="border border-white/30 px-1 py-1.5 text-right uppercase">Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length ? rows.map((row, rowIndex) => (
                      <tr key={row.id} className={rowIndex % 2 === 1 ? 'bg-slate-50/80' : 'bg-white'}>
                        <td className="border border-slate-300 px-1 py-1.5 text-center">
                          {pageIndex * RECONCILIATION_ROWS_PER_PAGE + rowIndex + 1}
                        </td>
                        <td className="border border-slate-300 px-1 py-1.5">{formatCompactDate(row.date)}</td>
                        <td className="border border-slate-300 px-1 py-1.5 font-semibold">{row.category}</td>
                        <td className="border border-slate-300 px-1 py-1.5">{row.subject}</td>
                        <td className="border border-slate-300 px-1 py-1.5">{row.description}</td>
                        <td className={`border border-slate-300 px-1 py-1.5 text-right font-semibold tabular-nums ${row.tone === 'deduction' ? 'text-rose-700' : ''}`}>
                          {row.nominal === null || row.nominal === undefined
                            ? '-'
                            : `${row.tone === 'deduction' ? '-' : ''}${formatCurrency(row.nominal)}`}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="border border-slate-300 px-3 py-5 text-center text-slate-500">
                          Belum ada biaya tambahan, claim, potongan, atau catatan ekspedisi.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {isLastPage && (
                <div className="mt-3 grid grid-cols-2 gap-3 text-[6.5pt]">
                  <div className="rounded border border-slate-300 p-2">
                    <p className="font-bold uppercase text-slate-700">Ringkasan Biaya DO</p>
                    <dl className="mt-1.5 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
                      <dt>Bruto</dt><dd className="text-right font-medium">{formatCurrency(data.bruttoValue)}</dd>
                      <dt>PPN</dt><dd className="text-right">{formatCurrency(data.totalPpn)}</dd>
                      <dt>PPH</dt><dd className="text-right">{formatCurrency(data.totalPph)}</dd>
                      <dt>Service Fee</dt><dd className="text-right">{formatCurrency(data.totalServiceFee)}</dd>
                      <dt>Tambahan Biaya</dt><dd className="text-right">{formatCurrency(data.totalAdditionalCost)}</dd>
                      <dt>Biaya Lain</dt><dd className="text-right">{formatCurrency(data.totalOtherFee)}</dd>
                      <dt>Biaya Driver</dt><dd className="text-right">{formatCurrency(data.totalDriverFee)}</dd>
                    </dl>
                  </div>
                  <div className="rounded border border-slate-300 p-2">
                    <p className="font-bold uppercase text-slate-700">Atensi Driver</p>
                    <p className="mt-1.5 whitespace-pre-line leading-snug text-slate-700">{data.driverNote || '-'}</p>
                  </div>
                </div>
              )}

              <footer className="mt-auto pt-3 text-[7pt] text-slate-600">
                {isLastPage && (
                  <div className="mb-[18mm] flex items-end justify-between gap-8">
                    <p className="max-w-[115mm] whitespace-pre-line leading-snug">{footerInformation}</p>
                    <div className="min-w-[45mm] text-center text-slate-800">
                      <p>Mengetahui,</p>
                      <div className="flex h-[14mm] items-center justify-center">
                        {signatureUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={signatureUrl} alt="" className="max-h-[14mm] max-w-[36mm] object-contain" />
                        )}
                      </div>
                      <p className="border-t border-slate-700 pt-1 font-semibold">{template.personSigner || 'Operasional'}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-slate-300 pt-1 text-[6pt]">
                  <span>Rekonsiliasi DO {data.doCode}</span>
                  <span>Halaman {pageIndex + 1} dari {reconciliationPages.length}</span>
                </div>
              </footer>
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default DOEkspedisiPrintDocument;
