import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Printer, Download, ChevronsUpDown, Check } from 'lucide-react';
import { getSuppliers, getUnitTypes } from '@/services/laporan-penerimaan.service';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface LaporanPenerimaanFilterProps {
  activeTab: string;
  startDate: string | null;
  endDate: string | null;
  onApplyFilters: (filters: {
    startDate: string | null;
    endDate: string | null;
    search: string;
    perPage: number;
  }) => void;
  onPrint: () => void;
  onDownload?: () => void;
}

interface OptionItem {
  id: number;
  name: string;
}

export default function LaporanPenerimaanFilter({
  activeTab,
  startDate,
  endDate,
  onApplyFilters,
  onPrint,
  onDownload,
}: LaporanPenerimaanFilterProps) {
  const dateRange = useMemo(() => {
    if (startDate && endDate) {
      const from = new Date(startDate);
      const to = new Date(endDate);
      return {
        from: Number.isNaN(from.getTime()) ? undefined : from,
        to: Number.isNaN(to.getTime()) ? undefined : to
      };
    }
    if (startDate) {
      const from = new Date(startDate);
      return {
        from: Number.isNaN(from.getTime()) ? undefined : from,
        to: undefined
      };
    }
    return undefined;
  }, [startDate, endDate]);

  const [suppliers, setSuppliers] = useState<OptionItem[]>([]);
  const [unitTypes, setUnitTypes] = useState<OptionItem[]>([]);
  const [openBox, setOpenBox] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTermInside, setSearchTermInside] = useState('');
  const [perPage, setPerPage] = useState('25');

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await getSuppliers();
        setSuppliers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setSuppliers([]);
      }
    };

    const fetchUnitTypes = async () => {
      try {
        const data = await getUnitTypes();
        setUnitTypes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setUnitTypes([]);
      }
    };

    if (activeTab === 'per-supplier') {
      fetchSuppliers();
    } else if (activeTab === 'per-tipe') {
      fetchUnitTypes();
    }
  }, [activeTab]);

  useEffect(() => {
    setSearchQuery('');
  }, [activeTab]);

  useEffect(() => {
    if (!openBox) setSearchTermInside('');
  }, [openBox]);

  const currentOptions = activeTab === 'per-supplier' ? suppliers : unitTypes;

  const filteredOptions = currentOptions.filter((option) =>
    option.name?.toLowerCase().includes(searchTermInside.toLowerCase())
  );

  useEffect(() => {
    const appliedStartDate = startDate;
    const appliedEndDate = endDate;

    let search = '';
    if (activeTab === 'per-supplier') {
      search = searchQuery.trim();
    } else if (activeTab === 'per-tipe') {
      search = searchQuery.trim();
    }

    onApplyFilters({
      startDate: appliedStartDate,
      endDate: appliedEndDate,
      search,
      perPage: parseInt(perPage, 10),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, activeTab, perPage]);

  const handleDateChange = (newRange: DateRange | undefined) => {
    const appliedStartDate = newRange?.from ? format(newRange.from, 'yyyy-MM-dd') : null;
    const appliedEndDate = newRange?.to ? format(newRange.to, 'yyyy-MM-dd') : appliedStartDate;

    let search = '';
    if (activeTab === 'per-supplier') {
      search = searchQuery.trim();
    } else if (activeTab === 'per-tipe') {
      search = searchQuery.trim();
    }

    onApplyFilters({
      startDate: appliedStartDate,
      endDate: appliedEndDate,
      search,
      perPage: parseInt(perPage, 10),
    });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between w-full no-print gap-4">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 w-full sm:w-auto">
        {/* Periode Transaksi */}
        <div className="flex flex-col space-y-1.5 w-full sm:w-auto">
          <label className="text-[13px] font-medium text-slate-700">Periode Transaksi</label>
          <div className="w-full sm:w-[280px]">
            <DatePickerWithRange date={dateRange} onChange={handleDateChange} />
          </div>
        </div>

        {activeTab !== 'per-nota' && (
          <div className="flex flex-col space-y-1.5 w-full sm:w-auto">
            <label className="text-[13px] font-medium text-slate-700">
              {activeTab === 'per-tipe' ? 'Masukkan Tipe ' : 'Masukkan Supplier '}
              <span className="text-red-500">*</span>
            </label>

            <Popover open={openBox} onOpenChange={setOpenBox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openBox}
                  className="w-full sm:w-[260px] justify-between text-left font-normal bg-white h-9"
                >
                  <span className="truncate">
                    {searchQuery
                      ? currentOptions.find((option) => option.name === searchQuery)?.name || searchQuery
                      : activeTab === 'per-tipe'
                        ? 'Pilih atau cari tipe...'
                        : 'Pilih atau cari supplier...'}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] sm:w-[260px] p-0" align="start">
                <div className="flex flex-col w-full">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Ketik untuk mencari..."
                      value={searchTermInside}
                      onChange={(event) => setSearchTermInside(event.target.value)}
                      className="h-8 shadow-none focus-visible:ring-0"
                    />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto p-1">
                    {filteredOptions.length === 0 && (
                      <div className="p-4 text-center text-sm text-gray-500">Data tidak ditemukan.</div>
                    )}
                    {filteredOptions.map((option) => (
                      <Button
                        key={option.id}
                        variant="ghost"
                        className="w-full justify-start rounded-md font-normal py-1.5 px-2 h-auto text-sm"
                        onClick={() => {
                          setSearchQuery(option.name);
                          setOpenBox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            searchQuery === option.name ? 'opacity-100 text-blue-600' : 'opacity-0'
                          )}
                        />
                        <span className="truncate">{option.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}

        <div className="flex flex-col space-y-1.5 w-full sm:w-auto">
          <label className="text-[13px] font-medium text-slate-700">Per Halaman</label>
          <Select value={perPage} onValueChange={setPerPage}>
            <SelectTrigger className="w-full sm:w-[130px] bg-white cursor-pointer h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
        <Button onClick={onPrint} variant="outline" className="w-full sm:w-auto h-9">
          <Printer className="h-4 w-4 mr-2" /> Print
        </Button>
        <Button onClick={onDownload} variant="outline" className="w-full sm:w-auto h-9">
          <Download className="h-4 w-4 mr-2" /> Download
        </Button>
      </div>
    </div>
  );
}
