import { BalanceSheetDocument, BalanceSheetReport } from '@/types/accounting-report.types';

import AccountingDocument from './AccountingDocument';
import { formatAccountingNumber } from './laporan-akuntansi.utils';

interface BalanceSheetReportViewProps {
  report: BalanceSheetReport;
}

function BalanceSheetTable({
  document,
}: {
  document: BalanceSheetDocument;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_140px] border-y border-[#111827] py-3 text-sm font-semibold text-[#111827]">
        <span>{document.label}</span>
        <span className="text-right">Jumlah</span>
      </div>

      <div className="space-y-6 text-sm text-[#111827]">
        {document.sections.map((section) => (
          <section key={section.title} className="space-y-3">
            <div className="font-semibold">{section.title}</div>
            <div className="space-y-1">
              {section.rows.map((row) => (
                <div
                  key={`${section.title}-${row.label}-${row.indent ?? 0}`}
                  className="grid grid-cols-[minmax(0,1fr)_140px] gap-4 py-1.5"
                >
                  <span
                    className={row.bold ? 'font-semibold' : ''}
                    style={{ paddingLeft: `${(row.indent ?? 0) * 18}px` }}
                  >
                    {row.label}
                  </span>
                  <span className="text-right">
                    {row.value === undefined ? '' : formatAccountingNumber(row.value)}
                  </span>
                </div>
              ))}
            </div>

            {section.totalLabel ? (
              <div className="grid grid-cols-[minmax(0,1fr)_140px] gap-4 border-t border-[#111827] pt-3 font-semibold">
                <span>{section.totalLabel}</span>
                <span className="text-right">
                  {formatAccountingNumber(section.totalValue)}
                </span>
              </div>
            ) : null}
          </section>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_140px] gap-4 border-t border-[#111827] pt-4 text-sm font-semibold text-[#111827]">
        <span>{document.totalLabel}</span>
        <span className="text-right">{formatAccountingNumber(document.totalValue)}</span>
      </div>
    </div>
  );
}

function BalanceSheetFooter({
  placeAndDate,
  directorName,
  directorTitle,
}: {
  placeAndDate: string;
  directorName: string;
  directorTitle: string;
}) {
  return (
    <footer className="pt-14 text-right text-sm text-[#111827]">
      <p>{placeAndDate}</p>
      <div className="pt-20">
        <p className="font-semibold">({directorName})</p>
        <p>{directorTitle}</p>
      </div>
    </footer>
  );
}

export default function BalanceSheetReportView({
  report,
}: BalanceSheetReportViewProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <AccountingDocument
        companyName={report.companyName}
        title={report.reportTitle}
        periodLabel={report.periodLabel}
        className="min-w-0"
      >
        <BalanceSheetTable document={report.assets} />
        <BalanceSheetFooter
          placeAndDate={report.placeAndDate}
          directorName={report.directorName}
          directorTitle={report.directorTitle}
        />
      </AccountingDocument>

      <AccountingDocument
        companyName={report.companyName}
        title={report.reportTitle}
        periodLabel={report.periodLabel}
        className="min-w-0"
      >
        <BalanceSheetTable document={report.liabilities} />
        <BalanceSheetFooter
          placeAndDate={report.placeAndDate}
          directorName={report.directorName}
          directorTitle={report.directorTitle}
        />
      </AccountingDocument>
    </div>
  );
}
