import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { FileText, Package, Pencil } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { useWarehouseActivityDetail, useWarehouseActivityStateUpdate, useProcessSparepartStock } from '@/hooks/useWarehouseActivity';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CopyBox } from '@/components/ui/copy-box';
import { formatDate } from '@/lib/utils/format';
import { ReferenceLink } from '@/components/ui/reference-link';
import { LoadingState } from '@/components/ui/loading-state';
import { Badge } from '@/components/ui/badge';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

export default function PengeluaranSparepartDetailPage() {
  const router = useRouter();
  const { id, slug } = router.query as { id?: string; slug?: string };

  const { data: detailData, isLoading } = useWarehouseActivityDetail(id);

  useEffect(() => {
    if (!isLoading && detailData && detailData.activity_type !== 'issue') {
      router.push(`/dashboard/${slug}/warehouse/pengeluaran-sparepart`);
    }
  }, [detailData, isLoading, router, slug]);

  const { hasPermission } = usePermissionGuard();
  const canEdit = hasPermission('warehouse:edit') || hasPermission('warehouse:activity');

  const [isUpdateStateDialogOpen, setIsUpdateStateDialogOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<'draft' | 'process' | 'done'>('draft');
  const [stateNote, setStateNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const updateStateMutation = useWarehouseActivityStateUpdate();
  const processStockMutation = useProcessSparepartStock();

  useEffect(() => {
    if (detailData?.state) {
      const s = detailData.state.toLowerCase();
      if (s === 'draft' || s === 'process' || s === 'done') {
        setSelectedState(s as 'draft' | 'process' | 'done');
      }
    }
    if (detailData?.state_note) {
      setStateNote(detailData.state_note);
    } else {
      setStateNote('');
    }
  }, [detailData]);

  const handleUpdateState = async () => {
    if (!id) return;
    try {
      await updateStateMutation.mutateAsync({
        activityId: id,
        state: selectedState,
        state_note: stateNote,
      });
      toast.success('Status pengeluaran berhasil diperbarui');
      setIsUpdateStateDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memperbarui status pengeluaran');
    }
  };

  const handleProcessStock = async () => {
    if (!id || !detailData) return;
    setIsProcessing(true);
    try {
      await processStockMutation.mutateAsync({
        activityId: id,
        activityType: 'issue',
        payload: {
          person_id: detailData.person?.id ? Number(detailData.person.id) : (detailData.sparepart_transaction?.person_id ?? null),
          cash_id: null,
          warehouse_id: detailData.warehouse?.id ? Number(detailData.warehouse.id) : (detailData.sparepart_transaction?.warehouse_id ?? null),
          type: detailData.type || null,
          unit_transaction_id: null,
          sparepart_transaction_id: detailData.sparepart_transaction?.id ?? null,
          activity_type: 'issue',
          activity_date: detailData.activity_date || new Date().toISOString(),
          description: detailData.description || null,
          state: 'done',
        },
      });
      toast.success('Stok sparepart berhasil diproses');
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memproses stok sparepart');
    } finally {
      setIsProcessing(false);
    }
  };

  const stateInfo = (() => {
    const s = detailData?.state?.toLowerCase();
    if (s === 'draft') return { text: 'Draft', bg: 'border-slate-200 bg-slate-50 text-slate-700' };
    if (s === 'process') return { text: 'Proses', bg: 'border-amber-200 bg-amber-50 text-amber-700' };
    if (s === 'done') return { text: 'Selesai', bg: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
    return { text: detailData?.state || '-', bg: 'border-slate-200 bg-slate-50 text-slate-700' };
  })();

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  const sparepartTx = detailData?.sparepart_transaction;
  const sparepartItem = sparepartTx?.sparepart;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Pengeluaran Sparepart', onClick: () => router.push(`/dashboard/${slug}/warehouse/pengeluaran-sparepart`) },
            { label: 'Detail Pengeluaran Sparepart' }
          ]}
          title="Detail Pengeluaran Sparepart"
          subtitle={
            <div className="flex items-center gap-2">
              <span>Kode Transaksi:</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:text-orange-700">
                {detailData?.activity_number || detailData?.noPenerimaan || '-'}
              </span>
              <Badge variant="outline" className={`font-semibold ${stateInfo.bg}`}>
                {stateInfo.text}
              </Badge>
            </div>
          }
          onBack={() => router.push(`/dashboard/${slug}/warehouse/pengeluaran-sparepart`)}
          actions={
            detailData?.state !== 'done' && (
              <Button
                onClick={handleProcessStock}
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 h-10 rounded-lg shadow-sm flex items-center gap-2 cursor-pointer"
              >
                {isProcessing ? 'Memproses...' : 'Proses Pengeluaran'}
              </Button>
            )
          }
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Card 1: Informasi Pengeluaran */}
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-blue-50">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700">Informasi Pengeluaran</h3>
              </div>
              <div className="text-sm text-slate-600 mt-3 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">No. Pengeluaran</p>
                    <p className="font-semibold text-slate-900">
                      <CopyBox text={detailData?.activity_number || detailData?.noPenerimaan || '-'} />
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Tanggal Pengeluaran</p>
                    <p className="font-semibold text-slate-900">{formatDate(detailData?.activity_date || detailData?.tanggal || '')}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-400">Warehouse/Gudang</span>
                  <span className="font-semibold text-slate-900">{detailData?.warehouse?.name || '-'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Customer</span>
                  <span className="font-semibold text-slate-900">
                    {detailData?.person?.name ? (
                      <ReferenceLink href={`/dashboard/${slug}/master/customer?search=${detailData?.person?.name}`}>
                        {detailData?.person?.name}
                      </ReferenceLink>
                    ) : '-'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Status Pengeluaran</span>
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    {canEdit && (
                      <button
                        onClick={() => setIsUpdateStateDialogOpen(true)}
                        className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                        title="Ubah Status Pengeluaran"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {detailData?.state ? (
                      <Badge variant="outline" className={`font-semibold ${stateInfo.bg}`}>
                        {stateInfo.text}
                      </Badge>
                    ) : '-'}
                  </span>
                </div>

                {detailData?.state_note && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-400">Catatan Status</span>
                    <span className="text-slate-950 font-medium">{detailData?.state_note}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Informasi Sparepart & Keterangan */}
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-amber-50">
                  <Package className="h-5 w-5 text-amber-500" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700">Detail Sparepart & Keterangan</h3>
              </div>
              <div className="text-sm text-slate-600 mt-3 space-y-2.5">
                {sparepartItem ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-slate-400 font-medium">Kode Sparepart</p>
                        <p className="font-semibold text-slate-900">
                          <CopyBox text={sparepartItem.code} />
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium">Nama Sparepart</p>
                        <p className="font-semibold text-slate-900">{sparepartItem.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-xs text-slate-400">Kuantitas</span>
                      <span className="font-bold text-slate-900">
                        {sparepartTx.qty} {sparepartItem.unit_type || 'pcs'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Harga Satuan</span>
                      <span className="font-medium text-slate-900">
                        {currenciesFormat('idr', sparepartTx.price)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Diskon</span>
                      <span className="font-medium text-slate-900">
                        {sparepartTx.discount}%
                      </span>
                    </div>

                    {sparepartTx.nota_number && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Nomor Nota</span>
                        <span className="font-medium text-slate-900">{sparepartTx.nota_number}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-slate-400 py-3">Tidak ada informasi sparepart</div>
                )}

                <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-400 font-medium">Keterangan / Catatan Transaksi</span>
                  <p className="text-slate-900 p-2.5 rounded-lg bg-slate-50 w-full min-h-[60px] text-xs leading-relaxed">
                    {detailData?.description || detailData?.keterangan || sparepartTx?.note || '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* DIALOG UPDATE STATUS */}
      <Dialog open={isUpdateStateDialogOpen} onOpenChange={setIsUpdateStateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-6 rounded-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">Ubah Status Pengeluaran</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Pilih status baru untuk aktivitas pengeluaran sparepart ini.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Status Baru</label>
              <Select
                value={selectedState}
                onValueChange={(val) => setSelectedState(val as 'draft' | 'process' | 'done')}
              >
                <SelectTrigger className="w-full bg-white border-slate-200 h-10 rounded-lg">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="process">Proses</SelectItem>
                  <SelectItem value="done">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Catatan Status</label>
              <Textarea
                placeholder="Masukkan catatan perubahan status..."
                value={stateNote}
                onChange={(e) => setStateNote(e.target.value)}
                className="w-full min-h-[80px] bg-white border-slate-200 rounded-lg p-2 text-sm focus:outline-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
            <Button variant="outline" className="rounded-lg" onClick={() => setIsUpdateStateDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleUpdateState}
              disabled={updateStateMutation.isPending}
              className="bg-[#1e3a5f] text-white hover:bg-[#152e4d] rounded-lg px-5"
            >
              {updateStateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
