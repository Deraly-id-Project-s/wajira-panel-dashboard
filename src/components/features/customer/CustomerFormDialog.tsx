import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import type { CustomerFormValues } from '@/schemas/customer.schema';
import RequiredMark from '@/components/ui/required-mark';

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<CustomerFormValues>;
  onSubmit: (values: CustomerFormValues) => void;
  title: string;
  description: string;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export function CustomerFormDialog({ open, onOpenChange, form, onSubmit, title, description, submitLabel = 'Simpan', isSubmitting = false }: CustomerFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl"
        style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
            <div className="flex flex-col gap-4 overflow-y-auto pr-1 pb-2" style={{ flex: 1 }}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Customer<RequiredMark /></FormLabel>
                    <FormControl>
                      <Input placeholder="Tambahkan nama" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alamat<RequiredMark /></FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tambahkan Alamat" className="resize-none" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="npwp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NPWP</FormLabel>
                    <FormControl>
                      <Input placeholder="Tambahkan NPWP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIC</FormLabel>
                    <FormControl>
                      <Input placeholder="Tambahkan PIC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Tambahkan nomer telepon" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="map_link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link Maps</FormLabel>
                    <FormControl>
                      <Input placeholder="Tambahkan link maps" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex shrink-0 flex-col gap-2 pt-4">
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : submitLabel}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
