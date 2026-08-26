import * as React from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Search } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { SearchableSelect } from '@/components/features/vehicle-data/SearchableSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDealers } from '@/hooks/useDealer';
import { useRegions } from '@/hooks/useRegion';
import { useVendorLookup } from '@/hooks/useVehicleData';
import type { VehicleDataPayload, VehicleType } from '@/types/vehicle-data.types';
import type { VehicleRegistrationDetail, VehicleRegistrationPayload } from '@/types/vehicle-document.types';

interface Props {
  initialData: VehicleRegistrationDetail;
  onSubmit: (payload: { registrationPayload: VehicleRegistrationPayload; vehicleDataPayload: Partial<VehicleDataPayload> }) => Promise<void> | void;
  isSubmitting?: boolean;
}

interface FormValues {
  processDate?: Date;
  bpkbNumber: string;
  bpkbRegistrationDate?: Date;
  bpkbReceivedDate?: Date;
  bpkbPhysicalStatus: 'true' | 'false';
  stnkRegistrationDate?: Date;
  stnkReceivedDate?: Date;
  stnkPhysicalStatus: 'true' | 'false';
  skpdPaymentDate?: Date;
  skpdReceivedDate?: Date;
  skpdPhysicalStatus: 'true' | 'false';
  tnkbReceivedDate?: Date;
  tnkbNumber: string;
  tnkbPhysicalStatus: 'true' | 'false';
  stckFee: number;
  bbnRegistrationFee: number;
  noticeFee: number;
  pmiFee: number;
  physicalCheckFee: number;
  nikValidationFee: number;
  garwilFee: number;
  builtUpFee: number;
  accelerationFee: number;
  plateRecommendationFee: number;
  serviceFee: number;
  skpdFee: number;
  stampFee: number;
  pnbpBpkb: number;
  customerDeliveryDate?: Date;
}

const toDateValue = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const toPayloadDate = (value?: Date) => {
  if (!value) return '';
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 border-b border-slate-100 pb-4 text-sm font-semibold text-slate-500">{title}</div>
      {children}
    </div>
  );
}

function StaticField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-slate-700">{label}</Label>
      <Input value={value || ''} readOnly className="bg-slate-50" />
    </div>
  );
}

function MoneyField({ name, label, control }: { name: keyof FormValues; label: string; control: any }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-slate-700">{label}</Label>
      <Controller
        name={name as any}
        control={control}
        render={({ field }) => (
          <MoneyInput value={Number(field.value) || 0} onChangeValue={field.onChange} onBlur={field.onBlur} name={field.name} placeholder="Rp" />
        )}
      />
    </div>
  );
}

function StatusField({ name, label, control }: { name: keyof FormValues; label: string; control: any }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-slate-700">{label}</Label>
      <Controller
        name={name as any}
        control={control}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select an item" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Ada</SelectItem>
              <SelectItem value="false">Belum Ada</SelectItem>
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );
}

export function VehicleRegistrationForm({ initialData, onSubmit, isSubmitting = false }: Props) {
  const router = useRouter();
  const [dealerSearch, setDealerSearch] = React.useState('');
  const [regionSearch, setRegionSearch] = React.useState('');
  const [vendorSearch, setVendorSearch] = React.useState('');
  const [dealerValue, setDealerValue] = React.useState(initialData.dealerId != null ? String(initialData.dealerId) : '');
  const [regionValue, setRegionValue] = React.useState(initialData.regionId != null ? String(initialData.regionId) : '');
  const [vendorValue, setVendorValue] = React.useState(initialData.vendorId != null ? String(initialData.vendorId) : '');
  const [vehicleTypeValue, setVehicleTypeValue] = React.useState<VehicleType | ''>(initialData.vehicleType || '');
  const handleVehicleTypeChange = (value: string) => {
    setVehicleTypeValue(value as VehicleType);
  };
  const dealersQuery = useDealers(null, { page: 1, perPage: 100, search: dealerSearch, sort_order: 'asc' }, { enabled: true });
  const regionsQuery = useRegions({ page: 1, perPage: 25, search: regionSearch, sort_order: 'asc' });
  const vendorLookup = useVendorLookup(vendorSearch);
  const { control, register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      processDate: toDateValue(initialData.processDate),
      bpkbNumber: initialData.bpkbNumber || '',
      bpkbRegistrationDate: toDateValue(initialData.bpkbRegistrationDate),
      bpkbReceivedDate: toDateValue(initialData.bpkbReceivedDate),
      bpkbPhysicalStatus: initialData.bpkbPhysicalStatus === false ? 'false' : 'true',
      stnkRegistrationDate: toDateValue(initialData.stnkRegistrationDate),
      stnkReceivedDate: toDateValue(initialData.stnkReceivedDate),
      stnkPhysicalStatus: initialData.stnkPhysicalStatus === false ? 'false' : 'true',
      skpdPaymentDate: toDateValue(initialData.skpdPaymentDate),
      skpdReceivedDate: toDateValue(initialData.skpdReceivedDate),
      skpdPhysicalStatus: initialData.skpdPhysicalStatus === false ? 'false' : 'true',
      tnkbReceivedDate: toDateValue(initialData.tnkbReceivedDate),
      tnkbNumber: initialData.tnkbNumber || '',
      tnkbPhysicalStatus: initialData.tnkbPhysicalStatus === false ? 'false' : 'true',
      stckFee: initialData.stckFee || 0,
      bbnRegistrationFee: initialData.bbnRegistrationFee || 0,
      noticeFee: initialData.noticeFee || 0,
      pmiFee: initialData.pmiFee || 0,
      physicalCheckFee: initialData.physicalCheckFee || 0,
      nikValidationFee: initialData.nikValidationFee || 0,
      garwilFee: initialData.garwilFee || 0,
      builtUpFee: initialData.builtUpFee || 0,
      accelerationFee: initialData.accelerationFee || 0,
      plateRecommendationFee: initialData.plateRecommendationFee || 0,
      serviceFee: initialData.serviceFee || 0,
      skpdFee: initialData.skpdFee || 0,
      stampFee: initialData.stampFee || 0,
      pnbpBpkb: initialData.pnbpBpkb || 0,
      customerDeliveryDate: toDateValue(initialData.customerDeliveryDate),
    },
  });

  React.useEffect(() => {
    setDealerValue(initialData.dealerId != null ? String(initialData.dealerId) : '');
    setRegionValue(initialData.regionId != null ? String(initialData.regionId) : '');
    setVendorValue(initialData.vendorId != null ? String(initialData.vendorId) : '');
    setVehicleTypeValue(initialData.vehicleType || '');
  }, [initialData]);

  const dealerOptions = React.useMemo(
    () =>
      (dealersQuery.data?.data ?? []).map((dealer) => ({
        value: String(dealer.id),
        label: dealer.namaDealer || dealer.code || `Dealer ID ${dealer.id}`,
        subtitle: dealer.code || undefined,
      })),
    [dealersQuery.data?.data],
  );

  const regionOptions = React.useMemo(
    () =>
      (regionsQuery.data?.data ?? []).map((region) => ({
        value: String(region.id),
        label: region.name || region.code || `Wilayah ID ${region.id}`,
        subtitle: region.code || undefined,
      })),
    [regionsQuery.data?.data],
  );

  const vendorOptions = React.useMemo(
    () =>
      (vendorLookup.data ?? []).map((item) => ({
        value: String(item.id),
        label: item.label,
        subtitle: item.vendor.code || item.vendor.phone || undefined,
      })),
    [vendorLookup.data],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="h-10 w-10 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold text-slate-900">Ubah Data Detail STNK/BPKB</h1>
      </div>

      <Card className="rounded-[22px] border border-slate-200 bg-[#fcfcfd] p-4 shadow-sm sm:p-6">
        <form
          onSubmit={handleSubmit(async (values) => {
            await onSubmit({
              registrationPayload: {
                vendorId: vendorValue ? Number(vendorValue) : null,
                dealerId: dealerValue ? Number(dealerValue) : null,
                regionId: regionValue ? Number(regionValue) : null,
                vehicleType: vehicleTypeValue || undefined,
                processDate: toPayloadDate(values.processDate),
                bpkbNumber: values.bpkbNumber.trim(),
                bpkbRegistrationDate: toPayloadDate(values.bpkbRegistrationDate),
                bpkbReceivedDate: toPayloadDate(values.bpkbReceivedDate),
                bpkbPhysicalStatus: values.bpkbPhysicalStatus === 'true',
                stnkRegistrationDate: toPayloadDate(values.stnkRegistrationDate),
                stnkReceivedDate: toPayloadDate(values.stnkReceivedDate),
                stnkPhysicalStatus: values.stnkPhysicalStatus === 'true',
                skpdPaymentDate: toPayloadDate(values.skpdPaymentDate),
                skpdReceivedDate: toPayloadDate(values.skpdReceivedDate),
                skpdPhysicalStatus: values.skpdPhysicalStatus === 'true',
                tnkbReceivedDate: toPayloadDate(values.tnkbReceivedDate),
                tnkbNumber: values.tnkbNumber.trim(),
                tnkbPhysicalStatus: values.tnkbPhysicalStatus === 'true',
                stckFee: Number(values.stckFee || 0),
                bbnRegistrationFee: Number(values.bbnRegistrationFee || 0),
                noticeFee: Number(values.noticeFee || 0),
                pmiFee: Number(values.pmiFee || 0),
                physicalCheckFee: Number(values.physicalCheckFee || 0),
                nikValidationFee: Number(values.nikValidationFee || 0),
                garwilFee: Number(values.garwilFee || 0),
                builtUpFee: Number(values.builtUpFee || 0),
                accelerationFee: Number(values.accelerationFee || 0),
                plateRecommendationFee: Number(values.plateRecommendationFee || 0),
                serviceFee: Number(values.serviceFee || 0),
                skpdFee: Number(values.skpdFee || 0),
                stampFee: Number(values.stampFee || 0),
                pnbpBpkb: Number(values.pnbpBpkb || 0),
                customerDeliveryDate: toPayloadDate(values.customerDeliveryDate),
              },
              vehicleDataPayload: {
                dealerId: dealerValue ? Number(dealerValue) : undefined,
                regionId: regionValue ? Number(regionValue) : undefined,
                vehicleType: vehicleTypeValue || undefined,
              },
            });
          })}
          className="space-y-5"
        >
          <Section title="Informasi Dealer & Wilayah">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">Dealer</Label>
                <SearchableSelect
                  value={dealerValue}
                  onChange={setDealerValue}
                  options={dealerOptions}
                  loading={dealersQuery.isLoading}
                  onSearchChange={setDealerSearch}
                  placeholder="Pilih dealer"
                  searchPlaceholder="Cari dealer..."
                  emptyText="Dealer tidak ditemukan."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">Wilayah</Label>
                <SearchableSelect
                  value={regionValue}
                  onChange={setRegionValue}
                  options={regionOptions}
                  loading={regionsQuery.isLoading}
                  onSearchChange={setRegionSearch}
                  placeholder="Pilih wilayah"
                  searchPlaceholder="Cari wilayah..."
                  emptyText="Wilayah tidak ditemukan."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">Vendor</Label>
                <SearchableSelect
                  value={vendorValue}
                  onChange={setVendorValue}
                  options={vendorOptions}
                  loading={vendorLookup.isLoading}
                  onSearchChange={setVendorSearch}
                  placeholder="Pilih vendor"
                  searchPlaceholder="Cari vendor..."
                  emptyText="Vendor tidak ditemukan."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">Jenis</Label>
                <Select value={vehicleTypeValue || undefined} onValueChange={handleVehicleTypeChange}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select an item" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="r2">R2</SelectItem>
                    <SelectItem value="r3">R3</SelectItem>
                    <SelectItem value="r4">R4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>

          <Section title="Data Kepemilikan">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StaticField label="Nama STNK" value={initialData.stnkName} />
              <StaticField label="Nomor Mesin" value={initialData.machineNumber} />
              <div className="space-y-2"><Label className="text-xs font-semibold text-slate-700">Tanggal Faktur</Label><Input value={initialData.invoiceDate || ''} readOnly className="bg-slate-50" /></div>
              <div className="space-y-2"><Label className="text-xs font-semibold text-slate-700">Tanggal Terima Faktur</Label><Input value={initialData.invoiceReceiveDate || ''} readOnly className="bg-slate-50" /></div>
              <div className="space-y-2 md:col-span-2 xl:col-span-1">
                <Label className="text-xs font-semibold text-slate-700">Tanggal Proses</Label>
                <Controller name="processDate" control={control} render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} placeholder="Pick a date" className="bg-white" />} />
              </div>
              <div className="space-y-2 md:col-span-2 xl:col-span-1">
                <Label className="text-xs font-semibold text-slate-700">Tanggal Penyerahan Customer</Label>
                <Controller name="customerDeliveryDate" control={control} render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} placeholder="Pick a date" className="bg-white" />} />
              </div>
            </div>
          </Section>

          <Section title="Data STNK & BPKB">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2 xl:col-span-3">
                <Label className="text-xs font-semibold text-slate-700">Nomor BPKB</Label>
                <Input {...register('bpkbNumber')} placeholder="Masukkan nomor" />
              </div>
              <div className="space-y-2"><Label className="text-xs font-semibold text-slate-700">Tanggal Daftar BPKB</Label><Controller name="bpkbRegistrationDate" control={control} render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} placeholder="Pick a date" className="bg-white" />} /></div>
              <div className="space-y-2"><Label className="text-xs font-semibold text-slate-700">Tanggal Terima BPKB</Label><Controller name="bpkbReceivedDate" control={control} render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} placeholder="Pick a date" className="bg-white" />} /></div>
              <StatusField name="bpkbPhysicalStatus" label="Fisik BPKB" control={control} />
              <div className="space-y-2"><Label className="text-xs font-semibold text-slate-700">Tanggal Daftar STNK</Label><Controller name="stnkRegistrationDate" control={control} render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} placeholder="Pick a date" className="bg-white" />} /></div>
              <div className="space-y-2"><Label className="text-xs font-semibold text-slate-700">Tanggal Terima STNK</Label><Controller name="stnkReceivedDate" control={control} render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} placeholder="Pick a date" className="bg-white" />} /></div>
              <StatusField name="stnkPhysicalStatus" label="Fisik STNK" control={control} />
              <div className="space-y-2"><Label className="text-xs font-semibold text-slate-700">Tanggal Bayar SKPD</Label><Controller name="skpdPaymentDate" control={control} render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} placeholder="Pick a date" className="bg-white" />} /></div>
              <div className="space-y-2"><Label className="text-xs font-semibold text-slate-700">Tanggal Terima SKPD</Label><Controller name="skpdReceivedDate" control={control} render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} placeholder="Pick a date" className="bg-white" />} /></div>
              <StatusField name="skpdPhysicalStatus" label="Fisik SKPD" control={control} />
              <div className="space-y-2"><Label className="text-xs font-semibold text-slate-700">Tanggal Terima TNKB</Label><Controller name="tnkbReceivedDate" control={control} render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} placeholder="Pick a date" className="bg-white" />} /></div>
              <div className="space-y-2"><Label className="text-xs font-semibold text-slate-700">Nomor TNKB</Label><Input {...register('tnkbNumber')} placeholder="Masukkan nomor" /></div>
              <StatusField name="tnkbPhysicalStatus" label="Fisik TNKB" control={control} />
            </div>
          </Section>

          <Section title="Data Harga Administrasi">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MoneyField name="stckFee" label="STCK" control={control} />
              <MoneyField name="bbnRegistrationFee" label="Daftar BBN" control={control} />
              <MoneyField name="noticeFee" label="Notice" control={control} />
              <MoneyField name="pmiFee" label="Biaya PMI" control={control} />
              <MoneyField name="physicalCheckFee" label="Acc Cek Fisik" control={control} />
              <MoneyField name="nikValidationFee" label="Acc NIK" control={control} />
              <MoneyField name="garwilFee" label="Acc Garwil" control={control} />
              <MoneyField name="builtUpFee" label="Acc Build Up" control={control} />
              <MoneyField name="accelerationFee" label="Acc Percepatan" control={control} />
              <MoneyField name="plateRecommendationFee" label="Recome NOPOL" control={control} />
              <MoneyField name="serviceFee" label="Jasa" control={control} />
              <MoneyField name="skpdFee" label="SKPD" control={control} />
              <MoneyField name="stampFee" label="Materai" control={control} />
              <MoneyField name="pnbpBpkb" label="PNBP BPKB" control={control} />
            </div>
          </Section>

          <div className="flex justify-center gap-3 pb-2 pt-3">
            <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>Batal</Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[108px] bg-[#17365d] hover:bg-[#122b49]">{isSubmitting ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
