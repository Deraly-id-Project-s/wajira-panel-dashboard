import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { Label } from '@/components/ui/label';
import { ARMADA_EQUIPMENT_FIELDS } from '@/@types/armada.types';
import type { Armada, ArmadaEquipmentField, ArmadaPayload } from '@/@types/armada.types';

export interface ArmadaFormData {
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

interface ArmadaFormProps {
  initialData?: Armada;
  title: string;
  onSubmit: (data: ArmadaPayload) => void | Promise<void>;
  isSubmitting?: boolean;
}

const toInputDate = (value?: string | null) => (value ? value.substring(0, 10) : '');

const defaultValues: ArmadaFormData = {
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
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export function ArmadaForm({ initialData, title, onSubmit, isSubmitting = false }: ArmadaFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ArmadaFormData>({
    defaultValues: initialData
      ? {
        registrationNumber: initialData.registrationNumber,
        type: initialData.type,
        machineNumber: initialData.machineNumber,
        chassisNumber: initialData.chassisNumber,
        stnkAge: toInputDate(initialData.stnkAge),
        kirAge: toInputDate(initialData.kirAge),
        stnkNumber: initialData.stnkNumber ?? '',
        kirBook: initialData.kirBook ?? '',
        radio_tape: toEquipmentInput(initialData.equipment.radio_tape),
        jack: toEquipmentInput(initialData.equipment.jack),
        spare_tire: toEquipmentInput(initialData.equipment.spare_tire),
        toolkit: toEquipmentInput(initialData.equipment.toolkit),
        jack_handle: toEquipmentInput(initialData.equipment.jack_handle),
        pressure_pipe_1: toEquipmentInput(initialData.equipment.pressure_pipe_1),
        first_aid_kit: toEquipmentInput(initialData.equipment.first_aid_kit),
        cigarette_lighter: toEquipmentInput(initialData.equipment.cigarette_lighter),
        pressure_pipe_2: toEquipmentInput(initialData.equipment.pressure_pipe_2),
        seat_saddle: toEquipmentInput(initialData.equipment.seat_saddle),
        handlebar_hose: toEquipmentInput(initialData.equipment.handlebar_hose),
        fire_extinguisher: toEquipmentInput(initialData.equipment.fire_extinguisher),
        large_tie_down_strap: toEquipmentInput(initialData.equipment.large_tie_down_strap),
        rearview_mirror: toEquipmentInput(initialData.equipment.rearview_mirror),
        ati_foam: toEquipmentInput(initialData.equipment.ati_foam),
        small_tie_down_strap: toEquipmentInput(initialData.equipment.small_tie_down_strap),
        toolbox_lock: toEquipmentInput(initialData.equipment.toolbox_lock),
        service_book: toEquipmentInput(initialData.equipment.service_book),
      }
      : defaultValues,
  });

  const submitForm = (data: ArmadaFormData) => {
    const equipmentValues = ARMADA_EQUIPMENT_FIELDS.reduce<Partial<Record<ArmadaEquipmentField, number | undefined>>>((accumulator, field) => {
      accumulator[field] = toNullableNumber(data[field]);
      return accumulator;
    }, {});

    onSubmit({
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
    <form onSubmit={handleSubmit(submitForm)} className="space-y-6">
      <div className="rounded-md border border-gray-200 bg-white p-6">
        <h3 className="mb-6 border-b pb-4 text-lg font-semibold text-gray-900">{title}</h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="registrationNumber">Nomor Polisi</Label>
            <Input
              id="registrationNumber"
              placeholder="Tambah nomor polisi"
              {...register('registrationNumber', { required: 'Nomor polisi wajib diisi', maxLength: { value: 249, message: 'Maks 249 karakter' } })}
              className={errors.registrationNumber ? 'border-red-500' : ''}
            />
            {errors.registrationNumber && <p className="text-xs text-red-500">{errors.registrationNumber.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipe</Label>
            <select
              id="type"
              {...register('type', { required: 'Tipe wajib diisi' })}
              className={`flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${errors.type ? 'border-red-500' : 'border-slate-200'
                }`}
            >
              <option value="" disabled>Pilih tipe armada</option>
              <option value="towing">Towing</option>
              <option value="cdd">CDD</option>
              <option value="fuso">Fuso</option>
            </select>
            {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="machineNumber">Nomor Mesin</Label>
            <Input
              id="machineNumber"
              placeholder="Tambah nomor mesin"
              {...register('machineNumber', { required: 'Nomor mesin wajib diisi', maxLength: { value: 249, message: 'Maks 249 karakter' } })}
              className={errors.machineNumber ? 'border-red-500' : ''}
            />
            {errors.machineNumber && <p className="text-xs text-red-500">{errors.machineNumber.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="chassisNumber">Nomor Rangka</Label>
            <Input
              id="chassisNumber"
              placeholder="Tambah nomor rangka"
              {...register('chassisNumber', { required: 'Nomor rangka wajib diisi', maxLength: { value: 249, message: 'Maks 249 karakter' } })}
              className={errors.chassisNumber ? 'border-red-500' : ''}
            />
            {errors.chassisNumber && <p className="text-xs text-red-500">{errors.chassisNumber.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="stnkAge">Masa STNK</Label>
            <Controller
              control={control}
              name="stnkAge"
              render={({ field }) => <InputDate id="stnkAge" {...field} />}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kirAge">Masa KIR</Label>
            <Controller
              control={control}
              name="kirAge"
              render={({ field }) => <InputDate id="kirAge" {...field} />}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stnkNumber">Nomor STNK</Label>
            <Input id="stnkNumber" placeholder="Tambah nomor STNK" {...register('stnkNumber', { maxLength: { value: 249, message: 'Maks 249 karakter' } })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kirBook">Buku KIR</Label>
            <Input id="kirBook" placeholder="Tambah buku KIR" {...register('kirBook', { maxLength: { value: 249, message: 'Maks 249 karakter' } })} />
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Perlengkapan Armada</h4>
            <p className="mt-1 text-xs text-gray-500">Isi jumlah perlengkapan bila tersedia. Kosongkan jika belum ada data.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ARMADA_EQUIPMENT_FIELDS.map((field) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field}>{equipmentLabels[field]}</Label>
                <Input
                  id={field}
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register(field, {
                    validate: (value) => !value || Number(value) >= 0 || 'Nilai tidak boleh kurang dari 0',
                  })}
                />
                {errors[field] && <p className="text-xs text-red-500">{errors[field]?.message}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 pb-8 pt-2">
        <Button type="button" variant="outline" className="w-[120px]" onClick={() => router.back()} disabled={isSubmitting}>
          Batal
        </Button>
        <Button type="submit" className="w-[120px] btn-primary!" disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
}
