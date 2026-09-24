import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Search,
  Info,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  RotateCcw,
} from 'lucide-react';
import { LoadingState } from '@/components/ui/loading-state';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

export interface ColumnDef<T> {
  header: React.ReactNode;
  label?: string; // Optional text label for column visibility menu
  id?: string;
  accessorKey?: string; // Optional key for sorting (or path)
  sortable?: boolean; // If true, this column can be sorted
  hideable?: boolean; // If false, column cannot be hidden (default: true)
  defaultHidden?: boolean; // If true, column is hidden on initial render
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

  // Column Visibility props
  showColumnVisibility?: boolean;
  hiddenColumns?: Set<string | number> | (string | number)[];
  onHiddenColumnsChange?: (hiddenColumns: Set<string | number>) => void;
  defaultHiddenColumns?: (string | number)[];

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

  // Row mark props
  getRowMark?: (item: T) => 'alert' | 'success' | 'base' | null | undefined;
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
  showColumnVisibility = true,
  hiddenColumns,
  onHiddenColumnsChange,
  defaultHiddenColumns,
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
  getRowMark,
}: BaseTableProps<T>) {
  const [localSearch, setLocalSearch] = useState(search || '');
  const [internalSort, setInternalSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    defaultSort || null
  );
  const [lockedColumns, setLockedColumns] = useState<Set<string | number>>(new Set());
  const [columnLeftOffsets, setColumnLeftOffsets] = useState<Record<string | number, number>>({});
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Column key helper
  const getColKey = useCallback((col: ColumnDef<T>, idx: number): string | number => {
    return col.id || col.accessorKey || String(idx);
  }, []);

  // Column text label helper (for dropdown menu)
  const getColumnLabel = useCallback((col: ColumnDef<T>, idx: number): string => {
    if (col.label) return col.label;
    if (typeof col.header === 'string') return col.header;
    if (typeof col.header === 'number') return String(col.header);
    if (col.id) return String(col.id);
    if (col.accessorKey) return String(col.accessorKey);
    return `Kolom ${idx + 1}`;
  }, []);

  // Initial hidden columns setup
  const initialHiddenColumns = useMemo(() => {
    const hidden = new Set<string | number>();
    columns.forEach((col, idx) => {
      const colKey = getColKey(col, idx);
      if (col.defaultHidden) {
        hidden.add(colKey);
      }
    });
    if (defaultHiddenColumns) {
      defaultHiddenColumns.forEach((key) => hidden.add(key));
    }
    return hidden;
  }, [columns, defaultHiddenColumns, getColKey]);

  const [internalHiddenColumns, setInternalHiddenColumns] = useState<Set<string | number>>(initialHiddenColumns);

  // Controlled / uncontrolled hidden columns
  const effectiveHiddenColumns = useMemo(() => {
    if (hiddenColumns !== undefined) {
      return hiddenColumns instanceof Set ? hiddenColumns : new Set(hiddenColumns);
    }
    return internalHiddenColumns;
  }, [hiddenColumns, internalHiddenColumns]);

  // Filter visible columns
  const visibleColumns = useMemo(() => {
    return columns.filter((col, idx) => {
      const colKey = getColKey(col, idx);
      return !effectiveHiddenColumns.has(colKey);
    });
  }, [columns, effectiveHiddenColumns, getColKey]);

  const toggleHideColumn = useCallback((colKey: string | number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(effectiveHiddenColumns);
    if (next.has(colKey)) {
      // Unhide column
      next.delete(colKey);
    } else {
      // Hide column: ensure at least 1 column remains visible
      if (visibleColumns.length <= 1) {
        return;
      }
      next.add(colKey);
    }
    if (onHiddenColumnsChange) {
      onHiddenColumnsChange(next);
    } else {
      setInternalHiddenColumns(next);
    }
  }, [effectiveHiddenColumns, onHiddenColumnsChange, visibleColumns.length]);

  const showAllColumns = useCallback(() => {
    const next = new Set<string | number>();
    if (onHiddenColumnsChange) {
      onHiddenColumnsChange(next);
    } else {
      setInternalHiddenColumns(next);
    }
  }, [onHiddenColumnsChange]);

  const resetHiddenColumns = useCallback(() => {
    if (onHiddenColumnsChange) {
      onHiddenColumnsChange(initialHiddenColumns);
    } else {
      setInternalHiddenColumns(initialHiddenColumns);
    }
  }, [initialHiddenColumns, onHiddenColumnsChange]);

  const hiddenCount = effectiveHiddenColumns.size;

  const updateLeftOffsets = useCallback(() => {
    if (!tableContainerRef.current) return;
    const headerCells = tableContainerRef.current.querySelectorAll('thead th');
    const offsets: Record<string | number, number> = {};

    let currentLeft = 0;
    if (showCheckbox && headerCells[0]) {
      currentLeft = (headerCells[0] as HTMLElement).offsetWidth;
    }

    const startIdx = showCheckbox ? 1 : 0;
    visibleColumns.forEach((col, idx) => {
      const colKey = getColKey(col, idx);
      const isLocked = lockedColumns.has(colKey) || col.sticky === 'left';

      if (isLocked) {
        offsets[colKey] = currentLeft;
        const cellEl = headerCells[startIdx + idx] as HTMLElement;
        if (cellEl) {
          currentLeft += cellEl.offsetWidth;
        } else {
          currentLeft += 120;
        }
      }
    });

    setColumnLeftOffsets(offsets);
  }, [visibleColumns, showCheckbox, lockedColumns, getColKey]);

  const lastStickyLeftKey = useMemo(() => {
    let lastKey: string | number | null = null;
    visibleColumns.forEach((col, idx) => {
      const colKey = getColKey(col, idx);
      if (lockedColumns.has(colKey) || col.sticky === 'left') {
        lastKey = colKey;
      }
    });
    return lastKey;
  }, [visibleColumns, lockedColumns, getColKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateLeftOffsets();
    }, 50);
    return () => clearTimeout(timer);
  }, [data, loading, lockedColumns, effectiveHiddenColumns, updateLeftOffsets]);

  useEffect(() => {
    updateLeftOffsets();
    window.addEventListener('resize', updateLeftOffsets);
    return () => window.removeEventListener('resize', updateLeftOffsets);
  }, [updateLeftOffsets]);

  const toggleLockColumn = (colKey: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLockedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(colKey)) {
        next.delete(colKey);
      } else {
        next.add(colKey);
      }
      return next;
    });
  };

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

  const getMarkClasses = (mark?: 'alert' | 'success' | 'base' | null | undefined) => {
    switch (mark) {
      case 'alert':
        return {
          row: 'bg-red-500/[0.09] hover:bg-red-500/[0.06] border-red-100/40 dark:bg-red-950/10 dark:hover:bg-red-950/20',
          cell: 'bg-red-500/[0.03] group-hover:bg-red-500/[0.06] dark:bg-red-950/10 dark:group-hover:bg-red-950/20',
        };
      case 'success':
        return {
          row: 'bg-emerald-500/[0.02] hover:bg-emerald-500/[0.05] border-emerald-100/40 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20',
          cell: 'bg-emerald-500/[0.02] group-hover:bg-emerald-500/[0.05] dark:bg-emerald-950/10 dark:group-hover:bg-emerald-950/20',
        };
      case 'base':
        return {
          row: 'bg-amber-500/[0.03] hover:bg-amber-500/[0.06] border-amber-100/40 dark:bg-amber-950/10 dark:hover:bg-amber-950/20',
          cell: 'bg-amber-500/[0.03] group-hover:bg-amber-500/[0.06] dark:bg-amber-950/10 dark:group-hover:bg-amber-950/20',
        };
      default:
        return {
          row: 'bg-white hover:bg-slate-50 border-slate-100',
          cell: 'bg-white group-hover:bg-slate-50',
        };
    }
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
          'h-8 min-w-8 rounded-md border px-2 text-xs font-medium shadow-none sm:h-9 sm:min-w-9 sm:px-3 sm:text-sm',
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

  const hasControls = Boolean(
    onSearchChange ||
    headerActions ||
    showLimitChange ||
    addDateRangePicker ||
    showColumnVisibility
  );

  const showDefaultControls = Boolean(
    onSearchChange ||
    showLimitChange ||
    addDateRangePicker ||
    showColumnVisibility
  );

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
                    className="h-9 bg-white pl-8 text-xs border-slate-300 sm:text-sm"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                  />
                </div>
              )}

              {showColumnVisibility && (
                <DropdownMenu>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="h-9 text-xs sm:text-sm gap-2 shrink-0 font-normal"
                          >
                            {hiddenCount > 0 ? (
                              <EyeOff className="h-4 w-4 shrink-0 text-[#ed333b]" />
                            ) : (
                              <Eye className="h-4 w-4 shrink-0 text-[#ed333b]" />
                            )}
                            <span>Kolom</span>
                            {hiddenCount > 0 && (
                              <span className="rounded-full bg-[#ed333b]/10 text-[#ed333b] border border-[#ed333b]/20 px-1.5 py-0.5 text-[10px] font-semibold">
                                {hiddenCount}
                              </span>
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        {hiddenCount > 0
                          ? `${hiddenCount} kolom disembunyikan. Klik untuk mengatur tampilan kolom`
                          : "Atur visibilitas kolom tabel"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <DropdownMenuContent align="start" className="w-64 p-2">
                    <div className="flex items-center justify-between px-2 py-1.5 text-xs">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">Visibilitas Kolom</span>
                        <span className="text-[11px] text-slate-500">
                          {visibleColumns.length} dari {columns.length} kolom aktif
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hiddenCount > 0 && (
                          <button
                            type="button"
                            onClick={showAllColumns}
                            className="text-xs font-medium text-[#ed333b] hover:text-[#dc2626] hover:underline cursor-pointer"
                          >
                            Tampilkan Semua
                          </button>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator className="my-1.5" />
                    <div className="max-h-64 overflow-y-auto space-y-0.5 pr-1">
                      {columns.map((col, idx) => {
                        const colKey = getColKey(col, idx);
                        const isHidden = effectiveHiddenColumns.has(colKey);
                        const isLastVisible = !isHidden && visibleColumns.length <= 1;
                        const isHideable = col.hideable !== false && !isLastVisible;
                        const colLabel = getColumnLabel(col, idx);

                        return (
                          <div
                            key={colKey}
                            onClick={() => isHideable && toggleHideColumn(colKey)}
                            title={isLastVisible ? "Minimal 1 kolom harus tetap tampil" : undefined}
                            className={cn(
                              "flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-colors select-none",
                              isHideable
                                ? "cursor-pointer hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                                : "opacity-50 cursor-not-allowed text-slate-400 bg-slate-50/50",
                              !isHidden && isHideable && "font-medium text-slate-900",
                              isLastVisible && "font-medium text-slate-700 opacity-60 cursor-not-allowed"
                            )}
                          >
                            <span className="truncate pr-2">{colLabel}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {!isHidden ? (
                                <Eye className="h-3.5 w-3.5 text-[#ed333b]" />
                              ) : (
                                <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {hiddenCount > 0 && (
                      <>
                        <DropdownMenuSeparator className="my-1.5" />
                        <div className="px-1 pt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetHiddenColumns}
                            className="w-full h-7 text-xs font-normal text-slate-600 hover:text-slate-900 justify-center gap-1.5"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Reset Kolom Default</span>
                          </Button>
                        </div>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
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
                  <span className="text-xs font-medium text-slate-700 sm:text-sm">Show</span>
                  <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                    <SelectTrigger className="h-9 w-[70px] bg-white text-xs border-slate-300 sm:text-sm">
                      <SelectValue placeholder="25" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs font-medium text-slate-700 sm:text-sm">Page</span>
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

      <div
        ref={tableContainerRef}
        className={cn('relative overflow-x-auto rounded-md border border-slate-200 bg-white text-[11px] shadow-none sm:text-sm', containerClassName)}
      >
        <Table className="w-max min-w-full print:w-full print:table-fixed">
          <TableHeader className={cn('border-b border-gray-200', headerRowClassName)}>
            {headerGroups && headerGroups}
            <TableRow className="hover:bg-transparent border-none">
              {showCheckbox && (
                <TableHead className={cn("sticky left-0 z-10 w-[44px] min-w-[44px] max-w-[44px] border-r border-slate-200 px-3 py-3 text-center shadow-[4px_0_6px_-4px_rgba(0,0,0,0.05)] sm:w-[50px] sm:min-w-[50px] sm:max-w-[50px] sm:px-4 sm:py-4", headerRowClassName)}>
                  <Checkbox
                    checked={sortedData.length > 0 && sortedData.every((item) => selectedIds?.has(getRowIdInternal(item)))}
                    onCheckedChange={handleToggleAll}
                    disabled={isMasterCheckboxDisabled}
                    aria-label="Pilih semua"
                  />
                </TableHead>
              )}
              {visibleColumns.map((col, idx) => {
                const alignment = col.alignment ?? 'left';
                const textAlignment = alignment === 'right' ? 'text-right' : alignment === 'center' ? 'text-center' : 'text-left';
                const justifyClass = alignment === 'right' ? 'justify-end' : alignment === 'center' ? 'justify-center' : 'justify-start';

                const isSortable = col.sortable && col.accessorKey;
                const sortKey = String(col.accessorKey || col.id || '');
                const colKey = getColKey(col, idx);
                const isSorted = activeSort?.key === sortKey;

                const isStickyLeft = col.sticky === 'left' || lockedColumns.has(colKey);
                const isStickyRight = col.sticky === 'right';
                const isLastStickyLeft = colKey === lastStickyLeftKey;
                const leftOffset = columnLeftOffsets[colKey] ?? 0;
                const canLock = !col.sticky;
                const canHide = col.hideable !== false;

                return (
                  <TableHead
                    key={col.id || idx}
                    onClick={() => isSortable && handleSort(sortKey)}
                    className={cn(
                      'px-3 py-3 text-[11px] font-semibold uppercase text-slate-500 whitespace-nowrap print:px-2 print:py-2 print:text-[10px] print:whitespace-normal sm:px-4 sm:py-4 sm:text-xs group',
                      isSortable && 'cursor-pointer select-none',
                      isStickyLeft && cn(
                        'sticky z-10 border-r border-slate-200',
                        isLastStickyLeft && 'shadow-[4px_0_6px_-4px_rgba(0,0,0,0.05)]',
                        headerRowClassName
                      ),
                      isStickyRight && cn(
                        'sticky right-0 z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]',
                        !col.headerClassName?.includes('w-') && 'w-[80px] min-w-[80px] max-w-[80px]',
                        headerRowClassName
                      ),
                      textAlignment,
                      col.headerClassName
                    )}
                    style={isStickyLeft ? { left: leftOffset } : undefined}
                  >
                    <div className={cn('flex items-center gap-1.5', justifyClass)}>
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
                            <ArrowUp className="h-3 w-3 text-[#ed333b] shrink-0" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-[#ed333b] shrink-0" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-70 transition-opacity duration-150 shrink-0" />
                        )
                      )}
                      {canHide && (
                        <button
                          type="button"
                          disabled={visibleColumns.length <= 1}
                          onClick={(e) => toggleHideColumn(colKey, e)}
                          className={cn(
                            "p-1 rounded hover:bg-slate-100/80 text-slate-400 hover:text-[#ed333b] transition-all shrink-0 cursor-pointer opacity-0 group-hover:opacity-100",
                            visibleColumns.length <= 1 && "opacity-20 cursor-not-allowed hover:text-slate-400 pointer-events-none"
                          )}
                          title={visibleColumns.length <= 1 ? "Minimal 1 kolom harus tetap tampil" : "Sembunyikan kolom ini"}
                        >
                          <EyeOff className="h-3 w-3" />
                        </button>
                      )}
                      {canLock && (
                        <button
                          type="button"
                          onClick={(e) => toggleLockColumn(colKey, e)}
                          className={cn(
                            "p-1 rounded hover:bg-slate-100/80 text-slate-400 hover:text-slate-700 transition-all shrink-0 cursor-pointer",
                            lockedColumns.has(colKey)
                              ? "text-[#ed333b] opacity-100"
                              : "opacity-0 group-hover:opacity-100"
                          )}
                          title={lockedColumns.has(colKey) ? "Lepas pin kolom" : "Pin kolom"}
                        >
                          {lockedColumns.has(colKey) ? (
                            <Lock className="h-3 w-3" />
                          ) : (
                            <Unlock className="h-3 w-3" />
                          )}
                        </button>
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
                <TableCell colSpan={visibleColumns.length + (showCheckbox ? 1 : 0)} className="text-center px-4 py-16 bg-white border-none">
                  <div className="flex flex-col items-center justify-center gap-2">
                    {loading ? (
                      <LoadingState variant="section" text="Memuat data..." />
                    ) : (
                      <>
                        <div className="rounded-full bg-slate-50 p-4 mb-2">
                          <Search className="h-8 w-8 text-slate-400" />
                        </div>
                        <p className="text-sm font-semibold text-slate-900 sm:text-base">Tidak ada data ditemukan</p>
                        <p className="text-xs text-slate-500 sm:text-sm">Belum ada data atau coba gunakan kata kunci pencarian lain.</p>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((item, rowIdx) => {
                const mark = getRowMark?.(item);
                const markClasses = getMarkClasses(mark);

                return (
                  <TableRow
                    key={rowIdx}
                    className={cn(
                      "group border-b transition-colors",
                      markClasses.row,
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(item)}
                  >
                    {showCheckbox && (
                      <TableCell
                        className={cn(
                          "sticky left-0 z-10 w-[44px] min-w-[44px] max-w-[44px] border-r border-slate-200 px-3 py-3 text-center shadow-[4px_0_6px_-4px_rgba(0,0,0,0.05)] sm:w-[50px] sm:min-w-[50px] sm:max-w-[50px] sm:px-4 sm:py-4",
                          markClasses.cell
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={selectedIds?.has(getRowIdInternal(item)) ?? false}
                          onCheckedChange={(checked) => handleToggleOne(getRowIdInternal(item), Boolean(checked))}
                          disabled={isCheckboxDisabled?.(item)}
                          aria-label="Pilih baris"
                        />
                      </TableCell>
                    )}
                    {visibleColumns.map((col, colIdx) => {
                      const alignment = col.alignment ?? 'left';
                      const textAlignment = alignment === 'right' ? 'text-right' : alignment === 'center' ? 'text-center' : 'text-left';
                      const colKey = getColKey(col, colIdx);

                      const isStickyLeft = col.sticky === 'left' || lockedColumns.has(colKey);
                      const isStickyRight = col.sticky === 'right';
                      const isLastStickyLeft = colKey === lastStickyLeftKey;
                      const leftOffset = columnLeftOffsets[colKey] ?? 0;

                      return (
                        <TableCell
                          key={col.id || colIdx}
                          className={cn(
                            'px-2.5 py-2.5 text-[11px] text-slate-700 transition-colors print:px-2 print:py-2 print:text-[10px] sm:px-4 sm:py-4 sm:text-sm',
                            isStickyLeft && cn(
                              'sticky z-10 border-r border-slate-200',
                              isLastStickyLeft && 'shadow-[4px_0_6px_-4px_rgba(0,0,0,0.05)]'
                            ),
                            isStickyRight && cn(
                              'sticky right-0 z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]',
                              !col.className?.includes('w-') && 'w-[80px] min-w-[80px] max-w-[80px]'
                            ),
                            markClasses.cell,
                            textAlignment,
                            col.className
                          )}
                          style={isStickyLeft ? { left: leftOffset } : undefined}
                          onClick={(e) => {
                            if (isStickyRight) {
                              e.stopPropagation();
                            }
                          }}
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
                );
              })
            )}
          </TableBody>
          {footer}
        </Table>
      </div>

      {/* Pagination */}
      {onPageChange && sortedData.length > 0 && (
        <div className="flex flex-col gap-4 py-2 text-xs text-slate-500 sm:text-sm lg:flex-row lg:items-center lg:justify-between no-print">
          <p>Showing {startIndex}-{endIndex} of {totalEntries} data</p>
          <div className="flex flex-wrap items-center justify-end gap-1 text-slate-800">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-md px-2 text-xs font-medium hover:bg-transparent disabled:text-slate-300 sm:h-9 sm:text-sm"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </Button>
            {renderPageButtons()}

            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-md px-2 text-xs font-medium hover:bg-transparent disabled:text-slate-300 sm:h-9 sm:text-sm"
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
