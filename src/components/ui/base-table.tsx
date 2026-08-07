import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowDown, ArrowUp, ArrowUpDown, Search, Info } from 'lucide-react';
import { LoadingState } from '@/components/ui/loading-state';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

export interface ColumnDef<T> {
  header: React.ReactNode;
  id?: string;
  accessorKey?: string; // Optional key for sorting (or path)
  sortable?: boolean; // If true, this column can be sorted
  alignment?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
  cell?: (item: T, index: number) => React.ReactNode;
  sticky?: 'left' | 'right'; // If provided, column will float/sticky
  tooltip?: React.ReactNode; // Optional tooltip for the column header
}

export interface BaseTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;

  // Header / Control bar props
  searchPlaceholder?: string;
  search?: string;
  onSearchChange?: (value: string) => void;
  headerActions?: React.ReactNode;
  headerGroups?: React.ReactNode; // Optional extra grouped header rows

  // Show / Limit page props
  showLimitChange?: boolean;
  perPage?: number;
  onPerPageChange?: (value: number) => void;

  // Sorting props
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (key: string, direction: 'asc' | 'desc') => void;
  defaultSort?: { key: string; direction: 'asc' | 'desc' };

  // Pagination props
  meta?: {
    currentPage: number;
    perPage: number;
    lastPage: number;
    total: number;
  };
  onPageChange?: (page: number) => void;

  // Custom styling
  headerRowClassName?: string; // e.g. bg-[#f8f9fa] or bg-[#E9EEF5]
  containerClassName?: string;

  // Selection / Checkbox props
  showCheckbox?: boolean;
  selectedIds?: Set<string>;
  onSelectedIdsChange?: (ids: Set<string>) => void;
  getRowId?: (item: T) => string;
  isCheckboxDisabled?: (item: T) => boolean;
  footer?: React.ReactNode;
  onRowClick?: (item: T) => void;

  // Date picker range props
  addDateRangePicker?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  onDateRangeChange?: (start: string | null, end: string | null) => void;
}

export default function BaseTable<T>({
  data,
  columns,
  loading,
  searchPlaceholder = 'Search...',
  search,
  onSearchChange,
  headerActions,
  showLimitChange = false,
  perPage = 25,
  onPerPageChange,
  sortBy,
  sortDirection,
  onSortChange,
  defaultSort,
  meta,
  onPageChange,
  headerGroups,
  headerRowClassName = 'bg-[#f8f9fa]',
  containerClassName,
  showCheckbox = false,
  selectedIds,
  onSelectedIdsChange,
  getRowId,
  isCheckboxDisabled,
  footer,
  onRowClick,
  addDateRangePicker = false,
  startDate,
  endDate,
  onDateRangeChange,
}: BaseTableProps<T>) {
  const [localSearch, setLocalSearch] = useState(search || '');
  const [internalSort, setInternalSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    defaultSort || null
  );

  const dateRange = useMemo<DateRange | undefined>(() => {
    if (!startDate && !endDate) return undefined;
    return {
      from: startDate ? new Date(startDate) : undefined,
      to: endDate ? new Date(endDate) : undefined,
    };
  }, [startDate, endDate]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (!onDateRangeChange) return;
    const start = range?.from ? format(range.from, 'yyyy-MM-dd') : null;
    const end = range?.to ? format(range.to, 'yyyy-MM-dd') : null;
    onDateRangeChange(start, end);
  };

  const getRowIdInternal = useCallback((item: T) => {
    if (getRowId) return getRowId(item);
    const anyItem = item as any;
    return String(anyItem.id || anyItem.uuid || '');
  }, [getRowId]);

  const handleToggleAll = (checked: boolean) => {
    if (!onSelectedIdsChange) return;
    const next = new Set<string>(selectedIds || new Set<string>());
    sortedData.forEach((item) => {
      const id = getRowIdInternal(item);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
    });
    onSelectedIdsChange(next);
  };

  const handleToggleOne = (id: string, checked: boolean) => {
    if (!onSelectedIdsChange) return;
    const next = new Set<string>(selectedIds || new Set<string>());
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    onSelectedIdsChange(next);
  };

  // Sync search prop
  useEffect(() => {
    setLocalSearch(search || '');
  }, [search]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearchChange && localSearch !== (search || '')) {
        onSearchChange(localSearch);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange, search]);

  const activeSort = useMemo(
    () =>
      onSortChange
        ? { key: sortBy || '', direction: sortDirection || 'asc' }
        : internalSort,
    [onSortChange, sortBy, sortDirection, internalSort]
  );

  const handleSort = (key: string) => {
    const nextDirection =
      activeSort?.key === key && activeSort.direction === 'asc' ? 'desc' : 'asc';

    if (onSortChange) {
      onSortChange(key, nextDirection);
    } else {
      setInternalSort({ key, direction: nextDirection });
    }
  };

  const sortedData = useMemo(() => {
    if (onSortChange || !activeSort || !activeSort.key) {
      return data;
    }

    const { key, direction } = activeSort;
    const factor = direction === 'asc' ? 1 : -1;

    return [...data].sort((a: any, b: any) => {
      // Resolve value from key (can be deep object path like supplier.name)
      const getValue = (obj: any, path: string) => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
      };

      const valA = getValue(a, key);
      const valB = getValue(b, key);

      if (valA === undefined || valA === null) return 1 * factor;
      if (valB === undefined || valB === null) return -1 * factor;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * factor;
      }

      // Check if date
      const dateA = new Date(valA).getTime();
      const dateB = new Date(valB).getTime();
      if (!isNaN(dateA) && !isNaN(dateB) && typeof valA === 'string' && valA.includes('-')) {
        return (dateA - dateB) * factor;
      }

      return String(valA).localeCompare(String(valB)) * factor;
    });
  }, [data, activeSort, onSortChange]);

  const isMasterCheckboxDisabled = useMemo(() => {
    if (!selectedIds || !isCheckboxDisabled) return false;
    const allChecked = sortedData.length > 0 && sortedData.every((item) => selectedIds.has(getRowIdInternal(item)));
    if (allChecked) return false;
    
    return sortedData.some((item) => {
      const isChecked = selectedIds.has(getRowIdInternal(item));
      return !isChecked && isCheckboxDisabled(item);
    });
  }, [sortedData, selectedIds, isCheckboxDisabled, getRowIdInternal]);

  const currentPage = meta?.currentPage ?? 1;
  const itemsPerPage = meta?.perPage ?? perPage;
  const totalPages = meta?.lastPage ?? 1;
  const totalEntries = meta?.total ?? sortedData.length;
  const startIndex = totalEntries === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = startIndex === 0 ? 0 : startIndex + sortedData.length - 1;

  const handlePageChange = (page: number) => {
    onPageChange?.(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    onPerPageChange?.(Number(value));
  };

  const renderPageButtons = () => {
    const buttons = [] as number[];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) buttons.push(i);
    } else if (currentPage <= 3) {
      buttons.push(1, 2, 3, 4, 5);
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) buttons.push(i);
    } else {
      buttons.push(currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2);
    }

    return buttons.map((pageNumber) => (
      <Button
        key={pageNumber}
        variant="ghost"
        size="sm"
        className={cn(
          'h-9 min-w-9 rounded-md border px-3 text-sm font-medium shadow-none',
          pageNumber === currentPage
            ? 'border-slate-200 bg-white text-slate-950 shadow-sm'
            : 'border-transparent bg-transparent text-slate-700 hover:border-slate-200 hover:bg-white',
        )}
        onClick={() => handlePageChange(pageNumber)}
      >
        {pageNumber}
      </Button>
    ));
  };

  const hasControls = Boolean(onSearchChange || headerActions || showLimitChange || addDateRangePicker);
  const showDefaultControls = Boolean(onSearchChange || showLimitChange || addDateRangePicker);

  return (
    <div className="space-y-4">
      {hasControls && (
        showDefaultControls ? (
          <div className="flex flex-wrap items-center justify-between gap-4 no-print">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {onSearchChange && (
                <div className="relative w-full sm:w-[240px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder={searchPlaceholder}
                    className="pl-8 bg-white h-9 border-slate-300"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                  />
                </div>
              )}

              {addDateRangePicker && (
                <DatePickerWithRange
                  date={dateRange}
                  onChange={handleDateRangeChange}
                  className="w-full sm:w-auto min-w-[260px]"
                />
              )}

              {showLimitChange && onPerPageChange && (
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-sm font-medium text-slate-700">Show</span>
                  <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                    <SelectTrigger className="w-[70px] bg-white h-9 border-slate-300">
                      <SelectValue placeholder="25" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm font-medium text-slate-700">Page</span>
                </div>
              )}
            </div>

            {headerActions && (
              <div className="w-full sm:w-auto">
                {headerActions}
              </div>
            )}
          </div>
        ) : (
          <div className="no-print">{headerActions}</div>
        )
      )}

      <div className={cn('relative overflow-hidden rounded-md border border-slate-200 bg-white shadow-none', containerClassName)}>
        <Table className="w-max min-w-full print:w-full print:table-fixed">
          <TableHeader className={cn('border-b border-gray-200', headerRowClassName)}>
            {headerGroups && headerGroups}
            <TableRow className="hover:bg-transparent border-none">
              {showCheckbox && (
                <TableHead className={cn("w-[50px] min-w-[50px] max-w-[50px] px-4 py-4 text-center sticky left-0 z-10 border-r border-slate-200 shadow-[4px_0_6px_-4px_rgba(0,0,0,0.05)]", headerRowClassName)}>
                  <Checkbox
                    checked={sortedData.length > 0 && sortedData.every((item) => selectedIds?.has(getRowIdInternal(item)))}
                    onCheckedChange={handleToggleAll}
                    disabled={isMasterCheckboxDisabled}
                    aria-label="Pilih semua"
                  />
                </TableHead>
              )}
              {columns.map((col, idx) => {
                const alignment = col.alignment ?? 'left';
                const textAlignment = alignment === 'right' ? 'text-right' : alignment === 'center' ? 'text-center' : 'text-left';
                const justifyClass = alignment === 'right' ? 'justify-end' : alignment === 'center' ? 'justify-center' : 'justify-start';

                const isSortable = col.sortable && col.accessorKey;
                const sortKey = String(col.accessorKey || col.id || '');
                const isSorted = activeSort?.key === sortKey;

                return (
                  <TableHead
                    key={col.id || idx}
                    onClick={() => isSortable && handleSort(sortKey)}
                    className={cn(
                      'px-4 py-4 print:px-2 print:py-2 text-xs print:text-[10px] font-semibold uppercase text-slate-500 whitespace-nowrap print:whitespace-normal',
                      isSortable && 'cursor-pointer select-none group',
                      col.sticky === 'right' && cn('sticky right-0 z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)] w-[80px] min-w-[80px] max-w-[80px]', headerRowClassName),
                      col.sticky === 'left' && cn('sticky left-0 z-10 border-r border-slate-200 shadow-[4px_0_6px_-4px_rgba(0,0,0,0.05)] w-[80px] min-w-[80px] max-w-[80px]', headerRowClassName),
                      textAlignment,
                      col.headerClassName
                    )}
                  >
                    <div className={cn('flex items-center gap-1', justifyClass)}>
                      <span>{col.header}</span>
                      {col.tooltip && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                onClick={(e) => e.stopPropagation()}
                                className="cursor-help inline-flex items-center"
                              >
                                <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 hover:text-slate-600 transition-colors" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {col.tooltip}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {isSortable && (
                        isSorted ? (
                          activeSort.direction === 'asc' ? (
                            <ArrowUp className="h-3 w-3 text-indigo-500 shrink-0" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-indigo-500 shrink-0" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-70 transition-opacity duration-150 shrink-0" />
                        )
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow className="hover:bg-transparent border-none">
                <TableCell colSpan={columns.length + (showCheckbox ? 1 : 0)} className="text-center px-4 py-16 bg-white border-none">
                  <div className="flex flex-col items-center justify-center gap-2">
                    {loading ? (
                      <LoadingState variant="section" text="Memuat data..." />
                    ) : (
                      <>
                        <div className="rounded-full bg-slate-50 p-4 mb-2">
                          <Search className="h-8 w-8 text-slate-400" />
                        </div>
                        <p className="text-base font-semibold text-slate-900">Tidak ada data ditemukan</p>
                        <p className="text-sm text-slate-500">Belum ada data atau coba gunakan kata kunci pencarian lain.</p>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((item, rowIdx) => (
                <TableRow
                  key={rowIdx}
                  className={cn(
                    "group border-b bg-white hover:bg-slate-50 border-slate-100 transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {showCheckbox && (
                    <TableCell className="w-[50px] min-w-[50px] max-w-[50px] px-4 py-4 text-center sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200 shadow-[4px_0_6px_-4px_rgba(0,0,0,0.05)]">
                      <Checkbox
                        checked={selectedIds?.has(getRowIdInternal(item)) ?? false}
                        onCheckedChange={(checked) => handleToggleOne(getRowIdInternal(item), Boolean(checked))}
                        disabled={isCheckboxDisabled?.(item)}
                        aria-label="Pilih baris"
                      />
                    </TableCell>
                  )}
                  {columns.map((col, colIdx) => {
                    const alignment = col.alignment ?? 'left';
                    const textAlignment = alignment === 'right' ? 'text-right' : alignment === 'center' ? 'text-center' : 'text-left';

                    return (
                      <TableCell
                        key={col.id || colIdx}
                        className={cn(
                          'px-4 py-4 print:px-2 print:py-2 text-sm print:text-[10px] text-slate-700 transition-colors',
                          col.sticky === 'right' && 'sticky right-0 bg-white group-hover:bg-slate-50 z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)] w-[80px] min-w-[80px] max-w-[80px]',
                          col.sticky === 'left' && 'sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200 shadow-[4px_0_6px_-4px_rgba(0,0,0,0.05)] w-[80px] min-w-[80px] max-w-[80px]',
                          textAlignment,
                          col.className
                        )}
                      >
                        {col.cell
                          ? col.cell(item, rowIdx)
                          : col.accessorKey
                            ? String((item as any)[col.accessorKey] ?? '')
                            : null}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
          {footer}
        </Table>
      </div>

      {/* Pagination */}
      {onPageChange && sortedData.length > 0 && (
        <div className="flex flex-col gap-4 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between py-2 no-print">
          <p>Showing {startIndex}-{endIndex} of {totalEntries} data</p>
          <div className="flex flex-wrap items-center justify-end gap-1 text-slate-800">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-md px-2 text-sm font-medium hover:bg-transparent disabled:text-slate-300"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </Button>
            {renderPageButtons()}

            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-md px-2 text-sm font-medium hover:bg-transparent disabled:text-slate-300"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
