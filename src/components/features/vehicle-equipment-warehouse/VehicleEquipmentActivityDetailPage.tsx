'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { CheckCircle2, FileText, Package, Truck, ArrowLeftRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useWarehouseActivityDetail, useWarehouseActivityStateUpdate } from '@/hooks/useWarehouseActivity';

interface VehicleEquipmentActivityDetailPageProps {
  type: 'receipt' | 'issue' | 'assign' | 'dispatch';
}

const getStateConfig = (state?: string) => {
  const normalized = state?.toLowerCase();
  if (normalized === 'done') return { label: 'Selesai', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
  if (normalized === 'process') return { label: 'Proses', className: 'border-amber-200 bg-amber-50 text-amber-700' };
  return { label: normalized === 'draft' ? 'Draft' : state || '-', className: 'border-slate-200 bg-slate-50 text-slate-700' };
};

const getActivityTypeBadge = (activityType?: string) => {
  switch (activityType) {
    case 'receipt':
      return <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 font-semibold">Penerimaan</Badge>;
    case 'issue':
      return <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700 font-semibold">Pengeluaran</Badge>;
    case 'assign':
      return <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold">Assign ke Armada</Badge>;
    case 'dispatch':
      return <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 font-semibold">Dispatch dari Armada</Badge>;
    default:
      return <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700 font-semibold">{activityType || '-'}</Badge>;
  }
};

export default function VehicleEquipmentActivityDetailPage({ type }: VehicleEquipmentActivityDetailPageProps) {
  const router = useRouter();
  const { id, slug } = router.query as { id?: string; slug?: string };
  const isIncoming = type === 'receipt' || type === 'assign';
  const baseRoute = isIncoming ? 'perlengkapan-masuk' : 'perlengkapan-keluar';
  const listTitle = isIncoming ? 'Penerimaan Perlengkapan' : 'Pengeluaran Perlengkapan';
  const partyLabel = isIncoming ? 'Supplier' : 'Customer';
  const partyMaster = isIncoming ? 'supplier' : 'customer';

  const { data, isLoading } = useWarehouseActivityDetail(id);
  const updateStateMutation = useWarehouseActivityStateUpdate();
  const { hasPermission } = usePermissionGuard();
  const canEdit = hasPermission('warehouse:edit') || hasPermission('warehouse:activity');
  const [doneDialogOpen, setDoneDialogOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && data && data.activity_type) {
      const allowedTypes = isIncoming ? ['receipt', 'assign'] : ['issue', 'dispatch'];
      if (!allowedTypes.includes(data.activity_type)) {
        router.push(`/dashboard/${slug}/warehouse/${baseRoute}`);
      }
    }
  }, [baseRoute, data, isIncoming, isLoading, router, slug]);

  const stateInfo = useMemo(() => getStateConfig(data?.state), [data?.state]);
  const assignment = data?.warehouse_movement_assignment;
  const transaction = data?.goods_transaction;
  const isAssignment = data?.activity_type === 'assign' || data?.activity_type === 'dispatch' || Boolean(assignment);
  const equipment = assignment?.vehicle_equipment || transaction?.vehicle_equipment;
  const fleet = assignment?.vehicle_fleet;
  const movement = data?.warehouse_movements?.[0];
  const isDone = data?.state?.toLowerCase() === 'done';

  const title = useMemo(() => {
    if (data?.activity_type === 'assign') return 'Detail Assign Perlengkapan';
    if (data?.activity_type === 'dispatch') return 'Detail Dispatch Perlengkapan';
    if (data?.activity_type === 'issue') return 'Detail Pengeluaran Perlengkapan';
    return 'Detail Penerimaan Perlengkapan';
  }, [data?.activity_type]);

  const handleDone = async () => {
    if (!id) return;
    try {
      await updateStateMutation.mutateAsync({ activityId: id, state: 'done' });
      toast.success(`${title} berhasil diselesaikan`);
      setDoneDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || `Gagal menyelesaikan aktivitas`);
    }
  };

  if (isLoading) {
    return <DashboardLayout><LoadingState variant="page" /></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={title}
          breadcrumbs={[{ label: listTitle, onClick: () => router.push(`/dashboard/${slug}/warehouse/${baseRoute}`) }, { label: 'Detail' }]}
          onBack={() => router.push(`/dashboard/${slug}/warehouse/${baseRoute}`)}
          subtitle={(
            <div className="flex flex-wrap items-center gap-2">
              <span>Kode:</span>
              <span className="font-semibold text-orange-600">{data?.activity_number || '-'}</span>
              <Badge variant="outline" className={cn('font-semibold', stateInfo.className)}>{stateInfo.label}</Badge>
            </div>
          )}
          actions={canEdit ? (
            <Button disabled={isDone || updateStateMutation.isPending} onClick={() => setDoneDialogOpen(true)} className="bg-emerald-600 text-white hover:bg-emerald-700">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {isDone ? 'Sudah Selesai' : 'Selesai'}
            </Button>
          ) : null}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Card 1: Informasi Aktivitas */}
          <Card collapsible={false} className="rounded-md border-slate-200 shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-blue-50 p-2"><FileText className="h-5 w-5 text-blue-600" /></div>
                <h3 className="text-sm font-semibold text-slate-700">Informasi Aktivitas</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-xs text-slate-400">Nomor Aktivitas</span>
                  <p className="font-semibold"><CopyBox text={data?.activity_number || '-'} /></p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Tipe Aktivitas</span>
                  <div className="pt-0.5">{getActivityTypeBadge(data?.activity_type)}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Tanggal Aktivitas</span>
                  <p className="font-semibold">{formatDate(data?.activity_date || '')}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Warehouse</span>
                  <p className="font-semibold">{data?.warehouse?.name || '-'}</p>
                </div>
                {movement?.serial_number && (
                  <div>
                    <span className="text-xs text-slate-400">Nomor Mutasi (Serial Number)</span>
                    <p className="font-semibold font-mono text-xs">{movement.serial_number}</p>
                  </div>
                )}
                {data?.person?.name && (
                  <div>
                    <span className="text-xs text-slate-400">{partyLabel}</span>
                    <p className="font-semibold">
                      <ReferenceLink href={`/dashboard/${slug}/master/${partyMaster}?search=${encodeURIComponent(data.person.name)}`}>
                        {data.person.name}
                      </ReferenceLink>
                    </p>
                  </div>
                )}
                {data?.state_note && (
                  <div>
                    <span className="text-xs text-slate-400">Catatan Status</span>
                    <p className="font-medium text-slate-700">{data.state_note}</p>
                  </div>
                )}
                <div>
                  <span className="text-xs text-slate-400">Deskripsi / Keterangan</span>
                  <p className="rounded-md bg-slate-50 p-2.5 text-xs leading-relaxed text-slate-700">{data?.description || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Informasi Armada (Untuk Assign/Dispatch) ATAU Informasi Transaksi (Untuk Receipt/Issue) */}
          {isAssignment ? (
            <Card collapsible={false} className="rounded-md border-slate-200 shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-emerald-50 p-2"><Truck className="h-5 w-5 text-emerald-600" /></div>
                  <h3 className="text-sm font-semibold text-slate-700">Informasi Armada</h3>
                </div>
                {fleet ? (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-xs text-slate-400">Nomor Polisi / Plat</span>
                      <p className="font-bold text-slate-900 text-base">{fleet.registration_number}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-slate-400">Tipe Kendaraan</span>
                        <p className="font-semibold uppercase">{fleet.type || '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400">No Mesin</span>
                        <p className="font-semibold font-mono text-xs">{fleet.machine_number || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">No Rangka</span>
                      <p className="font-semibold font-mono text-xs">{fleet.chassis_number || '-'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-xs text-slate-400">No STNK</span>
                        <p className="font-semibold text-xs">{fleet.stnk_number || '-'}</p>
                        {fleet.stnk_age && (
                          <span className="text-[11px] text-slate-500">Exp: {formatDate(fleet.stnk_age)}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-slate-400">Buku KIR</span>
                        <p className="font-semibold text-xs">{fleet.kir_book || '-'}</p>
                        {fleet.kir_age && (
                          <span className="text-[11px] text-slate-500">Exp: {formatDate(fleet.kir_age)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Data armada tidak tersedia</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card collapsible={false} className="rounded-md border-slate-200 shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-blue-50 p-2"><ArrowLeftRight className="h-5 w-5 text-blue-600" /></div>
                  <h3 className="text-sm font-semibold text-slate-700">Informasi Transaksi</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-xs text-slate-400">Kode Transaksi</span>
                    <p className="font-semibold"><CopyBox text={transaction?.code || '-'} /></p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-slate-400">No Nota</span>
                      <p className="font-semibold">{transaction?.nota_number || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">Tipe Pembayaran</span>
                      <p className="font-semibold uppercase">{transaction?.billing_type || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Total Transaksi</span>
                    <p className="font-semibold text-emerald-700">{currenciesFormat('idr', transaction?.price ? (transaction.price * (transaction.qty || 1)) : 0)}</p>
                  </div>
                  {transaction?.note && (
                    <div>
                      <span className="text-xs text-slate-400">Catatan Transaksi</span>
                      <p className="rounded-md bg-slate-50 p-2 text-xs leading-relaxed text-slate-700">{transaction.note}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card 3: Detail Perlengkapan Kendaraan */}
          <div className="md:col-span-2">
            <Card collapsible={false} className="rounded-md border-slate-200 shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-amber-50 p-2"><Package className="h-5 w-5 text-amber-600" /></div>
                  <h3 className="text-sm font-semibold text-slate-700">Detail Perlengkapan Kendaraan</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-400">Kode Perlengkapan</span>
                    <p className="font-semibold"><CopyBox text={equipment?.code || '-'} /></p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Nama Perlengkapan</span>
                    <p className="font-semibold text-slate-900">{equipment?.name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Kuantitas (Qty)</span>
                    <p className="font-bold text-slate-900">{assignment?.qty ?? transaction?.qty ?? '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">
                      {isAssignment ? 'Harga Beli (Satuan)' : 'Harga Satuan'}
                    </span>
                    <p className="font-semibold text-slate-800">
                      {currenciesFormat('idr', equipment?.buy_price ?? transaction?.price ?? 0)}
                    </p>
                  </div>
                  {isAssignment && equipment?.sell_price !== undefined && (
                    <div>
                      <span className="text-xs text-slate-400">Harga Jual (Satuan)</span>
                      <p className="font-semibold text-slate-800">
                        {currenciesFormat('idr', equipment.sell_price)}
                      </p>
                    </div>
                  )}
                  {isAssignment && (
                    <div>
                      <span className="text-xs text-slate-400">Total Nilai</span>
                      <p className="font-bold text-emerald-700">
                        {currenciesFormat('idr', ((equipment?.buy_price ?? 0) * (assignment?.qty ?? 0)))}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={doneDialogOpen} onOpenChange={setDoneDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Konfirmasi Selesai</DialogTitle>
            <DialogDescription>Aktivitas warehouse akan diubah ke status selesai.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDoneDialogOpen(false)} disabled={updateStateMutation.isPending}>Batal</Button>
            <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleDone} disabled={updateStateMutation.isPending}>
              {updateStateMutation.isPending ? 'Memproses...' : 'Ya, Selesai'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
