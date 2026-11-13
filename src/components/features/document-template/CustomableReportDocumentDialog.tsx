import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import {
  Archive,
  Bold,
  Download,
  FileText,
  Italic,
  List,
  ListOrdered,
  Printer,
  Redo2,
  Sparkles,
  Undo2,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { getObjectStorageUrl, StorageImage } from '@/components/ui/storage-image';
import { useDocumentTemplates } from '@/hooks/useDocumentTemplate';
import { useCreateDocumentArchive } from '@/hooks/useDocumentArchive';
import { getLatestDocumentNumber } from '@/services/document-archive.service';
import type { CashFlowReportItem } from '@/@types/cash-flow-report.types';
import type { DocumentArchive } from '@/@types/document-archive.types';
import { cn } from '@/lib/utils';

export interface CustomableReportDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportTitle?: string;
  companyName: string;
  periodLabel?: string;
  data: CashFlowReportItem[];
  totals: {
    debitCashIdr: number;
    kreditCashIdr: number;
    debitBankIdr: number;
    kreditBankIdr: number;
    debitBankUsd: number;
    kreditBankUsd: number;
  };
  fallbackLetterhead?: string;
  onArchiveSuccess?: (archive: DocumentArchive) => void;
}

function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 rounded border border-slate-200 bg-white p-1">
      <button
        type="button"
        title="Tebal"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          'rounded p-1 text-slate-600 hover:bg-slate-100',
          editor.isActive('bold') && 'bg-slate-200 text-blue-700'
        )}
      >
        <Bold className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        title="Miring"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(
          'rounded p-1 text-slate-600 hover:bg-slate-100',
          editor.isActive('italic') && 'bg-slate-200 text-blue-700'
        )}
      >
        <Italic className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        title="Daftar Bullet"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(
          'rounded p-1 text-slate-600 hover:bg-slate-100',
          editor.isActive('bulletList') && 'bg-slate-200 text-blue-700'
        )}
      >
        <List className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        title="Daftar Angka"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(
          'rounded p-1 text-slate-600 hover:bg-slate-100',
          editor.isActive('orderedList') && 'bg-slate-200 text-blue-700'
        )}
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </button>
      <div className="mx-1 h-3.5 w-[1px] bg-slate-200" />
      <button
        type="button"
        title="Undo"
        onClick={() => editor.chain().focus().undo().run()}
        className="rounded p-1 text-slate-600 hover:bg-slate-100"
      >
        <Undo2 className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        title="Redo"
        onClick={() => editor.chain().focus().redo().run()}
        className="rounded p-1 text-slate-600 hover:bg-slate-100"
      >
        <Redo2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function CustomableReportDocumentDialog({
  open,
  onOpenChange,
  reportTitle = 'Laporan Transaksi Kas',
  companyName,
  periodLabel = '-',
  data,
  totals,
  fallbackLetterhead,
  onArchiveSuccess,
}: CustomableReportDocumentDialogProps) {
  // Query master templates
  const { data: templatesData } = useDocumentTemplates({ page: 1, perPage: 100 });
  const templates = useMemo(() => templatesData?.data ?? [], [templatesData?.data]);

  // Selected template state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Customizable document state
  const [subject, setSubject] = useState(reportTitle);
  const [tableColor, setTableColor] = useState('#1f4163');
  const [personSigner, setPersonSigner] = useState('Zaifudin Yukhri');
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(fallbackLetterhead || null);

  // Archive metadata state
  const [archiveName, setArchiveName] = useState('');
  const [documentCode, setDocumentCode] = useState('');
  const [archiveNotes, setArchiveNotes] = useState('');

  // Processing states
  const [isFetchingCode, setIsFetchingCode] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const createArchiveMutation = useCreateDocumentArchive();

  // Initial defaults when dialog opens
  useEffect(() => {
    if (open) {
      const today = new Date().toISOString().slice(0, 10);
      setArchiveName(`${reportTitle} - ${periodLabel !== '-' ? periodLabel : today}`);
      setSubject(reportTitle);
      setBackgroundUrl(fallbackLetterhead || null);
    }
  }, [open, reportTitle, periodLabel, fallbackLetterhead]);

  // Tiptap Header Content Editor
  const defaultHeader = '<p>Berikut adalah rincian mutasi kas dan bank yang dicatat pada periode ini:</p>';
  const [headerHtml, setHeaderHtml] = useState(defaultHeader);
  const headerEditor = useEditor({
    extensions: [StarterKit],
    content: defaultHeader,
    immediatelyRender: false,
    onUpdate: ({ editor: next }: { editor: Editor }) => {
      setHeaderHtml(next.getHTML());
    },
  });

  // Tiptap Footer Content Editor
  const defaultFooter = '<p>Dokumen ini dibuat otomatis sebagai laporan mutasi kas dan bank operasional perusahaan.</p>';
  const [footerHtml, setFooterHtml] = useState(defaultFooter);
  const footerEditor = useEditor({
    extensions: [StarterKit],
    content: defaultFooter,
    immediatelyRender: false,
    onUpdate: ({ editor: next }: { editor: Editor }) => {
      setFooterHtml(next.getHTML());
    },
  });

  // When a master template is selected, adopt its style and content
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = templates.find((t) => String(t.id) === templateId);
    if (!tmpl) return;

    if (tmpl.subject) setSubject(tmpl.subject);
    if (tmpl.tableColor && /^#[0-9a-f]{6}$/i.test(tmpl.tableColor)) {
      setTableColor(tmpl.tableColor);
    }
    if (tmpl.personSigner) setPersonSigner(tmpl.personSigner);
    if (tmpl.personSignature) setSignatureUrl(tmpl.personSignature);
    if (tmpl.documentTemplate) {
      setBackgroundUrl(getObjectStorageUrl(tmpl.documentTemplate));
    } else if (fallbackLetterhead) {
      setBackgroundUrl(fallbackLetterhead);
    }

    if (tmpl.headerInformation && headerEditor) {
      headerEditor.commands.setContent(tmpl.headerInformation);
      setHeaderHtml(tmpl.headerInformation);
    }
    if (tmpl.footerInformation && footerEditor) {
      footerEditor.commands.setContent(tmpl.footerInformation);
      setFooterHtml(tmpl.footerInformation);
    }
    toast.success(`Template ${tmpl.name} berhasil diterapkan`);
  };

  // Fetch suggested document code from backend DocumentArchiveService
  const handleFetchSuggestedCode = async () => {
    setIsFetchingCode(true);
    try {
      const res = await getLatestDocumentNumber('report');
      if (res?.suggested_code) {
        setDocumentCode(res.suggested_code);
        toast.success(`Kode saran diperoleh: ${res.suggested_code}`);
      }
    } catch {
      toast.error('Gagal mengambil saran kode dokumen');
    } finally {
      setIsFetchingCode(false);
    }
  };

  // Generate PDF File from the WYSIWYG preview DOM
  const generatePdfFile = async (): Promise<File | null> => {
    if (!previewRef.current) return null;
    setIsGeneratingPdf(true);
    try {
      const element = previewRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

      const blob = pdf.output('blob');
      const safeFilename = `${archiveName.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      return new File([blob], safeFilename, { type: 'application/pdf' });
    } catch (err: any) {
      toast.error(err?.message ?? 'Gagal membuat berkas PDF dokumen');
      return null;
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Direct Download PDF
  const handleDownloadPdf = async () => {
    const file = await generatePdfFile();
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success('Berkas PDF berhasil diunduh');
  };

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  // Store & Archive Document via Backend API
  const handleSaveAndArchive = async () => {
    if (!archiveName.trim()) {
      toast.error('Nama dokumen arsip wajib diisi');
      return;
    }

    const pdfFile = await generatePdfFile();
    if (!pdfFile) return;

    try {
      const result = await createArchiveMutation.mutateAsync({
        name: archiveName.trim(),
        type: 'report',
        file: pdfFile,
        document_code: documentCode.trim() || undefined,
        notes: archiveNotes.trim() || `Diarsipkan dari Laporan Transaksi Kas (${periodLabel})`,
        is_active: true,
      });

      toast.success(
        `Laporan berhasil diarsipkan dengan kode: ${result.documentCode || documentCode || 'Auto'}`
      );
      if (onArchiveSuccess) {
        onArchiveSuccess(result);
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message ?? 'Gagal menyimpan arsip dokumen ke server backend');
    }
  };

  // Limit preview rows to 20 for preview readability
  const previewRows = data.slice(0, 20);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] w-[95vw] max-w-[1400px] overflow-hidden p-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="border-b border-slate-200 px-6 py-4 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Kustomisasi Konten & Arsip Dokumen Laporan
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Pilih template, kustomisasi teks dengan rich editor Tiptap, lalu arsipkan langsung ke server backend.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-1.5 text-xs h-8"
              >
                <Printer className="h-3.5 w-3.5" />
                Print
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="gap-1.5 text-xs h-8"
              >
                <Download className="h-3.5 w-3.5" />
                {isGeneratingPdf ? 'Memproses...' : 'Unduh PDF'}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveAndArchive}
                disabled={isGeneratingPdf || createArchiveMutation.isPending}
                className="bg-[#1e3a5f] hover:bg-[#152e4d] text-white gap-1.5 text-xs h-8"
              >
                <Archive className="h-3.5 w-3.5" />
                {createArchiveMutation.isPending || isGeneratingPdf
                  ? 'Mengarsipkan...'
                  : 'Simpan ke Arsip Dokumen'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Two-Column Workspace */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[460px_minmax(0,1fr)] overflow-hidden">
          {/* Left Column: Form Controls & Customization */}
          <div className="overflow-y-auto p-5 space-y-4 border-r border-slate-200 bg-slate-50/50">
            {/* Template Selector */}
            <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-blue-900 uppercase tracking-wider">
                  1. Pilih Basis Template Dokumen
                </Label>
                {selectedTemplateId && (
                  <Badge variant="outline" className="border-blue-300 text-blue-800 text-[10px]">
                    Template Aktif
                  </Badge>
                )}
              </div>
              <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                <SelectTrigger className="w-full bg-white text-xs">
                  <SelectValue placeholder="Pilih template untuk load kop & gaya..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((tmpl) => (
                    <SelectItem key={tmpl.id} value={String(tmpl.id)} className="text-xs">
                      {tmpl.name} ({tmpl.language.toUpperCase()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-blue-700">
                Memilih template akan mengimpor background kop surat, aksen warna, dan penandatangan.
              </p>
            </div>

            {/* Metadata Arsip */}
            <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-3">
              <Label className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                2. Metadata Arsip Dokumen
              </Label>

              <div className="space-y-1">
                <Label htmlFor="archive-name" className="text-xs font-medium">
                  Nama Arsip Dokumen <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="archive-name"
                  value={archiveName}
                  onChange={(e) => setArchiveName(e.target.value)}
                  placeholder="Contoh: Laporan Transaksi Kas November 2026"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="archive-code" className="text-xs font-medium">
                    Kode Dokumen
                  </Label>
                  <button
                    type="button"
                    onClick={handleFetchSuggestedCode}
                    disabled={isFetchingCode}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    <Sparkles className="h-3 w-3" />
                    {isFetchingCode ? 'Mengambil...' : 'Ambil Kode'}
                  </button>
                </div>
                <Input
                  id="archive-code"
                  value={documentCode}
                  onChange={(e) => setDocumentCode(e.target.value.toUpperCase())}
                  placeholder="Auto-generate dari sistem jika kosong"
                  className="font-mono text-xs uppercase"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="archive-notes" className="text-xs font-medium">
                  Catatan Arsip
                </Label>
                <Textarea
                  id="archive-notes"
                  value={archiveNotes}
                  onChange={(e) => setArchiveNotes(e.target.value)}
                  placeholder="Catatan tambahan untuk arsip ini..."
                  rows={2}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Custom Content & Tiptap Editors */}
            <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-3">
              <Label className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                3. Kustomisasi Isi Konten Dokumen
              </Label>

              {/* Subject & Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="custom-subject" className="text-xs font-medium">
                    Perihal / Judul
                  </Label>
                  <Input
                    id="custom-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="text-xs font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="table-color" className="text-xs font-medium">
                    Warna Aksen Tabel
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="table-color"
                      type="color"
                      value={tableColor}
                      onChange={(e) => setTableColor(e.target.value)}
                      className="h-8 w-10 cursor-pointer rounded border border-slate-200 p-0.5"
                    />
                    <Input
                      value={tableColor}
                      onChange={(e) => setTableColor(e.target.value)}
                      className="font-mono text-xs uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Header Rich Text Tiptap */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Konten Header / Paragraf Pengantar</Label>
                  <span className="text-[10px] text-slate-400">Tiptap Editor</span>
                </div>
                <EditorToolbar editor={headerEditor} />
                <div className="min-h-[80px] rounded border border-slate-200 p-2 text-xs bg-slate-50/30">
                  <EditorContent editor={headerEditor} className="prose prose-xs max-w-none text-xs" />
                </div>
              </div>

              {/* Footer Rich Text Tiptap */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Konten Footer / Catatan Penutup</Label>
                  <span className="text-[10px] text-slate-400">Tiptap Editor</span>
                </div>
                <EditorToolbar editor={footerEditor} />
                <div className="min-h-[70px] rounded border border-slate-200 p-2 text-xs bg-slate-50/30">
                  <EditorContent editor={footerEditor} className="prose prose-xs max-w-none text-xs" />
                </div>
              </div>

              {/* Signer */}
              <div className="space-y-1">
                <Label htmlFor="signer-name" className="text-xs font-medium">
                  Nama Penandatangan
                </Label>
                <Input
                  id="signer-name"
                  value={personSigner}
                  onChange={(e) => setPersonSigner(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live A4 WYSIWYG Document Preview */}
          <div className="overflow-y-auto bg-slate-200 p-4 sm:p-6 flex justify-center">
            <div
              ref={previewRef}
              className="relative w-[794px] min-h-[1123px] bg-white shadow-xl overflow-hidden text-slate-900"
              style={{
                backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            >
              {/* Padding to clear physical letterhead: 36mm top, 30mm bottom, 18mm sides */}
              <div className="flex min-h-[1123px] flex-col px-[55px] pt-[125px] pb-[90px]">
                {/* Header Information */}
                <header className="border-b-2 pb-2" style={{ borderColor: tableColor }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[8pt] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Laporan Akuntansi / Kas
                      </p>
                      <h1 className="text-[13pt] font-bold uppercase tracking-wide mt-0.5">
                        {subject || reportTitle}
                      </h1>
                      <p className="text-[8pt] font-semibold uppercase text-slate-700">{companyName}</p>
                    </div>
                    <dl className="grid min-w-[55mm] grid-cols-[20mm_1fr] gap-x-1 gap-y-0.5 text-[7pt] leading-tight">
                      <dt className="text-slate-500">Periode</dt>
                      <dd className="font-medium">: {periodLabel}</dd>
                      <dt className="text-slate-500">Kode</dt>
                      <dd className="font-mono">: {documentCode || 'AUTO'}</dd>
                      <dt className="text-slate-500">Dicetak</dt>
                      <dd>: {new Date().toLocaleDateString('id-ID')}</dd>
                    </dl>
                  </div>

                  {/* Render Custom Header from Tiptap */}
                  {headerHtml && (
                    <div
                      className="mt-2 text-[7.5pt] leading-relaxed text-slate-700 prose prose-xs max-w-none"
                      dangerouslySetInnerHTML={{ __html: headerHtml }}
                    />
                  )}
                </header>

                {/* Table Data */}
                <div className="mt-3 overflow-hidden border border-slate-300">
                  <table className="w-full table-fixed border-collapse text-[6.5pt] leading-tight">
                    <thead>
                      <tr className="text-white" style={{ backgroundColor: tableColor }}>
                        <th className="w-[6%] border border-white/20 px-1 py-1 text-center font-semibold">No</th>
                        <th className="w-[12%] border border-white/20 px-1 py-1 text-center font-semibold">Tanggal</th>
                        <th className="w-[14%] border border-white/20 px-1 py-1 text-left font-semibold">Nota/Ref</th>
                        <th className="w-[28%] border border-white/20 px-1 py-1 text-left font-semibold">Keterangan</th>
                        <th className="w-[10%] border border-white/20 px-1 py-1 text-right font-semibold">Kas In</th>
                        <th className="w-[10%] border border-white/20 px-1 py-1 text-right font-semibold">Kas Out</th>
                        <th className="w-[10%] border border-white/20 px-1 py-1 text-right font-semibold">Bank In</th>
                        <th className="w-[10%] border border-white/20 px-1 py-1 text-right font-semibold">Bank Out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, idx) => {
                        const debitCash = Number(row.debit_cash_idr ?? row['DEBIT (CASH IDR)'] ?? 0);
                        const kreditCash = Number(row.kredit_cash_idr ?? row['KREDIT (CASH IDR)'] ?? 0);
                        const debitBank = Number(row.debit_bank_idr ?? row['DEBIT (BANK IDR)'] ?? 0);
                        const kreditBank = Number(row.kredit_bank_idr ?? row['KREDIT (BANK IDR)'] ?? 0);

                        return (
                          <tr
                            key={row.id ?? idx}
                            className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}
                          >
                            <td className="border border-slate-200 px-1 py-1 text-center">{idx + 1}</td>
                            <td className="border border-slate-200 px-1 py-1 text-center">
                              {row.tanggal ? String(row.tanggal).slice(0, 10) : '-'}
                            </td>
                            <td className="border border-slate-200 px-1 py-1 font-mono truncate">
                              {row.nota_ref || '-'}
                            </td>
                            <td className="border border-slate-200 px-1 py-1 truncate">
                              {row.keterangan || '-'}
                            </td>
                            <td className="border border-slate-200 px-1 py-1 text-right tabular-nums">
                              {debitCash > 0 ? currenciesFormat('idr', debitCash) : '-'}
                            </td>
                            <td className="border border-slate-200 px-1 py-1 text-right tabular-nums">
                              {kreditCash > 0 ? currenciesFormat('idr', kreditCash) : '-'}
                            </td>
                            <td className="border border-slate-200 px-1 py-1 text-right tabular-nums">
                              {debitBank > 0 ? currenciesFormat('idr', debitBank) : '-'}
                            </td>
                            <td className="border border-slate-200 px-1 py-1 text-right tabular-nums">
                              {kreditBank > 0 ? currenciesFormat('idr', kreditBank) : '-'}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Summary Row */}
                      <tr className="font-bold bg-slate-100" style={{ backgroundColor: `${tableColor}14` }}>
                        <td colSpan={4} className="border border-slate-300 px-1.5 py-1 text-right uppercase">
                          Total
                        </td>
                        <td className="border border-slate-300 px-1 py-1 text-right tabular-nums text-emerald-800">
                          {currenciesFormat('idr', totals.debitCashIdr)}
                        </td>
                        <td className="border border-slate-300 px-1 py-1 text-right tabular-nums text-rose-800">
                          {currenciesFormat('idr', totals.kreditCashIdr)}
                        </td>
                        <td className="border border-slate-300 px-1 py-1 text-right tabular-nums text-emerald-800">
                          {currenciesFormat('idr', totals.debitBankIdr)}
                        </td>
                        <td className="border border-slate-300 px-1 py-1 text-right tabular-nums text-rose-800">
                          {currenciesFormat('idr', totals.kreditBankIdr)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {data.length > 20 && (
                  <p className="mt-1 text-[6pt] text-slate-400 italic">
                    * Menampilkan 20 transaksi pertama dari total {data.length} transaksi pada preview ringkas.
                  </p>
                )}

                {/* Footer Section */}
                <footer className="mt-auto pt-3">
                  {/* Render Custom Footer from Tiptap */}
                  {footerHtml && (
                    <div
                      className="mb-4 text-[7pt] text-slate-600 prose prose-xs max-w-none"
                      dangerouslySetInnerHTML={{ __html: footerHtml }}
                    />
                  )}

                  {/* Signer Signature Block */}
                  <div className="flex items-end justify-between gap-6 pt-2">
                    <p className="text-[6.5pt] text-slate-400">
                      Dicetak pada: {new Date().toLocaleString('id-ID')}
                    </p>

                    <div className="min-w-[45mm] text-center text-slate-800">
                      <p className="text-[7pt]">Mengetahui,</p>
                      <div className="flex h-[14mm] items-center justify-center my-1">
                        {signatureUrl && (
                          <StorageImage
                            src={signatureUrl}
                            alt="Tanda tangan"
                            width={140}
                            height={60}
                            className="max-h-[14mm] max-w-[35mm] object-contain"
                          />
                        )}
                      </div>
                      <p className="border-t border-slate-700 pt-0.5 text-[7pt] font-semibold">
                        {personSigner || '-'}
                      </p>
                    </div>
                  </div>
                </footer>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
