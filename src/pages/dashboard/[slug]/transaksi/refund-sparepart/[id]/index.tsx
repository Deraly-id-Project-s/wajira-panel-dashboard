import { useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { CopyBox } from '@/components/ui/copy-box';
import { formatDate } from '@/lib/utils/format';
import { useCreateSparepartRefundPayment, useDeleteSparepartRefundPayment, useSparepartRefund } from '@/hooks/useSparepartRefund';

export default function SparepartRefundDetailPage() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : undefined;
  const query = useSparepartRefund(id);
  const createPayment = useCreateSparepartRefundPayment();
  const deletePayment = useDeleteSparepartRefundPayment();
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const refund = query.data;
  const totalPaid = refund?.total_paid ?? (refund?.payments || []).reduce((sum, item) => sum + Number(item.amount), 0);
  const remaining = refund ? Math.max(0, refund.amount - totalPaid) : 0;
  const addPayment = async (event: React.FormEvent) => { event.preventDefault(); if (!refund || Number(amount) <= 0 || Number(amount) > remaining) { toast.error('Nominal pembayaran tidak valid'); return; } try { await createPayment.mutateAsync({ sparepart_transaction_refund_id: refund.id, amount: Number(amount), payment_date: paymentDate }); setAmount(''); toast.success('Pembayaran refund berhasil ditambahkan'); } catch (error: any) { toast.error(error?.message || 'Gagal menambahkan pembayaran'); } };
  const removePayment = async (paymentId: string) => { if (!window.confirm('Hapus pembayaran refund ini?')) return; try { await deletePayment.mutateAsync(paymentId); toast.success('Pembayaran berhasil dihapus'); } catch (error: any) { toast.error(error?.message || 'Gagal menghapus pembayaran'); } };
  if (query.isLoading) return <DashboardLayout><div>Memuat data...</div></DashboardLayout>;
  if (!refund) return <DashboardLayout><div>Data refund tidak ditemukan.</div></DashboardLayout>;
  return <DashboardLayout><div className="space-y-6"><PageHeader title="Detail Refund Sparepart" breadcrumbs={[{ label: 'Data Refund Sparepart', onClick: () => router.back() }, { label: refund.code }]} /><div className="grid gap-4 md:grid-cols-4">{[['Kode Refund', <CopyBox key="refund-code" text={refund.code} />], ['Transaksi', <CopyBox key="transaction-code" text={refund.transaction?.code || '-'} />], ['Tanggal', formatDate(refund.payment_date || refund.refund_date || '-')], ['Nominal', currenciesFormat('idr', refund.amount)]].map(([label, value]) => <div className="rounded-lg border bg-white p-4" key={String(label)}><p className="text-xs text-slate-500">{label}</p><div className="mt-2 font-semibold">{value}</div></div>)}</div><div className="rounded-lg border bg-white p-6"><h2 className="mb-4 text-lg font-semibold">Refund Payment</h2><form onSubmit={addPayment} className="mb-6 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end"><div><Label>Nominal</Label><Input type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} /></div><div><Label>Tanggal Pembayaran</Label><Input type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} /></div><Button type="submit" disabled={remaining <= 0 || createPayment.isPending}>Tambah Pembayaran</Button></form><div className="mb-4 flex gap-6 text-sm"><span>Total dibayar: <b>{currenciesFormat('idr', totalPaid)}</b></span><span>Sisa: <b className="text-amber-700">{currenciesFormat('idr', remaining)}</b></span></div><div className="divide-y">{(refund.payments || []).map((payment) => <div className="flex items-center justify-between py-3" key={payment.id}><div><CopyBox text={payment.code || payment.id} /><p className="text-xs text-slate-500">{formatDate(payment.payment_date)}</p></div><div className="flex items-center gap-4"><span>{currenciesFormat('idr', payment.amount)}</span><Button variant="ghost" size="sm" className="text-red-600" onClick={() => removePayment(payment.id)}>Hapus</Button></div></div>)}</div></div></div></DashboardLayout>;
}
