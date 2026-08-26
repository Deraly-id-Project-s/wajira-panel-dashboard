import { MonthlyVatReport } from '@/types/accounting-report.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { formatAccountingNumber } from './laporan-akuntansi.utils';

interface MonthlyVatReportViewProps {
  report: MonthlyVatReport;
}

const HEADERS = [
  'TGL BELI',
  'PERUSAHAAN/DEALER',
  'TGL FPM',
  'NSFP MASUKAN',
  'TYPE UNIT',
  'NO MESIN',
  'NO RANGKA',
  'HARGA BELI',
  'BIAYA',
  'HARGA UNIT',
  'DPP BELI',
  'PPN',
] as const;

export default function MonthlyVatReportView({
  report,
}: MonthlyVatReportViewProps) {
  return (
    <section className="rounded-md border border-gray-200 bg-white p-4 shadow-none sm:p-6 print:rounded-none print:border print:shadow-none">
      <header className="space-y-1 pb-8 text-center">
        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
          {report.reportTitle}
        </h2>
        <p className="text-sm font-semibold text-slate-800 sm:text-base">
          {report.companyName}
        </p>
        <p className="text-sm text-slate-500">{report.periodLabel}</p>
      </header>

      <div className="overflow-x-auto">
        <Table className="min-w-[1320px] border-separate border-spacing-0">
          <TableHeader>
            <TableRow className="cursor-default hover:bg-transparent hover:shadow-none">
              {HEADERS.map((header) => (
                <TableHead
                  key={header}
                  className="h-11 border border-slate-200 bg-[#f8f9fa] px-3 text-center text-[11px] font-semibold uppercase text-slate-500"
                >
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.rows.map((row, index) => (
              <TableRow
                key={`${row.engineNumber}-${index}`}
                className="cursor-default hover:bg-gray-50/50"
              >
                <TableCell className="border-b border-r border-slate-100 px-3 py-2 text-xs text-slate-600">
                  {row.transactionDate}
                </TableCell>
                <TableCell className="border-b border-r border-slate-100 px-3 py-2 text-xs text-slate-600">
                  {row.partnerName}
                </TableCell>
                <TableCell className="border-b border-r border-slate-100 px-3 py-2 text-xs text-slate-600">
                  {row.invoiceDate}
                </TableCell>
                <TableCell className="border-b border-r border-slate-100 px-3 py-2 text-xs text-slate-600">
                  {row.taxInvoiceNumber}
                </TableCell>
                <TableCell className="border-b border-r border-slate-100 px-3 py-2 text-xs text-slate-600">
                  {row.unitType}
                </TableCell>
                <TableCell className="border-b border-r border-slate-100 px-3 py-2 text-xs text-slate-600">
                  {row.engineNumber}
                </TableCell>
                <TableCell className="border-b border-r border-slate-100 px-3 py-2 text-xs text-slate-600">
                  {row.frameNumber}
                </TableCell>
                <TableCell className="border-b border-r border-slate-100 px-3 py-2 text-right text-xs text-slate-600">
                  {formatAccountingNumber(row.purchasePrice)}
                </TableCell>
                <TableCell className="border-b border-r border-slate-100 px-3 py-2 text-right text-xs text-slate-600">
                  {formatAccountingNumber(row.fee)}
                </TableCell>
                <TableCell className="border-b border-r border-slate-100 px-3 py-2 text-right text-xs text-slate-600">
                  {formatAccountingNumber(row.unitPrice)}
                </TableCell>
                <TableCell className="border-b border-r border-slate-100 px-3 py-2 text-right text-xs text-slate-600">
                  {formatAccountingNumber(row.dpp)}
                </TableCell>
                <TableCell className="border-b border-r border-slate-100 px-3 py-2 text-right text-xs text-slate-600">
                  {formatAccountingNumber(row.vat)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="cursor-default bg-slate-50/50 font-semibold hover:bg-slate-50/50 hover:shadow-none">
              <TableCell colSpan={7} className="border-b border-r border-slate-200 px-3 py-3 text-center text-xs text-slate-900">
                TOTAL
              </TableCell>
              <TableCell className="border-b border-r border-slate-200 px-3 py-3 text-right text-xs text-slate-900">
                {formatAccountingNumber(report.totals.purchasePrice)}
              </TableCell>
              <TableCell className="border-b border-r border-slate-200 px-3 py-3 text-right text-xs text-slate-900">
                {formatAccountingNumber(report.totals.fee)}
              </TableCell>
              <TableCell className="border-b border-r border-slate-200 px-3 py-3 text-right text-xs text-slate-900">
                {formatAccountingNumber(report.totals.unitPrice)}
              </TableCell>
              <TableCell className="border-b border-r border-slate-200 px-3 py-3 text-right text-xs text-slate-900">
                {formatAccountingNumber(report.totals.dpp)}
              </TableCell>
              <TableCell className="border-b border-r border-slate-200 px-3 py-3 text-right text-xs text-slate-900">
                {formatAccountingNumber(report.totals.vat)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
