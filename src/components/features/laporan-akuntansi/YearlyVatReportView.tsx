import { YearlyVatReport } from '@/types/accounting-report.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { formatAccountingNumber } from './laporan-akuntansi.utils';

interface YearlyVatReportViewProps {
  report: YearlyVatReport;
}

export default function YearlyVatReportView({
  report,
}: YearlyVatReportViewProps) {
  return (
    <section className="rounded-md border border-gray-200 bg-white p-4 shadow-none sm:p-6 print:rounded-none print:border print:shadow-none">
      <header className="space-y-2 pb-10 text-center">
        <h2 className="text-lg font-semibold text-slate-900">{report.reportTitle}</h2>
        <p className="text-base font-semibold text-slate-800">{report.companyName}</p>
        <p className="text-2xl font-semibold text-slate-900">{report.periodLabel}</p>
      </header>

      <div className="overflow-x-auto">
        <Table className="min-w-[1150px] border-separate border-spacing-0">
          <TableHeader>
            <TableRow className="cursor-default bg-[#f8f9fa] hover:bg-[#f8f9fa] hover:shadow-none">
              <TableHead rowSpan={2} className="border border-slate-200 px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">
                MASA
              </TableHead>
              <TableHead colSpan={3} className="border border-slate-200 px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">
                PAJAK PERTAMBAHAN NILAI MASUKAN
              </TableHead>
              <TableHead colSpan={3} className="border border-slate-200 px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">
                PAJAK PERTAMBAHAN NILAI KELUAN
              </TableHead>
              <TableHead colSpan={2} className="border border-slate-200 px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">
                KETERANGAN
              </TableHead>
            </TableRow>
            <TableRow className="cursor-default bg-[#f8f9fa] hover:bg-[#f8f9fa] hover:shadow-none">
              <TableHead className="border border-slate-200 px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">
                HARGA BELI
              </TableHead>
              <TableHead className="border border-slate-200 px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">
                DPP BELI
              </TableHead>
              <TableHead className="border border-slate-200 px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">
                PPN 11%
              </TableHead>
              <TableHead className="border border-slate-200 px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">
                HARGA JUAL
              </TableHead>
              <TableHead className="border border-slate-200 px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">
                DPP JUAL
              </TableHead>
              <TableHead className="border border-slate-200 px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">
                PPN 11%
              </TableHead>
              <TableHead className="border border-slate-200 px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">
                SALDO PPN
              </TableHead>
              <TableHead className="border border-slate-200 px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">
                LEBIH/KURANG BAYAR
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.rows.map((row) => (
              <TableRow
                key={row.masa}
                className="cursor-default hover:bg-gray-50/50"
              >
                <TableCell className="border-b border-r border-slate-100 px-4 py-3 text-sm text-slate-600">
                  {row.masa}
                </TableCell>
                <TableCell className="border-b border-r border-slate-100 px-4 py-3 text-right text-sm text-slate-600">
                  {formatAccountingNumber(row.inputPurchasePrice)}
                </TableCell>
                <TableCell className="border-b border-r border-slate-100 px-4 py-3 text-right text-sm text-slate-600">
                  {formatAccountingNumber(row.inputDpp)}
                </TableCell>
                <TableCell className="border-b border-r border-slate-100 px-4 py-3 text-right text-sm text-slate-600">
                  {formatAccountingNumber(row.inputVat)}
                </TableCell>
                <TableCell className="border-b border-r border-slate-100 px-4 py-3 text-right text-sm text-slate-600">
                  {formatAccountingNumber(row.outputSalesPrice)}
                </TableCell>
                <TableCell className="border-b border-r border-slate-100 px-4 py-3 text-right text-sm text-slate-600">
                  {formatAccountingNumber(row.outputDpp)}
                </TableCell>
                <TableCell className="border-b border-r border-slate-100 px-4 py-3 text-right text-sm text-slate-600">
                  {formatAccountingNumber(row.outputVat)}
                </TableCell>
                <TableCell className="border-b border-r border-slate-100 px-4 py-3 text-right text-sm text-slate-600">
                  {formatAccountingNumber(row.saldoPpn)}
                </TableCell>
                <TableCell className="border-b border-r border-slate-100 px-4 py-3 text-center text-sm text-slate-600">
                  {row.paymentStatus}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="cursor-default bg-slate-50/50 font-semibold hover:bg-slate-50/50 hover:shadow-none">
              <TableCell className="border-b border-r border-slate-200 px-4 py-3 text-sm text-slate-900">
                TOTAL
              </TableCell>
              <TableCell className="border-b border-r border-slate-200 px-4 py-3 text-right text-sm text-slate-900">
                {formatAccountingNumber(report.totals.inputPurchasePrice)}
              </TableCell>
              <TableCell className="border-b border-r border-slate-200 px-4 py-3 text-right text-sm text-slate-900">
                {formatAccountingNumber(report.totals.inputDpp)}
              </TableCell>
              <TableCell className="border-b border-r border-slate-200 px-4 py-3 text-right text-sm text-slate-900">
                {formatAccountingNumber(report.totals.inputVat)}
              </TableCell>
              <TableCell className="border-b border-r border-slate-200 px-4 py-3 text-right text-sm text-slate-900">
                {formatAccountingNumber(report.totals.outputSalesPrice)}
              </TableCell>
              <TableCell className="border-b border-r border-slate-200 px-4 py-3 text-right text-sm text-slate-900">
                {formatAccountingNumber(report.totals.outputDpp)}
              </TableCell>
              <TableCell className="border-b border-r border-slate-200 px-4 py-3 text-right text-sm text-slate-900">
                {formatAccountingNumber(report.totals.outputVat)}
              </TableCell>
              <TableCell className="border-b border-r border-slate-200 px-4 py-3 text-right text-sm text-slate-900">
                {formatAccountingNumber(report.totals.saldoPpn)}
              </TableCell>
              <TableCell className="border-b border-r border-slate-200 px-4 py-3 text-center text-sm text-slate-900">
                -
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
