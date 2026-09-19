import { useMemo } from 'react';
import type { DocumentTemplate } from '@/@types/document-template.types';
import type {
  DriverCashAdvance,
  DriverCashAdvanceBilling,
  DriverCashAdvanceBillingHistory,
} from '@/@types/driver-cash-advance.types';
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

const cashAmount = (history: DriverCashAdvanceBillingHistory, code: string) =>
  history.cashes?.find((cash) => cash.code === code)?.pivot.amount ?? 0;

export interface KasBonDetailPrintDocumentProps {
  data: DriverCashAdvance;
  billing?: DriverCashAdvanceBilling | null;
  template: DocumentTemplate | null;
  fallbackBackground?: string;
  companyName: string;
  printedAt: Date;
}

export function KasBonDetailPrintDocument({
  data,
  billing,
  template,
  fallbackBackground,
  companyName,
  printedAt,
}: KasBonDetailPrintDocumentProps) {
  const isApproved = data.isApprove;
  const isDriver = Boolean(data.is_driver_request ?? data.isDriverRequest);
  const approvedNominal =
    data.approveNominal !== undefined && data.approveNominal !== null
      ? Number(data.approveNominal)
      : isApproved
      ? Number(data.claimNominal)
      : 0;

  const effectiveBilling = billing ?? data.billings?.[0] ?? null;
  const totalPaid = effectiveBilling?.totalPaid ?? data.paidNominal ?? 0;
  const remainingPayment = effectiveBilling?.remainingPayment ?? data.remainingNominal ?? 0;
  const isPaid = Boolean(effectiveBilling?.isPaid ?? data.isPaid ?? data.is_paid);
  const paymentHistories: DriverCashAdvanceBillingHistory[] = useMemo(
    () => effectiveBilling?.histories ?? [],
    [effectiveBilling?.histories],
  );

  const paymentTotals = useMemo(() => {
    return paymentHistories.reduce(
      (acc, curr) => {
        const bcaIdr = cashAmount(curr, 'bca_idr');
        const bcaUsd = cashAmount(curr, 'bca_usd');
        const cashIdr = cashAmount(curr, 'cash_idr');
        const total = bcaIdr + cashIdr;
        return {
          bcaIdr: acc.bcaIdr + bcaIdr,
          bcaUsd: acc.bcaUsd + bcaUsd,
          cashIdr: acc.cashIdr + cashIdr,
          total: acc.total + total,
        };
      },
      { bcaIdr: 0, bcaUsd: 0, cashIdr: 0, total: 0 },
    );
  }, [paymentHistories]);

  if (!template) return null;

  const backgroundUrl = template.documentTemplate
    ? getObjectStorageUrl(template.documentTemplate)
    : fallbackBackground;
  const signatureUrl = getObjectStorageUrl(template.personSignature);
  const tableColor = /^#[0-9a-f]{6}$/i.test(template.tableColor) ? template.tableColor : '#1f4163';
  const headerInformation = htmlToPlainText(template.headerInformation);
  const footerInformation = htmlToPlainText(template.footerInformation);

  return (
    <div className="accounting-print-root kas-bon-detail-print-root" aria-hidden="true">
      <section
        className="print-letter-page accounting-print-area kas-bon-detail-print-area"
        aria-label="Voucher kas bon driver"
      >
        {backgroundUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={backgroundUrl} alt="" className="print-letterhead" />
        )}

        <div className="accounting-print-content kas-bon-detail-print-content">
          {/* Header */}
          <header className="border-b-2 pb-2 text-slate-950" style={{ borderColor: tableColor }}>
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-[7pt] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Voucher Bukti Kas Bon Driver
                </p>
                <h1 className="mt-0.5 text-[14pt] font-bold uppercase tracking-[0.08em]">
                  Bukti Kas Bon Driver
                </h1>
                <p className="mt-0.5 text-[8.5pt] font-semibold uppercase text-slate-700">{companyName}</p>
              </div>
              <dl className="grid min-w-[65mm] grid-cols-[24mm_1fr] gap-x-2 gap-y-0.5 text-[7pt] leading-tight">
                <dt className="text-slate-500">No. Kas Bon</dt>
                <dd className="font-mono font-bold text-slate-900">: {data.code || `KB-${data.id}`}</dd>
                <dt className="text-slate-500">Tgl Pengajuan</dt>
                <dd className="font-medium">: {formatCompactDate(data.claimDate)}</dd>
                <dt className="text-slate-500">Status Bayar</dt>
                <dd className="font-semibold text-slate-900">
                  : {isPaid ? 'LUNAS' : 'BELUM LUNAS'}
                </dd>
                <dt className="text-slate-500">Status Approval</dt>
                <dd className="font-medium">
                  : {isApproved === true ? 'Disetujui' : isApproved === false ? 'Ditolak' : 'Menunggu'}
                </dd>
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

          {/* Driver & Cash Advance Meta */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded border border-slate-300 p-2 text-[7pt] leading-snug">
              <p className="border-b border-slate-200 pb-1 font-bold uppercase text-slate-700">Informasi Driver</p>
              <dl className="mt-1.5 grid grid-cols-[24mm_1fr] gap-x-2 gap-y-1">
                <dt className="text-slate-500">Nama Driver</dt>
                <dd className="font-semibold text-slate-900">{data.driver?.name || '-'}</dd>
                <dt className="text-slate-500">ID / Kode Driver</dt>
                <dd>{data.driver?.code || '-'}</dd>
                <dt className="text-slate-500">Perusahaan</dt>
                <dd>{data.driver?.companyList || '-'}</dd>
              </dl>
            </div>

            <div className="rounded border border-slate-300 p-2 text-[7pt] leading-snug">
              <p className="border-b border-slate-200 pb-1 font-bold uppercase text-slate-700">Detail Pengajuan</p>
              <dl className="mt-1.5 grid grid-cols-[26mm_1fr] gap-x-2 gap-y-1">
                <dt className="text-slate-500">Sumber Pengajuan</dt>
                <dd className="font-medium">{isDriver ? 'Aplikasi Driver' : 'Input Admin Kantor'}</dd>
                <dt className="text-slate-500">Tanggal Disetujui</dt>
                <dd>{data.approveDate ? formatCompactDate(data.approveDate) : '-'}</dd>
                <dt className="text-slate-500">Keperluan / Ket.</dt>
                <dd className="text-slate-800">{data.subject || data.description || '-'}</dd>
              </dl>
            </div>
          </div>

          {/* Nominal Overview Box */}
          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[7pt]">
            <div className="rounded border border-slate-300 bg-slate-50 p-2">
              <div className="text-[6.5pt] font-semibold uppercase tracking-wider text-slate-500">Diajukan</div>
              <div className="mt-1 font-bold text-[8.5pt] text-slate-900">
                {currenciesFormat('idr', data.claimNominal)}
              </div>
            </div>
            <div className="rounded border border-slate-300 bg-blue-50/50 p-2">
              <div className="text-[6.5pt] font-semibold uppercase tracking-wider text-blue-700">Disetujui</div>
              <div className="mt-1 font-bold text-[8.5pt] text-blue-900">
                {currenciesFormat('idr', approvedNominal)}
              </div>
            </div>
            <div className="rounded border border-slate-300 bg-emerald-50/50 p-2">
              <div className="text-[6.5pt] font-semibold uppercase tracking-wider text-emerald-700">Terbayar</div>
              <div className="mt-1 font-bold text-[8.5pt] text-emerald-900">
                {currenciesFormat('idr', totalPaid)}
              </div>
            </div>
            <div className="rounded border border-slate-300 bg-rose-50/50 p-2">
              <div className="text-[6.5pt] font-semibold uppercase tracking-wider text-rose-700">Sisa Kas Bon</div>
              <div className="mt-1 font-bold text-[8.5pt] text-rose-900">
                {currenciesFormat('idr', remainingPayment)}
              </div>
            </div>
          </div>

          {/* Riwayat Pembayaran Table */}
          <div className="mt-3">
            <div className="mb-1 text-[7pt] font-bold uppercase text-slate-700">Riwayat Pembayaran Kas Bon</div>
            <div className="overflow-hidden border border-slate-400">
              <table className="w-full table-fixed border-collapse text-[6pt] leading-tight text-slate-900">
                <colgroup>
                  <col className="w-[5%]" />
                  <col className="w-[15%]" />
                  <col className="w-[18%]" />
                  <col className="w-[14%]" />
                  <col className="w-[18%]" />
                  <col className="w-[18%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead>
                  <tr className="text-white" style={{ backgroundColor: tableColor }}>
                    <th className="border border-white/30 px-1 py-1 text-center font-semibold uppercase">No</th>
                    <th className="border border-white/30 px-1.5 py-1 text-center font-semibold uppercase">Tgl Bayar</th>
                    <th className="border border-white/30 px-1.5 py-1 text-right font-semibold uppercase">BCA (IDR)</th>
                    <th className="border border-white/30 px-1.5 py-1 text-right font-semibold uppercase">BCA (USD)</th>
                    <th className="border border-white/30 px-1.5 py-1 text-right font-semibold uppercase">Tunai (IDR)</th>
                    <th className="border border-white/30 px-1.5 py-1 text-right font-semibold uppercase">Total (IDR)</th>
                    <th className="border border-white/30 px-1.5 py-1 text-left font-semibold uppercase">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistories.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="border border-slate-300 px-2 py-4 text-center text-slate-500">
                        Belum ada riwayat pembayaran yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    paymentHistories.map((h: DriverCashAdvanceBillingHistory, idx: number) => {
                      const bcaIdr = cashAmount(h, 'bca_idr');
                      const bcaUsd = cashAmount(h, 'bca_usd');
                      const cashIdr = cashAmount(h, 'cash_idr');
                      const rowTotal = bcaIdr + cashIdr;

                      return (
                        <tr key={h.id ?? idx} className={idx % 2 === 1 ? 'bg-slate-50/80' : 'bg-white'}>
                          <td className="border border-slate-300 px-1 py-1 text-center font-mono">{idx + 1}</td>
                          <td className="border border-slate-300 px-1.5 py-1 text-center tabular-nums">
                            {formatCompactDate(h.paymentAt)}
                          </td>
                          <td className="border border-slate-300 px-1.5 py-1 text-right tabular-nums">
                            {currenciesFormat('idr', bcaIdr)}
                          </td>
                          <td className="border border-slate-300 px-1.5 py-1 text-right tabular-nums">
                            {currenciesFormat('usd', bcaUsd)}
                          </td>
                          <td className="border border-slate-300 px-1.5 py-1 text-right tabular-nums">
                            {currenciesFormat('idr', cashIdr)}
                          </td>
                          <td className="border border-slate-300 px-1.5 py-1 text-right font-semibold tabular-nums">
                            {currenciesFormat('idr', rowTotal)}
                          </td>
                          <td className="border border-slate-300 px-1.5 py-1 truncate">{h.note || '-'}</td>
                        </tr>
                      );
                    })
                  )}
                  {paymentHistories.length > 0 && (
                    <tr className="font-bold" style={{ backgroundColor: `${tableColor}14` }}>
                      <td colSpan={2} className="border border-slate-400 px-1.5 py-1.5 text-right uppercase">
                        Total Terbayar
                      </td>
                      <td className="border border-slate-400 px-1.5 py-1.5 text-right tabular-nums">
                        {currenciesFormat('idr', paymentTotals.bcaIdr)}
                      </td>
                      <td className="border border-slate-400 px-1.5 py-1.5 text-right tabular-nums">
                        {currenciesFormat('usd', paymentTotals.bcaUsd)}
                      </td>
                      <td className="border border-slate-400 px-1.5 py-1.5 text-right tabular-nums">
                        {currenciesFormat('idr', paymentTotals.cashIdr)}
                      </td>
                      <td className="border border-slate-400 px-1.5 py-1.5 text-right tabular-nums">
                        {currenciesFormat('idr', paymentTotals.total)}
                      </td>
                      <td className="border border-slate-400 px-1.5 py-1.5"></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer & Signature Section */}
          <footer className="mt-auto pt-3 text-[7pt] text-slate-600">
            <div className="mb-[16mm] flex items-end justify-between gap-6">
              <div className="min-w-[40mm] text-center text-slate-800">
                <p className="text-[6.5pt] uppercase text-slate-500">Pemohon (Driver)</p>
                <div className="h-[14mm]" />
                <p className="border-t border-slate-700 pt-1 font-semibold">{data.driver?.name || 'Driver'}</p>
              </div>

              <div className="min-w-[40mm] text-center text-slate-800">
                <p className="text-[6.5pt] uppercase text-slate-500">Disetujui Oleh</p>
                <div className="h-[14mm]" />
                <p className="border-t border-slate-700 pt-1 font-semibold">Operasional / Pimpinan</p>
              </div>

              <div className="min-w-[45mm] text-center text-slate-800">
                <p className="text-[6.5pt] uppercase text-slate-500">Mengetahui (Finance)</p>
                <div className="flex h-[14mm] items-center justify-center">
                  {signatureUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={signatureUrl} alt="" className="max-h-[14mm] max-w-[36mm] object-contain" />
                  )}
                </div>
                <p className="border-t border-slate-700 pt-1 font-semibold">{template.personSigner || '-'}</p>
              </div>
            </div>

            {footerInformation && (
              <p className="border-t border-slate-200 pt-1 max-w-[140mm] whitespace-pre-line text-[6pt] leading-snug">
                {footerInformation}
              </p>
            )}

            <div className="mt-1 flex items-center justify-between border-t border-slate-300 pt-1 text-[6pt]">
              <span>Dokumen Bukti Kas Bon Driver · {companyName}</span>
              <span>Dicetak {formatCompactDate(printedAt)}</span>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}
