import React, { useId, useMemo, useRef, useState } from 'react';
import { FileSpreadsheet, Loader2, Upload, X, AlertCircle, Info, Download, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTypeUnits } from '@/hooks/useTypeUnit';
import { initImportStockUnits } from '@/services/stock-unit.service';
import { WarehouseSubBlockSelect } from '@/components/features/stock-unit/WarehouseSubBlockSelect';
import type { UnitItemDetailStatus, UnitItemDetailStockState } from '@/@types/stock-unit.types';
import { cn } from '@/lib/utils';

const TEMPLATE_URL =
  'https://docs.google.com/spreadsheets/d/1UdemvHlkJrmTD3mK5N4hcI5OfwQi2T2yw-vZxwrmcGg/edit?usp=sharing';

interface InitStockImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  companyId?: number | string | null;
}

export function InitStockImportDialog({
  open,
  onOpenChange,
  onSuccess,
  companyId,
}: InitStockImportDialogProps) {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mandatory fields
  const [unitTypeId, setUnitTypeId] = useState<number | null>(null);
  const [qtyTotal, setQtyTotal] = useState<number>(1);

  // Optional fields
  const [price, setPrice] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [warehouseSubBlockId, setWarehouseSubBlockId] = useState<number | null>(null);
  const [inStock, setInStock] = useState<boolean>(true);
  const [status, setStatus] = useState<UnitItemDetailStatus>('normal');
  const [stockState, setStockState] = useState<UnitItemDetailStockState>('receipt');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    data: typeUnitsData,
    isLoading: typeUnitsLoading,
    isError: typeUnitsError,
    refetch: refetchTypeUnits,
  } = useTypeUnits({
    company_id: companyId ? String(companyId) : undefined,
  });

  const typeUnitOptions = useMemo(() => {
    return typeUnitsData?.data ?? [];
  }, [typeUnitsData]);

  const resetForm = () => {
    setUnitTypeId(null);
    setQtyTotal(1);
    setPrice(0);
    setFile(null);
    setWarehouseSubBlockId(null);
    setInStock(true);
    setStatus('normal');
    setStockState('receipt');
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!unitTypeId) {
      setErrorMessage('Pilih tipe unit terlebih dahulu.');
      return;
    }

    if (!qtyTotal || qtyTotal < 1) {
      setErrorMessage('Jumlah unit (QTY) minimal 1.');
      return;
    }

    if (!file) {
      setErrorMessage('Pilih file Excel (.xlsx / .xls) terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await initImportStockUnits(
        {
          unit_type_id: unitTypeId,
          qty_total: qtyTotal,
          price: price > 0 ? price : undefined,
          file,
          warehouse_sub_block_id: warehouseSubBlockId,
          in_stock: inStock,
          status,
          stock_state: stockState,
        },
        companyId,
      );

      toast.success(response?.message || 'Data unit stok awal berhasil diimport');
      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      const message = err?.message || 'Terjadi kesalahan saat mengimport stok unit';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isSubmitting && (val ? onOpenChange(val) : handleClose())}>
      <DialogContent className="sm:max-w-[620px] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Import Stok Unit Awal
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Inisialisasi stok unit awal tanpa harus membuat transaksi pembelian (Relasional Unit Transaction Item).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {errorMessage && (
          <div className="mt-3 flex items-start gap-2.5 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="leading-relaxed whitespace-pre-line">{errorMessage}</div>
          </div>
        )}

        {/* Template Document Reference */}
        <div className="mt-3 flex items-center justify-between rounded-md border border-orange-200/80 bg-orange-50/40 p-3.5 transition-colors hover:bg-orange-50/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">Butuh template data?</p>
              <p className="text-xs text-slate-500 truncate">Gunakan format ini agar import berhasil.</p>
            </div>
          </div>
          <a
            href={TEMPLATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-white px-3 text-sm font-medium text-orange-600 shadow-sm border border-orange-200 hover:bg-orange-50 hover:text-orange-700 transition-colors"
          >
            <Download className="mr-2 h-4 w-4" /> Download
          </a>
        </div>

        {/* Guideline Box */}
        <div className="mt-3 flex items-start gap-2.5 rounded-md border border-sky-200 bg-sky-50/70 p-3 text-xs text-sky-800">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-sky-600" />
          <div className="space-y-1">
            <p className="font-semibold">Format Kolom Excel yang Didukung:</p>
            <p className="text-[11px] leading-relaxed text-sky-700">
              1. <strong>Warna</strong> (atau <em>color</em>)<br />
              2. <strong>Nomor Mesin</strong> (atau <em>no_mesin</em>, <em>machine_number</em>)<br />
              3. <strong>Nomor Rangka</strong> (atau <em>no_rangka</em>, <em>chassis_number</em>)
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Tipe Unit (Mandatory) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Tipe Unit <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={unitTypeId ? String(unitTypeId) : undefined}
              onValueChange={(val) => setUnitTypeId(Number(val))}
              disabled={isSubmitting}
            >
              <SelectTrigger className="w-full h-10 border-gray-300 bg-white text-gray-900 rounded-md">
                <SelectValue placeholder={typeUnitsLoading ? 'Memuat tipe unit...' : 'Pilih tipe unit'} />
              </SelectTrigger>
              <SelectContent showSearch searchPlaceholder="Cari tipe unit...">
                {typeUnitsLoading && <div className="px-3 py-2 text-xs text-muted-foreground">Memuat tipe unit...</div>}
                {typeUnitsError && (
                  <div className="px-3 py-2 text-xs text-destructive">
                    Gagal memuat tipe unit.{' '}
                    <button type="button" className="underline" onClick={() => refetchTypeUnits()}>
                      Coba lagi
                    </button>
                  </div>
                )}
                {typeUnitOptions.map((tu) => (
                  <SelectItem key={tu.id} value={String(tu.id)} maxLength={45}>
                    {tu.code ? `${tu.name} (${tu.code})` : tu.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Kuota QTY & Harga Perolehan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="qty_total" className="text-xs font-semibold text-slate-700">
                Jumlah / Kuota Unit (QTY) <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="qty_total"
                type="number"
                min="1"
                placeholder="Contoh: 5"
                value={qtyTotal || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setQtyTotal(val === '' ? 1 : Math.max(1, parseInt(val, 10) || 1));
                }}
                disabled={isSubmitting}
                className="h-10 border-gray-300 bg-white text-gray-900 rounded-md"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="price" className="text-xs font-semibold text-slate-700">
                Harga Perolehan Satuan (Opsional)
              </Label>
              <MoneyInput
                id="price"
                placeholder="Rp 0"
                value={price}
                onChangeValue={(val) => setPrice(val)}
                disabled={isSubmitting}
                className="h-10 border-gray-300 bg-white text-gray-900 rounded-md"
              />
            </div>
          </div>

          {/* File Upload Dropzone */}
          <div className="space-y-1.5">
            <Label htmlFor={fileInputId} className="text-xs font-semibold text-slate-700">
              File Excel Detail Unit Fisik <span className="text-rose-500">*</span>
            </Label>
            <input
              id={fileInputId}
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0] || null;
                setFile(selected);
                if (selected) setErrorMessage(null);
              }}
              disabled={isSubmitting}
            />

            {file ? (
              <div className="flex items-center justify-between rounded-md border border-emerald-300 bg-emerald-50/60 p-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{file.name}</p>
                    <p className="text-[11px] text-emerald-600 font-medium">
                      File siap diproses ({(file.size / 1024).toFixed(1)} KB)
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className={cn(
                  'group flex w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 text-center transition hover:border-orange-400 hover:bg-orange-50/40',
                  'disabled:opacity-50 disabled:pointer-events-none',
                )}
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 group-hover:bg-orange-100 group-hover:ring-orange-200 transition-colors">
                  <Upload className="h-5 w-5 text-slate-400 group-hover:text-orange-600 transition-colors" />
                </div>
                <span className="text-xs font-semibold text-slate-800 group-hover:text-orange-600 transition-colors">
                  Klik untuk mengunggah file Excel (.xlsx / .xls)
                </span>
                <span className="mt-1 text-[11px] text-slate-400">
                  Mendukung format XLSX dan XLS (Maksimal 10MB)
                </span>
              </button>
            )}
          </div>

          {/* Sub Blok Gudang (Opsional) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Sub Blok Gudang (Opsional)</Label>
            <WarehouseSubBlockSelect
              companyId={companyId}
              value={warehouseSubBlockId}
              onChange={setWarehouseSubBlockId}
              disabled={isSubmitting}
            />
            <p className="text-[11px] text-slate-400">
              Unit yang diimport akan otomatis ditempatkan pada sub blok ini jika dipilih.
            </p>
          </div>

          {/* Status & Stock State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Status Kondisi Fisik</Label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as UnitItemDetailStatus)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full h-10 border-gray-300 bg-white text-gray-900 rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal (Default)</SelectItem>
                  <SelectItem value="minor_damage">Minor Damage</SelectItem>
                  <SelectItem value="major_damage">Major Damage</SelectItem>
                  <SelectItem value="in_repair">In Repair</SelectItem>
                  <SelectItem value="returned">Retur Beli</SelectItem>
                  <SelectItem value="refunded">Refund Jual</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Posisi Alur Stok (Stock State)</Label>
              <Select
                value={stockState}
                onValueChange={(val) => setStockState(val as UnitItemDetailStockState)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full h-10 border-gray-300 bg-white text-gray-900 rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receipt">Receipt / Masuk Stok (Default)</SelectItem>
                  <SelectItem value="prepare">Prepare</SelectItem>
                  <SelectItem value="purchase_order">Purchase Order</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="cancel">Cancel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* In Stock Checkbox */}
          <div className="flex items-start gap-2.5 rounded-md border border-slate-200 bg-slate-50/70 p-3">
            <Checkbox
              id="in_stock_checkbox"
              checked={inStock}
              onCheckedChange={(checked) => setInStock(Boolean(checked))}
              disabled={isSubmitting}
              className="mt-0.5"
            />
            <div className="space-y-0.5">
              <Label htmlFor="in_stock_checkbox" className="text-xs font-semibold text-slate-800 cursor-pointer">
                In Stock (Fisik unit berada di gudang)
              </Label>
              <p className="text-[11px] text-slate-500">
                Centang jika unit fisik sudah tersedia dan siap dialokasikan di gudang (default: aktif).
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-md mr-2"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !file || !unitTypeId || qtyTotal < 1}
              className="rounded-md px-5 btn-primary-orange!"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengimport Data...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Mulai Import
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
