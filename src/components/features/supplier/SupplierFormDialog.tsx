import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import type { CreateSupplierFormValues } from '@/schemas/supplier.schema';
import RequiredMark from '@/components/ui/required-mark';
import { sanitizePhone } from '@/lib/utils/format';

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<CreateSupplierFormValues>;
  onSubmit: (values: CreateSupplierFormValues) => void;
  title: string;
  description: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  userOptions?: { id: number; name: string }[];
  isUserLoading?: boolean;
}

export function SupplierFormDialog({ open, onOpenChange, form, onSubmit, title, description, submitLabel = 'Simpan', isSubmitting = false, userOptions = [], isUserLoading = false }: SupplierFormDialogProps) {
  void userOptions;
  void isUserLoading;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md sm:max-w-[425px] max-h-[90vh] overflow-hidden flex flex-col rounded-md border-0 bg-white p-0 shadow-2xl">
        <DialogHeader className="px-6 py-5 border-b shrink-0 text-left">
          <DialogTitle className="text-[18px] font-semibold text-[#171717]">{title}</DialogTitle>
          <DialogDescription className="text-[15px] text-[#71717A]">{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[14px] font-medium text-[#171717]">Nama Supplier<RequiredMark /></FormLabel>
                    <FormControl>
                      <Input placeholder="Tambahkan nama" className="h-12 rounded-md border-[#E4E4E7] px-4 text-[15px] placeholder:text-[#A1A1AA]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pic"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[14px] font-medium text-[#171717]">PIC</FormLabel>
                    <FormControl>
                      <Input placeholder="Tambahkan PIC" className="h-12 rounded-md border-[#E4E4E7] px-4 text-[15px] placeholder:text-[#A1A1AA]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[14px] font-medium text-[#171717]">Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Tambahkan nomer telepon"
                        className="h-12 rounded-md border-[#E4E4E7] px-4 text-[15px] placeholder:text-[#A1A1AA]"
                        {...field}
                        onChange={(e) => {
                          field.onChange(sanitizePhone(e.target.value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="npwp"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[14px] font-medium text-[#171717]">Nomer NPWP</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Tambahkan NPWP"
                        maxLength={16}
                        className="h-12 rounded-md border-[#E4E4E7] px-4 text-[15px] placeholder:text-[#A1A1AA]"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value.replace(/[^\d]/g, ''));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[14px] font-medium text-[#171717]">Alamat</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tambahkan Alamat" className="min-h-[100px] rounded-md border-[#E4E4E7] px-4 py-3 text-[15px] placeholder:text-[#A1A1AA] resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="shrink-0 flex gap-3 px-6 py-4 border-t bg-gray-50">
              <Button type="button" variant="outline" className="flex-1 h-11 rounded-md border-[#D4D4D8] text-[15px] text-[#171717]" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" className="flex-1 h-11 rounded-md bg-[#1F3B5B] text-[15px] font-medium text-white hover:bg-[#19314b]" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : submitLabel}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
