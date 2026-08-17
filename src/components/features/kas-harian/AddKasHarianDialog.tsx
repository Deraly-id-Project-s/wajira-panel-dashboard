import { useEffect } from 'react';
import { type Resolver, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCompany } from '@/contexts/CompanyContext';
import { fetchUserCompanies } from '@/services/company.service';
import { useCreateKasHarian } from '@/hooks/useKasHarian';
import { kasHarianSchema, type KasHarianFormInput, type KasHarianFormValues } from '@/scheme/kas-harian.schema';
import KasHarianForm from './KasHarianForm';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddKasHarianDialog({ open, onOpenChange }: Props) {
  const { companyId } = useCompany();
  const selectedCompanyId = Number(companyId || 0);
  const { mutateAsync: createKasHarian, isPending } = useCreateKasHarian();
  const form = useForm<KasHarianFormInput, unknown, KasHarianFormValues>({
    resolver: zodResolver(kasHarianSchema) as Resolver<KasHarianFormInput, unknown, KasHarianFormValues>,
    defaultValues: {
      company_id: selectedCompanyId || 0,
      date: new Date(),
      note: '',
      debet: 0,
      credit: 0,
      transaction_category: 'general',
      payment_proof: null,
    },
  });

  const companyQuery = useQuery({
    queryKey: ['companies', 'selector'],
    queryFn: () => fetchUserCompanies(),
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (open) {
      form.reset({
        company_id: selectedCompanyId || 0,
        date: new Date(),
        note: '',
        debet: 0,
        credit: 0,
        transaction_category: 'general',
        payment_proof: null,
      });
    }
  }, [form, open, selectedCompanyId]);

  const onSubmit = async (data: KasHarianFormValues) => {
    try {
      await createKasHarian({
        company_id: data.company_id,
        date: format(data.date, 'yyyy-MM-dd'),
        note: data.note,
        debet: data.debet,
        credit: data.credit,
        transaction_category: data.transaction_category,
        payment_proof: data.payment_proof,
      });

      toast.success('Transaksi kas harian berhasil ditambahkan');
      onOpenChange(false);
      form.reset();
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Gagal menambahkan transaksi kas harian';
      toast.error(message);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] max-w-[520px] overflow-hidden rounded-[28px] border-0 p-0 shadow-2xl">
        <div className="flex max-h-[92vh] flex-col rounded-[28px] border border-slate-200 bg-white">
          <DialogHeader className="space-y-1 px-6 pt-6 text-left sm:px-8 sm:pt-8">
            <DialogTitle className="text-xl font-semibold text-slate-955">Tambah Transaksi KAS</DialogTitle>
            <p className="text-sm text-muted-foreground">Masukkan detail transaksi baru</p>
          </DialogHeader>

          <div className="mt-6 flex-1 overflow-y-auto px-6 pb-6 sm:px-8">
            <KasHarianForm
              form={form}
              onSubmit={onSubmit}
              id="add-kas-form"
              companies={companyQuery.data ?? []}
            />
          </div>

          <div className="border-t border-slate-100 px-6 py-5 sm:px-8">
            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="outline" className="border-slate-200" onClick={() => onOpenChange(false)} disabled={isPending}>
                Batal
              </Button>
              <Button type="submit" className="bg-[#1e3a5f] hover:bg-[#152e4d]" form="add-kas-form" disabled={isPending}>
                {isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
