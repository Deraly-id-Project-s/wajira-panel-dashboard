import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import RequiredMark from '@/components/ui/required-mark';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { AccountGroupFormValues } from '@/scheme/account-group.schema';
import type { UseFormReturn } from 'react-hook-form';

interface AccountGroupFormProps {
  form: UseFormReturn<AccountGroupFormValues>;
  disableGroupCode?: boolean;
  showLockField?: boolean;
}

export const AccountGroupForm = ({ form, disableGroupCode = false, showLockField = false }: AccountGroupFormProps) => {
  return (
    <>
      <FormField
        control={form.control}
        name="group_code"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[14px] font-medium text-[#171717]">Kode Grup<RequiredMark /></FormLabel>
            <FormControl>
              <Input
                placeholder="Masukkan kode grup"
                disabled={disableGroupCode}
                className="rounded-md border-[#E4E4E7] px-4 text-[15px] placeholder:text-[#A1A1AA] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                {...field}
              />
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

      {showLockField && (
        <FormField
          control={form.control}
          name="is_lock"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-md border border-[#E4E4E7] p-4">
              <div>
                <FormLabel className="text-[14px] font-medium text-[#171717]">Lock Data</FormLabel>
                <p className="text-sm text-muted-foreground">Kunci data agar hanya user tertentu yang bisa mengubah semua field</p>
              </div>
              <FormControl>
                <Switch checked={!!field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      )}
    </>
  );
};
