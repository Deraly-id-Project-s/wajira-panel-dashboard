import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Printer, Download, ChevronsUpDown, Check } from 'lucide-react';
import { getSuppliers, getUnitTypes } from '@/services/laporan-pembelian.service';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getSpareparts } from '@/services/sparepart.service';
import { useCompany } from '@/contexts/CompanyContext';

interface LaporanPembelianFilterProps {
  activeTab: string;
  reportItem: 'unit' | 'sparepart';
  startDate: string | null;
  endDate: string | null;
  onApplyFilters: (filters: {
    startDate: string | null;
    endDate: string | null;
    supplierId: number | null;
    search: string;
  }) => void;
  onPrint: () => void;
  onDownload?: () => void;
}

export default function LaporanPembelianFilter({
  activeTab,
  reportItem,
  startDate,
  endDate,
  onApplyFilters,
  onPrint,
  onDownload,
}: LaporanPembelianFilterProps) {
  const { companyId } = useCompany();
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
  const [suppliers, setSuppliers] = useState<Array<{ id: number; name: string }>>([]);
  const [unitTypes, setUnitTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [spareparts, setSpareparts] = useState<Array<{ id: number; name: string }>>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Combobox local state
  const [openBox, setOpenBox] = useState(false);
  const [searchTermInside, setSearchTermInside] = useState('');

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await getSuppliers();
        setSuppliers(Array.isArray(data) ? data : (data?.data || []));
      } catch (e) {
        console.error(e);
      }
    };
    const fetchUnitTypes = async () => {
      try {
        const data = await getUnitTypes();
        setUnitTypes(Array.isArray(data) ? data : (data?.data || []));
      } catch (e) {
        console.error(e);
      }
    };
    const fetchSpareparts = async () => {
      try {
        const result = await getSpareparts(companyId ?? undefined);
        setSpareparts(result.data.map(item => ({ id: Number(item.id), name: item.name })));
      } catch (e) {
        console.error(e);
      }
    };

    if (activeTab === 'per-supplier') {
      fetchSuppliers();
    } else if (activeTab === 'per-tipe') {
      if (reportItem === 'sparepart') fetchSpareparts();
      else fetchUnitTypes();
    }
  }, [activeTab, companyId, reportItem]);

  // Handle clear local inputs when tab changes
  useEffect(() => {
    setSearchQuery('');
  }, [activeTab, reportItem]);

  // Clear inner search term when popover closes
  useEffect(() => {
    if (!openBox) setSearchTermInside('');
  }, [openBox]);

  const rawOptions = activeTab === 'per-supplier' ? suppliers : reportItem === 'sparepart' ? spareparts : unitTypes;
  const currentOptions = Array.isArray(rawOptions) ? rawOptions : [];

  useEffect(() => {
    const startDateVal = startDate;
    const endDateVal = endDate;

    let supplierId: number | null = null;
    let search = '';

    if (activeTab === 'per-supplier') {
      const matchedSupplier = currentOptions.find(s => s.name?.toLowerCase() === searchQuery.trim().toLowerCase());
      if (matchedSupplier && reportItem === 'unit') {
        supplierId = matchedSupplier.id;
      } else {
        search = searchQuery.trim();
      }
    } else if (activeTab === 'per-tipe') {
      search = searchQuery.trim();
    }

    onApplyFilters({
      startDate: startDateVal,
      endDate: endDateVal,
      supplierId,
      search,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, activeTab, reportItem]);

  const handleDateChange = (newRange: DateRange | undefined) => {
    const appliedStartDate = newRange?.from ? format(newRange.from, 'yyyy-MM-dd') : null;
    const appliedEndDate = newRange?.to ? format(newRange.to, 'yyyy-MM-dd') : appliedStartDate;

    let supplierId: number | null = null;
    let search = '';

    if (activeTab === 'per-supplier') {
      const matchedSupplier = currentOptions.find(s => s.name?.toLowerCase() === searchQuery.trim().toLowerCase());
      if (matchedSupplier && reportItem === 'unit') {
        supplierId = matchedSupplier.id;
      } else {
        search = searchQuery.trim();
      }
    } else if (activeTab === 'per-tipe') {
      search = searchQuery.trim();
    }

    onApplyFilters({
      startDate: appliedStartDate,
      endDate: appliedEndDate,
      supplierId,
      search,
    });
  };

  const filteredOptions = currentOptions.filter(opt =>
    opt?.name?.toLowerCase().includes(searchTermInside.toLowerCase())
  );

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

        {/* Dynamic Searchable Select Field (Hidden for 'per-nota') */}
        {activeTab !== 'per-nota' && (
          <div className="flex flex-col space-y-1.5 w-full sm:w-auto">
            <label className="text-[13px] font-medium text-slate-700">
              {activeTab === 'per-tipe' ? `Masukkan ${reportItem === 'sparepart' ? 'Sparepart' : 'Tipe'} ` : 'Masukkan Supplier '}
              <span className="text-red-500">*</span>
            </label>

            <Popover open={openBox} onOpenChange={setOpenBox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openBox}
                  className="w-full sm:w-[250px] justify-between text-left font-normal bg-white rounded-md border-slate-200 shadow-sm h-9"
                >
                  <span className="truncate">
                    {searchQuery
                      ? (currentOptions.find(o => o.name === searchQuery)?.name || searchQuery)
                      : (activeTab === 'per-tipe' ? `Pilih atau cari ${reportItem === 'sparepart' ? 'sparepart' : 'tipe'}...` : 'Pilih atau cari supplier...')}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] sm:w-[250px] p-0" align="start">
                <div className="flex flex-col w-full">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Ketik untuk mencari..."
                      value={searchTermInside}
                      onChange={e => setSearchTermInside(e.target.value)}
                      className="h-8 shadow-none focus-visible:ring-0"
                    />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto p-1">
                    {filteredOptions.length === 0 && (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Data tidak ditemukan.
                      </div>
                    )}
                    {filteredOptions.map(opt => (
                      <Button
                        key={opt.id}
                        variant="ghost"
                        className="w-full justify-start rounded-sm font-normal py-1.5 px-2 h-auto text-sm"
                        onClick={() => {
                          setSearchQuery(opt.name);
                          setOpenBox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            searchQuery === opt.name ? "opacity-100 text-blue-600" : "opacity-0"
                          )}
                        />
                        <span className="truncate">{opt.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Action Buttons */}
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
