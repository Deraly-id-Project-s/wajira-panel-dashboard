import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompany } from '@/contexts/CompanyContext';
import { useSparepartTransactions } from '@/hooks/useSparepartTransaction';
import { useCreateSparepartRefund, useUpdateSparepartRefund } from '@/hooks/useSparepartRefund';
import type { SparepartTransactionRefund } from '@/@types/sparepart-refund.types';
import { toast } from 'sonner';

interface Values { sparepart_transaction_id: string; amount: number; payment_date: string; note: string; }
export default function SparepartRefundForm({ existing }: { existing?: SparepartTransactionRefund }) {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const { companyId } = useCompany();
  const createMutation = useCreateSparepartRefund();
  const updateMutation = useUpdateSparepartRefund();
  const form = useForm<Values>({ defaultValues: { sparepart_transaction_id: existing?.sparepart_transaction_id || '', amount: existing?.amount || 0, payment_date: (existing?.payment_date || existing?.refund_date || new Date().toISOString()).slice(0, 10), note: existing?.note || '' } });
  const type = existing?.type === 'purchase' || existing?.type === 'sales' ? existing.type : 'all';
  const transactions = useSparepartTransactions({ page: 1, perPage: 100, company_id: companyId ?? undefined, type: type === 'all' ? undefined : type });
  const available = useMemo(() => (transactions.data?.data || []).filter((item) => !item.is_refunded || String(item.id) === form.watch('sparepart_transaction_id')), [transactions.data?.data, form]);

  useEffect(() => {
    if (existing) form.reset({ sparepart_transaction_id: existing.sparepart_transaction_id || existing.transaction?.id || '', amount: existing.amount, payment_date: (existing.payment_date || existing.refund_date || '').slice(0, 10), note: existing.note || '' });
    else if (typeof router.query.sparepart_transaction_id === 'string') form.setValue('sparepart_transaction_id', router.query.sparepart_transaction_id);
  }, [existing, form, router.query.sparepart_transaction_id]);
  const submit = async (values: Values) => {
    try {
      if (existing) await updateMutation.mutateAsync({ id: existing.id, payload: values });
      else await createMutation.mutateAsync(values);
      toast.success(existing ? 'Refund berhasil diperbarui' : 'Refund berhasil dibuat');
      router.push(`/dashboard/${slug}/transaksi/refund-sparepart`);
    } catch (error: any) { toast.error(error?.message || 'Gagal menyimpan refund'); }
  };
  const pending = createMutation.isPending || updateMutation.isPending;
  return <form onSubmit={form.handleSubmit(submit)} className="max-w-2xl space-y-5 rounded-md border bg-white p-6 shadow-sm">
    <div><Label>Transaksi Sparepart</Label><Select value={form.watch('sparepart_transaction_id')} onValueChange={(value) => form.setValue('sparepart_transaction_id', value)} disabled={Boolean(existing)}><SelectTrigger className="mt-2"><SelectValue placeholder="Pilih transaksi" /></SelectTrigger><SelectContent>{available.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.code} — {item.type === 'purchase' ? 'Pembelian' : 'Penjualan'} — {item.sparepart?.name || `Sparepart #${item.sparepart_id}`}</SelectItem>)}</SelectContent></Select>{form.formState.errors.sparepart_transaction_id && <p className="mt-1 text-xs text-red-600">Transaksi wajib dipilih</p>}</div>
    <div><Label htmlFor="amount">Nominal Refund</Label><Input id="amount" type="number" min="1" className="mt-2" {...form.register('amount', { valueAsNumber: true, min: { value: 1, message: 'Nominal harus lebih dari 0' } })} />{form.formState.errors.amount && <p className="mt-1 text-xs text-red-600">{form.formState.errors.amount.message}</p>}</div>
    <div><Label htmlFor="payment_date">Tanggal Refund</Label><Controller control={form.control} name="payment_date" render={({ field }) => <InputDate id="payment_date" className="mt-2" {...field} />} /></div>
    <div><Label htmlFor="note">Catatan</Label><Input id="note" className="mt-2" {...form.register('note')} /></div>
    <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button><Button type="submit" disabled={pending}>{pending ? 'Menyimpan...' : 'Simpan'}</Button></div>
  </form>;
}
