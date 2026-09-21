import type { UseFormReturn } from 'react-hook-form';
import { CustomerCombobox } from '@/components/features/customer/CustomerCombobox';
import { SupplierCombobox } from '@/components/features/supplier/SupplierCombobox';
import type { Customer } from '@/@types/customer.types';
import type { Supplier } from '@/@types/supplier.types';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { Label } from '@/components/ui/label';
import { DocumentTemplateSelect } from '@/components/ui/document-template-select';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { UnitTransactionFormValues, UnitTransactionKind } from '@/types/unit-transaction.types';

export type UnitTransactionPerson = Supplier | Customer;

interface UnitTransactionPartyFieldsProps {
  type: UnitTransactionKind;
  companyId?: string | number | null;
  form: UseFormReturn<UnitTransactionFormValues>;
  personId: string;
  selectedPerson: UnitTransactionPerson | null;
  transactionDate: string;
  onDateChange: (value: string) => void;
  onPersonSelect: (person: UnitTransactionPerson) => void;
}

export function UnitTransactionPartyFields({
  type,
  companyId,
  form,
  personId,
  selectedPerson,
  transactionDate,
  onDateChange,
  onPersonSelect,
}: UnitTransactionPartyFieldsProps) {
  const isPurchase = type === 'purchase';
  const personLabel = isPurchase ? 'Supplier' : 'Customer';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="min-w-0 space-y-2">
          <Label className="text-sm font-medium">Tanggal</Label>
          <InputDate
            value={transactionDate}
            onChange={(event) => onDateChange(event.target.value)}
            className="w-full sm:w-full bg-transparent"
          />
        </div>

        <div className="min-w-0 space-y-2">
          <Label className="text-sm font-medium">{personLabel}</Label>
          {isPurchase ? (
            <SupplierCombobox
              companyId={companyId}
              selectedId={personId}
              selectedName={selectedPerson?.name}
              allowCreate
              onSelect={onPersonSelect}
            />
          ) : (
            <CustomerCombobox
              companyId={companyId}
              selectedId={personId}
              selectedName={selectedPerson?.name}
              allowCreate
              onSelect={onPersonSelect}
            />
          )}
        </div>

        <div className="min-w-0 space-y-2">
          <Label className="text-sm font-medium">Alamat</Label>
          <Input value={selectedPerson?.address ?? ''} readOnly disabled className="bg-transparent" placeholder={`Alamat ${personLabel.toLowerCase()}`} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Label className="text-sm font-medium">NPWP</Label>
          <Input value={selectedPerson?.npwp ?? ''} readOnly disabled className="bg-transparent" placeholder={`NPWP ${personLabel.toLowerCase()}`} />
        </div>

        <FormField
          control={form.control}
          name="documentTemplateId"
          render={({ field }) => (
            <FormItem className="min-w-0">
              <FormLabel className="text-sm font-medium">
                Document Template <span className="font-normal text-muted-foreground">(Opsional)</span>
              </FormLabel>
              <FormControl>
                <DocumentTemplateSelect value={field.value} onValueChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
