import React from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import { ReportDateFilters } from '@/@types/report-feature.types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

interface ReportFilterBarProps {
  filters: ReportDateFilters;
  onFilterChange: (filters: ReportDateFilters) => void;
}

export function ReportFilterBar({ filters, onFilterChange }: ReportFilterBarProps) {
  const [open, setOpen] = React.useState(false);
  const [localFilters, setLocalFilters] = React.useState<ReportDateFilters>(filters);

  // Sync when prop changes
  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleDateChange = (field: keyof ReportDateFilters, date?: Date) => {
    setLocalFilters((prev) => ({
      ...prev,
      [field]: date ? format(date, 'yyyy-MM-dd') : undefined,
    }));
  };

  const applyFilters = () => {
    onFilterChange(localFilters);
    setOpen(false);
  };

  const clearFilters = () => {
    const emptyFilters = {
      created_at: undefined,
      start_date: undefined,
      end_date: undefined,
      target_start_date: undefined,
      target_end_date: undefined,
    };
    setLocalFilters(emptyFilters);
    onFilterChange(emptyFilters);
    setOpen(false);
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-10 border-slate-300">
          <Filter className="mr-2 h-4 w-4" />
          Filter Tanggal
          {activeFilterCount > 0 && (
            <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="font-medium leading-none">Filter Berdasarkan Tanggal</h4>
          </div>

          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Dibuat Pada (Created At)</Label>
              <DatePicker
                value={localFilters.created_at}
                onChange={(d) => handleDateChange('created_at', d)}
                placeholder="Pilih Tanggal Dibuat"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Mulai (Start Date)</Label>
              <DatePicker
                value={localFilters.start_date}
                onChange={(d) => handleDateChange('start_date', d)}
                placeholder="Pilih Start Date"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Selesai (End Date)</Label>
              <DatePicker
                value={localFilters.end_date}
                onChange={(d) => handleDateChange('end_date', d)}
                placeholder="Pilih End Date"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Target Mulai (Target Start Date)</Label>
              <DatePicker
                value={localFilters.target_start_date}
                onChange={(d) => handleDateChange('target_start_date', d)}
                placeholder="Pilih Target Start Date"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Target Selesai (Target End Date)</Label>
              <DatePicker
                value={localFilters.target_end_date}
                onChange={(d) => handleDateChange('target_end_date', d)}
                placeholder="Pilih Target End Date"
              />
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 hover:text-slate-900">
              <X className="mr-2 h-4 w-4" /> Reset
            </Button>
            <Button onClick={applyFilters}>
              Terapkan Filter
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
