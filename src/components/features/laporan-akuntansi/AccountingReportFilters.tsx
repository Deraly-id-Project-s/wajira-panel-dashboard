'use client';

import { Download, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';

interface AccountingReportFiltersProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onPrint: () => void;
  onDownload: () => void;
  isDownloading?: boolean;
}

export default function AccountingReportFilters({
  selectedDate,
  onDateChange,
  onPrint,
  onDownload,
  isDownloading = false,
}: AccountingReportFiltersProps) {
  return (
    <div className="flex items-end justify-between w-full no-print gap-4">
      <div className="flex items-end gap-6 flex-wrap">
        <div className="flex flex-col space-y-2">
          <label className="text-[13px] font-medium text-slate-700">
            Periode Transaksi
          </label>
          <div className="w-[280px]">
            <DatePicker
              value={selectedDate}
              onChange={(date) => onDateChange(date ?? selectedDate)}
              placeholder="Pilih tanggal"
              className="w-full justify-start bg-white"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
        <Button type="button" onClick={onPrint} variant="outline" className="w-full sm:w-auto">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button type="button" onClick={onDownload} disabled={isDownloading} variant="outline" className="w-full sm:w-auto">
          <Download className="h-4 w-4 mr-2" />
          {isDownloading ? 'Preparing...' : 'Download'}
        </Button>
      </div>
    </div>
  );
}

