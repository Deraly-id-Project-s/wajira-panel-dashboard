import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Search } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { UploadInvoiceModal } from '@/components/features/material-receipt/UploadInvoiceModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMaterialTransaction, useMaterialTransactionItems, useUploadMaterialTransactionInvoice } from '@/hooks/useMaterialTransaction';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { getVisiblePageNumbers } from '@/lib/api/pagination';
import { ApiResponseError, ApiValidationError } from '@/lib/api/response';
import { LoadingState } from '@/components/ui/loading-state';

const formatDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function MaterialReleaseDetailPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const rawId = typeof router.query.id === 'string' ? Number(router.query.id) : NaN;
  const transactionId = Number.isFinite(rawId) ? rawId : undefined;
  const { page, perPage, search, setPage, setPerPage, setSearch } = useQueryParamsTable({ defaultPerPage: 25 });

  const transactionQuery = useMaterialTransaction(transactionId);
  const itemsQuery = useMaterialTransactionItems({
    page,
    perPage,
    search,
    materialTransactionId: transactionId,
    type: 'sales',
    enabled: !!transactionId,
  });

  const [openInvoiceModal, setOpenInvoiceModal] = useState(false);
  const uploadInvoiceMutation = useUploadMaterialTransactionInvoice();

  const transaction = transactionQuery.data;
  const items = itemsQuery.data?.data ?? [];
  const totalPages = itemsQuery.data?.meta.lastPage ?? 1;
  const pageNumbers = useMemo(() => getVisiblePageNumbers(totalPages, page, 5), [page, totalPages]);
  const totalData = itemsQuery.data?.meta.total ?? 0;
  const startData = totalData === 0 ? 0 : (page - 1) * perPage + 1;
  const endData = Math.min(page * perPage, totalData);

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
      if (error instanceof ApiValidationError) {
        toast.error(error.message || 'Validasi upload invoice gagal');
        return;
      }

      toast.error(error instanceof ApiResponseError ? error.message : 'Gagal mengunggah invoice');
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
        <div className="rounded-md border border-red-200 bg-red-50 p-10 text-center text-red-600">Data pengeluaran perlengkapan tidak ditemukan.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Data Pengeluaran Perlengkapan', onClick: () => router.push(`/dashboard/${slug}/warehouse/perlengkapan-keluar`) },
            { label: 'Detail' }
          ]}
          title="Data Pengeluaran Perlengkapan"
          subtitle={
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              No Pengeluaran
              {transaction?.code && (
                <span className="font-medium text-[#1f4163]">{transaction.code}</span>
              )}
            </div>
          }
          onBack={() => router.push(`/dashboard/${slug}/warehouse/perlengkapan-keluar`)}
        />

        <Card className="rounded-md border border-slate-200 bg-white p-5 shadow-none">
          <div className="space-y-6">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-[20px] font-semibold text-slate-950">Informasi Pengeluaran</h2>
              <Button onClick={() => setOpenInvoiceModal(true)} className="h-11 rounded-md bg-[#1f4163] px-6 text-[18px] hover:bg-[#183552]">
                Lihat Invoice
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="text-[15px] font-medium text-slate-900">No Pengeluaran</label>
                <Input value={transaction.code} readOnly className="h-12 rounded-md border-slate-200 bg-white text-[15px]" />
              </div>
              <div className="space-y-2">
                <label className="text-[15px] font-medium text-slate-900">Tanggal Keluar</label>
                <Input value={formatDate(transaction.transactionDate)} readOnly className="h-12 rounded-md border-slate-200 bg-white text-[15px]" />
              </div>
              <div className="space-y-2">
                <label className="text-[15px] font-medium text-slate-900">Tujuan / Supplier</label>
                <Input value={transaction.supplierName} readOnly className="h-12 rounded-md border-slate-200 bg-white text-[15px]" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[15px] font-medium text-slate-900">Keterangan</label>
              <textarea value={transaction.description ?? ''} readOnly className="min-h-[74px] w-full rounded-md border border-slate-200 px-4 py-3 text-[15px] outline-none" />
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[304px]">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search here" className="h-[42px] rounded-md border-slate-200 pl-11 shadow-sm" />
          </div>
          <div className="flex items-center gap-3 text-[16px] text-slate-800">
            <span>Show</span>
            <Select value={String(perPage)} onValueChange={(value) => setPerPage(Number(value))}>
              <SelectTrigger className="h-[42px] w-[60px] rounded-md border-slate-200 shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span>Page</span>
          </div>
        </div>

        <Card className="overflow-hidden rounded-[12px] border border-slate-200 bg-white shadow-none">
          <Table>
            <TableHeader className="bg-slate-100/90">
              <TableRow className="border-slate-200">
                <TableHead className="px-6 py-4 text-center text-[14px] font-semibold uppercase text-slate-950">NO</TableHead>
                <TableHead className="px-6 py-4 text-[14px] font-semibold uppercase text-slate-950">NO PENJUALAN</TableHead>
                <TableHead className="px-6 py-4 text-[14px] font-semibold uppercase text-slate-950">KODE BARANG</TableHead>
                <TableHead className="px-6 py-4 text-[14px] font-semibold uppercase text-slate-950">NAMA BARANG</TableHead>
                <TableHead className="px-6 py-4 text-center text-[14px] font-semibold uppercase text-slate-950">QTY</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemsQuery.isLoading || itemsQuery.isFetching ? (
                <TableRow>
                  <TableCell colSpan={100} className="h-28 text-center"><LoadingState variant="section" text="Memuat item material..." /></TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">Belum ada item material.</TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => (
                  <TableRow key={item.id} className="border-slate-200">
                    <TableCell className="px-6 py-3 text-center text-[15px] text-slate-800">{startData + index}</TableCell>
                    <TableCell className="px-6 py-3 text-[15px] text-slate-800">{item.orderCode ?? '-'}</TableCell>
                    <TableCell className="px-6 py-3 text-[15px] text-slate-800">{item.material?.code ?? '-'}</TableCell>
                    <TableCell className="px-6 py-3 text-[15px] text-slate-800">{item.material?.name ?? '-'}</TableCell>
                    <TableCell className="px-6 py-3 text-center text-[15px] text-slate-800">{item.qty}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-[14px] text-slate-500">Showing {startData}-{endData} of {totalData} data</p>
          <div className="flex items-center gap-1 text-[16px]">
            <Button variant="ghost" onClick={() => setPage(page - 1)} disabled={page <= 1}>Previous</Button>
            {pageNumbers.map((pageNumber) => (
              <Button key={pageNumber} variant={pageNumber === page ? 'outline' : 'ghost'} onClick={() => setPage(pageNumber)} className={pageNumber === page ? 'h-10 min-w-10 rounded-md border-slate-200 bg-white' : 'h-10 min-w-10 rounded-md'}>
                {pageNumber}
              </Button>
            ))}
            {totalPages > 5 && !pageNumbers.includes(totalPages) ? <span className="px-2 text-slate-500">...</span> : null}
            {totalPages > 5 && !pageNumbers.includes(totalPages) ? (
              <Button variant="ghost" onClick={() => setPage(totalPages)} className="h-10 min-w-10 rounded-md">{totalPages}</Button>
            ) : null}
            <Button variant="ghost" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>Next</Button>
          </div>
        </div>
      </div>

      <UploadInvoiceModal
        open={openInvoiceModal}
        onOpenChange={setOpenInvoiceModal}
        onSubmit={handleUploadInvoice}
        isSubmitting={uploadInvoiceMutation.isPending}
      />
    </DashboardLayout>
  );
}
