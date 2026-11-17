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
import { TABLE_VISIBILITY_PREFIX } from '@/lib/session/storage';

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
  group?: string; // Parent header group (e.g., 'Pergerakan', 'Saldo Akhir')
  groupClassName?: string; // Custom styling for the parent group header
  rowSpan?: number; // Row span height for headers without group (e.g. 2 for 2-row table header)
  colSpan?: number; // Col span width
}

export interface BaseTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  emptyText?: string;
  emptyMessage?: string;

  // Header / Control bar props
  searchPlaceholder?: string;
  search?: string;
  onSearchChange?: (value: string) => void;
  headerActions?: React.ReactNode;
  headerGroups?: React.ReactNode; // Optional extra grouped header rows
  customHeader?: React.ReactNode; // Optional full custom table header

  // Row & Table styling props
  bordered?: boolean; // Enables clean borders between all cells (ideal for sheets/financial tables)
  dense?: boolean; // Enables compact row padding
  striped?: boolean; // Enables alternating row backgrounds
  rowClassName?: string | ((item: T, index: number) => string); // Custom styling per row
  cellClassName?: string | ((item: T, column: ColumnDef<T>, index: number) => string); // Custom styling per cell

  // Show / Limit page props
  showLimitChange?: boolean;
  perPage?: number;
  onPerPageChange?: (value: number) => void;

  // Column Visibility props
  showColumnVisibility?: boolean;
  hiddenColumns?: Set<string | number> | (string | number)[];
  onHiddenColumnsChange?: (hiddenColumns: Set<string | number>) => void;
  defaultHiddenColumns?: (string | number)[];
  tableId?: string;
  storageKey?: string;
  disableStoragePersistence?: boolean;

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
  emptyText,
  emptyMessage,
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
  tableId,
  storageKey,
  disableStoragePersistence = false,
  sortBy,
  sortDirection,
  onSortChange,
  defaultSort,
  meta,
  onPageChange,
  headerGroups,
  customHeader,
  bordered = false,
  dense = false,
  striped = false,
  rowClassName,
  cellClassName,
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

  // Resolve unique storage key for persistent column visibility
  const resolvedStorageKey = useMemo(() => {
    if (disableStoragePersistence) return null;
    if (storageKey) {
      return storageKey.startsWith(TABLE_VISIBILITY_PREFIX)
        ? storageKey
        : `${TABLE_VISIBILITY_PREFIX}${storageKey}`;
    }
    if (tableId) {
      return `${TABLE_VISIBILITY_PREFIX}${tableId}`;
    }

    if (typeof window === 'undefined') return null;

    // Normalize path by replacing dynamic slug/ids (uuid or numeric)
    const rawPath = window.location.pathname || '';
    const normalizedPath = rawPath
      .replace(/^\/dashboard\/[^/]+/, '/dashboard/:slug')
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id');

    // Create column signature to distinguish different tables on the same page
    const colSignature = columns
      .map((col, idx) => col.id || col.accessorKey || (typeof col.header === 'string' ? col.header : ''))
      .filter(Boolean)
      .slice(0, 8)
      .join('_');

    return `${TABLE_VISIBILITY_PREFIX}${normalizedPath}__${colSignature}`;
  }, [disableStoragePersistence, storageKey, tableId, columns]);

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

  const onHiddenColumnsChangeRef = useRef(onHiddenColumnsChange);
  useEffect(() => {
    onHiddenColumnsChangeRef.current = onHiddenColumnsChange;
  }, [onHiddenColumnsChange]);

  // Load saved preferences from localStorage on mount or key change
  useEffect(() => {
    if (!resolvedStorageKey || typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(resolvedStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const loadedSet = new Set<string | number>(parsed);
          setInternalHiddenColumns(loadedSet);
          onHiddenColumnsChangeRef.current?.(loadedSet);
        }
      }
    } catch (e) {
      console.warn('Failed to load table hidden columns from localStorage', e);
    }
  }, [resolvedStorageKey]);

  // Save preferences to localStorage helper
  const saveHiddenColumnsToStorage = useCallback(
    (nextSet: Set<string | number>) => {
      if (!resolvedStorageKey || typeof window === 'undefined') return;
      try {
        localStorage.setItem(resolvedStorageKey, JSON.stringify(Array.from(nextSet)));
      } catch (e) {
        console.warn('Failed to save table hidden columns to localStorage', e);
      }
    },
    [resolvedStorageKey]
  );

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

  const hasMultiRowHeader = useMemo(() => {
    return visibleColumns.some((c) => Boolean(c.group || (c.rowSpan && c.rowSpan > 1)));
  }, [visibleColumns]);

  const headerGroupItems = useMemo(() => {
    if (!hasMultiRowHeader) return [];

    interface GroupItem {
      type: 'single' | 'group';
      groupName?: string;
      groupClassName?: string;
      columns: ColumnDef<T>[];
      colSpan: number;
    }

    const items: GroupItem[] = [];
    let currentGroup: GroupItem | null = null;

    visibleColumns.forEach((col) => {
      if (col.group) {
        if (currentGroup && currentGroup.type === 'group' && currentGroup.groupName === col.group) {
          currentGroup.columns.push(col);
          currentGroup.colSpan += 1;
        } else {
          currentGroup = {
            type: 'group',
            groupName: col.group,
            groupClassName: col.groupClassName,
            columns: [col],
            colSpan: 1,
          };
          items.push(currentGroup);
        }
      } else {
        currentGroup = {
          type: 'single',
          columns: [col],
          colSpan: 1,
        };
        items.push(currentGroup);
      }
    });

    return items;
  }, [hasMultiRowHeader, visibleColumns]);

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
    saveHiddenColumnsToStorage(next);
    if (onHiddenColumnsChange) {
      onHiddenColumnsChange(next);
    } else {
      setInternalHiddenColumns(next);
    }
  }, [effectiveHiddenColumns, onHiddenColumnsChange, saveHiddenColumnsToStorage, visibleColumns.length]);

  const showAllColumns = useCallback(() => {
    const next = new Set<string | number>();
    saveHiddenColumnsToStorage(next);
    if (onHiddenColumnsChange) {
      onHiddenColumnsChange(next);
    } else {
      setInternalHiddenColumns(next);
    }
  }, [onHiddenColumnsChange, saveHiddenColumnsToStorage]);

  const resetHiddenColumns = useCallback(() => {
    if (resolvedStorageKey && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(resolvedStorageKey);
      } catch {}
    }
    if (onHiddenColumnsChange) {
      onHiddenColumnsChange(initialHiddenColumns);
    } else {
      setInternalHiddenColumns(initialHiddenColumns);
    }
  }, [initialHiddenColumns, onHiddenColumnsChange, resolvedStorageKey]);

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

  const renderTableHeadCell = (
    col: ColumnDef<T>,
    idx: number,
    options?: { rowSpan?: number; isSubHeader?: boolean }
  ) => {
    const alignment = col.alignment ?? 'left';
    const textAlignment =
      alignment === 'right' ? 'text-right' : alignment === 'center' ? 'text-center' : 'text-left';
    const colKey = getColKey(col, idx);
    const isStickyLeft = col.sticky === 'left' || lockedColumns.has(colKey);
    const isStickyRight = col.sticky === 'right';
    const isLastStickyLeft = colKey === lastStickyLeftKey;
    const leftOffset = columnLeftOffsets[colKey] ?? 0;
    const isCurrentSort = Boolean(
      activeSort?.key && (activeSort.key === col.id || activeSort.key === col.accessorKey)
    );
    const sortIcon = isCurrentSort ? (
      activeSort?.direction === 'asc' ? (
        <ArrowUp className="h-3.5 w-3.5 text-slate-900" />
      ) : (
        <ArrowDown className="h-3.5 w-3.5 text-slate-900" />
      )
    ) : (
      <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-40" />
    );

    const isSortable = Boolean(col.sortable && (col.id || col.accessorKey));
    const isLocked = lockedColumns.has(colKey);
    const rowSpan = options?.rowSpan ?? 1;

    return (
      <TableHead
        key={col.id || colKey}
        rowSpan={rowSpan > 1 ? rowSpan : undefined}
        className={cn(
          dense ? 'px-3 py-2 text-[11px] sm:text-xs' : 'px-2.5 py-2.5 text-[11px] sm:px-4 sm:py-3.5 sm:text-sm',
          'font-semibold text-slate-700 transition-colors print:px-2 print:py-2 print:text-[10px]',
          (bordered || hasMultiRowHeader) && 'border-r border-slate-200',
          options?.isSubHeader ? 'bg-[#f8f9fa] text-[11px] font-semibold text-slate-600' : headerRowClassName,
          rowSpan > 1 && 'align-middle border-b border-slate-200',
          isStickyLeft &&
            cn(
              'sticky z-10 border-r border-slate-200',
              headerRowClassName,
              isLastStickyLeft && 'shadow-[4px_0_6px_-4px_rgba(0,0,0,0.05)]'
            ),
          isStickyRight &&
            cn(
              'sticky right-0 z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]',
              headerRowClassName,
              !col.headerClassName?.includes('w-') && 'w-[80px] min-w-[80px] max-w-[80px]'
            ),
          textAlignment,
          col.headerClassName
        )}
        style={isStickyLeft ? { left: leftOffset } : undefined}
      >
        <div
          className={cn(
            'group/th flex items-center gap-1.5',
            alignment === 'right' ? 'justify-end' : alignment === 'center' ? 'justify-center' : 'justify-start'
          )}
        >
          {isSortable ? (
            <button
              type="button"
              className={cn(
                'flex items-center gap-1 hover:text-slate-900 transition-colors cursor-pointer select-none',
                isCurrentSort && 'text-slate-950 font-bold'
              )}
              onClick={() => handleSort((col.id || col.accessorKey)!)}
            >
              <span>{col.header}</span>
              <span className="shrink-0">{sortIcon}</span>
            </button>
          ) : (
            <span className="select-none">{col.header}</span>
          )}

          {col.tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-slate-400 hover:text-slate-600 focus:outline-none">
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">{col.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Optional lock/pin button */}
          {col.sticky !== 'left' && col.sticky !== 'right' && (
            <button
              type="button"
              onClick={(e) => toggleLockColumn(colKey, e)}
              className={cn(
                'opacity-0 group-hover/th:opacity-100 transition-opacity p-0.5 rounded hover:bg-slate-200/60 text-slate-400 hover:text-slate-700',
                isLocked && 'opacity-100 text-slate-700 bg-slate-200/50'
              )}
              title={isLocked ? 'Lepas pin kolom' : 'Pin kolom ke kiri'}
            >
              {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
            </button>
          )}
        </div>
      </TableHead>
    );
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
        <Table className={cn("w-max min-w-full print:w-full print:table-fixed", (bordered || hasMultiRowHeader) && "border-collapse border-spacing-0")}>
          <TableHeader className={cn('border-b border-slate-200', headerRowClassName)}>
            {customHeader ? (
              customHeader
            ) : hasMultiRowHeader ? (
              <>
                {/* Row 1: Height row 2 columns (rowSpan: 2) and Group parent headers (colSpan) */}
                <TableRow className="hover:bg-transparent border-b border-slate-200">
                  {showCheckbox && (
                    <TableHead
                      rowSpan={2}
                      className={cn(
                        "sticky left-0 z-20 w-[44px] min-w-[44px] max-w-[44px] border-r border-b border-slate-200 px-3 py-3 text-center align-middle shadow-[4px_0_6px_-4px_rgba(0,0,0,0.05)] sm:w-[50px] sm:min-w-[50px] sm:max-w-[50px] sm:px-4 sm:py-4",
                        headerRowClassName
                      )}
                    >
                      <Checkbox
                        checked={sortedData.length > 0 && sortedData.every((item) => selectedIds?.has(getRowIdInternal(item)))}
                        onCheckedChange={handleToggleAll}
                        disabled={isMasterCheckboxDisabled}
                        aria-label="Pilih semua"
                      />
                    </TableHead>
                  )}
                  {headerGroupItems.map((item, gIdx) => {
                    if (item.type === 'single') {
                      const col = item.columns[0];
                      const colIdx = visibleColumns.indexOf(col);
                      return renderTableHeadCell(col, colIdx, { rowSpan: col.rowSpan || 2 });
                    }
                    return (
                      <TableHead
                        key={`grp-${gIdx}-${item.groupName}`}
                        colSpan={item.colSpan}
                        className={cn(
                          'px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-700 bg-slate-100/90 border-r border-b border-slate-200 select-none',
                          item.groupClassName
                        )}
                      >
                        {item.groupName}
                      </TableHead>
                    );
                  })}
                </TableRow>

                {/* Row 2: Sub-columns for groups only */}
                <TableRow className="hover:bg-transparent border-b border-slate-200">
                  {visibleColumns.map((col, idx) => {
                    if (!col.group) return null;
                    return renderTableHeadCell(col, idx, { rowSpan: 1, isSubHeader: true });
                  })}
                </TableRow>
              </>
            ) : (
              <>
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
                  {visibleColumns.map((col, idx) => renderTableHeadCell(col, idx, { rowSpan: 1 }))}
                </TableRow>
              </>
            )}
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
                        <p className="text-xs text-slate-500 sm:text-sm">
                          {emptyText || emptyMessage || 'Belum ada data atau coba gunakan kata kunci pencarian lain.'}
                        </p>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((item, rowIdx) => {
                const mark = getRowMark?.(item);
                const markClasses = getMarkClasses(mark);
                const customRowClass = typeof rowClassName === 'function' ? rowClassName(item, rowIdx) : rowClassName;

                return (
                  <TableRow
                    key={rowIdx}
                    className={cn(
                      "group border-b border-slate-200 transition-colors",
                      striped && (rowIdx % 2 === 1 ? "bg-slate-50/50" : "bg-white"),
                      markClasses.row,
                      onRowClick && "cursor-pointer hover:bg-slate-50/80",
                      customRowClass
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
                            dense ? 'px-3 py-2 text-[11px] sm:text-xs' : 'px-2.5 py-2.5 text-[11px] sm:px-4 sm:py-3.5 sm:text-sm',
                            'text-slate-700 transition-colors print:px-2 print:py-2 print:text-[10px]',
                            (bordered || hasMultiRowHeader) && 'border-r border-slate-200',
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
                            typeof cellClassName === 'function' ? cellClassName(item, col, rowIdx) : cellClassName,
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
