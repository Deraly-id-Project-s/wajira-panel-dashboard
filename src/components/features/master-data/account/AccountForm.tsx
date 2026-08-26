import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { AccountGroup } from '@/types/account-group.types';
import type { AccountFormValues } from '@/schemas/account-master.schema';
import type { UseFormReturn } from 'react-hook-form';
import { SearchableSelect } from '@/components/features/vehicle-data/SearchableSelect';
import { CreateAccountGroupDialog } from '@/components/features/account/CreateAccountGroupDialog';
import { ACCOUNT_CATEGORY_OPTIONS } from '@/lib/account';
import { Plus, Search } from 'lucide-react';
import RequiredMark from '@/components/ui/required-mark';
import { cn } from '@/lib/utils';

interface AccountFormProps {
  form: UseFormReturn<AccountFormValues>;
  accountGroups: AccountGroup[];
  onSubmit: (values: AccountFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  isLoadingGroups?: boolean;
  onGroupSearchChange?: (val: string) => void;
  onLoadMoreGroups?: () => void;
  hasMoreGroups?: boolean;
  isLock?: boolean;
}

export const AccountForm = ({
  form,
  accountGroups,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Simpan',
  isLoadingGroups = false,
  onGroupSearchChange,
  onLoadMoreGroups,
  hasMoreGroups = false,
  isLock = false,
}: AccountFormProps) => {
  const [openCreateGroup, setOpenCreateGroup] = useState(false);

  const groupOptions = useMemo(
    () =>
      accountGroups.map((group) => ({
        value: String(group.id),
        label: group.code || String(group.id),
        subtitle: group.description ?? undefined,
      })),
    [accountGroups],
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-semibold text-slate-700">Kode Akun<RequiredMark /></FormLabel>
                <FormControl>
                  <Input readOnly={isLock} placeholder="Masukkan kode akun" className={cn("h-10 rounded-lg border-slate-200 px-3 text-sm shadow-none focus-visible:ring-slate-300 bg-white", isLock && "bg-slate-50 text-slate-500 cursor-not-allowed")} {...field} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountGroupId"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-semibold text-slate-700">Grup Akun <RequiredMark /></FormLabel>
                <FormControl>
                  <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <div className="flex-1">
                      <SearchableSelect
                        value={field.value ? String(field.value) : ''}
                        onChange={(value) => field.onChange(Number(value))}
                        options={groupOptions}
                        placeholder={isLoadingGroups ? 'Memuat...' : 'Select an item'}
                        searchPlaceholder="Cari grup akun..."
                        emptyText="Grup akun tidak ditemukan."
                        loading={isLoadingGroups}
                        onSearchChange={onGroupSearchChange}
                        onLoadMore={onLoadMoreGroups}
                        hasMore={hasMoreGroups}
                        className="h-10 rounded-lg border-slate-200 px-3 text-sm shadow-none focus-visible:ring-slate-300 bg-white"
                      />
                    </div>
                    <Button type="button" onClick={() => setOpenCreateGroup(true)} className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#152e4d]">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-semibold text-slate-700">Nama Akun<RequiredMark /></FormLabel>
                <FormControl>
                  <Input readOnly={isLock} placeholder="Masukkan nama akun" className={cn("h-10 rounded-lg border-slate-200 px-3 text-sm shadow-none focus-visible:ring-slate-300 bg-white", isLock && "bg-slate-50 text-slate-500 cursor-not-allowed")} {...field} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-semibold text-slate-700">Kategori Laporan</FormLabel>
                <FormControl>
                  <Select value={field.value ?? ''} onValueChange={(val) => field.onChange(val === 'none' ? undefined : val)}>
                    <SelectTrigger className={cn("h-10 rounded-lg border-slate-200 px-3 text-sm shadow-none focus:ring-slate-300 bg-white", isLock && "pointer-events-none opacity-60 bg-slate-50 cursor-not-allowed")} tabIndex={isLock ? -1 : undefined}>
                      <SelectValue placeholder="Pilih Kategori Laporan (Opsional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-sm text-slate-500">Pilih Kategori Laporan (Opsional)</SelectItem>
                      {ACCOUNT_CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-sm">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs font-semibold text-slate-700">Deskripsi</FormLabel>
              <FormControl>
                <Textarea readOnly={isLock} placeholder="Tulis deskripsi di sini" className={cn("min-h-[72px] resize-none rounded-lg border-slate-200 px-3 py-2 text-sm shadow-none focus-visible:ring-slate-300 bg-white", isLock && "bg-slate-50 text-slate-500 cursor-not-allowed")} rows={3} {...field} />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <FormLabel>Status</FormLabel>
                <p className="text-sm text-muted-foreground">Aktifkan akun untuk dapat digunakan</p>
              </div>
              <FormControl>
                <Switch checked={!!field.value} onCheckedChange={field.onChange} className={cn(isLock && "pointer-events-none opacity-60")} tabIndex={isLock ? -1 : undefined} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-3">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" className="bg-[#1F3B5B] hover:bg-[#1B3450]" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : submitLabel}
          </Button>
        </div>
      </form>

      <CreateAccountGroupDialog
        open={openCreateGroup}
        onOpenChange={setOpenCreateGroup}
        onCreated={(id) => {
          form.setValue('accountGroupId', Number(id), {
            shouldDirty: true,
            shouldValidate: true,
          });
        }}
      />
    </Form>
  );
};
