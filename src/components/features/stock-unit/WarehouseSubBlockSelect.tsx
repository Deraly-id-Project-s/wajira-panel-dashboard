'use client';

import { useMemo } from 'react';
import { useWarehouseSubBlocks } from '@/hooks/useUnitItemDetail';
import type { WarehouseSubBlock } from '@/services/warehouseBlock.service';
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/searchable-select';

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
  maxLength,
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

  const options = useMemo<SearchableSelectOption[]>(() => {
    const items: SearchableSelectOption[] = [];
    if (allowClear) {
      items.push({
        value: 'none',
        label: clearLabel,
      });
    }
    subBlockOptions.forEach((sb) => {
      items.push({
        value: String(sb.id),
        label: sb.name,
        subtitle: sb.description || undefined,
      });
    });
    return items;
  }, [allowClear, clearLabel, subBlockOptions]);

  const handleChange = (val: string) => {
    if (!val || val === 'none') {
      onChange?.(null);
      onSelect?.(null);
      return;
    }
    const item = subBlockOptions.find((sb) => String(sb.id) === val);
    if (item) {
      onChange?.(Number(item.id));
      onSelect?.(item);
    }
  };

  const selectedValue =
    currentId && currentId !== 'none'
      ? String(currentId)
      : allowClear
        ? 'none'
        : '';

  return (
    <SearchableSelect
      value={selectedValue}
      onChange={handleChange}
      options={options}
      placeholder={isLoading ? 'Memuat sub blok...' : (selectedName || placeholder)}
      searchPlaceholder={searchPlaceholder}
      emptyText={isError ? 'Gagal memuat sub blok.' : 'Sub blok tidak ditemukan.'}
      disabled={disabled || isLoading}
      loading={isLoading}
      className={className}
    />
  );
}

export const WarehouseSubBlockCombobox = WarehouseSubBlockSelect;
