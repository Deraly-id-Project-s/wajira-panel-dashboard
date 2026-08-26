'use client';

import { AccountingReportTab } from '@/types/accounting-report.types';
import { ACCOUNTING_REPORT_TABS } from './laporan-akuntansi.constants';
import { cn } from '@/lib/utils';

interface AccountingReportTabsProps {
  activeTab: AccountingReportTab;
  onChange: (tab: AccountingReportTab) => void;
}

export default function AccountingReportTabs({
  activeTab,
  onChange,
}: AccountingReportTabsProps) {
  return (
    <div className="print:hidden overflow-x-auto">
      <div className="inline-flex h-auto p-1 bg-gray-50 border border-gray-100 rounded-md">
        {ACCOUNTING_REPORT_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              'rounded-lg px-6 py-2.5 text-[14px] font-medium transition-all whitespace-nowrap',
              activeTab === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-slate-600 hover:text-gray-900',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
