'use client';

import { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWarehouseSubBlocks } from '@/hooks/useUnitItemDetail';
import type { WarehouseSubBlock } from '@/services/warehouseBlock.service';
import { cn } from '@/lib/utils';

export interface WarehouseSubBlockSelectProps {
  companyId?: string | number | null;
  selectedId?: string | number | null;
  selectedName?: string | null;
  onSelect?: (subBlock: WarehouseSubBlock | null) => void;
  value?: string | number | null;
  onChange?: (value: number | null) => void;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  allowClear?: boolean;
  clearLabel?: string;
  maxLength?: number;
  className?: string;
  perPage?: number;
}

export function WarehouseSubBlockSelect({
  companyId,
  selectedId: selectedIdProp,
  selectedName,
  onSelect,
  value: valueProp,
  onChange,
  disabled = false,
  placeholder = 'Pilih sub blok gudang',
  searchPlaceholder = 'Cari sub blok gudang...',
  allowClear = true,
  clearLabel = '-- Tanpa Sub Blok (Default) --',
  maxLength = 40,
  className,
  perPage = 100,
}: WarehouseSubBlockSelectProps) {
  const currentId = selectedIdProp !== undefined ? selectedIdProp : valueProp;

  const { data, isLoading, isError, refetch } = useWarehouseSubBlocks({
    company_id: companyId ? String(companyId) : undefined,
    is_active: true,
    per_page: perPage,
    page: 1,
  });

  const subBlocks = useMemo<WarehouseSubBlock[]>(() => {
    const raw = data?.data;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);

  const subBlockOptions = useMemo(() => {
    if (
      !currentId ||
      !selectedName ||
      subBlocks.some((item) => String(item.id) === String(currentId))
    ) {
      return subBlocks;
    }

    return [
      {
        id: Number(currentId),
        uuid: String(currentId),
        name: selectedName,
        warehouse_block_id: 0,
        description: '',
        is_active: true,
        is_default: false,
        created_at: '',
        updated_at: '',
      },
      ...subBlocks,
    ];
  }, [subBlocks, currentId, selectedName]);

  const selectedItem = useMemo(() => {
    if (!currentId || currentId === 'none') return null;
    return subBlockOptions.find((item) => String(item.id) === String(currentId)) ?? null;
  }, [subBlockOptions, currentId]);

  const activeLabel = selectedName || selectedItem?.name;

  return (
    <Select
      value={currentId && currentId !== 'none' ? String(currentId) : undefined}
      onValueChange={(val) => {
        if (val === 'none') {
          onChange?.(null);
          onSelect?.(null);
          return;
        }
        const item = subBlockOptions.find((sb) => String(sb.id) === val);
        if (item) {
          onChange?.(Number(item.id));
          onSelect?.(item);
        }
      }}
      disabled={disabled || isLoading}
    >
      <SelectTrigger
        className={cn(
          'h-10 w-full min-w-0 overflow-hidden bg-transparent font-normal border-slate-200 rounded-md',
          className,
        )}
      >
        <SelectValue
          maxLength={maxLength}
          placeholder={isLoading ? 'Memuat sub blok...' : activeLabel || placeholder}
        />
      </SelectTrigger>
      <SelectContent showSearch searchPlaceholder={searchPlaceholder}>
        {allowClear && (
          <SelectItem value="none" maxLength={maxLength}>
            <span className="italic text-slate-500">{clearLabel}</span>
          </SelectItem>
        )}
        {subBlockOptions.map((sb) => (
          <SelectItem key={String(sb.id)} value={String(sb.id)} maxLength={maxLength}>
            {sb.name}
          </SelectItem>
        ))}
        {isError && (
          <div className="px-3 py-2 text-xs text-destructive">
            Gagal memuat sub blok.{' '}
            <button type="button" className="underline" onClick={() => refetch()}>
              Coba lagi
            </button>
          </div>
        )}
      </SelectContent>
    </Select>
  );
}

export const WarehouseSubBlockCombobox = WarehouseSubBlockSelect;
