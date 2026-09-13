import React from 'react';
import { AlertTriangle, Pencil, Printer, Truck } from 'lucide-react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DOEkspedisiDetailCard } from '@/components/features/do-ekspedisi/DOEkspedisiDetailCard';
import { DOEkspedisiPrintDocument } from '@/components/features/do-ekspedisi/DOEkspedisiPrintDocument';
import { DeleteDOEkspedisiModal } from '@/components/features/do-ekspedisi/DeleteDOEkspedisiModal';
import type { DoEkspedisiItem } from '@/@types/do-ekspedisi.types';
import { useDeleteDoEkspedisiItem, useDoEkspedisiDetail, useUpdateDoEkspedisi, useUpdateDoExpeditionStatus } from '@/hooks/useDoEkspedisi';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import { LoadingState } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ReportTemplatePrintDialog } from '@/components/ui/report-template-print-dialog';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/format';
import { DOEkspedisiRelatedData } from '@/components/features/do-ekspedisi/DOEkspedisiRelatedData';
import { useCompany } from '@/contexts/CompanyContext';
import { useReportTemplatePrint } from '@/hooks/useReportTemplatePrint';
import { getCompanyName, getLetterheadByCompanyId, resolveCompanyId } from '@/lib/print-letterhead';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// pagination helper removed (unused in print/detail view)

const getDoStatusBadgeClassName = (status: string) => {
  switch (String(status).toLowerCase()) {
    case 'draft':
      return 'border-slate-200 bg-slate-50 text-slate-700';
    case 'process':
      return 'border-blue-200 bg-blue-50 text-blue-700 font-semibold';
    case 'done':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold';
    case 'failed':
      return 'border-rose-200 bg-rose-50 text-rose-700 font-semibold';
    case 'pending':
      return 'border-amber-200 bg-amber-50 text-amber-700 font-semibold';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
};

const getDoStatusLabel = (status: string) => {
  switch (String(status).toLowerCase()) {
    case 'draft':
      return 'Draft';
    case 'process':
      return 'Proses';
    case 'done':
      return 'Selesai';
    case 'failed':
      return 'Gagal';
    case 'pending':
      return 'Tertunda';
    default:
      return status || '-';
  }
};

export default function DetailDOEkspedisiPage() {
  const router = useRouter();
  const { slug, id } = router.query;
  const { companyId } = useCompany();
  const resolvedCompanyId = resolveCompanyId(slug, companyId) || 1;
  const selectedPrintBackground = getLetterheadByCompanyId(resolvedCompanyId);
  const templatePrint = useReportTemplatePrint(selectedPrintBackground);

  const [selectedItem, setSelectedItem] = React.useState<DoEkspedisiItem | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [statusConfirmOpen, setStatusConfirmOpen] = React.useState(false);
  const autoPrintOpenedRef = React.useRef(false);

  const detailQuery = useDoEkspedisiDetail(id ? String(id) : null);
  const updateMutation = useUpdateDoEkspedisi();
  const updateStatusMutation = useUpdateDoExpeditionStatus();
  const deleteItemMutation = useDeleteDoEkspedisiItem();

  const updateStatus = async (status: 'draft' | 'process' | 'done') => {
    if (!id || !detailQuery.data) return;

    const now = new Date().toISOString();
    try {
      await updateMutation.mutateAsync({
        id: String(id),
        payload: {
          date: detailQuery.data.date,
          vehicle_id: detailQuery.data.vehicleId ?? '',
          driver_id: detailQuery.data.driverId ?? '',
          driver_note: detailQuery.data.driverNote,
          status,
          start_date: status === 'draft' ? null : status === 'process' ? (detailQuery.data.startDate || now) : detailQuery.data.startDate,
          end_date: status === 'draft' ? null : status === 'done' ? now : detailQuery.data.endDate,
        },
      });
      toast.success(status === 'process' ? 'Pengiriman dimulai' : status === 'done' ? 'DO Ekspedisi telah selesai' : 'DO Ekspedisi dikembalikan ke Draft');
      await detailQuery.refetch();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const backToList = React.useCallback(() => {
    if (slug) void router.push(`/dashboard/${slug}/do-ekspedisi`);
  }, [router, slug]);

  const pageHeader = (actions?: React.ReactNode) => (
    <PageHeader
      breadcrumbs={[
        { label: 'DO Ekspedisi', onClick: backToList },
        { label: 'Detail DO' },
      ]}
      title="Detail Delivery Order Ekspedisi"
      subtitle={(
        <div className="flex flex-wrap items-center gap-2">
          <span>Kode DO:</span>
          <span className="font-semibold text-orange-600">{detailQuery.data?.doCode}</span>
          {detailQuery.data && (
            <Badge variant="outline" className={cn('rounded-full px-3 py-1', getDoStatusBadgeClassName(detailQuery.data.status))}>
              {getDoStatusLabel(detailQuery.data.status)}
            </Badge>
          )}
          <span className="text-xs text-slate-500">Ditambahkan {detailQuery.data?.createdAt ? formatDate(detailQuery.data.createdAt) : ''}</span>
        </div>
      )}
      onBack={backToList}
      actions={actions}
    />
  );

  // Print effect removed (handled in dedicated print page)

  const handleDeleteItem = async () => {
    if (!selectedItem || !id) return;

    try {
      await deleteItemMutation.mutateAsync({
        id: selectedItem.id,
        doExpeditionId: String(id),
      });
      toast.success('Item DO berhasil dihapus');
      setDeleteOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus item DO');
    }
  };

  // Handle errors from detailQuery
  React.useEffect(() => {
    if (detailQuery.isError) {
      const errorMsg =
        detailQuery.error instanceof Error
          ? detailQuery.error.message
          : 'Gagal memuat detail DO Ekspedisi';
      toast.error(errorMsg);
    }
  }, [detailQuery.isError, detailQuery.error]);

  React.useEffect(() => {
    if (
      !router.isReady
      || router.query.print !== '1'
      || !detailQuery.data
      || autoPrintOpenedRef.current
    ) return;

    autoPrintOpenedRef.current = true;
    templatePrint.openPrintDialog();
    if (slug && id) {
      void router.replace(`/dashboard/${slug}/do-ekspedisi/detail/${id}`, undefined, { shallow: true });
    }
  }, [detailQuery.data, id, router, slug, templatePrint]);

  if (detailQuery.isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  // Check if router is ready and id is available
  if (!router.isReady || !id) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center text-yellow-600">ID DO tidak ditemukan</div>
      </DashboardLayout>
    );
  }

  if (detailQuery.isError) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          {pageHeader()}

          <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center">
            <p className="mb-4 text-red-700">
              {detailQuery.error instanceof Error
                ? detailQuery.error.message
                : 'Gagal memuat detail DO Ekspedisi'}
            </p>
            <button
              onClick={() => detailQuery.refetch()}
              disabled={detailQuery.isFetching}
              className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {detailQuery.isFetching ? 'Memuat ulang...' : 'Coba Lagi'}
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!detailQuery.data) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          {pageHeader()}

          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-6 text-center">
            <p className="mb-4 text-yellow-700">Data DO Ekspedisi tidak ditemukan</p>
            <button
              onClick={() => slug && router.push(`/dashboard/${slug}/do-ekspedisi`)}
              className="inline-flex items-center gap-2 rounded-md bg-yellow-600 px-4 py-2 text-white transition-colors hover:bg-yellow-700"
            >
              Kembali ke Daftar
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {pageHeader(
          <>
            {detailQuery.data?.status === 'draft' ? (
              <Button
                type="button"
                disabled={updateStatusMutation.isPending || !detailQuery.data.driverId || !detailQuery.data.vehicleId}
                onClick={() => setStatusConfirmOpen(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white min-w-[120px] cursor-pointer font-medium"
              >
                <Truck className="h-4 w-4" />
                {updateStatusMutation.isPending ? 'Memproses...' : 'Serahkan ke Driver'}
              </Button>
            ) : detailQuery.data?.status === 'pending' ? (
              <>
                <Button type="button" variant="outline" disabled={updateMutation.isPending} onClick={() => void updateStatus('draft')} className="min-w-[120px] border-slate-300 font-medium text-slate-700 hover:bg-slate-50" tooltip="Data DO belum diproses oleh Driver, data ini bisa dikembalikan ke Draft">
                  Kembalikan ke Draft
                </Button>
              </>
            ) : null}

            <Button
              variant="outline"
              disabled={detailQuery.data?.status !== 'draft'}
              onClick={() => slug && id && void router.push(`/dashboard/${slug}/do-ekspedisi/form/${id}`)}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button
              onClick={templatePrint.openPrintDialog}
              variant="outline"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </>,
        )}

        {(!detailQuery.data.driver || !detailQuery.data.vehicle) && (
          <Alert variant="warning">
            <AlertTriangle />
            <AlertTitle>Driver atau kendaraan belum dipilih</AlertTitle>
            <AlertDescription>
              Silakan klik Edit untuk melengkapi driver dan kendaraan sebelum memulai pengiriman.
            </AlertDescription>
          </Alert>
        )}

        <DOEkspedisiDetailCard data={detailQuery.data} />
        <DOEkspedisiRelatedData data={detailQuery.data} onRefresh={() => void detailQuery.refetch()} />

        {/* <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
            <div className="relative w-full sm:w-[320px]">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search here"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="h-12 rounded-md border-[#E5E7EB] bg-white pl-11"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-slate-600">Show</span>
              <Select value={String(perPage)} onValueChange={(value) => {
                setPerPage(Number(value));
              }}>
                <SelectTrigger className="h-12 w-[88px] rounded-md border-[#E5E7EB] bg-white">
                  <SelectValue placeholder="25" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-slate-600">Page</span>
            </div>
          </div>

          <Button onClick={() => slug && id && router.push(`/dashboard/${slug}/do-ekspedisi/detail/${id}/create`)} className="btn-primary-orange!">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Data
          </Button>
        </div> */}

        {/* <DOEkspedisiDetailTable
          data={tableData}
          page={page}
          perPage={perPage}
          isLoading={itemQuery.isLoading}
          onView={(item) => slug && id && router.push(`/dashboard/${slug}/do-ekspedisi/detail/${id}/item/${item.id}`)}
          onEdit={(item) => slug && id && router.push(`/dashboard/${slug}/do-ekspedisi/detail/${id}/item/${item.id}/edit`)}
          onDelete={(item) => {
            setSelectedItem(item);
            setDeleteOpen(true);
          }}
        /> */}

        {/* <div className="flex flex-col gap-4 px-1 pt-1 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm text-slate-500">
            Showing {startData}-{endData} of {totalData} data
          </div>

          {totalPages > 1 ? (
            <div className="flex flex-wrap items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1} className="text-slate-600">
                Previous
              </Button>
              {renderPagination(page, totalPages).map((item, index) => (
                <Button
                  key={`${item}-${index}`}
                  variant={item === page ? 'outline' : 'ghost'}
                  size="sm"
                  disabled={item === '...'}
                  onClick={() => typeof item === 'number' && setPage(item)}
                  className={item === page ? 'border-[#D7DEE7] bg-white' : 'text-slate-600'}
                >
                  {item}
                </Button>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setPage(page + 1)} disabled={page === totalPages} className="text-slate-600">
                Next
              </Button>
            </div>
          ) : null}
        </div> */}
      </div>

      <DeleteDOEkspedisiModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteItem}
        isDeleting={deleteItemMutation.isPending}
        itemName={selectedItem?.customerName}
      />

      <AlertDialog open={statusConfirmOpen} onOpenChange={setStatusConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Serahkan ke Driver?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menyerahkan DO Ekspedisi ini ke driver. Status akan berubah menjadi <span className="font-semibold text-amber-600">Tertunda</span>. Pastikan driver dan kendaraan sudah benar sebelum melanjutkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateStatusMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={updateStatusMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={async () => {
                if (!id) return;
                try {
                  await updateStatusMutation.mutateAsync({ id: String(id), status: 'pending' });
                  toast.success('DO Ekspedisi berhasil diserahkan ke driver');
                  setStatusConfirmOpen(false);
                } catch (error) {
                  toast.error(getApiErrorMessage(error));
                }
              }}
            >
              {updateStatusMutation.isPending ? 'Memproses...' : 'Ya, Serahkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {detailQuery.data && (
        <DOEkspedisiPrintDocument
          data={detailQuery.data}
          template={templatePrint.selectedTemplate}
          fallbackBackground={selectedPrintBackground}
          companyName={getCompanyName(resolvedCompanyId)}
          printedAt={templatePrint.printedAt}
        />
      )}

      <ReportTemplatePrintDialog
        open={templatePrint.isDialogOpen}
        onOpenChange={templatePrint.setIsDialogOpen}
        selectedTemplateId={templatePrint.selectedTemplateId}
        onTemplateChange={templatePrint.setSelectedTemplateId}
        onPrint={templatePrint.printWithSelectedTemplate}
        isPreparingPrint={templatePrint.isPreparingPrint}
        reportName="DO ekspedisi"
      />
    </DashboardLayout>
  );
}
