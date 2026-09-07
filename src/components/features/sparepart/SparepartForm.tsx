'use client';

import { useState } from 'react';
import { useForm, Controller, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sparepartSchema, type SparepartFormValues } from '@/scheme/sparepart.schema';
import { useSparepartCategories } from '@/hooks/useSparepart';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { MoneyInput } from '@/components/ui/money-input';
import { CreateSparepartCategoryDialog } from './CreateSparepartCategoryDialog';
import { Check, ChevronsUpDown, Plus, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import RequiredMark from '@/components/ui/required-mark';

interface SparepartFormProps {
  form: UseFormReturn<SparepartFormValues>;
  onSubmit: (values: SparepartFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

const fieldClassName = 'h-10 rounded-md border-input px-3 text-sm shadow-none bg-transparent';

export function SparepartForm({
  form,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Simpan',
}: SparepartFormProps) {
  const { data: categories, isLoading: loadingCategories } = useSparepartCategories();
  const [openCreateGroup, setOpenCreateGroup] = useState(false);
  const [openGroupSelect, setOpenGroupSelect] = useState(false);
  const [groupSearch, setGroupSearch] = useState('');

  const filteredCategories = (categories ?? []).filter((category) =>
    category.name.toLowerCase().includes(groupSearch.toLowerCase())
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight">Informasi Sparepart</h2>
          <p className="text-sm text-gray-500 mt-1">Kelola detail kode, nama, grup, satuan, dan harga sparepart</p>
          <div className="my-6 h-px bg-muted/60" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem className="flex flex-col min-w-0">
                <FormLabel className="text-sm font-medium">
                  Kode Part<RequiredMark />
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isSubmitting}
                    placeholder="Tambahkan kode"
                    className={fieldClassName}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex flex-col min-w-0">
                <FormLabel className="text-sm font-medium">
                  Nama Part<RequiredMark />
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isSubmitting}
                    placeholder="Tambahkan nama"
                    className={fieldClassName}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem className="flex flex-col min-w-0">
                <FormLabel className="text-sm font-medium">Grup</FormLabel>
                <div className="flex items-center gap-2 w-full min-w-0">
                  <Popover
                    open={openGroupSelect}
                    onOpenChange={(open) => {
                      setOpenGroupSelect(open);
                      if (!open) setGroupSearch('');
                    }}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        role="combobox"
                        aria-expanded={openGroupSelect}
                        disabled={loadingCategories || isSubmitting}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 min-w-0 font-normal text-left"
                      >
                        <span className={cn('truncate', !field.value && 'text-muted-foreground')}>
                          {field.value
                            ? categories?.find((category) => category.id === Number(field.value))?.name ?? 'Pilih grup'
                            : loadingCategories
                            ? 'Memuat grup...'
                            : 'Pilih grup'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Cari grup..."
                          value={groupSearch}
                          onValueChange={setGroupSearch}
                        />
                        <CommandList>
                          <CommandEmpty>Grup tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="tanpa grup"
                              onSelect={() => {
                                field.onChange(null);
                                setOpenGroupSelect(false);
                                setGroupSearch('');
                              }}
                            >
                              <Check className={cn('mr-2 h-4 w-4', !field.value ? 'opacity-100' : 'opacity-0')} />
                              <span className="truncate">Tanpa grup</span>
                            </CommandItem>
                            {filteredCategories.map((category) => (
                              <CommandItem
                                key={category.id}
                                value={`${category.name} ${category.id}`}
                                onSelect={() => {
                                  field.onChange(category.id);
                                  setOpenGroupSelect(false);
                                  setGroupSearch('');
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    Number(field.value) === category.id ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                                <span className="truncate">{category.name}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    disabled={isSubmitting}
                    aria-label="Tambah grup"
                    onClick={() => setOpenCreateGroup(true)}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Tambah grup</span>
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unitType"
            render={({ field }) => (
              <FormItem className="flex flex-col min-w-0">
                <FormLabel className="text-sm font-medium">
                  Satuan<RequiredMark />
                </FormLabel>
                <Select
                  value={field.value || ''}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="w-full bg-transparent">
                      <SelectValue placeholder="Pilih Satuan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pcs">Pcs</SelectItem>
                    <SelectItem value="set">Set</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purchasePrice"
            render={({ field: { onChange, value, ...fieldProps } }) => (
              <FormItem className="flex flex-col min-w-0">
                <FormLabel className="text-sm font-medium">
                  Harga Beli<RequiredMark />
                </FormLabel>
                <FormControl>
                  <MoneyInput
                    {...fieldProps}
                    value={value ?? 0}
                    disabled={isSubmitting}
                    onChangeValue={onChange}
                    placeholder="Tambahkan harga beli"
                    className="bg-transparent"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sellingPrice"
            render={({ field: { onChange, value, ...fieldProps } }) => (
              <FormItem className="flex flex-col min-w-0">
                <FormLabel className="text-sm font-medium">
                  Harga Jual<RequiredMark />
                </FormLabel>
                <FormControl>
                  <MoneyInput
                    {...fieldProps}
                    value={value ?? 0}
                    disabled={isSubmitting}
                    onChangeValue={onChange}
                    placeholder="Tambahkan harga jual"
                    className="bg-transparent"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-center items-center gap-6 pt-10">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-muted-foreground font-medium hover:text-foreground"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#1e293b] hover:bg-[#0f172a] text-white font-medium min-w-[120px] rounded-lg"
          >
            {isSubmitting ? (
              'Menyimpan...'
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {submitLabel}
              </>
            )}
          </Button>
        </div>
      </form>

      <CreateSparepartCategoryDialog
        open={openCreateGroup}
        onOpenChange={setOpenCreateGroup}
        onCreated={(id) => {
          form.setValue('categoryId', id, { shouldValidate: true, shouldDirty: true });
        }}
      />
    </Form>
  );
}
