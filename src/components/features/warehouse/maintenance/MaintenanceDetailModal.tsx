import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import type { MaintenanceItem } from '@/@types/maintenance.types';

interface MaintenanceDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: MaintenanceItem | null;
}

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

const formatCurrency = (value?: number) => {
  if (value == null) return 'Rp 0';
  return `Rp ${value.toLocaleString('id-ID')}`;
};

export function MaintenanceDetailModal({
  open,
  onOpenChange,
  data,
}: MaintenanceDetailModalProps) {
  if (!data) return null;

  const details = data.goodsTransactionDetails ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={true} className="max-w-[850px] max-h-[85vh] overflow-y-auto rounded-md border-none p-8 shadow-2xl bg-white">
        <DialogHeader className="border-b border-slate-100 pb-4 text-left">
          <DialogTitle className="text-[22px] font-bold text-slate-950">
            Detail Maintenance
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Kode Transaksi: <span className="font-semibold text-[#1f4163]">{data.code}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-8">
          {/* Main Info Blocks */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Maintenance Info */}
            <Card className="rounded-md border border-slate-100 p-5 shadow-none bg-slate-50/50 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Informasi Transaksi</h3>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Tanggal Transaksi</p>
                  <p className="font-medium text-slate-900">{formatDate(data.transactionDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Kategori</p>
                  <p className="font-medium text-slate-900 capitalize">{data.category}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Lokasi</p>
                  <p className="font-medium text-slate-900">{data.location || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Brutto</p>
                  <p className="font-medium text-slate-900">{formatCurrency(data.totalBrutto)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500">Deskripsi</p>
                  <p className="font-medium text-slate-900">{data.description || '-'}</p>
                </div>
              </div>
            </Card>

            {/* Driver Info */}
            <Card className="rounded-md border border-slate-100 p-5 shadow-none bg-slate-50/50 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Informasi Driver</h3>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Kode Driver</p>
                  <p className="font-medium text-slate-900">{data.driver?.code || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Nama Driver</p>
                  <p className="font-medium text-slate-900">{data.driver?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Tipe Driver</p>
                  <p className="font-medium text-slate-900 capitalize">{data.driver?.type || '-'}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Vehicle Fleet Info */}
          <Card className="rounded-md border border-slate-100 p-5 shadow-none bg-slate-50/50 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Informasi Kendaraan / Armada</h3>
            <div className="grid gap-4 sm:grid-cols-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Nomor Polisi</p>
                <p className="font-medium text-slate-900">{data.vehicleFleet?.registrationNumber || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Jenis Armada</p>
                <p className="font-medium text-slate-900 uppercase">{data.vehicleFleet?.type || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Nomor Mesin</p>
                <p className="font-medium text-slate-900">{data.vehicleFleet?.machineNumber || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Nomor Rangka</p>
                <p className="font-medium text-slate-900">{data.vehicleFleet?.chassisNumber || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Nomor STNK</p>
                <p className="font-medium text-slate-900">{data.vehicleFleet?.stnkNumber || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Masa Berlaku STNK</p>
                <p className="font-medium text-slate-900">{formatDate(data.vehicleFleet?.stnkAge || undefined)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Buku KIR</p>
                <p className="font-medium text-slate-900">{data.vehicleFleet?.kirBook || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Masa Berlaku KIR</p>
                <p className="font-medium text-slate-900">{formatDate(data.vehicleFleet?.kirAge || undefined)}</p>
              </div>
            </div>
          </Card>

          {/* List of Equipments */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-slate-900">Perlengkapan Maintenance</h3>
            <div className="overflow-x-auto rounded-md border border-slate-200">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-12 text-center">NO</TableHead>
                    <TableHead>KODE PERLENGKAPAN</TableHead>
                    <TableHead>NAMA PERLENGKAPAN</TableHead>
                    <TableHead className="text-center">QTY</TableHead>
                    <TableHead className="text-right">HARGA</TableHead>
                    <TableHead className="text-right">TOTAL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-20 text-center text-slate-500">
                        Tidak ada detail perlengkapan yang digunakan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    details.map((item, idx) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-center">{idx + 1}</TableCell>
                        <TableCell>{item.vehicleEquipment?.code || '-'}</TableCell>
                        <TableCell className="font-medium">{item.vehicleEquipment?.name || '-'}</TableCell>
                        <TableCell className="text-center font-semibold text-slate-900">{item.qty}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                        <TableCell className="text-right font-semibold text-slate-950">{formatCurrency(item.total)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
