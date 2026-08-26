import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { GoodsReceiptTable } from '@/components/features/goods-receipt/GoodsReceiptTable';
import { GoodsReceiptFormModal } from '@/components/features/goods-receipt/GoodsReceiptFormModal';
import { GoodsReceiptPaymentModal } from '@/components/features/goods-receipt/GoodsReceiptPaymentModal';
import { GoodsReceiptUploadModal } from '@/components/features/goods-receipt/GoodsReceiptUploadModal';
import type { ApiError } from '@/types/api';
import type { GoodsReceipt } from '@/types/goods-receipt.types';
import { useCompany } from '@/contexts/CompanyContext';
import { useKas } from '@/hooks/useKas';
import {
  useCreateGoodsReceipt,
  useCreateGoodsReceiptBilling,
  useCreateGoodsReceiptPayment,
  useDeleteGoodsReceipt,
  useGoodsReceipt,
  useGoodsReceipts,
  useUploadGoodsReceiptInvoice,
} from '@/hooks/useGoodsReceipt';
import { useSuppliers } from '@/hooks/useSupplier';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { ApiResponseError, ApiValidationError } from '@/lib/api/response';
import type { GoodsReceiptFormValues, GoodsReceiptPaymentFormValues } from '@/schemas/goods-receipt.schema';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

const translateBackendMessageToIndonesian = (message: string) => {
  const normalized = message.trim();

  const exactMap: Record<string, string> = {
    'The invoice file field is required.': 'File nota wajib diunggah.',
    'The invoice file must be a file of type: pdf, doc, docx, jpg, jpeg, png.': 'File nota harus berformat PDF, DOC, DOCX, JPG, JPEG, atau PNG.',
    'The invoice file failed to upload.': 'File nota gagal diunggah.',
    'The selected invoice file is invalid.': 'File nota yang dipilih tidak valid.',
    'No file uploaded.': 'Belum ada file yang diunggah.',
    'Request failed': 'Permintaan gagal diproses.',
  };

  if (exactMap[normalized]) return exactMap[normalized];

  return normalized
    .replace(/invoice file/gi, 'file nota')
    .replace(/failed to upload/gi, 'gagal diunggah')
    .replace(/must be a file of type/gi, 'harus berformat')
    .replace(/field is required/gi, 'wajib diisi')
    .replace(/the selected/gi, '')
    .replace(/is invalid/gi, 'tidak valid')
    .replace(/no file uploaded/gi, 'belum ada file yang diunggah')
    .replace(/method not allowed/gi, 'metode request tidak diizinkan')
    .replace(/server error/gi, 'terjadi kesalahan pada server')
    .trim();
};

const readUploadInvoiceError = (error: unknown) => {
  if (error instanceof ApiValidationError) {
    const firstFieldError = Object.values(error.fieldErrors)[0]?.[0];
    return translateBackendMessageToIndonesian(firstFieldError || error.message);
  }

  if (error instanceof ApiResponseError) {
    return translateBackendMessageToIndonesian(error.message);
  }

  const apiError = error as ApiError & {
    details?: Record<string, unknown> | string;
    response?: { data?: { message?: string; errors?: Record<string, string[]> } };
  };

  const fieldErrors = apiError.response?.data?.errors;
  const firstFieldError = fieldErrors ? Object.values(fieldErrors)[0]?.[0] : undefined;
  const rawMessage =
    firstFieldError ||
    apiError.response?.data?.message ||
    (typeof apiError.details === 'string' ? apiError.details : undefined) ||
    apiError.message;

  return translateBackendMessageToIndonesian(rawMessage || 'Gagal mengunggah nota.');
};

export default function GoodsReceiptListPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const companyIdValue = Number(companyId ?? '3') || 3;
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const { page, perPage, search, setPage, setPerPage, setSearch } = useQueryParamsTable({ defaultPerPage: 25 });

  const listQuery = useGoodsReceipts({ page, perPage, supplier_name: search, companyId: companyIdValue });
  const suppliersQuery = useSuppliers(String(companyIdValue));
  const cashesQuery = useKas(companyIdValue);
  const createMutation = useCreateGoodsReceipt();
  const deleteMutation = useDeleteGoodsReceipt();
  const createBillingMutation = useCreateGoodsReceiptBilling();
  const createPaymentMutation = useCreateGoodsReceiptPayment();
  const uploadMutation = useUploadGoodsReceiptInvoice();

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('warehouse:create');
  const canEdit = hasPermission('warehouse:edit');
  const canDelete = hasPermission('warehouse:delete');

  const [openForm, setOpenForm] = useState(false);
  const [selectedPay, setSelectedPay] = useState<GoodsReceipt | null>(null);
  const [selectedUpload, setSelectedUpload] = useState<GoodsReceipt | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GoodsReceipt | null>(null);
  const [supplierSearch, setSupplierSearch] = useState('');

  const paymentDetailQuery = useGoodsReceipt(selectedPay?.id);
  const paymentTransaction = paymentDetailQuery.data ?? selectedPay;
  const paymentTotal = paymentDetailQuery.data?.goodsTransactionBillings?.[0]?.grandTotal ?? paymentDetailQuery.data?.totalBrutto ?? selectedPay?.totalBrutto ?? 0;

  const handleCreate = async (values: GoodsReceiptFormValues) => {
    try {
      await createMutation.mutateAsync({
        supplierId: values.supplierId,
        transactionDate: values.transactionDate,
        description: values.description,
        companyId: companyIdValue,
      });
      toast.success('Data penerimaan material berhasil dibuat');
      setOpenForm(false);
    } catch (error) {
      const message = error instanceof ApiValidationError || error instanceof ApiResponseError ? error.message : 'Gagal menyimpan data penerimaan material';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Data penerimaan material berhasil dihapus');
      setDeleteTarget(null);
    } catch (error) {
      const message = error instanceof ApiResponseError ? error.message : 'Gagal menghapus data penerimaan material';
      toast.error(message);
    }
  };

  const handlePayment = async (values: GoodsReceiptPaymentFormValues) => {
    const detail = paymentDetailQuery.data;
    if (!selectedPay || !detail) return;

    try {
      let billingId = detail.goodsTransactionBillings[0]?.id;
      if (!billingId) {
        const createdBilling = await createBillingMutation.mutateAsync({ goodsTransactionId: detail.id });
        billingId = createdBilling.id;
      }

      await createPaymentMutation.mutateAsync({
        goodsTransactionBillingId: billingId,
        cashId: values.cashId,
        amount: values.amount,
        transactionDate: values.transactionDate,
        description: values.description,
      });

      toast.success('Pembayaran penerimaan material berhasil disimpan');
      setSelectedPay(null);
    } catch (error) {
      const message = error instanceof ApiValidationError || error instanceof ApiResponseError ? error.message : 'Gagal menyimpan pembayaran';
      toast.error(message);
    }
  };

  const handleUpload = async (file: File | null) => {
    if (!selectedUpload || !file) {
      toast.error('File nota wajib dipilih');
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        id: selectedUpload.id,
        payload: {
          invoiceFile: file,
        },
      });
      toast.success('Nota berhasil diunggah');
      setSelectedUpload(null);
    } catch (error) {
      toast.error(readUploadInvoiceError(error));
    }
  };

  const suppliers = useMemo(() => suppliersQuery.data?.data ?? [], [suppliersQuery.data?.data]);
  const cashes = useMemo(() => cashesQuery.data?.data ?? [], [cashesQuery.data?.data]);

  return (
    <DashboardLayout>
      <GoodsReceiptTable
        slug={slug}
        data={listQuery.data?.data ?? []}
        totalData={listQuery.data?.meta.total ?? 0}
        page={page}
        perPage={perPage}
        search={search}
        isLoading={listQuery.isLoading || listQuery.isFetching}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        onSearchChange={setSearch}
        onAdd={canCreate ? () => setOpenForm(true) : undefined}
        onPay={setSelectedPay}
        onUpload={setSelectedUpload}
        onDelete={canDelete ? setDeleteTarget : undefined}
      />

      <GoodsReceiptFormModal
        open={openForm}
        onOpenChange={setOpenForm}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
        suppliers={suppliers}
        isLoadingSuppliers={suppliersQuery.isLoading}
        supplierSearch={supplierSearch}
        onSupplierSearchChange={setSupplierSearch}
      />

      {paymentTransaction ? (
        <GoodsReceiptPaymentModal
          open={!!selectedPay}
          onOpenChange={(open) => !open && setSelectedPay(null)}
          onSubmit={handlePayment}
          isSubmitting={createBillingMutation.isPending || createPaymentMutation.isPending}
          transaction={paymentTransaction}
          totalAmount={paymentTotal}
          cashes={cashes}
          isLoadingCashes={cashesQuery.isLoading || paymentDetailQuery.isLoading}
        />
      ) : null}

      <GoodsReceiptUploadModal
        open={!!selectedUpload}
        onOpenChange={(open) => !open && setSelectedUpload(null)}
        onSubmit={handleUpload}
        isSubmitting={uploadMutation.isPending}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data penerimaan material?</AlertDialogTitle>
            <AlertDialogDescription>{deleteTarget ? `Data ${deleteTarget.code} akan dihapus secara permanen.` : 'Data akan dihapus secara permanen.'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending} className="bg-red-600 hover:bg-red-700">
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
