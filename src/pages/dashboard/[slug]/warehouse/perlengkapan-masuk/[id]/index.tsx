import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { UploadInvoiceModal } from '@/components/features/material-receipt/UploadInvoiceModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ApiResponseError, ApiValidationError } from '@/lib/api/response';
import { useKas } from '@/hooks/useKas';

// Import new services & hooks
import {
  useGoodsReceiptEquipmentDetail,
  useUploadGoodsReceiptInvoice,
  useCreateGoodsReceiptBilling,
  useDeleteGoodsReceiptBilling,
  useCreateGoodsReceiptPayment,
  useDeleteGoodsReceiptPayment,
} from '@/hooks/warehouse/useGoodsReceiptEquipment';
import { GoodsReceiptEquipmentPaymentModal } from '@/components/features/warehouse/receipt-equipment/GoodsReceiptEquipmentPaymentModal';
import {
  formatDate,
  formatCurrency,
  getReceiptBilling,
  resolveInvoiceUrl,
} from '@/components/features/warehouse/receipt-equipment/goodsReceiptEquipment.utils';
import type { GoodsReceiptEquipmentPaymentFormValues } from '@/scheme/goods-receipt-equipment.schema';
import { LoadingState } from '@/components/ui/loading-state';

const getErrorMessage = (error: any): string => {
  if (error instanceof ApiValidationError) {
    const first = Object.values(error.fieldErrors)[0]?.[0];
    if (first) return first;
  }
  if (error instanceof ApiResponseError) {
    return error.message;
  }
  if (error && typeof error === 'object') {
    const details = error.details;
    if (details) {
      if (typeof details === 'object') {
        const first = Object.values(details)[0];
        if (Array.isArray(first) && first[0]) return first[0];
        if (typeof first === 'string') return first;
      }
      if (typeof details === 'string') return details;
    }
    if (error.message) return error.message;
  }
  return 'Gagal memproses data';
};

export default function PerlengkapanMasukDetailPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const rawId = typeof router.query.id === 'string' ? Number(router.query.id) : NaN;
  const transactionId = Number.isFinite(rawId) ? rawId : undefined;

  const transactionQuery = useGoodsReceiptEquipmentDetail(transactionId);
  const cashesQuery = useKas(4); // Wajira Transindo company ID

  const uploadInvoiceMutation = useUploadGoodsReceiptInvoice();
  const createBillingMutation = useCreateGoodsReceiptBilling();
  const deleteBillingMutation = useDeleteGoodsReceiptBilling();
  const createPaymentMutation = useCreateGoodsReceiptPayment();
  const deletePaymentMutation = useDeleteGoodsReceiptPayment();

  // Modals state
  const [openInvoiceModal, setOpenInvoiceModal] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);

  const transaction = transactionQuery.data;
  const billing = getReceiptBilling(transaction);
  const items = transaction?.goodsTransactionDetails ?? [];

  const handleUploadInvoice = async (file: File | null) => {
    if (!transactionId || !transaction) return;
    if (!file) {
      toast.error('Silakan pilih file invoice terlebih dahulu');
      return;
    }

    try {
      await uploadInvoiceMutation.mutateAsync({ id: transactionId, file });
      toast.success(`Invoice untuk ${transaction.code} berhasil diunggah`);
      setOpenInvoiceModal(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleCreateBilling = async () => {
    if (!transactionId) return;
    try {
      await createBillingMutation.mutateAsync({ goodsTransactionId: transactionId });
      toast.success('Billing berhasil dibuat');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDeleteBilling = async () => {
    if (!billing || !transactionId) return;
    try {
      await deleteBillingMutation.mutateAsync({ id: billing.id, goodsTransactionId: transactionId });
      toast.success('Billing berhasil dihapus');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handlePaymentSubmit = async (values: GoodsReceiptEquipmentPaymentFormValues) => {
    if (!billing || !transactionId) return;
    try {
      await createPaymentMutation.mutateAsync({
        goodsTransactionBillingId: billing.id,
        cashId: values.cashId,
        amount: values.amount,
        transactionDate: values.transactionDate,
        description: values.description,
      });
      toast.success('Pembayaran billing berhasil ditambahkan');
      setOpenPaymentModal(false);
      transactionQuery.refetch();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!transactionId) return;
    try {
      await deletePaymentMutation.mutateAsync({ id: paymentId, goodsTransactionId: transactionId });
      toast.success('Pembayaran berhasil dihapus');
      transactionQuery.refetch();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (transactionQuery.isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (!transaction) {
    return (
      <DashboardLayout>
        <div className="rounded-md border border-red-200 bg-red-50 p-10 text-center text-red-600">
          Data penerimaan perlengkapan tidak ditemukan.
        </div>
      </DashboardLayout>
    );
  }

  const invoiceUrl = resolveInvoiceUrl(transaction.invoiceFile);
  const remainingBillingAmount = billing
    ? billing.grandTotal - billing.payments.reduce((sum, p) => sum + p.amount, 0)
    : transaction.totalBrutto;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Penerimaan Perlengkapan', onClick: () => router.push(`/dashboard/${slug}/warehouse/perlengkapan-masuk`) },
            { label: 'Detail' }
          ]}
          title="Detail Penerimaan Perlengkapan"
          subtitle={
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              Detail transaksi penerimaan perlengkapan
              {transaction?.code && (
                <span className="font-medium text-[#1f4163]">Kode Transaksi: {transaction.code}</span>
              )}
            </div>
          }
          onBack={() => router.push(`/dashboard/${slug}/warehouse/perlengkapan-masuk`)}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="col-span-2 rounded-md border border-slate-200 bg-white p-6 shadow-none space-y-6">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-[20px] font-semibold text-slate-950">Informasi Penerimaan</h2>
              <div className="flex gap-2">
                {invoiceUrl ? (
                  <Button variant="outline" asChild className="h-10 rounded-md px-4 text-slate-700">
                    <a href={invoiceUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="mr-2 h-4 w-4" />
                      Unduh Invoice / Nota
                    </a>
                  </Button>
                ) : null}
                <Button onClick={() => setOpenInvoiceModal(true)} className="h-10 rounded-md bg-[#1f4163] px-4 hover:bg-[#183552]">
                  {invoiceUrl ? 'Ganti Invoice' : 'Upload Invoice'}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[15px] font-medium text-slate-900">Kode Penerimaan</label>
                <Input value={transaction.code} readOnly className="h-11 rounded-md border-slate-200 bg-slate-50 text-[15px]" />
              </div>
              <div className="space-y-2">
                <label className="text-[15px] font-medium text-slate-900">Tanggal Terima</label>
                <Input value={formatDate(transaction.transactionDate)} readOnly className="h-11 rounded-md border-slate-200 bg-slate-50 text-[15px]" />
              </div>
              <div className="space-y-2">
                <label className="text-[15px] font-medium text-slate-900">Supplier</label>
                <Input value={transaction.supplier?.name ?? '-'} readOnly className="h-11 rounded-md border-slate-200 bg-slate-50 text-[15px]" />
              </div>
              <div className="space-y-2">
                <label className="text-[15px] font-medium text-slate-900">Lokasi</label>
                <Input value={transaction.location ?? '-'} readOnly className="h-11 rounded-md border-slate-200 bg-slate-50 text-[15px]" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[15px] font-medium text-slate-900">Keterangan</label>
              <textarea value={transaction.description ?? ''} readOnly className="min-h-[74px] w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] outline-none" />
            </div>
          </Card>

          <Card className="rounded-md border border-slate-200 bg-white p-6 shadow-none space-y-6">
            <h2 className="text-[20px] font-semibold text-slate-950 border-b border-slate-200 pb-5">Ringkasan Billing</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[15px]">
                <span className="text-slate-500">Total Brutto</span>
                <span className="font-semibold text-slate-900">{formatCurrency(transaction.totalBrutto)}</span>
              </div>

              {billing ? (
                <>
                  <div className="flex justify-between items-center text-[15px]">
                    <span className="text-slate-500">Grand Total Billing</span>
                    <span className="font-semibold text-slate-950">{formatCurrency(billing.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[15px]">
                    <span className="text-slate-500">Sisa Tagihan</span>
                    <span className={`font-semibold ${remainingBillingAmount > 0 ? 'text-red-600' : 'text-green-700'}`}>
                      {formatCurrency(remainingBillingAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[15px] border-t border-slate-100 pt-3">
                    <span className="text-slate-500">Status Pembayaran</span>
                    {billing.isPaid ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Lunas
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                        Belum Lunas
                      </span>
                    )}
                  </div>

                  {!billing.isPaid && (
                    <Button onClick={() => setOpenPaymentModal(true)} className="w-full mt-4 h-10 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white">
                      Bayar Billing
                    </Button>
                  )}

                  <Button onClick={handleDeleteBilling} variant="outline" className="w-full h-10 rounded-md text-red-600 border-red-200 hover:bg-red-50">
                    Hapus Billing
                  </Button>
                </>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="rounded-md bg-slate-50 p-4 text-center text-sm text-slate-500">
                    Billing belum dibuat untuk transaksi ini.
                  </div>
                  <Button onClick={handleCreateBilling} className="w-full h-10 rounded-md bg-[#1f4163] hover:bg-[#183552] text-white">
                    Buat Billing
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {billing && billing.payments && billing.payments.length > 0 && (
          <Card className="rounded-md border border-slate-200 bg-white p-6 shadow-none space-y-4">
            <h2 className="text-[18px] font-semibold text-slate-950">Riwayat Pembayaran</h2>
            <div className="overflow-hidden rounded-md border border-slate-200">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-12 text-center">NO</TableHead>
                    <TableHead>TANGGAL BAYAR</TableHead>
                    <TableHead>KAS AKUN</TableHead>
                    <TableHead>JUMLAH BAYAR</TableHead>
                    <TableHead>KETERANGAN</TableHead>
                    <TableHead className="w-16 text-center">AKSI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billing.payments.map((payment, idx) => (
                    <TableRow key={payment.id} className="hover:bg-slate-50/50">
                      <TableCell className="text-center">{idx + 1}</TableCell>
                      <TableCell>{formatDate(payment.transactionDate)}</TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900">{payment.cash?.description || '-'}</div>
                        <div className="text-xs text-slate-500">{payment.cash?.code || ''}</div>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{payment.description || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePayment(payment.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        <Card className="rounded-md border border-slate-200 bg-white p-6 shadow-none space-y-4">
          <h2 className="text-[18px] font-semibold text-slate-950">Daftar Barang Perlengkapan</h2>
          <div className="overflow-hidden rounded-md border border-slate-200">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[56px] px-5 py-4 text-center text-[14px] font-semibold uppercase text-slate-950">NO</TableHead>
                  <TableHead className="px-5 py-4 text-[14px] font-semibold uppercase text-slate-950">KODE BARANG</TableHead>
                  <TableHead className="px-5 py-4 text-[14px] font-semibold uppercase text-slate-950">NAMA BARANG</TableHead>
                  <TableHead className="px-5 py-4 text-[14px] font-semibold uppercase text-slate-950">HARGA SATUAN</TableHead>
                  <TableHead className="px-5 py-4 text-center text-[14px] font-semibold uppercase text-slate-950">QTY</TableHead>
                  <TableHead className="px-5 py-4 text-[14px] font-semibold uppercase text-slate-950">TOTAL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                      Belum ada item perlengkapan.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/50">
                      <TableCell className="px-5 py-4 text-center text-[15px] text-slate-800">{index + 1}</TableCell>
                      <TableCell className="px-5 py-4 text-[15px] text-slate-800">{item.vehicleEquipment?.code ?? '-'}</TableCell>
                      <TableCell className="px-5 py-4 text-[15px] text-slate-800">{item.vehicleEquipment?.name ?? '-'}</TableCell>
                      <TableCell className="px-5 py-4 text-[15px] text-slate-800">{formatCurrency(item.price || 0)}</TableCell>
                      <TableCell className="px-5 py-4 text-center text-[15px] font-semibold text-slate-900">{item.qty}</TableCell>
                      <TableCell className="px-5 py-4 text-[15px] font-semibold text-slate-900">{formatCurrency((item.price || 0) * item.qty)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <UploadInvoiceModal
        open={openInvoiceModal}
        onOpenChange={setOpenInvoiceModal}
        onSubmit={handleUploadInvoice}
        isSubmitting={uploadInvoiceMutation.isPending}
        title="Upload Nota Penerimaan"
        description="Masukkan file invoice / nota perlengkapan masuk"
      />

      {transaction && billing && (
        <GoodsReceiptEquipmentPaymentModal
          open={openPaymentModal}
          onOpenChange={setOpenPaymentModal}
          onSubmit={handlePaymentSubmit}
          isSubmitting={createPaymentMutation.isPending}
          transaction={transaction}
          totalAmount={remainingBillingAmount}
          cashes={cashesQuery.data?.data ?? []}
          isLoadingCashes={cashesQuery.isLoading}
        />
      )}
    </DashboardLayout>
  );
}
