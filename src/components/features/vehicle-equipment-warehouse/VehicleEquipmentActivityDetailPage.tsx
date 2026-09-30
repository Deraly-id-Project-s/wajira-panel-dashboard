'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { CheckCircle2, FileText, Package } from 'lucide-react';
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
  type: 'receipt' | 'issue';
}

const getStateConfig = (state?: string) => {
  const normalized = state?.toLowerCase();
  if (normalized === 'done') return { label: 'Selesai', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
  if (normalized === 'process') return { label: 'Proses', className: 'border-amber-200 bg-amber-50 text-amber-700' };
  return { label: normalized === 'draft' ? 'Draft' : state || '-', className: 'border-slate-200 bg-slate-50 text-slate-700' };
};

export default function VehicleEquipmentActivityDetailPage({ type }: VehicleEquipmentActivityDetailPageProps) {
  const router = useRouter();
  const { id, slug } = router.query as { id?: string; slug?: string };
  const isIssue = type === 'issue';
  const baseRoute = isIssue ? 'perlengkapan-keluar' : 'perlengkapan-masuk';
  const title = isIssue ? 'Detail Pengeluaran Perlengkapan' : 'Detail Penerimaan Perlengkapan';
  const listTitle = isIssue ? 'Pengeluaran Perlengkapan' : 'Penerimaan Perlengkapan';
  const partyLabel = isIssue ? 'Customer' : 'Supplier';
  const partyMaster = isIssue ? 'customer' : 'supplier';

  const { data, isLoading } = useWarehouseActivityDetail(id);
  const updateStateMutation = useWarehouseActivityStateUpdate();
  const { hasPermission } = usePermissionGuard();
  const canEdit = hasPermission('warehouse:edit') || hasPermission('warehouse:activity');
  const [doneDialogOpen, setDoneDialogOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && data && data.activity_type !== type) {
      router.push(`/dashboard/${slug}/warehouse/${baseRoute}`);
    }
  }, [baseRoute, data, isLoading, router, slug, type]);

  const stateInfo = useMemo(() => getStateConfig(data?.state), [data?.state]);
  const transaction = data?.goods_transaction;
  const equipment = transaction?.vehicle_equipment;
  const isDone = data?.state?.toLowerCase() === 'done';

  const handleDone = async () => {
    if (!id) return;
    try {
      await updateStateMutation.mutateAsync({ activityId: id, state: 'done' });
      toast.success(`${listTitle} berhasil diselesaikan`);
      setDoneDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || `Gagal menyelesaikan ${listTitle.toLowerCase()}`);
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
          <Card className="rounded-md border-slate-200 shadow-sm">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-blue-50 p-2"><FileText className="h-5 w-5 text-blue-600" /></div>
                <h3 className="text-sm font-semibold text-slate-700">Informasi Aktivitas</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="text-xs text-slate-400">Nomor Aktivitas</span><p className="font-semibold"><CopyBox text={data?.activity_number || '-'} /></p></div>
                <div><span className="text-xs text-slate-400">Tanggal</span><p className="font-semibold">{formatDate(data?.activity_date || '')}</p></div>
                <div><span className="text-xs text-slate-400">Warehouse</span><p className="font-semibold">{data?.warehouse?.name || '-'}</p></div>
                <div>
                  <span className="text-xs text-slate-400">{partyLabel}</span>
                  <p className="font-semibold">
                    {data?.person?.name ? (
                      <ReferenceLink href={`/dashboard/${slug}/master/${partyMaster}?search=${encodeURIComponent(data.person.name)}`}>
                        {data.person.name}
                      </ReferenceLink>
                    ) : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-md border-slate-200 shadow-sm">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-amber-50 p-2"><Package className="h-5 w-5 text-amber-600" /></div>
                <h3 className="text-sm font-semibold text-slate-700">Detail Perlengkapan</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="text-xs text-slate-400">Kode Transaksi</span><p className="font-semibold"><CopyBox text={transaction?.code || '-'} /></p></div>
                <div><span className="text-xs text-slate-400">Kode Perlengkapan</span><p className="font-semibold"><CopyBox text={equipment?.code || '-'} /></p></div>
                <div><span className="text-xs text-slate-400">Nama Perlengkapan</span><p className="font-semibold">{equipment?.name || '-'}</p></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-xs text-slate-400">Qty</span><p className="font-semibold">{transaction?.qty ?? '-'}</p></div>
                  <div><span className="text-xs text-slate-400">Harga</span><p className="font-semibold">{currenciesFormat('idr', transaction?.price ?? 0)}</p></div>
                </div>
                <div><span className="text-xs text-slate-400">Keterangan</span><p className="rounded-md bg-slate-50 p-2 text-xs leading-relaxed">{data?.description || transaction?.note || '-'}</p></div>
              </div>
            </CardContent>
          </Card>
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
