import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import RequiredMark from '@/components/ui/required-mark';
import { Textarea } from '@/components/ui/textarea';
import type { AccountGroupFormValues } from '@/scheme/account-group.schema';
import type { UseFormReturn } from 'react-hook-form';

interface AccountGroupFormProps {
  form: UseFormReturn<AccountGroupFormValues>;
  onSubmit: (values: AccountGroupFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export const AccountGroupForm = ({ form, onSubmit, onCancel, isSubmitting = false, submitLabel = 'Simpan' }: AccountGroupFormProps) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 space-y-4">
          <FormField
            control={form.control}
            name="group_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[14px] font-medium text-[#171717]">Kode Grup<RequiredMark /></FormLabel>
                <FormControl>
                  <Input placeholder="Masukkan kode grup" className="rounded-md border-[#E4E4E7] px-4 text-[15px] placeholder:text-[#A1A1AA]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[14px] font-medium text-[#171717]">Deskripsi</FormLabel>
                <FormControl>
                  <Textarea placeholder="Tambahkan catatan" className="rounded-md border-[#E4E4E7] px-4 text-[15px] placeholder:text-[#A1A1AA] resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="shrink-0 flex gap-3 px-6 py-4 border-t bg-gray-50">
          <Button type="button" variant="outline" className="flex-1 rounded-md border-[#D4D4D8] text-[15px] text-[#171717]" onClick={onCancel} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" className="flex-1 rounded-md bg-[#1F3B5B] text-[15px] font-medium text-white hover:bg-[#19314b]" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
};
