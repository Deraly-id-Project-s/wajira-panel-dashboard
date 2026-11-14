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
  Clock,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  GripVertical,
  ImageIcon,
  Italic,
  List,
  ListOrdered,
  Move,
  Plus,
  Printer,
  Redo2,
  RotateCcw,
  Sparkles,
  Table as TableIcon,
  Trash2,
  Type,
  Undo2,
  Upload,
  ZoomIn,
  ZoomOut,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { getObjectStorageUrl } from '@/components/ui/storage-image';
import { useDocumentTemplates } from '@/hooks/useDocumentTemplate';
import { useCreateDocumentArchive } from '@/hooks/useDocumentArchive';
import { getLatestDocumentNumber } from '@/services/document-archive.service';
import type { CashFlowReportItem } from '@/@types/cash-flow-report.types';
import type { DocumentArchive } from '@/@types/document-archive.types';
import { cn } from '@/lib/utils';

export interface ComponentPosition {
  x: number;
  y: number;
  width: number;
}

export interface SignatureBlock {
  id: string;
  label: string;
  signerName: string;
  signatureUrl: string | null;
  x: number;
  y: number;
  width: number;
}

export interface CustomTextBlock {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
  fontWeight: 'normal' | 'semibold' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string;
  textAlign: 'left' | 'center' | 'right';
  border: boolean;
}

export interface CustomImageBlock {
  id: string;
  name: string;
  url: string;
  x: number;
  y: number;
  width: number;
  opacity: number;
}

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

// Default standard A4 positions (794px width, 1123px height)
const DEFAULT_POSITIONS: {
  headerInfo: ComponentPosition;
  introText: ComponentPosition;
  table: ComponentPosition;
  closingText: ComponentPosition;
  printDate: ComponentPosition;
} = {
  headerInfo: { x: 55, y: 125, width: 684 },
  introText: { x: 55, y: 220, width: 684 },
  table: { x: 55, y: 295, width: 684 },
  closingText: { x: 55, y: 790, width: 684 },
  printDate: { x: 55, y: 1060, width: 320 },
};

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
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(fallbackLetterhead || null);

  // Archive metadata state
  const [archiveName, setArchiveName] = useState('');
  const [documentCode, setDocumentCode] = useState('');
  const [archiveNotes, setArchiveNotes] = useState('');

  // Active left tab
  const [activeTab, setActiveTab] = useState<'info' | 'text' | 'media'>('info');

  // Preview zoom level & Drag visual guides
  const [zoom, setZoom] = useState(1);
  const [showDragHandles, setShowDragHandles] = useState(true);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Dynamic Relocatable Positions for ALL Standard Components
  const [headerInfoPos, setHeaderInfoPos] = useState<ComponentPosition>(DEFAULT_POSITIONS.headerInfo);
  const [introTextPos, setIntroTextPos] = useState<ComponentPosition>(DEFAULT_POSITIONS.introText);
  const [tablePos, setTablePos] = useState<ComponentPosition>(DEFAULT_POSITIONS.table);
  const [closingTextPos, setClosingTextPos] = useState<ComponentPosition>(DEFAULT_POSITIONS.closingText);
  const [printDatePos, setPrintDatePos] = useState<ComponentPosition>(DEFAULT_POSITIONS.printDate);

  // Signatures configuration (Draggable on Canvas)
  const [signatures, setSignatures] = useState<SignatureBlock[]>([
    {
      id: 'sig-1',
      label: 'Mengetahui,',
      signerName: 'Zaifudin Yukhri',
      signatureUrl: null,
      x: 520,
      y: 920,
      width: 190,
    },
  ]);

  // Custom Text Blocks (Draggable on Canvas)
  const [textBlocks, setTextBlocks] = useState<CustomTextBlock[]>([]);

  // Custom Image Blocks (Draggable on Canvas, e.g. stamps, logo, QR)
  const [imageBlocks, setImageBlocks] = useState<CustomImageBlock[]>([]);

  // Processing states
  const [isFetchingCode, setIsFetchingCode] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sigFileInputRef = useRef<HTMLInputElement>(null);
  const [activeSigIdForUpload, setActiveSigIdForUpload] = useState<string | null>(null);

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
    if (tmpl.documentTemplate) {
      setBackgroundUrl(getObjectStorageUrl(tmpl.documentTemplate));
    } else if (fallbackLetterhead) {
      setBackgroundUrl(fallbackLetterhead);
    }

    if (tmpl.personSigner || tmpl.personSignature) {
      setSignatures((prev) =>
        prev.map((s, idx) =>
          idx === 0
            ? {
              ...s,
              signerName: tmpl.personSigner || s.signerName,
              signatureUrl: tmpl.personSignature ? getObjectStorageUrl(tmpl.personSignature) : s.signatureUrl,
            }
            : s
        )
      );
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

  // Unified Drag and Drop Handler for ALL Components on Canvas
  type ItemType =
    | 'headerInfo'
    | 'introText'
    | 'table'
    | 'closingText'
    | 'printDate'
    | 'signature'
    | 'text'
    | 'image';

  const handleDragStart = (
    e: React.PointerEvent,
    itemId: string,
    itemType: ItemType,
    currentX: number,
    currentY: number
  ) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, select')) return;

    e.preventDefault();
    e.stopPropagation();

    setActiveDragId(itemId);
    const startPointerX = e.clientX;
    const startPointerY = e.clientY;
    const currentZoom = zoom || 1;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = (moveEvent.clientX - startPointerX) / currentZoom;
      const deltaY = (moveEvent.clientY - startPointerY) / currentZoom;

      const nextX = Math.max(0, Math.min(740, Math.round(currentX + deltaX)));
      const nextY = Math.max(0, Math.min(1080, Math.round(currentY + deltaY)));

      switch (itemType) {
        case 'headerInfo':
          setHeaderInfoPos((prev) => ({ ...prev, x: nextX, y: nextY }));
          break;
        case 'introText':
          setIntroTextPos((prev) => ({ ...prev, x: nextX, y: nextY }));
          break;
        case 'table':
          setTablePos((prev) => ({ ...prev, x: nextX, y: nextY }));
          break;
        case 'closingText':
          setClosingTextPos((prev) => ({ ...prev, x: nextX, y: nextY }));
          break;
        case 'printDate':
          setPrintDatePos((prev) => ({ ...prev, x: nextX, y: nextY }));
          break;
        case 'signature':
          setSignatures((prev) =>
            prev.map((s) => (s.id === itemId ? { ...s, x: nextX, y: nextY } : s))
          );
          break;
        case 'text':
          setTextBlocks((prev) =>
            prev.map((t) => (t.id === itemId ? { ...t, x: nextX, y: nextY } : t))
          );
          break;
        case 'image':
          setImageBlocks((prev) =>
            prev.map((img) => (img.id === itemId ? { ...img, x: nextX, y: nextY } : img))
          );
          break;
      }
    };

    const handlePointerUp = () => {
      setActiveDragId(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Reset all layout positions to standard clean flow
  const handleResetAllPositions = () => {
    setHeaderInfoPos(DEFAULT_POSITIONS.headerInfo);
    setIntroTextPos(DEFAULT_POSITIONS.introText);
    setTablePos(DEFAULT_POSITIONS.table);
    setClosingTextPos(DEFAULT_POSITIONS.closingText);
    setPrintDatePos(DEFAULT_POSITIONS.printDate);
    setSignatures((prev) =>
      prev.map((s, idx) => ({
        ...s,
        x: idx === 0 ? 520 : 80 + idx * 210,
        y: 920,
      }))
    );
    toast.success('Tata letak dokumen dirapikan ke posisi standar');
  };

  // Signature Block Management
  const handleAddSignature = () => {
    const newSig: SignatureBlock = {
      id: `sig-${Date.now()}`,
      label: 'Dibuat oleh,',
      signerName: 'Nama Staf / Pemeriksa',
      signatureUrl: null,
      x: 80,
      y: 920,
      width: 190,
    };
    setSignatures((prev) => [...prev, newSig]);
    setActiveTab('media');
    toast.success('Blok tanda tangan baru ditambahkan. Geser di pratinjau untuk mengatur posisinya.');
  };

  const handleDeleteSignature = (id: string) => {
    if (signatures.length <= 1) {
      toast.error('Minimal harus ada 1 penandatangan');
      return;
    }
    setSignatures((prev) => prev.filter((s) => s.id !== id));
    toast.info('Blok tanda tangan dihapus');
  };

  const handleTriggerUploadSignature = (sigId: string) => {
    setActiveSigIdForUpload(sigId);
    if (sigFileInputRef.current) {
      sigFileInputRef.current.value = '';
      sigFileInputRef.current.click();
    }
  };

  const handleSigFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSigIdForUpload) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSignatures((prev) =>
        prev.map((s) => (s.id === activeSigIdForUpload ? { ...s, signatureUrl: result } : s))
      );
      toast.success('Berkas tanda tangan berhasil dimuat');
    };
    reader.readAsDataURL(file);
  };

  // Custom Text Block Management
  const handleAddTextBlock = () => {
    const newBlock: CustomTextBlock = {
      id: `text-${Date.now()}`,
      text: 'Catatan / teks tambahan baru di sini...',
      x: 60,
      y: 380,
      width: 300,
      fontSize: 9,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#334155',
      textAlign: 'left',
      border: false,
    };
    setTextBlocks((prev) => [...prev, newBlock]);
    setActiveTab('text');
    toast.success('Blok teks baru ditambahkan. Geser & sesuaikan posisinya di pratinjau dokumen.');
  };

  const handleDeleteTextBlock = (id: string) => {
    setTextBlocks((prev) => prev.filter((t) => t.id !== id));
    toast.info('Blok teks dihapus');
  };

  const handleUpdateTextBlock = (id: string, patch: Partial<CustomTextBlock>) => {
    setTextBlocks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  // Custom Image Block Management (Stamps, Logos, Watermarks)
  const handleTriggerUploadImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleImageFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const newImg: CustomImageBlock = {
        id: `img-${Date.now()}`,
        name: file.name.slice(0, 18),
        url: result,
        x: 430,
        y: 890,
        width: 130,
        opacity: 0.95,
      };
      setImageBlocks((prev) => [...prev, newImg]);
      setActiveTab('media');
      toast.success('Komponen gambar/stempel berhasil ditambahkan.');
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteImageBlock = (id: string) => {
    setImageBlocks((prev) => prev.filter((img) => img.id !== id));
    toast.info('Komponen gambar dihapus');
  };

  const handleUpdateImageBlock = (id: string, patch: Partial<CustomImageBlock>) => {
    setImageBlocks((prev) => prev.map((img) => (img.id === id ? { ...img, ...patch } : img)));
  };

  // Comprehensive regex matching all unsupported CSS Color Module Level 4/5 functions (oklab, oklch, color-mix, lab, lch, color, light-dark, hwb)
  const UNSUPPORTED_COLOR_FN_REGEX = /\b(oklab|oklch|color-mix|lab|lch|color|light-dark|hwb)\s*\(/i;

  // Extracts the full balanced function call substring starting at startIndex
  const extractBalancedFunction = (
    str: string,
    startIndex: number
  ): { fullMatch: string; endIndex: number } | null => {
    const openParen = str.indexOf('(', startIndex);
    if (openParen === -1) return null;

    let depth = 1;
    let i = openParen + 1;
    while (i < str.length && depth > 0) {
      if (str[i] === '(') depth++;
      else if (str[i] === ')') depth--;
      i++;
    }

    if (depth === 0) {
      return {
        fullMatch: str.substring(startIndex, i),
        endIndex: i,
      };
    }
    return null;
  };

  // Convert any modern color expression into standard sRGB (#hex or rgba) using Canvas2D
  const convertModernColorToSrgb = (colorExpr: string): string => {
    if (typeof document !== 'undefined') {
      try {
        const helperCanvas = document.createElement('canvas');
        helperCanvas.width = 1;
        helperCanvas.height = 1;
        const helperCtx = helperCanvas.getContext('2d');
        if (helperCtx) {
          helperCtx.fillStyle = '#000000';
          helperCtx.fillStyle = colorExpr;
          const converted = helperCtx.fillStyle;
          if (converted && !UNSUPPORTED_COLOR_FN_REGEX.test(converted)) {
            return converted;
          }
        }
      } catch {
        // fallback below
      }
    }

    // Semantic fallbacks
    if (colorExpr.includes('transparent') || colorExpr.includes('/ 0') || colorExpr.includes(' 0%')) {
      return 'rgba(0, 0, 0, 0)';
    }
    if (colorExpr.includes('1 0 0') || colorExpr.includes('0.98') || colorExpr.includes('white')) {
      return '#ffffff';
    }
    return '#1e293b';
  };

  // Sanitizes a style string or property value by resolving any unsupported color functions
  const sanitizeColorString = (val: string): string => {
    if (!val || typeof val !== 'string' || !UNSUPPORTED_COLOR_FN_REGEX.test(val)) {
      return val;
    }

    // Strip modern gradient color interpolation like 'in oklab,' or 'in oklch,'
    let result = val
      .replace(/linear-gradient\(\s*in\s+(?:oklab|oklch|lab|lch)\s*,\s*/gi, 'linear-gradient(')
      .replace(/linear-gradient\(\s*to\s+([a-z\s]+)\s+in\s+(?:oklab|oklch|lab|lch)\s*,\s*/gi, 'linear-gradient(to $1, ');

    let maxLoops = 25;
    while (UNSUPPORTED_COLOR_FN_REGEX.test(result) && maxLoops > 0) {
      maxLoops--;
      const match = result.match(UNSUPPORTED_COLOR_FN_REGEX);
      if (!match || match.index === undefined) break;

      const fnCall = extractBalancedFunction(result, match.index);
      if (!fnCall) {
        result = result.replace(match[0], 'rgb(30, 41, 59)(');
        break;
      }

      const converted = convertModernColorToSrgb(fnCall.fullMatch);
      result = result.substring(0, match.index) + converted + result.substring(fnCall.endIndex);
    }

    return result;
  };

  // Generate PDF File from the WYSIWYG preview DOM
  const generatePdfFile = async (): Promise<File | null> => {
    if (!previewRef.current) return null;
    setIsGeneratingPdf(true);

    const prevZoom = zoom;
    setZoom(1);
    await new Promise((resolve) => setTimeout(resolve, 80));

    const origWindowGetComputedStyle = window.getComputedStyle;

    const wrapGetComputedStyle = (win: Window) => {
      const orig = win.getComputedStyle.bind(win);
      win.getComputedStyle = function (elt: Element, pseudoElt?: string | null) {
        const style = orig(elt, pseudoElt);
        return new Proxy(style, {
          get(target, prop) {
            const val = (target as any)[prop];
            if (typeof val === 'function') {
              if (prop === 'getPropertyValue') {
                return (propertyName: string) => {
                  const propVal = target.getPropertyValue(propertyName);
                  return sanitizeColorString(propVal);
                };
              }
              return val.bind(target);
            }
            if (typeof val === 'string') {
              return sanitizeColorString(val);
            }
            return val;
          },
        });
      };
    };

    try {
      // Intercept getComputedStyle to prevent html2canvas crashing on oklch
      wrapGetComputedStyle(window);

      const element = previewRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          if (clonedDoc.defaultView) {
            wrapGetComputedStyle(clonedDoc.defaultView);
          }

          // Inject safe hex fallbacks for all root CSS variables in cloned DOM
          const styleOverride = clonedDoc.createElement('style');
          styleOverride.textContent = `
            :root, * {
              --background: #ffffff !important;
              --foreground: #020817 !important;
              --card: #ffffff !important;
              --card-foreground: #020817 !important;
              --popover: #ffffff !important;
              --popover-foreground: #020817 !important;
              --primary: #0f172a !important;
              --primary-foreground: #f8fafc !important;
              --secondary: #f1f5f9 !important;
              --secondary-foreground: #0f172a !important;
              --muted: #f8fafc !important;
              --muted-foreground: #64748b !important;
              --accent: #f1f5f9 !important;
              --accent-foreground: #0f172a !important;
              --destructive: #ef4444 !important;
              --border: #e2e8f0 !important;
              --input: #e2e8f0 !important;
              --ring: #94a3b8 !important;
              outline-color: transparent !important;
            }
          `;
          clonedDoc.head.appendChild(styleOverride);

          // Sanitize any style tags inside cloned doc containing modern color functions
          clonedDoc.querySelectorAll('style').forEach((st) => {
            if (st.textContent && UNSUPPORTED_COLOR_FN_REGEX.test(st.textContent)) {
              st.textContent = sanitizeColorString(st.textContent);
            }
          });

          // Sanitize inline style attributes on all cloned elements
          clonedDoc.querySelectorAll('*').forEach((el) => {
            const htmlEl = el as HTMLElement;
            const styleAttr = htmlEl.getAttribute('style');
            if (styleAttr && UNSUPPORTED_COLOR_FN_REGEX.test(styleAttr)) {
              htmlEl.setAttribute('style', sanitizeColorString(styleAttr));
            }
          });
        },
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
      const safeFilename = `${(archiveName.trim() || 'Laporan_Kas').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      return new File([blob], safeFilename, { type: 'application/pdf' });
    } catch (err: any) {
      toast.error(err?.message ?? 'Gagal membuat berkas PDF dokumen');
      return null;
    } finally {
      window.getComputedStyle = origWindowGetComputedStyle;
      setZoom(prevZoom);
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
      <DialogContent
        size="3x"
        className="max-h-[96vh] w-[96vw] max-w-[1536px] overflow-hidden p-0 flex flex-col"
      >
        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFileSelected}
        />
        <input
          ref={sigFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleSigFileSelected}
        />

        {/* Header */}
        <DialogHeader className="border-b border-slate-200 px-6 py-3.5 shrink-0 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Kustomisasi Konten & Arsip Dokumen Laporan
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Tata letak bebas & dinamis: tabel, paragraf pengantar, penutup, tanda tangan, teks, dan gambar dapat digeser (drag & drop) ke posisi mana saja.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 mr-15">
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
                className="bg-[#1e3a5f] hover:bg-[#152e4d] text-white gap-1.5 text-xs h-8 shadow-sm"
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
          {/* Left Column: Tabbed Customization Controls */}
          <div className="overflow-y-auto p-4 border-r border-slate-200 bg-slate-50/60 flex flex-col">
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as 'info' | 'text' | 'media')}
              className="w-full flex-1 flex flex-col"
            >
              <TabsList className="grid grid-cols-3 w-full mb-3 shrink-0 bg-slate-200/70 p-1">
                <TabsTrigger value="info" className="text-xs py-1.5">
                  1. Info & Desain
                </TabsTrigger>
                <TabsTrigger value="text" className="text-xs py-1.5">
                  2. Konten Teks
                </TabsTrigger>
                <TabsTrigger value="media" className="text-xs py-1.5">
                  3. TTD & Gambar
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: INFO & TEMPLATE */}
              <TabsContent value="info" className="space-y-3.5 focus-visible:outline-none">
                {/* Template Selector */}
                <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-blue-900 uppercase tracking-wider">
                      Basis Template Dokumen
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
                    Memilih template akan mengimpor background kop surat, aksen warna, dan penandatangan standar.
                  </p>
                </div>

                {/* Metadata Arsip */}
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-3">
                  <Label className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    Metadata Arsip Dokumen
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
                      <Button
                        type="button"
                        onClick={handleFetchSuggestedCode}
                        disabled={isFetchingCode}
                        variant="link"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50 h-auto p-0"
                      >
                        <Sparkles className="h-3 w-3" />
                        {isFetchingCode ? 'Mengambil...' : 'Ambil Kode'}
                      </Button>
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

                {/* Subject & Color */}
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-3">
                  <Label className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    Desain Dokumen & Tabel
                  </Label>
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

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span>Posisi Kop & Judul:</span>
                    <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      X: {headerInfoPos.x}px, Y: {headerInfoPos.y}px
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Posisi Tabel Data:</span>
                    <span className="font-mono text-[11px] text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded">
                      X: {tablePos.x}px, Y: {tablePos.y}px
                    </span>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: KONTEN TEKS & BLOK TEKS */}
              <TabsContent value="text" className="space-y-3.5 focus-visible:outline-none">
                {/* Header Rich Text Tiptap */}
                <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs font-semibold text-slate-800">
                        Paragraf Pengantar (Header)
                      </Label>
                      <span className="font-mono text-[10px] text-amber-700 bg-amber-50 px-1 rounded">
                        X:{introTextPos.x} Y:{introTextPos.y}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Tiptap Rich Text</span>
                  </div>
                  <EditorToolbar editor={headerEditor} />
                  <div className="min-h-[75px] rounded border border-slate-200 p-2 text-xs bg-slate-50/30">
                    <EditorContent editor={headerEditor} className="prose prose-xs max-w-none text-xs" />
                  </div>
                </div>

                {/* Footer Rich Text Tiptap */}
                <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs font-semibold text-slate-800">
                        Catatan Penutup (Footer)
                      </Label>
                      <span className="font-mono text-[10px] text-purple-700 bg-purple-50 px-1 rounded">
                        X:{closingTextPos.x} Y:{closingTextPos.y}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Tiptap Rich Text</span>
                  </div>
                  <EditorToolbar editor={footerEditor} />
                  <div className="min-h-[65px] rounded border border-slate-200 p-2 text-xs bg-slate-50/30">
                    <EditorContent editor={footerEditor} className="prose prose-xs max-w-none text-xs" />
                  </div>
                </div>

                {/* Custom Text Blocks */}
                <div className="rounded-lg border border-indigo-200 bg-indigo-50/30 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-semibold text-indigo-950 uppercase tracking-wider">
                        Blok Teks Tambahan ({textBlocks.length})
                      </Label>
                      <p className="text-[11px] text-indigo-700">
                        Tambah blok teks bebas yang bisa digeser (drag & drop) ke mana saja pada dokumen.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddTextBlock}
                      className="gap-1 text-xs h-7 border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                    >
                      <Plus className="h-3 w-3" />
                      Tambah Teks
                    </Button>
                  </div>

                  {textBlocks.length === 0 ? (
                    <div className="rounded border border-dashed border-indigo-200 p-3 text-center text-xs text-indigo-500">
                      Belum ada blok teks tambahan. Klik tombol di atas untuk menambah teks bebas.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {textBlocks.map((tb, idx) => (
                        <div
                          key={tb.id}
                          className="rounded-md border border-slate-200 bg-white p-2.5 space-y-2 shadow-sm text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-700 flex items-center gap-1">
                              <Type className="h-3.5 w-3.5 text-indigo-600" />
                              Blok Teks #{idx + 1}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">
                                X:{tb.x} Y:{tb.y}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTextBlock(tb.id)}
                                className="h-6 w-6 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          <Textarea
                            value={tb.text}
                            onChange={(e) => handleUpdateTextBlock(tb.id, { text: e.target.value })}
                            placeholder="Isi teks..."
                            rows={2}
                            className="text-xs"
                          />

                          <div className="grid grid-cols-3 gap-1.5">
                            <div>
                              <Label className="text-[10px] text-slate-500">Ukuran</Label>
                              <Select
                                value={String(tb.fontSize)}
                                onValueChange={(val) =>
                                  handleUpdateTextBlock(tb.id, { fontSize: Number(val) })
                                }
                              >
                                <SelectTrigger className="h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[7, 8, 9, 10, 11, 12, 14, 16].map((s) => (
                                    <SelectItem key={s} value={String(s)} className="text-xs">
                                      {s} pt
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-[10px] text-slate-500">Gaya</Label>
                              <Select
                                value={tb.fontWeight}
                                onValueChange={(val) =>
                                  handleUpdateTextBlock(tb.id, {
                                    fontWeight: val as 'normal' | 'semibold' | 'bold',
                                  })
                                }
                              >
                                <SelectTrigger className="h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                                  <SelectItem value="semibold" className="text-xs">Semibold</SelectItem>
                                  <SelectItem value="bold" className="text-xs">Bold</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-[10px] text-slate-500">Rata</Label>
                              <Select
                                value={tb.textAlign}
                                onValueChange={(val) =>
                                  handleUpdateTextBlock(tb.id, {
                                    textAlign: val as 'left' | 'center' | 'right',
                                  })
                                }
                              >
                                <SelectTrigger className="h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="left" className="text-xs">Kiri</SelectItem>
                                  <SelectItem value="center" className="text-xs">Tengah</SelectItem>
                                  <SelectItem value="right" className="text-xs">Kanan</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600">
                              <input
                                type="checkbox"
                                checked={tb.border}
                                onChange={(e) =>
                                  handleUpdateTextBlock(tb.id, { border: e.target.checked })
                                }
                                className="rounded text-indigo-600 h-3.5 w-3.5"
                              />
                              Beri Bingkai / Kotak
                            </label>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400">Warna:</span>
                              <input
                                type="color"
                                value={tb.color}
                                onChange={(e) =>
                                  handleUpdateTextBlock(tb.id, { color: e.target.value })
                                }
                                className="h-5 w-7 cursor-pointer rounded border p-0"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* TAB 3: TANDA TANGAN & GAMBAR */}
              <TabsContent value="media" className="space-y-3.5 focus-visible:outline-none">
                {/* Tanda Tangan Section */}
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                        Tata Letak Tanda Tangan ({signatures.length})
                      </Label>
                      <p className="text-[11px] text-slate-500">
                        Geser kotak tanda tangan di dokumen secara drag & drop.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSignatures((prev) =>
                          prev.map((s, idx) => ({
                            ...s,
                            x: idx === 0 ? 520 : 80 + idx * 210,
                            y: 920,
                          }))
                        );
                        toast.info('Posisi tanda tangan direset ke area bawah');
                      }}
                      className="gap-1 text-[11px] h-7 text-slate-500 hover:text-slate-800"
                      title="Reset posisi tanda tangan ke default bawah"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset TTD
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {signatures.map((sig, idx) => (
                      <div
                        key={sig.id}
                        className="rounded-md border border-slate-200 bg-slate-50/60 p-2.5 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            <Move className="h-3.5 w-3.5 text-blue-600" />
                            Penandatangan #{idx + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 font-mono">
                              X:{sig.x} Y:{sig.y}
                            </span>
                            {signatures.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSignature(sig.id)}
                                className="h-6 w-6 p-0 text-rose-500 hover:text-rose-700"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-0.5">
                            <Label className="text-[10px] text-slate-500">Jabatan / Keterangan</Label>
                            <Input
                              value={sig.label}
                              onChange={(e) =>
                                setSignatures((prev) =>
                                  prev.map((s) =>
                                    s.id === sig.id ? { ...s, label: e.target.value } : s
                                  )
                                )
                              }
                              placeholder="Mengetahui, / Dibuat oleh,"
                              className="text-xs h-7"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-[10px] text-slate-500">Nama Penandatangan</Label>
                            <Input
                              value={sig.signerName}
                              onChange={(e) =>
                                setSignatures((prev) =>
                                  prev.map((s) =>
                                    s.id === sig.id ? { ...s, signerName: e.target.value } : s
                                  )
                                )
                              }
                              placeholder="Nama lengkap"
                              className="text-xs h-7"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-2">
                            {sig.signatureUrl ? (
                              <div className="h-6 w-12 border bg-white rounded flex items-center justify-center overflow-hidden">
                                <img
                                  src={sig.signatureUrl}
                                  alt="TTD"
                                  className="h-full object-contain"
                                />
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Tanpa berkas scan</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleTriggerUploadSignature(sig.id)}
                              className="gap-1 text-[11px] h-6 px-2"
                            >
                              <Upload className="h-3 w-3" />
                              {sig.signatureUrl ? 'Ganti TTD' : 'Upload Scan TTD'}
                            </Button>
                            {sig.signatureUrl && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setSignatures((prev) =>
                                    prev.map((s) =>
                                      s.id === sig.id ? { ...s, signatureUrl: null } : s
                                    )
                                  )
                                }
                                className="h-6 w-6 p-0 text-slate-400 hover:text-rose-600"
                                title="Hapus gambar TTD"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSignature}
                    className="w-full gap-1.5 text-xs h-8 text-blue-700 border-blue-200 hover:bg-blue-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Penandatangan Kedua
                  </Button>
                </div>

                {/* Komponen Gambar / Stempel Section */}
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-semibold text-emerald-950 uppercase tracking-wider">
                        Komponen Gambar & Stempel ({imageBlocks.length})
                      </Label>
                      <p className="text-[11px] text-emerald-700">
                        Upload stempel cap perusahaan, materai, logo, atau QR code.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleTriggerUploadImage}
                      className="gap-1 text-xs h-7 bg-emerald-700 hover:bg-emerald-800 text-white"
                    >
                      <Upload className="h-3 w-3" />
                      Upload Gambar
                    </Button>
                  </div>

                  {imageBlocks.length === 0 ? (
                    <div className="rounded border border-dashed border-emerald-200 p-3 text-center text-xs text-emerald-600">
                      Belum ada gambar tambahan. Klik Upload Gambar untuk menambahkan stempel atau logo.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {imageBlocks.map((img) => (
                        <div
                          key={img.id}
                          className="rounded-md border border-slate-200 bg-white p-2.5 space-y-2 shadow-sm text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                              <ImageIcon className="h-3.5 w-3.5 text-emerald-600" />
                              {img.name || 'Gambar'}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">
                                X:{img.x} Y:{img.y}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteImageBlock(img.id)}
                                className="h-6 w-6 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="h-10 w-12 border rounded bg-slate-50 flex items-center justify-center p-0.5 shrink-0">
                              <img
                                src={img.url}
                                alt={img.name}
                                className="h-full w-full object-contain"
                              />
                            </div>
                            <div className="flex-1 space-y-1.5">
                              <div className="flex items-center justify-between text-[11px] text-slate-600">
                                <span>Lebar: {img.width}px</span>
                                <span>Opasitas: {Math.round(img.opacity * 100)}%</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="range"
                                  min="40"
                                  max="320"
                                  step="5"
                                  value={img.width}
                                  onChange={(e) =>
                                    handleUpdateImageBlock(img.id, { width: Number(e.target.value) })
                                  }
                                  className="h-1.5 w-full cursor-pointer accent-emerald-600"
                                  title="Atur lebar gambar"
                                />
                                <input
                                  type="range"
                                  min="0.2"
                                  max="1"
                                  step="0.05"
                                  value={img.opacity}
                                  onChange={(e) =>
                                    handleUpdateImageBlock(img.id, {
                                      opacity: Number(e.target.value),
                                    })
                                  }
                                  className="h-1.5 w-full cursor-pointer accent-emerald-600"
                                  title="Atur transparansi gambar / stempel"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column: Live A4 WYSIWYG Document Preview with Drag & Drop Canvas */}
          <div className="overflow-y-auto bg-slate-300/80 p-4 sm:p-6 flex flex-col items-center select-none relative">
            {/* Canvas Interactive Toolbar */}
            <div
              data-html2canvas-ignore="true"
              className="sticky top-0 z-30 mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white/95 px-3.5 py-2 shadow-md backdrop-blur w-full max-w-[794px]"
            >
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Badge variant="secondary" className="gap-1 text-[11px] bg-blue-100 text-blue-800">
                  <Move className="h-3 w-3" />
                  Mode Drag & Drop Penuh Aktif
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetAllPositions}
                  className="h-7 text-[11px] gap-1 text-slate-700 hover:text-slate-900 border-slate-300"
                  title="Rapikan semua komponen ke posisi standar"
                >
                  <RotateCcw className="h-3 w-3" />
                  Rapikan Tata Letak
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDragHandles((prev) => !prev)}
                  className={cn(
                    'h-7 text-[11px] gap-1 border-slate-300',
                    showDragHandles ? 'bg-blue-50 text-blue-700 border-blue-300 font-medium' : 'text-slate-600'
                  )}
                  title="Tampilkan / sembunyikan bar pegangan geser"
                >
                  {showDragHandles ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {showDragHandles ? 'Handle Geser (ON)' : 'Pratinjau Polos'}
                </Button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Zoom:</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-slate-600"
                  onClick={() => setZoom((z) => Math.max(0.6, Number((z - 0.1).toFixed(1))))}
                  title="Perkecil"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <span className="tabular-nums font-mono text-xs w-9 text-center font-semibold text-slate-800">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-slate-600"
                  onClick={() => setZoom((z) => Math.min(1.3, Number((z + 0.1).toFixed(1))))}
                  title="Perbesar"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                {zoom !== 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-[10px] text-blue-600 hover:text-blue-800"
                    onClick={() => setZoom(1)}
                  >
                    100%
                  </Button>
                )}
              </div>
            </div>

            {/* Scaled Canvas Container */}
            <div
              style={{
                transform: zoom !== 1 ? `scale(${zoom})` : undefined,
                transformOrigin: 'top center',
                transition: 'transform 0.1s ease-out',
              }}
            >
              <div
                ref={previewRef}
                className="relative w-[794px] min-h-[1123px] bg-white shadow-2xl overflow-hidden text-slate-900 border border-slate-300"
                style={{
                  backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
                  backgroundSize: '100% 100%',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              >
                {/* ========================================================================= */}
                {/* 1. RELOCATABLE / DRAGGABLE HEADER INFO (KOP & JUDUL DOKUMEN)              */}
                {/* ========================================================================= */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${headerInfoPos.x}px`,
                    top: `${headerInfoPos.y}px`,
                    width: `${headerInfoPos.width}px`,
                  }}
                  onPointerDown={(e) =>
                    handleDragStart(e, 'headerInfo', 'headerInfo', headerInfoPos.x, headerInfoPos.y)
                  }
                  className={cn(
                    'group select-none rounded border transition-all cursor-move',
                    activeDragId === 'headerInfo'
                      ? 'border-blue-500 ring-2 ring-blue-400 shadow-lg z-40 bg-blue-50'
                      : 'border-transparent hover:border-blue-400 hover:bg-blue-50'
                  )}
                >
                  {/* Zero-gap Attached Drag Handle (Always visible when showDragHandles is on) */}
                  {showDragHandles && (
                    <div
                      data-html2canvas-ignore="true"
                      className="flex items-center justify-between rounded-t bg-blue-700 px-2 py-0.5 text-[9px] font-medium text-white shadow-sm cursor-move touch-none select-none opacity-90 group-hover:opacity-100"
                    >
                      <div className="flex items-center gap-1">
                        <GripVertical className="h-3 w-3" />
                        <span>Kop & Judul Dokumen (Geser)</span>
                      </div>
                      <span className="font-mono text-[8px] opacity-80">
                        X:{headerInfoPos.x} Y:{headerInfoPos.y}
                      </span>
                    </div>
                  )}

                  <header className="border-b-2 p-1.5" style={{ borderColor: tableColor }}>
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
                  </header>
                </div>

                {/* ========================================================================= */}
                {/* 2. RELOCATABLE / DRAGGABLE INTRO PARAGRAPH (PARAGRAF PENGANTAR)           */}
                {/* ========================================================================= */}
                {headerHtml && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${introTextPos.x}px`,
                      top: `${introTextPos.y}px`,
                      width: `${introTextPos.width}px`,
                    }}
                    onPointerDown={(e) =>
                      handleDragStart(e, 'introText', 'introText', introTextPos.x, introTextPos.y)
                    }
                    className={cn(
                      'group select-none rounded border transition-all cursor-move',
                      activeDragId === 'introText'
                        ? 'border-amber-500 ring-2 ring-amber-400 shadow-lg z-40 bg-amber-50'
                        : 'border-transparent hover:border-amber-400 hover:bg-amber-50'
                    )}
                  >
                    {/* Zero-gap Attached Drag Handle */}
                    {showDragHandles && (
                      <div
                        data-html2canvas-ignore="true"
                        className="flex items-center justify-between rounded-t bg-amber-700 px-2 py-0.5 text-[9px] font-medium text-white shadow-sm cursor-move touch-none select-none opacity-90 group-hover:opacity-100"
                      >
                        <div className="flex items-center gap-1">
                          <GripVertical className="h-3 w-3" />
                          <span>Paragraf Pengantar (Geser)</span>
                        </div>
                        <span className="font-mono text-[8px] opacity-80">
                          X:{introTextPos.x} Y:{introTextPos.y}
                        </span>
                      </div>
                    )}

                    <div
                      className="p-1.5 text-[7.5pt] leading-relaxed text-slate-700 prose prose-xs max-w-none"
                      dangerouslySetInnerHTML={{ __html: headerHtml }}
                    />
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 3. RELOCATABLE / DRAGGABLE TABLE (TABEL TRANSAKSI KAS)                    */}
                {/* ========================================================================= */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${tablePos.x}px`,
                    top: `${tablePos.y}px`,
                    width: `${tablePos.width}px`,
                  }}
                  className={cn(
                    'group select-none rounded border transition-all',
                    activeDragId === 'table'
                      ? 'border-cyan-500 ring-2 ring-cyan-400 shadow-lg z-40'
                      : 'border-transparent hover:border-cyan-400'
                  )}
                >
                  {/* Zero-gap Attached Drag Handle */}
                  {showDragHandles && (
                    <div
                      data-html2canvas-ignore="true"
                      onPointerDown={(e) =>
                        handleDragStart(e, 'table', 'table', tablePos.x, tablePos.y)
                      }
                      className="flex items-center justify-between rounded-t bg-cyan-700 px-2 py-0.5 text-[9px] font-medium text-white shadow-sm cursor-move touch-none select-none opacity-90 group-hover:opacity-100"
                    >
                      <div className="flex items-center gap-1">
                        <GripVertical className="h-3 w-3" />
                        <span>Tabel Data Transaksi (Klik & Geser)</span>
                      </div>
                      <span className="font-mono text-[8px] opacity-80">
                        X:{tablePos.x} Y:{tablePos.y}
                      </span>
                    </div>
                  )}

                  <div className="overflow-hidden border border-slate-300 shadow-sm">
                    <table className="w-full table-fixed border-collapse text-[6.5pt] leading-tight">
                      <thead>
                        <tr
                          className="text-white cursor-move select-none"
                          style={{ backgroundColor: tableColor }}
                          onPointerDown={(e) =>
                            handleDragStart(e, 'table', 'table', tablePos.x, tablePos.y)
                          }
                          title="Klik & geser untuk memindahkan tabel"
                        >
                          <th className="w-[6%] border border-white px-1 py-1 text-center font-semibold">No</th>
                          <th className="w-[12%] border border-white px-1 py-1 text-center font-semibold">Tanggal</th>
                          <th className="w-[14%] border border-white px-1 py-1 text-left font-semibold">Nota/Ref</th>
                          <th className="w-[28%] border border-white px-1 py-1 text-left font-semibold">Keterangan</th>
                          <th className="w-[10%] border border-white px-1 py-1 text-right font-semibold">Kas In</th>
                          <th className="w-[10%] border border-white px-1 py-1 text-right font-semibold">Kas Out</th>
                          <th className="w-[10%] border border-white px-1 py-1 text-right font-semibold">Bank In</th>
                          <th className="w-[10%] border border-white px-1 py-1 text-right font-semibold">Bank Out</th>
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
                              className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}
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
                </div>

                {/* ========================================================================= */}
                {/* 4. RELOCATABLE / DRAGGABLE CLOSING NOTES (CATATAN PENUTUP)                 */}
                {/* ========================================================================= */}
                {footerHtml && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${closingTextPos.x}px`,
                      top: `${closingTextPos.y}px`,
                      width: `${closingTextPos.width}px`,
                    }}
                    onPointerDown={(e) =>
                      handleDragStart(e, 'closingText', 'closingText', closingTextPos.x, closingTextPos.y)
                    }
                    className={cn(
                      'group select-none rounded border transition-all cursor-move',
                      activeDragId === 'closingText'
                        ? 'border-purple-500 ring-2 ring-purple-400 shadow-lg z-40 bg-purple-50'
                        : 'border-transparent hover:border-purple-400 hover:bg-purple-50'
                    )}
                  >
                    {/* Zero-gap Attached Drag Handle */}
                    {showDragHandles && (
                      <div
                        data-html2canvas-ignore="true"
                        className="flex items-center justify-between rounded-t bg-purple-700 px-2 py-0.5 text-[9px] font-medium text-white shadow-sm cursor-move touch-none select-none opacity-90 group-hover:opacity-100"
                      >
                        <div className="flex items-center gap-1">
                          <GripVertical className="h-3 w-3" />
                          <span>Catatan Penutup (Geser)</span>
                        </div>
                        <span className="font-mono text-[8px] opacity-80">
                          X:{closingTextPos.x} Y:{closingTextPos.y}
                        </span>
                      </div>
                    )}

                    <div
                      className="p-1.5 text-[7pt] text-slate-600 prose prose-xs max-w-none"
                      dangerouslySetInnerHTML={{ __html: footerHtml }}
                    />
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 5. RELOCATABLE / DRAGGABLE PRINT DATE TIMESTAMP                           */}
                {/* ========================================================================= */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${printDatePos.x}px`,
                    top: `${printDatePos.y}px`,
                    width: `${printDatePos.width}px`,
                  }}
                  onPointerDown={(e) =>
                    handleDragStart(e, 'printDate', 'printDate', printDatePos.x, printDatePos.y)
                  }
                  className={cn(
                    'group select-none rounded border transition-all cursor-move p-1',
                    activeDragId === 'printDate'
                      ? 'border-slate-500 ring-2 ring-slate-400 shadow-lg z-40'
                      : 'border-transparent hover:border-slate-400 hover:bg-slate-50'
                  )}
                >
                  {showDragHandles && (
                    <div
                      data-html2canvas-ignore="true"
                      className="flex items-center justify-between rounded bg-slate-700 px-1.5 py-0.5 text-[8px] font-medium text-white shadow-sm cursor-move mb-0.5 opacity-90 group-hover:opacity-100"
                    >
                      <span className="flex items-center gap-1">
                        <GripVertical className="h-2.5 w-2.5" /> Waktu Cetak
                      </span>
                      <span className="font-mono text-[7px] opacity-80">
                        X:{printDatePos.x} Y:{printDatePos.y}
                      </span>
                    </div>
                  )}
                  <p className="text-[6.5pt] text-slate-400 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5 inline" />
                    Dicetak pada: {new Date().toLocaleString('id-ID')}
                  </p>
                </div>

                {/* ========================================================================= */}
                {/* 6. DRAGGABLE CUSTOM TEXT BLOCKS                                           */}
                {/* ========================================================================= */}
                {textBlocks.map((tb) => (
                  <div
                    key={tb.id}
                    style={{
                      position: 'absolute',
                      left: `${tb.x}px`,
                      top: `${tb.y}px`,
                      width: `${tb.width}px`,
                      fontSize: `${tb.fontSize}pt`,
                      fontWeight: tb.fontWeight,
                      fontStyle: tb.fontStyle,
                      color: tb.color,
                      textAlign: tb.textAlign,
                    }}
                    onPointerDown={(e) => handleDragStart(e, tb.id, 'text', tb.x, tb.y)}
                    className={cn(
                      'group select-none rounded border transition-all leading-snug break-words cursor-move',
                      activeDragId === tb.id
                        ? 'border-indigo-500 ring-2 ring-indigo-400 shadow-lg z-40'
                        : 'border-transparent hover:border-indigo-400 hover:bg-indigo-50',
                      tb.border && 'border-slate-300 bg-white'
                    )}
                  >
                    {/* Zero-gap Attached Drag Handle */}
                    {showDragHandles && (
                      <div
                        data-html2canvas-ignore="true"
                        className="flex items-center justify-between rounded-t bg-indigo-700 px-2 py-0.5 text-[9px] font-medium text-white shadow-sm cursor-move touch-none select-none opacity-90 group-hover:opacity-100"
                      >
                        <div className="flex items-center gap-1">
                          <GripVertical className="h-3 w-3" />
                          <span>Teks (Geser)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-[8px] opacity-80">
                            X:{tb.x} Y:{tb.y}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteTextBlock(tb.id)}
                            className="ml-1 text-rose-300 hover:text-white p-0.5"
                            title="Hapus teks ini"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="p-1.5 whitespace-pre-wrap">
                      {tb.text || 'Ketik teks...'}
                    </div>
                  </div>
                ))}

                {/* ========================================================================= */}
                {/* 7. DRAGGABLE CUSTOM IMAGE BLOCKS (STAMPS, LOGOS, WATERMARKS)              */}
                {/* ========================================================================= */}
                {imageBlocks.map((img) => (
                  <div
                    key={img.id}
                    style={{
                      position: 'absolute',
                      left: `${img.x}px`,
                      top: `${img.y}px`,
                      width: `${img.width}px`,
                      opacity: img.opacity,
                    }}
                    onPointerDown={(e) => handleDragStart(e, img.id, 'image', img.x, img.y)}
                    className={cn(
                      'group select-none rounded border transition-all cursor-move',
                      activeDragId === img.id
                        ? 'border-emerald-500 ring-2 ring-emerald-400 shadow-lg z-40'
                        : 'border-transparent hover:border-emerald-400 hover:bg-emerald-50'
                    )}
                  >
                    {/* Zero-gap Attached Drag Handle */}
                    {showDragHandles && (
                      <div
                        data-html2canvas-ignore="true"
                        className="flex items-center justify-between rounded-t bg-emerald-700 px-2 py-0.5 text-[9px] font-medium text-white shadow-sm cursor-move touch-none select-none opacity-90 group-hover:opacity-100"
                      >
                        <div className="flex items-center gap-1 truncate max-w-[120px]">
                          <GripVertical className="h-3 w-3 shrink-0" />
                          <span className="truncate">{img.name || 'Gambar'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteImageBlock(img.id)}
                          className="text-rose-300 hover:text-white p-0.5 ml-1"
                          title="Hapus gambar ini"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    )}

                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full object-contain pointer-events-none p-0.5"
                    />
                  </div>
                ))}

                {/* ========================================================================= */}
                {/* 8. DRAGGABLE SIGNATURE BLOCKS                                             */}
                {/* ========================================================================= */}
                {signatures.map((sig) => (
                  <div
                    key={sig.id}
                    style={{
                      position: 'absolute',
                      left: `${sig.x}px`,
                      top: `${sig.y}px`,
                      width: `${sig.width}px`,
                    }}
                    onPointerDown={(e) => handleDragStart(e, sig.id, 'signature', sig.x, sig.y)}
                    className={cn(
                      'group select-none rounded border transition-all text-center text-slate-800 cursor-move',
                      activeDragId === sig.id
                        ? 'border-blue-500 ring-2 ring-blue-400 shadow-lg z-40 bg-blue-50'
                        : 'border-transparent hover:border-blue-400 hover:bg-blue-50'
                    )}
                  >
                    {/* Zero-gap Attached Drag Handle */}
                    {showDragHandles && (
                      <div
                        data-html2canvas-ignore="true"
                        className="flex items-center justify-between rounded-t bg-slate-800 px-2 py-0.5 text-[9px] font-medium text-white shadow-sm cursor-move touch-none select-none opacity-90 group-hover:opacity-100"
                      >
                        <div className="flex items-center gap-1">
                          <GripVertical className="h-3 w-3" />
                          <span>TTD (Geser)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-[8px] opacity-80">
                            X:{sig.x} Y:{sig.y}
                          </span>
                          {signatures.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSignature(sig.id)}
                              className="text-rose-300 hover:text-white p-0.5 ml-1"
                              title="Hapus tanda tangan ini"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="p-1.5">
                      <p className="text-[7pt] font-medium">{sig.label}</p>
                      <div className="flex h-[15mm] items-center justify-center my-1">
                        {sig.signatureUrl ? (
                          <img
                            src={sig.signatureUrl}
                            alt={sig.signerName}
                            className="max-h-[15mm] max-w-full object-contain pointer-events-none"
                          />
                        ) : (
                          <div className="h-7 w-24 border border-dashed border-slate-300 rounded flex items-center justify-center text-[6.5pt] text-slate-400 italic">
                            (Area TTD)
                          </div>
                        )}
                      </div>
                      <p className="border-t border-slate-700 pt-0.5 text-[7pt] font-semibold">
                        {sig.signerName || '-'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
