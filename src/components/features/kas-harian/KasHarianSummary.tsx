import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { formatCurrency } from '@/lib/utils/currency';
import type { KasHarian } from '@/types/kas-harian.types';
import type { DateRange } from 'react-day-picker';
import { addDays, differenceInCalendarDays, endOfDay, format, isAfter, startOfMonth, startOfDay } from 'date-fns';

const MAX_RANGE_DAYS = 31;

interface KasHarianSummaryProps {
  data?: KasHarian[];
}

const parseDate = (value: Date | string) => {
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatPeriodText = (range?: DateRange) => {
  if (!range?.from || !range?.to) return 'Periode belum dipilih';
  const from = range.from;
  const to = range.to;

  if (format(from, 'MMM yyyy') === format(to, 'MMM yyyy')) {
    return `${format(from, 'd')}-${format(to, 'd MMM yyyy')}`;
  }

  return `${format(from, 'd MMM yyyy')} - ${format(to, 'd MMM yyyy')}`;
};

export default function KasHarianSummary({ data = [] }: KasHarianSummaryProps) {
  const [selectedAkun, setSelectedAkun] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const start = startOfMonth(new Date());
    return { from: start, to: addDays(start, 29) };
  });

  const accounts = useMemo(() => {
    const uniques = Array.from(new Set(data.map((item) => item.cash?.description).filter(Boolean))) as string[];
    return uniques.length > 0 ? uniques : ['BCA USD', 'BCA IDR'];
  }, [data]);

  const handleDateRangeChange = (nextRange: DateRange | undefined) => {
    if (!nextRange?.from || !nextRange.to) {
      setDateRange(nextRange);
      return;
    }

    const daysDiff = differenceInCalendarDays(nextRange.to, nextRange.from);
    if (daysDiff >= MAX_RANGE_DAYS) {
      setDateRange({
        from: nextRange.from,
        to: addDays(nextRange.from, MAX_RANGE_DAYS - 1),
      });
      return;
    }

    setDateRange(nextRange);
  };

  const analyticsData = useMemo(() => {
    return data.filter((item) => {
      if (selectedAkun !== 'all' && item.cash?.description !== selectedAkun) return false;
      if (!dateRange?.from || !dateRange.to) return true;

      const itemDate = parseDate(item.date);
      if (!itemDate) return false;

      const from = startOfDay(dateRange.from);
      const to = endOfDay(dateRange.to);
      return !isAfter(from, itemDate) && !isAfter(itemDate, to);
    });
  }, [data, selectedAkun, dateRange]);

  const { totalDebit, totalKredit, debitCount, kreditCount, saldoKas } = useMemo(() => {
    return analyticsData.reduce(
      (acc, item) => {
        const debit = Number(item.debet || 0);
        const kredit = Number(item.credit || 0);
        acc.totalDebit += debit;
        acc.totalKredit += kredit;
        if (debit > 0) acc.debitCount += 1;
        if (kredit > 0) acc.kreditCount += 1;
        acc.saldoKas += debit - kredit;
        return acc;
      },
      {
        totalDebit: 0,
        totalKredit: 0,
        debitCount: 0,
        kreditCount: 0,
        saldoKas: 0,
      },
    );
  }, [analyticsData]);

  const periodText = formatPeriodText(dateRange);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Informasi Akun */}
      <Card className="rounded-md border shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
              <CreditCard size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Informasi Akun</h3>
              <p className="text-sm text-gray-500">Detail Informasi akun</p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Nama KAS</label>
            <Select value={selectedAkun} onValueChange={setSelectedAkun}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Akun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Akun</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account} value={account}>
                    {account}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Periode Transaksi</label>
            <DatePickerWithRange date={dateRange} onChange={handleDateRangeChange} className="w-full" />
            <p className="text-xs text-gray-500">Maksimal range 1 bulan. Periode: {periodText}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Saldo Kas</p>
            <p className="text-lg font-bold">{formatCurrency(saldoKas)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Total Debit */}
      <Card className="rounded-md border shadow-sm">
        <CardContent className="p-6 flex flex-col justify-between h-full">
          <div className="flex items-start gap-4">
            <div className="bg-green-100 p-3 rounded-lg text-green-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Total Debit</h3>
              <p className="text-sm text-gray-500">Uang Masuk</p>
            </div>
          </div>

          <div className="mt-4">
            <h2 className="text-3xl font-bold text-green-500">{formatCurrency(totalDebit)}</h2>
            <p className="text-sm text-gray-500 mt-1">Total Uang Masuk {periodText}</p>
          </div>

          <div className="flex justify-between items-center mt-6 pt-6 border-t">
            <span className="text-sm text-gray-500">Transaksi</span>
            <span className="font-medium">{debitCount}</span>
          </div>
        </CardContent>
      </Card>

      {/* Total Kredit */}
      <Card className="rounded-md border shadow-sm">
        <CardContent className="p-6 flex flex-col justify-between h-full">
          <div className="flex items-start gap-4">
            <div className="bg-red-100 p-3 rounded-lg text-red-600">
              <TrendingDown size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Total Kredit</h3>
              <p className="text-sm text-gray-500">Uang Keluar</p>
            </div>
          </div>

          <div className="mt-4">
            <h2 className="text-3xl font-bold text-red-500">{formatCurrency(totalKredit)}</h2>
            <p className="text-sm text-gray-500 mt-1">Total Uang Keluar {periodText}</p>
          </div>

          <div className="flex justify-between items-center mt-6 pt-6 border-t">
            <span className="text-sm text-gray-500">Transaksi</span>
            <span className="font-medium">{kreditCount}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
