import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface StockSparepartFilterDraft {
  perPage: string;
  stockState: string;
  activityType: string;
  inStock: string;
  specified: string;
}

interface StockSparepartFilterDialogProps {
  open: boolean;
  value: StockSparepartFilterDraft;
  onOpenChange: (open: boolean) => void;
  onChange: (value: StockSparepartFilterDraft) => void;
  onReset: () => void;
  onApply: () => void;
}

const selectClassName = 'h-10 w-full border-slate-300 bg-white text-slate-900';

export default function StockSparepartFilterDialog({
  open,
  value,
  onOpenChange,
  onChange,
  onReset,
  onApply,
}: StockSparepartFilterDialogProps) {
  const update = (key: keyof StockSparepartFilterDraft, nextValue: string) => {
    onChange({ ...value, [key]: nextValue });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-[520px]">
        <DialogHeader className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
          <DialogTitle className="text-lg text-slate-900">Filter Stok Sparepart</DialogTitle>
          <DialogDescription>
            Persempit data berdasarkan ketersediaan, proses, dan aktivitas gudang.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[60vh] gap-5 overflow-y-auto px-6 py-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sparepart-per-page">Tampilkan Data</Label>
            <Select value={value.perPage} onValueChange={(next) => update('perPage', next)}>
              <SelectTrigger id="sparepart-per-page" className={selectClassName}>
                <SelectValue placeholder="Jumlah baris" />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((option) => (
                  <SelectItem key={option} value={String(option)}>{option} data per halaman</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sparepart-availability">Ketersediaan Stok</Label>
            <Select value={value.inStock} onValueChange={(next) => update('inStock', next)}>
              <SelectTrigger id="sparepart-availability" className={selectClassName}>
                <SelectValue placeholder="Ketersediaan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua ketersediaan</SelectItem>
                <SelectItem value="true">Tersedia (Qty &gt; 0)</SelectItem>
                <SelectItem value="false">Kosong (Qty = 0)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sparepart-stock-state">Kondisi Stok</Label>
            <Select value={value.stockState} onValueChange={(next) => update('stockState', next)}>
              <SelectTrigger id="sparepart-stock-state" className={selectClassName}>
                <SelectValue placeholder="Kondisi stok" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="process">Proses</SelectItem>
                <SelectItem value="done">Selesai</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sparepart-activity">Tipe Aktivitas</Label>
            <Select value={value.activityType} onValueChange={(next) => update('activityType', next)}>
              <SelectTrigger id="sparepart-activity" className={selectClassName}>
                <SelectValue placeholder="Tipe aktivitas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua aktivitas</SelectItem>
                <SelectItem value="receipt">Penerimaan</SelectItem>
                <SelectItem value="issue">Pengeluaran</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="sparepart-outstanding">Spesifikasi Outstanding</Label>
            <Select value={value.specified} onValueChange={(next) => update('specified', next)}>
              <SelectTrigger id="sparepart-outstanding" className={selectClassName}>
                <SelectValue placeholder="Pilih spesifikasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua data</SelectItem>
                <SelectItem value="sales_outstanding">Sales outstanding</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-100 bg-white px-6 py-4 sm:justify-between">
          <Button type="button" variant="ghost" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={onReset}>
            Reset filter
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="button" className="btn-primary-orange! px-5" onClick={onApply}>Terapkan</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
