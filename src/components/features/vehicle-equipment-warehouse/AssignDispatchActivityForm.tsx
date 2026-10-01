'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Truck, Save } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CollapsibleBox } from '@/components/ui/collapsible-box';
import RequiredMark from '@/components/ui/required-mark';
import { VehicleEquipmentCombobox } from '@/components/features/vehicle-equipment/VehicleEquipmentCombobox';
import { handleApiFormError } from '@/lib/validation';
import { getVehicleFleets } from '@/services/vehicle-fleet.service';
import { getWarehouses } from '@/services/laporan-warehouse.service';
import type { VehicleEquipment } from '@/@types/vehicle-equipment.types';

const createSchema = (activityType: 'assign' | 'dispatch') =>
  z.object({
    warehouse_id: z.coerce.number().min(1, 'Warehouse wajib dipilih'),
    activity_type: z.enum(['assign', 'dispatch']).default(activityType),
    activity_date: z.string().min(1, 'Tanggal aktivitas wajib diisi'),
    vehicle_equipment_id: z.coerce.number().min(1, 'Perlengkapan wajib dipilih'),
    vehicle_fleet_id: z.coerce.number().min(1, 'Armada wajib dipilih'),
    qty: z.coerce.number().min(1, 'Qty minimal 1'),
    description: z.string().optional().nullable(),
    state_note: z.string().optional().nullable(),
  });

export type AssignDispatchFormData = {
  warehouse_id: number;
  activity_type: 'assign' | 'dispatch';
  activity_date: string;
  vehicle_equipment_id: number;
  vehicle_fleet_id: number;
  qty: number;
  description?: string | null;
  state_note?: string | null;
};

interface AssignDispatchActivityFormProps {
  activityType: 'assign' | 'dispatch';
  onSubmit: (data: AssignDispatchFormData) => Promise<void> | void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function AssignDispatchActivityForm({
  activityType,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: AssignDispatchActivityFormProps) {
  const isDispatch = activityType === 'dispatch';
  const title = isDispatch ? 'Dispatch Perlengkapan' : 'Assign Perlengkapan ke Armada';
  const description = isDispatch
    ? 'Tarik kembali perlengkapan dari armada kendaraan'
    : 'Assign perlengkapan kendaraan ke armada tertentu';

  const schema = useMemo(() => createSchema(activityType), [activityType]);

  const [selectedEquipmentName, setSelectedEquipmentName] = useState<string | null>(null);
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);

  const form = useForm<AssignDispatchFormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      warehouse_id: 0,
      activity_type: activityType,
      activity_date: new Date().toISOString().split('T')[0],
      vehicle_equipment_id: 0,
      vehicle_fleet_id: 0,
      qty: 1,
      description: '',
      state_note: '',
    },
  });

  const { data: warehousesData, isLoading: isLoadingWarehouses } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: getWarehouses,
  });

  const { data: fleetsData, isLoading: isLoadingFleets } = useQuery({
    queryKey: ['vehicle-fleets-list'],
    queryFn: () => getVehicleFleets({ page: 1, perPage: 200 }),
  });

  const warehouses = warehousesData ?? [];
  const fleets = fleetsData?.data ?? [];

  const equipmentId = form.watch('vehicle_equipment_id');

  const handleEquipmentSelect = (equipment: VehicleEquipment) => {
    form.setValue('vehicle_equipment_id', Number(equipment.id), { shouldDirty: true, shouldValidate: true });
    setSelectedEquipmentName(equipment.name);
  };

  const handleFormSubmit = async (values: AssignDispatchFormData) => {
    try {
      setIsSubmittingLocal(true);
      await onSubmit({ ...values, activity_type: activityType, type: 'vehicle-equipment' } as any);
    } catch (error) {
      handleApiFormError(error, form);
    } finally {
      setIsSubmittingLocal(false);
    }
  };

  const submitting = isSubmitting || isSubmittingLocal || form.formState.isSubmitting;

  return (
    <CollapsibleBox
      icon={Truck}
      title={title}
      description={description}
      defaultExpanded
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Row 1: Warehouse, Tanggal */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
            <FormField
              control={form.control}
              name="warehouse_id"
              render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel className="text-sm font-medium">Warehouse <RequiredMark /></FormLabel>
                  <FormControl>
                    <Select
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(val) => field.onChange(Number(val))}
                      disabled={isLoadingWarehouses}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingWarehouses ? 'Memuat warehouse...' : 'Pilih warehouse'} />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((wh) => (
                          <SelectItem key={wh.id} value={String(wh.id)}>{wh.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="activity_date"
              render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel className="text-sm font-medium">Tanggal Aktivitas <RequiredMark /></FormLabel>
                  <FormControl>
                    <InputDate {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Row 2: Perlengkapan, Armada, Qty */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 items-start">
            <FormField
              control={form.control}
              name="vehicle_equipment_id"
              render={() => (
                <FormItem className="min-w-0">
                  <FormLabel className="text-sm font-medium">Perlengkapan <RequiredMark /></FormLabel>
                  <FormControl>
                    <div>
                      <VehicleEquipmentCombobox
                        selectedId={equipmentId ? String(equipmentId) : null}
                        selectedName={selectedEquipmentName}
                        onSelect={handleEquipmentSelect}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vehicle_fleet_id"
              render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel className="text-sm font-medium">Armada <RequiredMark /></FormLabel>
                  <FormControl>
                    <Select
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(val) => field.onChange(Number(val))}
                      disabled={isLoadingFleets}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingFleets ? 'Memuat armada...' : 'Pilih armada'} />
                      </SelectTrigger>
                      <SelectContent showSearch searchPlaceholder="Cari armada...">
                        {fleets.map((fleet) => (
                          <SelectItem key={fleet.id} value={String(fleet.id)}>
                            {fleet.registrationNumber} {fleet.type ? `(${fleet.type.toUpperCase()})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="qty"
              render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel className="text-sm font-medium">Qty <RequiredMark /></FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Row 3: Deskripsi, Catatan State */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel className="text-sm font-medium">Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Tambahkan deskripsi aktivitas..."
                      className="resize-none min-h-[80px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state_note"
              render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel className="text-sm font-medium">Catatan</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} placeholder="Catatan tambahan..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {isDispatch && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              <strong>Perhatian Dispatch:</strong> Pastikan qty yang di-dispatch tidak melebihi stock yang ter-assign pada armada yang dipilih.
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-center items-center gap-6 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting} className="btn-primary!">
              <Save className="mr-2 h-4 w-4" />
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Form>
    </CollapsibleBox>
  );
}
