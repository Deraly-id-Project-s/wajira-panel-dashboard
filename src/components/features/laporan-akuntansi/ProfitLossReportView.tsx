import { ProfitLossReport } from '@/types/accounting-report.types';
import { cn } from '@/lib/utils';

import AccountingDocument from './AccountingDocument';
import { formatAccountingNumber } from './laporan-akuntansi.utils';

interface ProfitLossReportViewProps {
  report: ProfitLossReport;
}

function ReportRow({
  label,
  value,
  indent = 0,
  bold = false,
  muted = false,
}: {
  label: string;
  value?: number | null;
  indent?: number;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-[minmax(0,1fr)_140px] items-start gap-4 py-1.5 text-sm text-[#111827]',
        bold && 'font-semibold',
        muted && 'text-[#4b5563]',
      )}
    >
      <span style={{ paddingLeft: `${indent * 18}px` }}>{label}</span>
      <span className="text-right">{value === undefined ? '' : formatAccountingNumber(value)}</span>
    </div>
  );
}

function ReportBox({
  title,
  rows,
  totalLabel,
  totalValue,
  totalTone = 'default',
}: ProfitLossReport['revenueBox']) {
  return (
    <div className="rounded-[22px] border border-[#e5e7eb] p-3 sm:p-4">
      {title ? (
        <div className="pb-3 text-center text-sm font-semibold text-[#111827]">
          {title}
        </div>
      ) : null}

      <div className="rounded-[18px] border border-[#e5e7eb] bg-white px-3 py-2">
        {rows.map((row) => (
          <ReportRow
            key={`${row.label}-${row.indent ?? 0}`}
            label={row.label}
            value={row.value}
            indent={row.indent}
            bold={row.bold}
            muted={row.muted}
          />
        ))}

        {totalLabel ? (
          <div
            className={cn(
              'mt-3 border-t border-[#111827] pt-2',
              totalTone === 'soft' && 'rounded-md bg-[#f8fafc] px-2',
            )}
          >
            <div className="grid grid-cols-[minmax(0,1fr)_140px] gap-4 text-sm font-semibold text-[#111827]">
              <span>{totalLabel}</span>
              <span className="text-right">{formatAccountingNumber(totalValue)}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SummaryStrip({
  label,
  value,
}: {
  label: string;
  value?: number | null;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_140px] gap-4 rounded-md border border-[#e5e7eb] bg-[#f8fbff] px-4 py-3 text-sm font-semibold text-[#111827]">
      <span>{label}</span>
      <span className="text-right">{formatAccountingNumber(value)}</span>
    </div>
  );
}

export default function ProfitLossReportView({
  report,
}: ProfitLossReportViewProps) {
  return (
    <AccountingDocument
      companyName={report.companyName}
      title={report.reportTitle}
      periodLabel={report.periodLabel}
      className="mx-auto max-w-5xl"
    >
      <div className="space-y-4">
        <ReportBox {...report.revenueBox} />
        <ReportBox {...report.costOfGoodsSoldBox} />
        <SummaryStrip label="LABA KOTOR" value={report.grossProfit} />
        <ReportBox {...report.expenseBox} />
        <SummaryStrip
          label="LABA (RUGI) OPERASIONAL"
          value={report.operatingIncome}
        />
        <ReportBox {...report.nonOperatingBox} />
        <SummaryStrip
          label="LABA (RUGI) BERSIH SEBELUM PAJAK"
          value={report.incomeBeforeTax}
        />
        <ReportBox {...report.fiscalCorrectionBox} />
        <div className="space-y-2 rounded-[22px] border border-[#e5e7eb] p-4">
          <SummaryStrip
            label="LABA (RUGI) BERSIH SEBELUM PAJAK"
            value={report.incomeBeforeTaxAfterCorrection}
          />
          <SummaryStrip label="PAJAK" value={report.tax} />
          <SummaryStrip
            label="LABA (RUGI) BERSIH SETELAH PAJAK"
            value={report.netIncomeAfterTax}
          />
        </div>
      </div>

      <footer className="pt-10 text-right text-sm text-[#111827]">
        <p>{report.placeAndDate}</p>
        <div className="pt-20">
          <p className="font-semibold">({report.directorName})</p>
          <p>{report.directorTitle}</p>
        </div>
      </footer>
    </AccountingDocument>
  );
}
