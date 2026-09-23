import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FormDialog } from '@/components/ui/form-dialog';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import RequiredMark from '@/components/ui/required-mark';
import { ARMADA_EQUIPMENT_FIELDS } from '@/@types/armada.types';
import type { Armada, ArmadaEquipmentField, ArmadaPayload } from '@/@types/armada.types';

export interface ArmadaModalFormData {
  registrationNumber: string;
  type: string;
  machineNumber: string;
  chassisNumber: string;
  stnkAge: string;
  kirAge: string;
  stnkNumber: string;
  kirBook: string;
  radio_tape: string;
  jack: string;
  spare_tire: string;
  toolkit: string;
  jack_handle: string;
  pressure_pipe_1: string;
  first_aid_kit: string;
  cigarette_lighter: string;
  pressure_pipe_2: string;
  seat_saddle: string;
  handlebar_hose: string;
  fire_extinguisher: string;
  large_tie_down_strap: string;
  rearview_mirror: string;
  ati_foam: string;
  small_tie_down_strap: string;
  toolbox_lock: string;
  service_book: string;
}

interface ArmadaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ArmadaPayload) => void;
  initialData?: Armada | null;
  defaultType?: string;
  isSubmitting?: boolean;
}

const toInputDate = (value?: string | null) => (value ? value.substring(0, 10) : '');

const emptyValues: ArmadaModalFormData = {
  registrationNumber: '',
  type: '',
  machineNumber: '',
  chassisNumber: '',
  stnkAge: '',
  kirAge: '',
  stnkNumber: '',
  kirBook: '',
  radio_tape: '',
  jack: '',
  spare_tire: '',
  toolkit: '',
  jack_handle: '',
  pressure_pipe_1: '',
  first_aid_kit: '',
  cigarette_lighter: '',
  pressure_pipe_2: '',
  seat_saddle: '',
  handlebar_hose: '',
  fire_extinguisher: '',
  large_tie_down_strap: '',
  rearview_mirror: '',
  ati_foam: '',
  small_tie_down_strap: '',
  toolbox_lock: '',
  service_book: '',
};

const equipmentLabels: Record<ArmadaEquipmentField, string> = {
  radio_tape: 'Radio Tape',
  jack: 'Dongkrak',
  spare_tire: 'Ban Serep',
  toolkit: 'Toolkit',
  jack_handle: 'Handle Dongkrak',
  pressure_pipe_1: 'Pipa Tekan 1',
  first_aid_kit: 'Kotak P3K',
  cigarette_lighter: 'Pemantik Rokok',
  pressure_pipe_2: 'Pipa Tekan 2',
  seat_saddle: 'Pelana Jok',
  handlebar_hose: 'Selang Stang',
  fire_extinguisher: 'APAR',
  large_tie_down_strap: 'Tali Ikat Besar',
  rearview_mirror: 'Spion',
  ati_foam: 'Busa ATI',
  small_tie_down_strap: 'Tali Ikat Kecil',
  toolbox_lock: 'Gembok Toolbox',
  service_book: 'Buku Service',
};

const toEquipmentInput = (value?: number | null) => (value == null ? '' : String(value));
const toNullableNumber = (value: string) => {
  if (!value || !value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export function ArmadaFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultType,
  isSubmitting = false,
}: ArmadaFormModalProps) {
  const form = useForm<ArmadaModalFormData>({
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (isOpen && initialData) {
      form.reset({
        registrationNumber: initialData.registrationNumber || '',
        type: initialData.type || '',
        machineNumber: initialData.machineNumber || '',
        chassisNumber: initialData.chassisNumber || '',
        stnkAge: toInputDate(initialData.stnkAge),
        kirAge: toInputDate(initialData.kirAge),
        stnkNumber: initialData.stnkNumber ?? '',
        kirBook: initialData.kirBook ?? '',
        radio_tape: toEquipmentInput(initialData.equipment?.radio_tape),
        jack: toEquipmentInput(initialData.equipment?.jack),
        spare_tire: toEquipmentInput(initialData.equipment?.spare_tire),
        toolkit: toEquipmentInput(initialData.equipment?.toolkit),
        jack_handle: toEquipmentInput(initialData.equipment?.jack_handle),
        pressure_pipe_1: toEquipmentInput(initialData.equipment?.pressure_pipe_1),
        first_aid_kit: toEquipmentInput(initialData.equipment?.first_aid_kit),
        cigarette_lighter: toEquipmentInput(initialData.equipment?.cigarette_lighter),
        pressure_pipe_2: toEquipmentInput(initialData.equipment?.pressure_pipe_2),
        seat_saddle: toEquipmentInput(initialData.equipment?.seat_saddle),
        handlebar_hose: toEquipmentInput(initialData.equipment?.handlebar_hose),
        fire_extinguisher: toEquipmentInput(initialData.equipment?.fire_extinguisher),
        large_tie_down_strap: toEquipmentInput(initialData.equipment?.large_tie_down_strap),
        rearview_mirror: toEquipmentInput(initialData.equipment?.rearview_mirror),
        ati_foam: toEquipmentInput(initialData.equipment?.ati_foam),
        small_tie_down_strap: toEquipmentInput(initialData.equipment?.small_tie_down_strap),
        toolbox_lock: toEquipmentInput(initialData.equipment?.toolbox_lock),
        service_book: toEquipmentInput(initialData.equipment?.service_book),
      });
    } else if (isOpen) {
      form.reset({
        ...emptyValues,
        type: defaultType || '',
      });
    } else {
      form.reset(emptyValues);
    }
  }, [isOpen, initialData, defaultType, form]);

  const onSubmit = (data: ArmadaModalFormData) => {
    const equipmentValues = ARMADA_EQUIPMENT_FIELDS.reduce<Partial<Record<ArmadaEquipmentField, number | undefined>>>(
      (accumulator, field) => {
        accumulator[field] = toNullableNumber(data[field]);
        return accumulator;
      },
      {},
    );

    onSave({
      registration_number: data.registrationNumber,
      type: data.type,
      machine_number: data.machineNumber,
      chassis_number: data.chassisNumber,
      stnk_age: data.stnkAge || null,
      kir_age: data.kirAge || null,
      stnk_number: data.stnkNumber || null,
      kir_book: data.kirBook || null,
      vehicle_fleet_id: initialData?.id,
      ...equipmentValues,
    });
  };

  return (
    <Form {...form}>
      <FormDialog
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        title={initialData ? 'Edit Data Armada' : 'Tambah Data Armada'}
        description={initialData ? 'Perbarui detail armada' : 'Masukkan detail armada baru'}
        onSubmit={form.handleSubmit(onSubmit)}
        submitLabel="Simpan"
        isSubmitting={isSubmitting}
        maxWidthClassName="max-w-3xl"
      >
        <div className="space-y-6 max-h-[65vh] overflow-y-auto px-1 py-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="registrationNumber"
              rules={{ required: 'Nomor polisi wajib diisi', maxLength: { value: 249, message: 'Maks 249 karakter' } }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Nomor Polisi<RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: B 1234 ABC"
                      className={`bg-white ${form.formState.errors.registrationNumber ? 'border-red-500' : ''}`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              rules={{ required: 'Tipe wajib dipilih' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Tipe Armada<RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <select
                      className={`flex h-9 w-full rounded-md border bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                        form.formState.errors.type ? 'border-red-500' : 'border-slate-200'
                      }`}
                      {...field}
                    >
                      <option value="" disabled>Pilih tipe armada</option>
                      <option value="towing">Towing</option>
                      <option value="cdd">CDD</option>
                      <option value="fuso">Fuso</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="machineNumber"
              rules={{ required: 'Nomor mesin wajib diisi', maxLength: { value: 249, message: 'Maks 249 karakter' } }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Nomor Mesin<RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Tambah nomor mesin"
                      className={`bg-white ${form.formState.errors.machineNumber ? 'border-red-500' : ''}`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="chassisNumber"
              rules={{ required: 'Nomor rangka wajib diisi', maxLength: { value: 249, message: 'Maks 249 karakter' } }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Nomor Rangka<RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Tambah nomor rangka"
                      className={`bg-white ${form.formState.errors.chassisNumber ? 'border-red-500' : ''}`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stnkAge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Masa STNK</FormLabel>
                  <FormControl>
                    <InputDate id="modal-stnkAge" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="kirAge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Masa KIR</FormLabel>
                  <FormControl>
                    <InputDate id="modal-kirAge" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stnkNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Nomor STNK</FormLabel>
                  <FormControl>
                    <Input placeholder="Tambah nomor STNK" className="bg-white" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="kirBook"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Buku KIR</FormLabel>
                  <FormControl>
                    <Input placeholder="Tambah buku KIR" className="bg-white" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Perlengkapan Armada</h4>
            <p className="text-xs text-gray-500 mb-3">Isi jumlah perlengkapan bila tersedia. Kosongkan jika belum ada data.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ARMADA_EQUIPMENT_FIELDS.map((field) => (
                <FormField
                  key={field}
                  control={form.control}
                  name={field}
                  rules={{
                    validate: (value) => !value || Number(value) >= 0 || 'Minimal 0',
                  }}
                  render={({ field: inputField }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-medium text-gray-600 truncate block" title={equipmentLabels[field]}>
                        {equipmentLabels[field]}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="bg-white h-8 text-xs"
                          {...inputField}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </FormDialog>
    </Form>
  );
}
