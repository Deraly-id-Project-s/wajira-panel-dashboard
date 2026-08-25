'use client';
import { format } from 'date-fns';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transactionSchema, TransactionFormValues } from '@/scheme/transaction.schema';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Save } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';

// Assuming standard layout components exist where possible, or using raw HTML/Tailwind for precision
interface Props {
  defaultValues?: Partial<TransactionFormValues>;
  onSubmit: (data: TransactionFormValues) => Promise<void>;
  onCancel: () => void;
  isBusy?: boolean;
}

export default function TransactionForm({ defaultValues, onSubmit, onCancel, isBusy }: Props) {
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: defaultValues as any,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Transaksi</h3>
          <div className="flex flex-row gap-4 justify-content-between">
            {/* SECTION 1: HEADER */}
            <div className="w-full">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Pilih Tanggal</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value ? new Date(field.value) : undefined} onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')} disabled={isBusy} placeholder="Pick a date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* SECTION 2: TRANSACTION INFO */}
            <div className="space-y-4 w-full">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Transaksi</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama transaksi" {...field} disabled={isBusy} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: BANK (Grid Layout) */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">BANK</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* USD ROW */}
            <FormField
              control={form.control}
              name="debitUSD"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Debet USD</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MoneyInput currency="USD" value={field.value ?? 0} onChangeValue={(val) => field.onChange(val)} disabled={isBusy} placeholder="0" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="creditUSD"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kredit USD</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MoneyInput currency="USD" value={field.value ?? 0} onChangeValue={(val) => field.onChange(val)} disabled={isBusy} placeholder="0" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* IDR ROW */}
            <FormField
              control={form.control}
              name="debitIDR"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Debet IDR</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MoneyInput value={field.value ?? 0} onChangeValue={(val) => field.onChange(val)} disabled={isBusy} placeholder="0" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="creditIDR"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kredit IDR</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MoneyInput value={field.value ?? 0} onChangeValue={(val) => field.onChange(val)} disabled={isBusy} placeholder="0" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* SECTION 4: CASH */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">CASH</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="debitCash"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Debet IDR</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MoneyInput value={field.value ?? 0} onChangeValue={(val) => field.onChange(val)} disabled={isBusy} placeholder="0" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="creditCash"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kredit IDR</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MoneyInput value={field.value ?? 0} onChangeValue={(val) => field.onChange(val)} disabled={isBusy} placeholder="0" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* SECTION 5: FOOTER */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Lainnya</h3>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Keterangan</FormLabel>
                <FormControl>
                  <Input placeholder="Masukkan Keterangan" {...field} disabled={isBusy} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isBusy}>
            Batal
          </Button>
          <Button type="submit" className="button-theme-1!" disabled={isBusy}>
            {isBusy ? (
              <>Menyimpan...</>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
