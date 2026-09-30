'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileText, Save } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { MoneyInput } from '@/components/ui/money-input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CollapsibleBox } from '@/components/ui/collapsible-box';
import { FileInput } from '@/components/ui/file-input';
import RequiredMark from '@/components/ui/required-mark';
import { SupplierCombobox } from '@/components/features/supplier/SupplierCombobox';
import { CustomerCombobox } from '@/components/features/customer/CustomerCombobox';
import { VehicleEquipmentCombobox } from '@/components/features/vehicle-equipment/VehicleEquipmentCombobox';
import { useCompany } from '@/contexts/CompanyContext';
import { handleApiFormError } from '@/lib/validation';
import { formatCurrency } from '@/lib/utils/currency';
import type { Supplier } from '@/@types/supplier.types';
import type { Customer } from '@/@types/customer.types';
import type { VehicleEquipment } from '@/@types/vehicle-equipment.types';

const createSchema = (type: 'purchase' | 'sales') =>
  z.object({
    company_id: z.string().or(z.number()).transform((value) => Number(value)),
    type: z.enum(['purchase', 'sales']).default(type),
    transaction_type: z.string().default('vehicle_equipment'),
    person_id: z
      .string()
      .or(z.number())
      .transform((value) => Number(value))
      .refine((value) => value > 0, type === 'sales' ? 'Customer wajib diisi' : 'Supplier wajib diisi'),
    vehicle_equipment_id: z
      .string()
      .or(z.number())
      .transform((value) => Number(value))
      .refine((value) => value > 0, 'Perlengkapan wajib diisi'),
    qty: z.coerce.number().min(1, 'Minimal kuantitas adalah 1'),
    price: z.coerce.number().min(0, 'Harga tidak valid'),
    discount: z.coerce.number().min(0, 'Diskon tidak valid').default(0),
    transaction_date: z.string().min(1, 'Tanggal transaksi wajib diisi'),
    nota_number: z.string().optional().nullable(),
    billing_type: z.enum(['cash', 'transfer', 'credit']).default('cash'),
    billing_due_date: z.string().optional().nullable(),
    invoice_file: z.any().optional().nullable(),
    note: z.string().optional().nullable(),
  });

export type VehicleEquipmentTransactionFormData = z.infer<ReturnType<typeof createSchema>>;

interface VehicleEquipmentTransactionFormProps {
  type: 'purchase' | 'sales';
  defaultValues?: Partial<VehicleEquipmentTransactionFormData> & {
    supplier?: { name?: string };
    customer?: { name?: string };
    person?: { name?: string };
    vehicle_equipment?: { name?: string; code?: string };
  };
  onSubmit: (data: VehicleEquipmentTransactionFormData, form: UseFormReturn<VehicleEquipmentTransactionFormData>) => Promise<void> | void;
  onCancel: () => void;
  companyId?: string | null;
  readOnly?: boolean;
}

export default function VehicleEquipmentTransactionForm({
  type,
  defaultValues,
  onSubmit,
  onCancel,
  companyId: propCompanyId,
  readOnly = false,
}: VehicleEquipmentTransactionFormProps) {
  const { companyId: contextCompanyId } = useCompany();
  const companyId = propCompanyId || contextCompanyId;
  const isSales = type === 'sales';
  const personLabel = isSales ? 'Customer' : 'Supplier';
  const schema = useMemo(() => createSchema(type), [type]);

  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
  const [selectedPersonName, setSelectedPersonName] = useState<string | null>(
    defaultValues?.person?.name ||
    (isSales
      ? defaultValues?.customer?.name
      : defaultValues?.supplier?.name
    ) || null
  );
  const [selectedEquipmentName, setSelectedEquipmentName] = useState<string | null>(
    defaultValues?.vehicle_equipment?.name || null,
  );

  const form = useForm<VehicleEquipmentTransactionFormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      company_id: Number(companyId || defaultValues?.company_id || 0),
      type: defaultValues?.type || type,
      transaction_type: (defaultValues as any)?.transaction_type || 'vehicle_equipment',
      person_id: defaultValues?.person_id || 0,
      vehicle_equipment_id: defaultValues?.vehicle_equipment_id || 0,
      qty: defaultValues?.qty || 1,
      price: defaultValues?.price || 0,
      discount: defaultValues?.discount || 0,
      transaction_date: defaultValues?.transaction_date || new Date().toISOString().split('T')[0],
      nota_number: defaultValues?.nota_number || '',
      billing_type: (defaultValues?.billing_type as any) || 'cash',
      billing_due_date: defaultValues?.billing_due_date || null,
      invoice_file: defaultValues?.invoice_file || null,
      note: defaultValues?.note || '',
    },
  });

  useEffect(() => {
    form.reset({
      company_id: Number(companyId || defaultValues?.company_id || 0),
      type: defaultValues?.type || type,
      transaction_type: (defaultValues as any)?.transaction_type || 'vehicle_equipment',
      person_id: defaultValues?.person_id || 0,
      vehicle_equipment_id: defaultValues?.vehicle_equipment_id || 0,
      qty: defaultValues?.qty || 1,
      price: defaultValues?.price || 0,
      discount: defaultValues?.discount || 0,
      transaction_date: defaultValues?.transaction_date || new Date().toISOString().split('T')[0],
      nota_number: defaultValues?.nota_number || '',
      billing_type: (defaultValues?.billing_type as any) || 'cash',
      billing_due_date: defaultValues?.billing_due_date || null,
      invoice_file: defaultValues?.invoice_file || null,
      note: defaultValues?.note || '',
    });
    if (defaultValues?.person?.name) setSelectedPersonName(defaultValues.person.name);
    else if (isSales && defaultValues?.customer?.name) setSelectedPersonName(defaultValues.customer.name);
    else if (!isSales && (defaultValues?.supplier?.name)) {
      setSelectedPersonName(defaultValues?.supplier?.name || null);
    }

    if (defaultValues?.vehicle_equipment?.name) {
      setSelectedEquipmentName(defaultValues.vehicle_equipment.name);
    }
  }, [companyId, defaultValues, form, isSales, type]);

  const personId = form.watch('person_id');
  const equipmentId = form.watch('vehicle_equipment_id');
  const qty = Number(form.watch('qty') || 0);
  const price = Number(form.watch('price') || 0);
  const discount = Number(form.watch('discount') || 0);
  const bruto = qty * price;
  const netto = Math.max(0, bruto - bruto * (discount / 100));

  const handlePersonSelect = (person: Supplier | Customer) => {
    form.setValue('person_id', Number(person.id), { shouldDirty: true, shouldValidate: true });
    setSelectedPersonName(person.name);
  };

  const handleEquipmentSelect = (equipment: VehicleEquipment) => {
    form.setValue('vehicle_equipment_id', Number(equipment.id), { shouldDirty: true, shouldValidate: true });
    setSelectedEquipmentName(equipment.name);

    const defaultPrice = isSales
      ? equipment.sell_price ?? equipment.sellPrice
      : equipment.buy_price ?? equipment.buyPrice;

    if (defaultPrice !== undefined && defaultPrice !== null && (price === 0 || !form.formState.dirtyFields.price)) {
      form.setValue('price', Number(defaultPrice), { shouldDirty: true, shouldValidate: true });
    }
  };

  const handleFormSubmit = async (values: VehicleEquipmentTransactionFormData) => {
    try {
      setIsSubmittingLocal(true);
      await onSubmit({ ...values, type, transaction_type: 'vehicle_equipment' }, form);
    } catch (error) {
      handleApiFormError(error, form);
    } finally {
      setIsSubmittingLocal(false);
    }
  };

  const isSubmitting = form.formState.isSubmitting || isSubmittingLocal;

  return (
    <CollapsibleBox
      icon={FileText}
      title={isSales ? 'Informasi Penjualan Perlengkapan' : 'Informasi Pembelian Perlengkapan'}
      description={
        isSales
          ? 'Kelola detail informasi penjualan perlengkapan kendaraan'
          : 'Kelola detail informasi pembelian perlengkapan kendaraan'
      }
      defaultExpanded
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Row 1: No Nota, Tanggal Transaksi, Supplier / Customer */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 items-start">
            <FormField
              control={form.control}
              name="nota_number"
              render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel className="text-sm font-medium">No Nota Referensi</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} disabled={readOnly} placeholder="Contoh: NOTA-12345" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transaction_date"
              render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel className="text-sm font-medium">
                    Tanggal Transaksi <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <InputDate {...field} disabled={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="person_id"
              render={() => (
                <FormItem className="min-w-0">
                  <FormLabel className="text-sm font-medium">
                    {personLabel} <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <div>
                      {isSales ? (
                        <CustomerCombobox
                          companyId={companyId}
                          selectedId={personId ? String(personId) : null}
                          selectedName={selectedPersonName}
                          allowCreate={!readOnly}
                          disabled={readOnly}
                          onSelect={handlePersonSelect}
                        />
                      ) : (
                        <SupplierCombobox
                          companyId={companyId}
                          selectedId={personId ? String(personId) : null}
                          selectedName={selectedPersonName}
                          allowCreate={!readOnly}
                          disabled={readOnly}
                          onSelect={handlePersonSelect}
                        />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Row 2: Perlengkapan, Qty, Harga Satuan, Diskon */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4 items-start">
            <FormField
              control={form.control}
              name="vehicle_equipment_id"
              render={() => (
                <FormItem className="min-w-0">
                  <FormLabel className="text-sm font-medium">
                    Perlengkapan <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <div>
                      <VehicleEquipmentCombobox
                        selectedId={equipmentId ? String(equipmentId) : null}
                        selectedName={selectedEquipmentName}
                        allowCreate={!readOnly}
                        disabled={readOnly}
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
              name="qty"
              render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel className="text-sm font-medium">
                    Qty <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                      disabled={readOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel className="text-sm font-medium">
                    Harga Satuan <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <MoneyInput
                      name={field.name}
                      value={Number(field.value) || 0}
                      onChangeValue={field.onChange}
                      disabled={readOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discount"
              render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel className="text-sm font-medium">Diskon (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                      disabled={readOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Row 3: Disabled Calculation Inputs (Sebelum & Setelah Diskon) */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
            <FormItem className="min-w-0">
              <FormLabel className="text-sm font-medium">Total Harga Sebelum Diskon</FormLabel>
              <FormControl>
                <Input value={formatCurrency(bruto)} className="bg-muted/50 font-semibold tabular-nums" disabled readOnly />
              </FormControl>
            </FormItem>

            <FormItem className="min-w-0">
              <FormLabel className="text-sm font-medium">Total Harga Setelah Diskon</FormLabel>
              <FormControl>
                <Input value={formatCurrency(netto)} className="bg-muted/50 font-semibold tabular-nums text-emerald-700" disabled readOnly />
              </FormControl>
            </FormItem>
          </div>

          {/* Row 4: Tipe Billing, Jatuh Tempo Billing */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
            <FormField
              control={form.control}
              name="billing_type"
              render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel className="text-sm font-medium">
                    Tipe Billing <RequiredMark />
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={readOnly}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe billing" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="credit">Credit / Hutang</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billing_due_date"
              render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel className="text-sm font-medium">Jatuh Tempo Billing</FormLabel>
                  <FormControl>
                    <InputDate {...field} value={field.value ?? ''} disabled={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Row 5: Upload File Invoice */}
          <FormField
            control={form.control}
            name="invoice_file"
            render={({ field }) => (
              <FormItem className="min-w-0">
                <FormLabel className="text-sm font-medium">File Invoice / Nota</FormLabel>
                <FormControl>
                  <div>
                    <FileInput
                      value={field.value instanceof File ? field.value : null}
                      onFileChange={field.onChange}
                      disabled={readOnly}
                      accept="image/png,image/jpeg,application/pdf"
                      helperText="Format PNG, JPG, PDF maksimal 2MB"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Row 6: Catatan */}
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem className="min-w-0">
                <FormLabel className="text-sm font-medium">Catatan</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value ?? ''}
                    disabled={readOnly}
                    placeholder="Tambahkan catatan transaksi..."
                    className="resize-none min-h-[80px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Actions */}
          <div className="flex justify-center items-center gap-6 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Batal
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={isSubmitting} className="btn-primary!">
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </CollapsibleBox>
  );
}
