import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { FormDialog } from '@/components/ui/form-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { getWarehouseDataList } from '@/services/warehouseBlock.service';
import type { WarehouseBlock } from '@/services/warehouseBlock.service';
import { cn } from '@/lib/utils';

const warehouseBlockSchema = z.object({
  warehouse_id: z.coerce.number().min(1, 'Gudang wajib dipilih'),
  name: z.string().min(1, 'Nama blok wajib diisi'),
  description: z.string().optional(),
});

type WarehouseBlockFormValues = z.infer<typeof warehouseBlockSchema>;

interface WarehouseBlockFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: WarehouseBlock;
  onSubmit: (data: WarehouseBlockFormValues) => void;
  isSubmitting?: boolean;
}

export function WarehouseBlockForm({ open, onOpenChange, initialData, onSubmit, isSubmitting }: WarehouseBlockFormProps) {
  const form = useForm<WarehouseBlockFormValues>({
    resolver: zodResolver(warehouseBlockSchema),
    defaultValues: {
      warehouse_id: 0,
      name: '',
      description: '',
    },
  });

  const { data: warehousesResponse, isLoading: isWarehousesLoading } = useQuery({
    queryKey: ['warehouses-data-list'],
    queryFn: () => getWarehouseDataList(),
    enabled: open,
  });

  const warehouses = useMemo(() => warehousesResponse?.data?.data || [], [warehousesResponse]);
  const [openWarehouseSelect, setOpenWarehouseSelect] = useState(false);
  const [warehouseSearch, setWarehouseSearch] = useState('');
  
  const filteredWarehouses = warehouses.filter((wh) => {
    if (!warehouseSearch.trim()) return true;
    const keyword = warehouseSearch.toLowerCase();
    return wh.name.toLowerCase().includes(keyword);
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          warehouse_id: initialData.warehouse_id,
          name: initialData.name,
          description: initialData.description || '',
        });
      } else {
        form.reset({
          warehouse_id: 0,
          name: '',
          description: '',
        });
      }
    }
  }, [initialData, form, open]);

  useEffect(() => {
    if (open && !initialData && warehouses.length > 0 && form.getValues('warehouse_id') === 0) {
      form.setValue('warehouse_id', warehouses[0].id);
    }
  }, [open, initialData, warehouses, form]);

  const handleSubmit = (values: WarehouseBlockFormValues) => {
    onSubmit({
      ...values,
      description: values.description || '',
    });
  };

  return (
    <Form {...form}>
      <FormDialog
        open={open}
        onOpenChange={onOpenChange}
        title={initialData ? 'Edit Blok Gudang' : 'Tambah Blok Gudang'}
        onSubmit={form.handleSubmit(handleSubmit)}
        isSubmitting={isSubmitting}
      >
        <FormField
          control={form.control}
          name="warehouse_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pilih Gudang</FormLabel>
              <Popover
                modal={true}
                open={openWarehouseSelect}
                onOpenChange={(open) => {
                  setOpenWarehouseSelect(open);
                  if (!open) setWarehouseSearch('');
                }}
              >
                <PopoverTrigger asChild>
                  <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openWarehouseSelect}
                          disabled={isSubmitting || isWarehousesLoading}
                          className={cn(
                            "w-full justify-between bg-white font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? warehouses.find((wh) => wh.id === field.value)?.name
                            : "Pilih Gudang"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Cari gudang..." 
                      value={warehouseSearch} 
                      onValueChange={setWarehouseSearch} 
                    />
                    <CommandList>
                      <CommandEmpty>Gudang tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {filteredWarehouses.map((wh) => (
                          <CommandItem
                            key={wh.id}
                            value={`${wh.name} ${wh.id}`}
                            onSelect={() => {
                              field.onChange(wh.id);
                              setOpenWarehouseSelect(false);
                              setWarehouseSearch('');
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === wh.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {wh.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Blok</FormLabel>
              <FormControl>
                <Input placeholder="cth: Blok A" disabled={isSubmitting} {...field} />
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
              <FormLabel>Deskripsi</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Masukkan deskripsi opsional"
                  disabled={isSubmitting}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </FormDialog>
    </Form>
  );
}
