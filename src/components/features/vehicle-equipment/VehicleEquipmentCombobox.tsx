'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { VehicleEquipment } from '@/@types/vehicle-equipment.types';
import { useCreateVehicleEquipment, useVehicleEquipments } from '@/hooks/useVehicleEquipment';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SelectAdd } from '@/components/ui/select-add';
import { VehicleEquipmentFormModal } from './VehicleEquipmentFormModal';
import type { VehicleEquipmentFormValues } from '@/scheme/vehicle-equipment.schema';
import { cn } from '@/lib/utils';

interface VehicleEquipmentComboboxProps {
  selectedId?: string | number | null;
  selectedName?: string | null;
  onSelect: (equipment: VehicleEquipment) => void;
  disabled?: boolean;
  allowCreate?: boolean;
  className?: string;
}

export function VehicleEquipmentCombobox({
  selectedId,
  selectedName,
  onSelect,
  disabled = false,
  allowCreate = false,
  className,
}: VehicleEquipmentComboboxProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useVehicleEquipments({ page: 1, perPage: 100 });
  const createMutation = useCreateVehicleEquipment();

  const equipments = useMemo(() => data?.data ?? [], [data?.data]);

  const equipmentOptions = useMemo(() => {
    if (!selectedId || equipments.some((item) => String(item.id) === String(selectedId))) {
      return equipments;
    }

    return [
      {
        id: Number(selectedId),
        uuid: String(selectedId),
        code: '',
        name: selectedName || `Perlengkapan #${selectedId}`,
        description: null,
        buy_price: 0,
        sell_price: 0,
      } as VehicleEquipment,
      ...equipments,
    ];
  }, [selectedId, selectedName, equipments]);

  const handleCreate = async (values: VehicleEquipmentFormValues) => {
    try {
      const created = await createMutation.mutateAsync(values);
      onSelect(created || { ...values, id: 0, uuid: '' });
      setCreateOpen(false);
      toast.success('Perlengkapan kendaraan berhasil ditambahkan');
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menyimpan perlengkapan kendaraan');
    }
  };

  return (
    <div className={cn('w-full min-w-0', className)}>
      <SelectAdd
        allowAdd={allowCreate}
        addDisabled={disabled}
        addLabel="Tambah perlengkapan"
        onAdd={() => setCreateOpen(true)}
      >
        <Select
          value={selectedId ? String(selectedId) : undefined}
          onValueChange={(value) => {
            const item = equipmentOptions.find((eq) => String(eq.id) === value);
            if (item) onSelect(item);
          }}
          disabled={disabled || isLoading}
        >
          <SelectTrigger className="h-10 w-full min-w-0 overflow-hidden bg-transparent font-normal">
            <SelectValue maxLength={35} placeholder={isLoading ? 'Memuat perlengkapan...' : selectedName || 'Pilih perlengkapan'} />
          </SelectTrigger>
          <SelectContent showSearch searchPlaceholder="Cari perlengkapan...">
            {equipmentOptions.map((item) => (
              <SelectItem key={String(item.id)} value={String(item.id)} maxLength={45}>
                {item.name} {item.code ? `(${item.code})` : ''}
              </SelectItem>
            ))}
            {isError && (
              <div className="px-3 py-2 text-xs text-destructive">
                Gagal memuat perlengkapan.{' '}
                <button type="button" className="underline" onClick={() => refetch()}>
                  Coba lagi
                </button>
              </div>
            )}
          </SelectContent>
        </Select>
      </SelectAdd>

      <VehicleEquipmentFormModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreate}
        isSaving={createMutation.isPending}
      />
    </div>
  );
}
