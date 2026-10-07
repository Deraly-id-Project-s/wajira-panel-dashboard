'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import RequiredMark from '@/components/ui/required-mark';
import { VehicleEquipmentCombobox } from '@/components/features/vehicle-equipment/VehicleEquipmentCombobox';
import { handleApiFormError } from '@/lib/validation';
import { getStoredCompanyId } from '@/lib/session/storage';
import { useCompany } from '@/contexts/CompanyContext';
import { getVehicleFleets } from '@/services/vehicle-fleet.service';
import type { VehicleEquipment } from '@/@types/vehicle-equipment.types';

const createSchema = (activityType: 'assign' | 'dispatch') =>
  z.object({
    warehouse_id: z.coerce.number().optional().nullable(),
    activity_type: z.enum(['assign', 'dispatch']).default(activityType),
    activity_date: z.string().min(1, 'Tanggal aktivitas wajib diisi'),
    vehicle_equipment_id: z.coerce.number().min(1, 'Perlengkapan wajib dipilih'),
    vehicle_fleet_id: z.coerce.number().min(1, 'Armada wajib dipilih'),
    qty: z.coerce.number().min(1, 'Qty minimal 1'),
    description: z.string().optional().nullable(),
  });

export type AssignDispatchFormData = {
  warehouse_id?: number;
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
  const schema = useMemo(() => createSchema(activityType), [activityType]);

  const { companyId: contextCompanyId } = useCompany();
  const [selectedEquipmentName, setSelectedEquipmentName] = useState<string | null>(null);
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);

  const { data: fleetsData, isLoading: isLoadingFleets } = useQuery({
    queryKey: ['vehicle-fleets-list'],
    queryFn: () => getVehicleFleets({ page: 1, perPage: 200 }),
  });

  const fleets = fleetsData?.data ?? [];

  const getActiveCompanyId = useCallback(() => {
    const stored = getStoredCompanyId();
    return Number(stored || contextCompanyId || 0);
  }, [contextCompanyId]);

  const form = useForm<AssignDispatchFormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      warehouse_id: getActiveCompanyId(),
      activity_type: activityType,
      activity_date: new Date().toISOString().split('T')[0],
      vehicle_equipment_id: 0,
      vehicle_fleet_id: 0,
      qty: 1,
      description: '',
    },
  });

  useEffect(() => {
    const currentCompanyId = getActiveCompanyId();
    if (currentCompanyId) {
      form.setValue('warehouse_id', currentCompanyId);
    }
  }, [form, getActiveCompanyId]);

  const equipmentId = form.watch('vehicle_equipment_id');

  const handleEquipmentSelect = (equipment: VehicleEquipment) => {
    form.setValue('vehicle_equipment_id', Number(equipment.id), { shouldDirty: true, shouldValidate: true });
    setSelectedEquipmentName(equipment.name);
  };

  const handleFormSubmit = async (values: AssignDispatchFormData) => {
    try {
      setIsSubmittingLocal(true);
      const activeCompanyId = getActiveCompanyId() || values.warehouse_id || 0;
      await onSubmit({
        ...values,
        warehouse_id: activeCompanyId,
        activity_type: activityType,
        type: 'vehicle-equipment',
      } as any);
    } catch (error) {
      handleApiFormError(error, form);
    } finally {
      setIsSubmittingLocal(false);
    }
  };

  const submitting = isSubmitting || isSubmittingLocal || form.formState.isSubmitting;

  return (
    <Card collapsible={false} className="rounded-md border-slate-200 shadow-none">
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
              {/* Row 1: Tanggal Aktivitas & Perlengkapan */}
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

              {/* Row 2: Armada & Qty */}
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

              {/* Row 3: Deskripsi (Full Width) */}
              <div className="md:col-span-2">
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
              </div>

              {isDispatch && (
                <div className="md:col-span-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                  <strong>Perhatian Dispatch:</strong> Pastikan qty yang di-dispatch tidak melebihi stock yang ter-assign pada armada yang dipilih.
                </div>
              )}
            </div>

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
      </CardContent>
    </Card>
  );
}
