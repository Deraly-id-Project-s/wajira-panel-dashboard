import React from 'react';
import { AlertTriangle, FileImage, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { DoEkspedisi } from '@/@types/do-ekspedisi.types';
import { SearchableSelect, type SearchableSelectOption } from '@/components/features/vehicle-data/SearchableSelect';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CollapsibleBox } from '@/components/ui/collapsible-box';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImagePreview } from '@/components/ui/image-preview';
import { Label } from '@/components/ui/label';
import { getObjectStorageUrl } from '@/components/ui/storage-image';
import { useApproveDoExpeditionReject, useDoEkspedisiDriverLookup, useDoEkspedisiVehicleLookup } from '@/hooks/useDoEkspedisi';
import { formatDate } from '@/lib/utils/format';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';

interface DOEkspedisiRejectApprovalProps {
  data: DoEkspedisi;
  onApproved?: () => void;
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className="text-sm font-semibold text-slate-950">{value || '-'}</div>
    </div>
  );
}

const toOptions = (items?: { id: number; label: string; subtitle?: string }[]): SearchableSelectOption[] =>
  (items ?? []).map((item) => ({
    value: String(item.id),
    label: item.label,
    subtitle: item.subtitle,
  }));

export function DOEkspedisiRejectApproval({ data, onApproved }: DOEkspedisiRejectApprovalProps) {
  const reject = data.expeditionReject;
  const [open, setOpen] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [vehicleSearch, setVehicleSearch] = React.useState('');
  const [driverSearch, setDriverSearch] = React.useState('');
  const [vehicleId, setVehicleId] = React.useState('');
  const [driverId, setDriverId] = React.useState('');

  const vehicleLookup = useDoEkspedisiVehicleLookup(vehicleSearch, open);
  const driverLookup = useDoEkspedisiDriverLookup(driverSearch, open);
  const approveMutation = useApproveDoExpeditionReject(data.id);

  React.useEffect(() => {
    if (!open) {
      setVehicleSearch('');
      setDriverSearch('');
      setVehicleId('');
      setDriverId('');
    }
  }, [open]);

  const currentVehicleId = data.vehicleId ? String(data.vehicleId) : '';
  const currentDriverId = data.driverId ? String(data.driverId) : '';
  const expectedVehicleType = (data.orderList?.vehicleType || data.vehicle?.type || '').trim().toLowerCase();

  const vehicleOptions = React.useMemo(() => {
    const options = toOptions(vehicleLookup.data);
    if (!expectedVehicleType) return options;

    return options.filter((option) => String(option.subtitle ?? '').trim().toLowerCase() === expectedVehicleType);
  }, [expectedVehicleType, vehicleLookup.data]);

  const driverOptions = React.useMemo(() => toOptions(driverLookup.data), [driverLookup.data]);
  const canSubmit = Boolean(vehicleId && driverId && vehicleId !== currentVehicleId && driverId !== currentDriverId);

  const submitApproval = async () => {
    if (!canSubmit) {
      toast.error('Pilih driver dan armada baru yang berbeda dari data saat ini.');
      return;
    }

    try {
      await approveMutation.mutateAsync({
        vehicle_id: Number(vehicleId),
        driver_id: Number(driverId),
      });
      toast.success('Request reject berhasil disetujui. DO Ekspedisi kembali menjadi draft.');
      setOpen(false);
      onApproved?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (!reject && !data.hasRejectRequest) return null;

  return (
    <>
      <CollapsibleBox
        title="Informasi Request Reject"
        description="Detail pengajuan reject dari driver dan approval penggantian driver serta armada"
        icon={AlertTriangle}
        defaultExpanded
        actions={
          data.hasRejectRequest ? (
            <Button
              type="button"
              size="sm"
              className="bg-orange-600 text-white hover:bg-orange-700"
              onClick={() => setOpen(true)}
            >
              <RefreshCw className="h-4 w-4" />
              Approval Reject
            </Button>
          ) : null
        }
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <InfoField label="Driver Pengaju" value={reject?.driver?.name || '-'} />
          <InfoField label="Status Approval" value={
            <Badge variant="outline" className={reject?.isApprove ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}>
              {reject?.isApprove ? 'Disetujui' : 'Menunggu Approval'}
            </Badge>
          } />
          <InfoField label="Status Sebelumnya" value={reject?.lastExpeditionType || '-'} />
          <div className="md:col-span-2">
            <InfoField label="Alasan Reject" value={<p className="whitespace-pre-wrap leading-relaxed">{reject?.rejectReason || '-'}</p>} />
          </div>
          <InfoField label="Tanggal Pengajuan" value={reject?.createdAt ? formatDate(reject.createdAt) : '-'} />
          <div className="md:col-span-3">
            {reject?.rejectDocumentation ? (
              <Button
                type="button"
                variant="outline"
                className="border-orange-200 text-orange-700 hover:bg-orange-50"
                onClick={() => setPreviewUrl(getObjectStorageUrl(reject.rejectDocumentation))}
              >
                <FileImage className="h-4 w-4" />
                Lihat Dokumentasi Reject
              </Button>
            ) : (
              <p className="text-sm text-slate-500">Dokumentasi reject tidak tersedia.</p>
            )}
          </div>
        </div>
      </CollapsibleBox>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-[460px] overflow-y-auto rounded-md p-6" showCloseButton={!approveMutation.isPending}>
          <DialogHeader className="text-left">
            <DialogTitle>Approval Request Reject</DialogTitle>
            <DialogDescription>
              Pilih driver dan armada pengganti. Keduanya wajib berbeda dari data yang sedang terpasang.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <div className="font-semibold text-slate-900">Data saat ini</div>
              <div className="mt-1 grid gap-1">
                <span>Driver: {data.driver?.name || '-'}</span>
                <span>Armada: {data.vehicle?.registrationNumber || '-'}{data.vehicle?.type ? ` (${data.vehicle.type})` : ''}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Driver Baru</Label>
              <SearchableSelect
                value={driverId}
                onChange={setDriverId}
                options={driverOptions}
                placeholder="Pilih driver baru"
                searchPlaceholder="Cari driver..."
                loading={driverLookup.isFetching}
                onSearchChange={setDriverSearch}
                disabled={approveMutation.isPending}
                disabledValues={currentDriverId ? [currentDriverId] : []}
                disabledLabel="Driver saat ini"
              />
            </div>

            <div className="space-y-2">
              <Label>Armada Baru</Label>
              <SearchableSelect
                value={vehicleId}
                onChange={setVehicleId}
                options={vehicleOptions}
                placeholder="Pilih armada baru"
                searchPlaceholder="Cari nomor polisi..."
                loading={vehicleLookup.isFetching}
                onSearchChange={setVehicleSearch}
                disabled={approveMutation.isPending}
                disabledValues={currentVehicleId ? [currentVehicleId] : []}
                disabledLabel="Armada saat ini"
              />
              {expectedVehicleType ? (
                <p className="text-xs text-slate-500">Armada difilter untuk tipe {expectedVehicleType.toUpperCase()}.</p>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={approveMutation.isPending} onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="button" disabled={!canSubmit || approveMutation.isPending} className="bg-orange-600 text-white hover:bg-orange-700" onClick={submitApproval}>
              {approveMutation.isPending ? 'Memproses...' : 'Setujui Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImagePreview open={previewUrl !== null} onClose={() => setPreviewUrl(null)} src={previewUrl} />
    </>
  );
}
