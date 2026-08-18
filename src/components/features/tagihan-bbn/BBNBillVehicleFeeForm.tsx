import * as React from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import type { BBNBillVehicleData, BBNBillVehicleFeePayload } from '@/@types/bbn-bill.types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';

interface Props {
  vehicle: BBNBillVehicleData;
  onSubmit: (payload: BBNBillVehicleFeePayload) => Promise<void> | void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

type FormValues = {
  bbnRegistrationFee: number;
  garwilFee: number;
  nikValidationFee: number;
  accelerationFee: number;
  stampFee: number;
  pnbpBpkb: number;
  skpdFee: number;
};

function FeeField({ label, name, control }: { label: string; name: keyof FormValues; control: any }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-900">{label}</Label>
      <Controller
        name={name as any}
        control={control}
        render={({ field }) => (
          <MoneyInput
            value={field.value}
            onChangeValue={field.onChange}
            placeholder="Rp"
            className="h-11 rounded-md border-slate-200 bg-white"
          />
        )}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-6 border-b border-slate-100 pb-4 text-[15px] font-medium text-slate-400 uppercase tracking-wide">{title}</div>
      {children}
    </Card>
  );
}

export function BBNBillVehicleFeeForm({ vehicle, onSubmit, onCancel, isSubmitting = false }: Props) {
  const registration = vehicle.vehicleRegistration;
  const form = useForm<FormValues>({
    defaultValues: {
      bbnRegistrationFee: registration?.bbnRegistrationFee || 0,
      garwilFee: registration?.garwilFee || 0,
      nikValidationFee: registration?.nikValidationFee || 0,
      accelerationFee: registration?.accelerationFee || 0,
      stampFee: registration?.stampFee || 0,
      pnbpBpkb: registration?.pnbpBpkb || 0,
      skpdFee: registration?.skpdFee || 0,
    },
  });

  React.useEffect(() => {
    form.reset({
      bbnRegistrationFee: registration?.bbnRegistrationFee || 0,
      garwilFee: registration?.garwilFee || 0,
      nikValidationFee: registration?.nikValidationFee || 0,
      accelerationFee: registration?.accelerationFee || 0,
      stampFee: registration?.stampFee || 0,
      pnbpBpkb: registration?.pnbpBpkb || 0,
      skpdFee: registration?.skpdFee || 0,
    });
  }, [form, registration]);

  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
        <Button type="button" onClick={onCancel} variant="ghost" size="icon" className="h-10 w-10 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-slate-950">Ubah Data Detail STNK/BPKB</h1>
      </div>

      <form
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit({
            bbnRegistrationFee: values.bbnRegistrationFee,
            garwilFee: values.garwilFee,
            nikValidationFee: values.nikValidationFee,
            accelerationFee: values.accelerationFee,
            stampFee: values.stampFee,
            pnbpBpkb: values.pnbpBpkb,
            skpdFee: values.skpdFee,
          });
        })}
        className="space-y-6"
      >
        <Section title="Biaya Proses Pendaftaran BBN">
          <div className="grid gap-5 md:grid-cols-2">
            <FeeField name="bbnRegistrationFee" label="Biaya Daftar BBN" control={form.control} />
            <FeeField name="garwilFee" label="Biaya Acc Garwil" control={form.control} />
            <FeeField name="nikValidationFee" label="Biaya Acc NIK" control={form.control} />
            <FeeField name="accelerationFee" label="Biaya Percepatan" control={form.control} />
            <div className="col-span-1">
              <FeeField name="stampFee" label="Biaya Materai (2 materai/berkas)" control={form.control} />
            </div>
          </div>
        </Section>

        <Section title="Piutang Proses">
          <div className="grid gap-5 md:grid-cols-2">
            <FeeField name="pnbpBpkb" label="Biaya PNBP BPKB" control={form.control} />
            <FeeField name="skpdFee" label="Biaya Notice SKPD" control={form.control} />
          </div>
        </Section>

        <div className="flex items-center justify-center gap-6 pt-4">
          <Button type="button" variant="ghost" onClick={onCancel} className="text-sm font-medium text-slate-600 hover:text-slate-950">
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting} className="h-10 rounded-md bg-[#1f4163] px-6 text-sm font-medium text-white hover:bg-[#183552]">
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </form>
    </div>
  );
}
