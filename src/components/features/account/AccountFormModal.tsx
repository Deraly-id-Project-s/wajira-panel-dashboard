import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import RequiredMark from '@/components/ui/required-mark';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { UseFormReturn } from 'react-hook-form';
import type { AccountFormValues } from '@/scheme/account-master.schema';
import type { AccountGroup } from '@/@types/account-group.types';
import { ACCOUNT_CATEGORY_OPTIONS } from '@/lib/account';
import { cn } from '@/lib/utils';
import { SearchableSelect } from '@/components/features/vehicle-data/SearchableSelect';
import { CreateAccountGroupDialog } from './CreateAccountGroupDialog';
import { Plus, Search } from 'lucide-react';

interface AccountFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<AccountFormValues>;
  onSubmit: (values: AccountFormValues) => void;
  title: string;
  description: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  accountGroups: AccountGroup[];
  isLoadingGroups?: boolean;
  onGroupSearchChange?: (val: string) => void;
  onLoadMoreGroups?: () => void;
  hasMoreGroups?: boolean;
}

export function AccountFormModal({
  open,
  onOpenChange,
  form,
  onSubmit,
  title,
  description,
  submitLabel = 'Simpan',
  isSubmitting = false,
  accountGroups,
  isLoadingGroups = false,
  onGroupSearchChange,
  onLoadMoreGroups,
  hasMoreGroups = false,
}: AccountFormModalProps) {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[480px] rounded-md border-0 p-0 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" showCloseButton={false}>
        <DialogHeader className="space-y-1 border-b border-slate-100 px-5 py-4 text-left sm:px-6 flex-shrink-0">
          <DialogTitle className="text-lg font-semibold tracking-tight text-slate-950">{title}</DialogTitle>
          <DialogDescription className="text-xs text-slate-500">{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5 px-5 py-4 sm:px-6 overflow-y-auto flex-1 bg-white">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold text-slate-700">Kode Akun<RequiredMark /></FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan kode akun" className="h-10 rounded-md border-slate-200 px-3 text-sm shadow-none focus-visible:ring-slate-300 bg-white" {...field} />
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
                          className="h-10 rounded-md border-slate-200 px-3 text-sm shadow-none focus-visible:ring-slate-300 bg-white"
                        />
                      </div>
                      <Button type="button" onClick={() => setOpenCreateGroup(true)} className="btn-primary!">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
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
                      <SelectTrigger className="h-10 rounded-md border-slate-200 px-3 text-sm shadow-none focus:ring-slate-300 bg-white">
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

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold text-slate-700">Nama Akun<RequiredMark /></FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama akun" className="h-10 rounded-md border-slate-200 px-3 text-sm shadow-none focus-visible:ring-slate-300 bg-white" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold text-slate-700">Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tulis deskripsi di sini" className="min-h-[72px] resize-none rounded-md border-slate-200 px-3 py-2 text-sm shadow-none focus-visible:ring-slate-300 bg-white" rows={3} {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-2 pt-3 flex-shrink-0">
              <Button type="submit" className={cn('h-10 w-full rounded-md bg-[#1F3B5B] text-sm font-semibold text-white hover:bg-[#1B3450]')} disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : submitLabel}
              </Button>
              <Button type="button" variant="outline" className="h-10 w-full rounded-md border-slate-200 text-sm font-semibold text-slate-700 shadow-none hover:bg-slate-50" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>

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
    </Dialog>
  );
}
