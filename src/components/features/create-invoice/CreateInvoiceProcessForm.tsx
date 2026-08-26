import * as React from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import type { CreateInvoiceDetailRow, CreateInvoiceProcessValues } from '@/types/create-invoice.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { formatDisplayDate, formatMoney, formatInvoiceMoney } from './create-invoice.utils';

interface Props {
  title: string;
  values: CreateInvoiceProcessValues;
  rows: CreateInvoiceDetailRow[];
  statusLabel?: string;
  selectedInvoiceCount?: number;
  mode?: 'detail' | 'bulk';
  selectedExpeditionIds?: number[];
  onBack: () => void;
  onCancel: () => void;
  onChange: <K extends keyof CreateInvoiceProcessValues>(field: K, value: CreateInvoiceProcessValues[K]) => void;
  onSubmit: () => void;
  onToggleExpedition?: (expeditionId: number, checked: boolean) => void;
  onToggleAllExpeditions?: (checked: boolean) => void;
  isSubmitting?: boolean;
}

export function CreateInvoiceProcessForm({
  title,
  values,
  rows,
  statusLabel,
  selectedInvoiceCount = 1,
  mode = 'detail',
  selectedExpeditionIds = [],
  onBack,
  onCancel,
  onChange,
  onSubmit,
  onToggleExpedition,
  onToggleAllExpeditions,
  isSubmitting = false,
}: Props) {
  const isPrintedInvoice = Boolean(statusLabel?.includes('Sudah'));
  const totalInvoice = rows.reduce((sum, row) => sum + row.invoiceExpedition, 0);
  const totalPpn = rows.reduce((sum, row) => sum + row.ppn, 0);
  const totalAmount = rows.reduce((sum, row) => sum + row.totalAmount, 0);
  const selectableRows = rows.filter((row) => !row.isPrinted || isPrintedInvoice);
  const allSelectableChecked = selectableRows.length > 0 && selectableRows.every((row) => selectedExpeditionIds.includes(row.expeditionId));
  const partialSelectableChecked = selectableRows.some((row) => selectedExpeditionIds.includes(row.expeditionId)) && !allSelectableChecked;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="ghost" size="icon" className="h-10 w-10 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer">
          <ArrowLeft className="h-5 w-5 text-slate-700" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === 'bulk' ? `${selectedInvoiceCount} invoice dipilih untuk diproses` : 'Kelola informasi invoice dan expedisi'}
          </p>
        </div>
      </div>

      <Card className="rounded-md border border-gray-200 bg-white p-6 shadow-none md:p-8">
        <div className="space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Informasi Ekspedisi</h2>
            {statusLabel ? (
              <Badge className={statusLabel.includes('Sudah') ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-red-400 bg-red-50 text-red-500'}>
                {statusLabel}
              </Badge>
            ) : null}
          </div>

          <div className="h-px bg-slate-200" />

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-900">Kode Invoice</Label>
              <Input value={values.invoiceCode} readOnly className="h-12 rounded-md border-slate-200 bg-slate-50" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-900">Nama Customer</Label>
              <Input value={values.customerName} onChange={(event) => onChange('customerName', event.target.value)} className="h-12 rounded-md border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-900">Tanggal</Label>
              <DatePicker value={values.date} onChange={(date) => onChange('date', date ? date.toISOString().slice(0, 10) : '')} placeholder="Pilih tanggal" className="h-12 rounded-md border-slate-200 bg-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-900">Perihal</Label>
              <Input value={values.subject} onChange={(event) => onChange('subject', event.target.value)} placeholder="Contoh: Invoice Ekspedisi" className="h-12 rounded-md border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-900">Lampiran</Label>
              <Input value={values.attachmentLabel} onChange={(event) => onChange('attachmentLabel', event.target.value)} placeholder="Contoh: 1 lembar" className="h-12 rounded-md border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-900">Upload Attachment</Label>
              <Input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(event) => onChange('attachmentFile', event.target.files?.[0] ?? null)}
                className="h-12 rounded-md border-slate-200 pt-3"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-900">Deskripsi</Label>
            <Input value={values.description} onChange={(event) => onChange('description', event.target.value)} placeholder="Masukkan deskripsi invoice" className="h-12 rounded-md border-slate-200" />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-900">Isi Surat</Label>
            <Textarea value={values.letterContent} onChange={(event) => onChange('letterContent', event.target.value)} placeholder="Masukkan isi surat invoice" className="min-h-[140px] rounded-md border-slate-200" />
          </div>

          <div className="flex items-center space-x-2 py-1">
            <Checkbox
              id="is_usd"
              checked={values.isUsd ?? false}
              onCheckedChange={(checked) => {
                onChange('isUsd', Boolean(checked));
              }}
            />
            <Label htmlFor="is_usd" className="text-sm font-medium cursor-pointer text-slate-700 select-none">
              Transaksi USD
            </Label>
          </div>

          {values.isUsd && (
            <div className="grid gap-5 md:grid-cols-2 border border-amber-100 bg-amber-50/20 p-5 rounded-md">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-amber-900">Kurs USD (1 USD = Rp ...)</Label>
                <Input
                  type="number"
                  step="1"
                  value={values.rateUsd ?? 16000}
                  onChange={(event) => onChange('rateUsd', Number(event.target.value))}
                  placeholder="Masukkan kurs USD"
                  className="h-12 rounded-md border-amber-200 bg-white focus-visible:ring-amber-500 text-slate-800"
                />
              </div>
            </div>
          )}

          {values.isUsd && (
            <div className="bg-amber-50/50 border border-amber-100 text-amber-900 rounded-md p-4 text-xs font-semibold flex items-center justify-between">
              <span>MATA UANG INVOICE: USD (UNITED STATES DOLLAR)</span>
              <span>KURS: 1 USD = {formatInvoiceMoney(values.rateUsd ?? 16000, false)}</span>
            </div>
          )}

          <div className="overflow-hidden rounded-md border border-gray-200">
            <div className="max-h-[460px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-[#f8f9fa] border-b border-gray-200">
                  <TableRow className="border-slate-200">
                    <TableHead className="w-[54px] px-4 py-4 text-center">
                      <Checkbox
                        checked={allSelectableChecked ? true : partialSelectableChecked ? 'indeterminate' : false}
                        onCheckedChange={(checked) => onToggleAllExpeditions?.(Boolean(checked))}
                        disabled={!selectableRows.length}
                      />
                    </TableHead>
                    {['NO', 'TANGGAL', 'NO POLISI', 'TYPE', 'DRIVER', 'LOADING IN', 'TUJUAN KIRIM', 'LOADING OUT', 'NO SURAT DO', 'DESKRIPSI', 'QTY', 'INV EKSPEDISI', 'PPN', 'STATUS'].map((header) => (
                      <TableHead key={header} className="whitespace-nowrap px-4 py-4 text-center text-xs font-semibold uppercase text-slate-500">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={`${row.invoiceId}-${row.expeditionId}-${index}`} className="border-slate-100">
                      <TableCell className="px-4 py-3 text-center">
                        <Checkbox
                          checked={selectedExpeditionIds.includes(row.expeditionId)}
                          onCheckedChange={(checked) => onToggleExpedition?.(row.expeditionId, Boolean(checked))}
                          disabled={row.isPrinted && !isPrintedInvoice}
                        />
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center text-sm text-slate-700">{index + 1}</TableCell>
                      <TableCell className="px-4 py-3 text-center text-sm text-slate-700">{formatDisplayDate(row.date)}</TableCell>
                      <TableCell className="px-4 py-3 text-center text-sm text-slate-700">{row.noPolisi}</TableCell>
                      <TableCell className="px-4 py-3 text-center text-sm text-slate-700">{row.type}</TableCell>
                      <TableCell className="px-4 py-3 text-center text-sm text-slate-700">{row.driver}</TableCell>
                      <TableCell className="px-4 py-3 text-center text-sm text-slate-700">{row.loadingIn}</TableCell>
                      <TableCell className="px-4 py-3 text-center text-sm text-slate-700">{row.destination}</TableCell>
                      <TableCell className="px-4 py-3 text-center text-sm text-slate-700">{row.loadingOut}</TableCell>
                      <TableCell className="px-4 py-3 text-center text-sm text-slate-700">{row.noSuratDo}</TableCell>
                      <TableCell className="px-4 py-3 text-center text-sm text-slate-700">{row.description}</TableCell>
                      <TableCell className="px-4 py-3 text-center text-sm text-slate-700">{row.qty}</TableCell>
                      <TableCell className="px-4 py-3 text-center text-sm text-slate-700">{formatInvoiceMoney(row.invoiceExpedition, values.isUsd, values.rateUsd)}</TableCell>
                      <TableCell className="px-4 py-3 text-center text-sm text-slate-700">{formatInvoiceMoney(row.ppn, values.isUsd, values.rateUsd)}</TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <Badge variant="outline" className={row.isPrinted ? 'rounded-full border-emerald-300 bg-emerald-50 text-emerald-700' : 'rounded-full border-slate-300 bg-white text-slate-700'}>
                          {row.isPrinted ? 'Sudah di Print' : row.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-[#effaf3]">
                    <TableCell colSpan={12} className="px-4 py-4 text-center text-[16px] font-semibold text-slate-900">
                      PAYMENT DITRANSFER KE REKENING PT XXXXX
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center text-sm font-semibold text-slate-900">{formatInvoiceMoney(totalInvoice, values.isUsd, values.rateUsd)}</TableCell>
                    <TableCell className="px-4 py-4 text-center text-sm font-semibold text-slate-900">{formatInvoiceMoney(totalPpn, values.isUsd, values.rateUsd)}</TableCell>
                    <TableCell className="px-4 py-4 text-center text-sm font-semibold text-slate-900">{formatInvoiceMoney(totalAmount, values.isUsd, values.rateUsd)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-center gap-5">
        <Button type="button" variant="ghost" onClick={onCancel} className="text-base text-slate-700 hover:bg-transparent hover:text-slate-900">
          Batal
        </Button>
        <Button type="button" onClick={onSubmit} disabled={isSubmitting} variant="outline" className="w-full sm:w-auto">
          <Printer className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Memproses...' : 'Print Invoice'}
        </Button>
      </div>
    </div>
  );
}
