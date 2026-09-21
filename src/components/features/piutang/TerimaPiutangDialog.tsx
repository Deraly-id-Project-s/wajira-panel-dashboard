'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { terimaPiutangSchema, TerimaPiutangFormValues } from '@/scheme/piutang.schema';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DatePicker } from '@/components/ui/date-picker';
// format removed - not used

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: TerimaPiutangFormValues) => Promise<void> | void;
}

export default function TerimaPiutangDialog({ open, onClose, onSubmit }: Props) {
  const form = useForm<TerimaPiutangFormValues>({
    resolver: zodResolver(terimaPiutangSchema),
    defaultValues: {
      tanggal: new Date(),
      kasMasuk: '',
      jumlahTerima: 0,
    },
  });

  const handleFormSubmit = async (values: TerimaPiutangFormValues) => {
    try {
      await onSubmit(values);
      toast.success('Pembayaran berhasil diterima');
      form.reset();
      onClose();
    } catch (error: any) {
      toast.error(error?.message ?? 'Gagal menerima pembayaran');
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Terima Piutang</DialogTitle>
          <p className="text-sm text-gray-500">Masukkan detail penerimaan piutang</p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
            <FormItem>
              <FormLabel>Kode Bayar</FormLabel>
              <FormControl>
                <Input value="Auto Generated Code" disabled className="bg-gray-50 text-gray-500" />
              </FormControl>
            </FormItem>

            <FormField
              control={form.control}
              name="tanggal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Terima</FormLabel>
                  <FormControl>
                    <DatePicker value={field.value} onChange={field.onChange} placeholder="Pilih Tanggal" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="kasMasuk"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kas Masuk</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Kas Masuk" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BCA IDR">BCA IDR</SelectItem>
                      <SelectItem value="MANDIRI IDR">MANDIRI IDR</SelectItem>
                      <SelectItem value="KAS BESAR">KAS BESAR</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jumlahTerima"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah Terima</FormLabel>
                  <FormControl>
                    <MoneyInput placeholder="Tambahkan nominal" {...field} value={field.value || 0} onChangeValue={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-3 mt-6 pt-4">
              <Button type="submit" className="w-full bg-[#1e293b] hover:bg-[#0f172a] text-white">
                Simpan
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={handleClose}>
                Batal
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
