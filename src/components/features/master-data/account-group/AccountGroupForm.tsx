import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import RequiredMark from '@/components/ui/required-mark';
import { Textarea } from '@/components/ui/textarea';
import type { AccountGroupFormValues } from '@/schemas/account-group.schema';
import type { UseFormReturn } from 'react-hook-form';

interface AccountGroupFormProps {
  form: UseFormReturn<AccountGroupFormValues>;
}

export const AccountGroupForm = ({ form }: AccountGroupFormProps) => {
  return (
    <>
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
    </>
  );
};
