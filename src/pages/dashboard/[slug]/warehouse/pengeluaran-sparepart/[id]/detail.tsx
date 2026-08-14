import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { ChevronRight, ArrowLeft, FileText, Package, Pencil } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useWarehouseActivityDetail, useWarehouseActivityStateUpdate } from '@/hooks/useWarehouseActivity';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CopyBox } from '@/components/ui/copy-box';
import { formatDate } from '@/lib/utils/format';
import { ReferenceLink } from '@/components/ui/reference-link';
import { LoadingState } from '@/components/ui/loading-state';
import { Badge } from '@/components/ui/badge';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
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
  const slugStr = typeof slug === 'string' ? slug : '';

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

  const updateStateMutation = useWarehouseActivityStateUpdate();

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

  const stateInfo = (() => {
    const s = detailData?.state?.toLowerCase();
    if (s === 'draft') return { text: 'Draft', bg: 'border-slate-200 bg-slate-50 text-slate-700' };
    if (s === 'process') return { text: 'Proses', bg: 'border-amber-200 bg-amber-50 text-amber-700' };
    if (s === 'done') return { text: 'Selesai', bg: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
    return { text: detailData?.state || '-', bg: 'border-slate-200 bg-slate-50 text-slate-700' };
  })();

  const itemDetails = useMemo(() => {
    if (!detailData?.sparepart_transaction) return [];
    const st = detailData.sparepart_transaction;
    return [
      {
        id: st.id,
        code: st.code,
        sparepartName: st.sparepart?.name || detailData.sparepart?.name || '-',
        sparepartCode: st.sparepart?.code || detailData.sparepart?.code || '-',
        qty: st.qty || detailData.qty || 1,
        unitType: st.sparepart?.unit_type || detailData.sparepart?.unit_type || '-',
      }
    ];
  }, [detailData]);

  const columns: ColumnDef<any>[] = [
    {
      header: 'No. Transaksi',
      accessorKey: 'code',
      alignment: 'left',
      cell: (item) => <CopyBox text={item.code} />,
    },
    {
      header: 'Kode Sparepart',
      accessorKey: 'sparepartCode',
      alignment: 'left',
      cell: (item) => <CopyBox text={item.sparepartCode} />,
    },
    {
      header: 'Nama Sparepart',
      accessorKey: 'sparepartName',
      alignment: 'left',
      cell: (item) => (
        <ReferenceLink href={`/dashboard/${slugStr}/master/sparepart?search=${item.sparepartName}`}>
          {item.sparepartName}
        </ReferenceLink>
      ),
    },
    {
      header: 'Kuantitas',
      accessorKey: 'qty',
      alignment: 'center',
      cell: (item) => <span className="font-semibold text-slate-900">{item.qty} {item.unitType}</span>,
    },
    {
      header: 'Status',
      alignment: 'center',
      cell: () => (
        <Badge variant="outline" className={`font-semibold ${stateInfo.bg}`}>
          {stateInfo.text}
        </Badge>
      ),
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* BREADCRUMB HEADER */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="hover:text-slate-800 cursor-pointer" onClick={() => router.push(`/dashboard/${slug}/warehouse/pengeluaran-sparepart`)}>
            Pengeluaran Sparepart
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="font-medium text-slate-800">Detail Pengeluaran Sparepart</span>
        </div>

        {/* HEADLINE & ACTIONS */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => router.push(`/dashboard/${slug}/warehouse/pengeluaran-sparepart`)} variant="ghost" size="icon" className="h-10 w-10 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </Button>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-slate-900">Detail Pengeluaran Sparepart</h1>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span>Kode Transaksi:</span>
                <span className="text-blue-600 font-semibold">{detailData?.activity_number || detailData?.noPenerimaan || '-'}</span>
                <Badge variant="outline" className={`font-semibold ${stateInfo.bg}`}>
                  {stateInfo.text}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Card 1: Informasi Pengeluaran */}
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-blue-50">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700">Informasi Pengeluaran</h3>
              </div>
              <div className="text-sm text-slate-600 mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-slate-400">No. Pengeluaran</p>
                    <p className="font-semibold text-slate-900">
                      <CopyBox text={detailData?.activity_number || detailData?.noPenerimaan || '-'} />
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Tanggal Pengeluaran</p>
                    <p className="font-semibold text-slate-900">{formatDate(detailData?.activity_date || detailData?.tanggal || '')}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
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
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                    <span className="text-xs text-slate-400">Catatan Status</span>
                    <span className="text-slate-900">{detailData?.state_note}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Keterangan & Logistik */}
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-yellow-50">
                  <Package className="h-5 w-5 text-yellow-500" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700">Keterangan & Logistik</h3>
              </div>
              <div className="text-sm text-slate-600 mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Total Item</span>
                  <span className="font-semibold text-slate-900">{itemDetails.length} Jenis Sparepart</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-slate-400">Catatan / Keterangan</span>
                  <p className="text-slate-900 p-2 rounded-md bg-slate-50 w-full min-h-[50px]">
                    {detailData?.description || detailData?.keterangan || '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-md border p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Daftar Sparepart Dikeluarkan</h3>
          <BaseTable
            data={itemDetails}
            columns={columns}
            loading={isLoading}
            page={1}
            perPage={10}
            totalData={itemDetails.length}
            onPageChange={() => {}}
            onPerPageChange={() => {}}
          />
        </div>
      </div>

      {/* DIALOG UPDATE STATUS */}
      <Dialog open={isUpdateStateDialogOpen} onOpenChange={setIsUpdateStateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-6 rounded-2xl">
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
