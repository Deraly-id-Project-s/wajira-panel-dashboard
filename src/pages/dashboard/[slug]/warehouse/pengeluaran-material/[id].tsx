import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InvoicePreviewModal } from '@/components/features/goods-receipt/InvoicePreviewModal';
import { useGoodsIssue } from '@/hooks/useGoodsIssue';
import { formatCurrency, formatLongDate, getIssueBilling } from '@/components/features/goods-issue/goods-issue.utils';
import { LoadingState } from '@/components/ui/loading-state';

export default function GoodsIssueDetailPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const rawId = typeof router.query.id === 'string' ? Number(router.query.id) : NaN;
  const id = Number.isFinite(rawId) ? rawId : undefined;
  const query = useGoodsIssue(id);
  const [openInvoice, setOpenInvoice] = useState(false);

  const issue = query.data;
  const billing = useMemo(() => getIssueBilling(issue), [issue]);
  const payments = billing?.payments ?? [];

  if (query.isLoading) return <DashboardLayout><LoadingState variant="page" /></DashboardLayout>;
  if (!issue) return <DashboardLayout><div className="rounded-md border border-red-200 bg-red-50 p-10 text-center text-red-600">Detail pengeluaran material tidak ditemukan.</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Data Pengeluaran Material', onClick: () => router.push(`/dashboard/${slug}/warehouse/pengeluaran-material`) },
            { label: 'Detail' }
          ]}
          title="Data Pengeluaran Material"
          onBack={() => router.push(`/dashboard/${slug}/warehouse/pengeluaran-material`)}
        />

        <Card className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-6">
              <h2 className="text-[18px] font-semibold text-slate-900">Informasi Pengeluaran</h2>
              <Button onClick={() => setOpenInvoice(true)} className="h-10 rounded-[10px] px-5 text-[16px] button-theme-1!">Lihat Nota</Button>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[15px] font-medium text-slate-900">Kode Pengeluaran</label>
                <Input value={issue.code} readOnly className="h-11 rounded-md border-slate-200 text-[16px] text-slate-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[15px] font-medium text-slate-900">Tanggal Pengeluaran</label>
                <Input value={formatLongDate(issue.transactionDate)} readOnly className="h-11 rounded-md border-slate-200 text-[16px]" />
              </div>
              <div className="space-y-2">
                <label className="text-[15px] font-medium text-slate-900">Customer</label>
                <Input value={issue.customer?.name ?? '-'} readOnly className="h-11 rounded-md border-slate-200 text-[16px]" />
              </div>
              <div className="space-y-2">
                <label className="text-[15px] font-medium text-slate-900">Total Harga Penjualan</label>
                <Input value={formatCurrency(billing?.grandTotal ?? issue.totalBrutto)} readOnly className="h-11 rounded-md border-slate-200 text-[16px]" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[15px] font-medium text-slate-900">Keterangan</label>
              <Textarea value={issue.description ?? ''} readOnly rows={4} className="rounded-md border-slate-200 text-[16px]" />
            </div>
          </div>
        </Card>

        <Card className="rounded-md border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-slate-100">
              <TableRow className="border-slate-200">
                <TableHead className="px-5 py-4 text-[14px] font-semibold uppercase text-slate-900">NO</TableHead>
                <TableHead className="px-5 py-4 text-[14px] font-semibold uppercase text-slate-900">KODE BARANG</TableHead>
                <TableHead className="px-5 py-4 text-[14px] font-semibold uppercase text-slate-900">NAMA BARANG</TableHead>
                <TableHead className="px-5 py-4 text-[14px] font-semibold uppercase text-slate-900">QTY</TableHead>
                <TableHead className="px-5 py-4 text-[14px] font-semibold uppercase text-slate-900">SATUAN</TableHead>
                <TableHead className="px-5 py-4 text-[14px] font-semibold uppercase text-slate-900">HARGA SATUAN</TableHead>
                <TableHead className="px-5 py-4 text-[14px] font-semibold uppercase text-slate-900">TOTAL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issue.goodsTransactionDetails.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-slate-500">Belum ada detail material.</TableCell></TableRow>
              ) : issue.goodsTransactionDetails.map((item, index) => (
                <TableRow key={item.id} className="border-slate-200">
                  <TableCell className="px-5 py-4 text-[15px]">{index + 1}</TableCell>
                  <TableCell className="px-5 py-4 text-[15px]">{item.material?.code ?? '-'}</TableCell>
                  <TableCell className="px-5 py-4 text-[15px]">{item.material?.name ?? '-'}</TableCell>
                  <TableCell className="px-5 py-4 text-[15px]">{item.qty}</TableCell>
                  <TableCell className="px-5 py-4 text-[15px]">{item.type.toUpperCase()}</TableCell>
                  <TableCell className="px-5 py-4 text-[15px]">{formatCurrency(item.price)}</TableCell>
                  <TableCell className="px-5 py-4 text-[15px]">{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-5">
            <h2 className="text-[18px] font-semibold text-slate-900">Informasi Billing</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Grand Total</p>
                <p className="mt-1 text-[20px] font-semibold text-slate-900">{formatCurrency(billing?.grandTotal ?? issue.totalBrutto)}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Status</p>
                <p className="mt-1 text-[20px] font-semibold text-slate-900">{issue.isPaid ? 'Lunas' : 'Belum Lunas'}</p>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-[16px] font-semibold text-slate-900">History Pembayaran</h3>
              <div className="space-y-3">
                {payments.length === 0 ? (
                  <div className="rounded-md border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">Belum ada history pembayaran.</div>
                ) : payments.map((payment) => (
                  <div key={payment.id} className="rounded-md border border-slate-200 px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[15px] font-medium text-slate-900">{payment.cash?.description ?? payment.cash?.code ?? 'Pembayaran'}</p>
                        <p className="text-sm text-slate-500">{payment.transactionDate ?? '-'}</p>
                      </div>
                      <p className="text-[16px] font-semibold text-slate-900">{formatCurrency(payment.amount)}</p>
                    </div>
                    {payment.description ? <p className="mt-2 text-sm text-slate-500">{payment.description}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <InvoicePreviewModal open={openInvoice} onOpenChange={setOpenInvoice} invoiceFile={issue.invoiceFile} />
    </DashboardLayout>
  );
}
