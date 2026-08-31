import { Check, FileText, Loader2, Printer } from 'lucide-react';

import type { DocumentTemplate } from '@/@types/document-template.types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getObjectStorageUrl } from '@/components/ui/storage-image';
import { cn } from '@/lib/utils';

interface JournalPrintTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: DocumentTemplate[];
  selectedTemplateId: string | null;
  onSelectTemplate: (id: string) => void;
  onPrint: () => void;
  isLoading?: boolean;
  isError?: boolean;
  isPrinting?: boolean;
  reportName?: string;
}

export function JournalPrintTemplateDialog({
  open,
  onOpenChange,
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onPrint,
  isLoading,
  isError,
  isPrinting,
  reportName = 'Laporan Jurnal',
}: JournalPrintTemplateDialogProps) {
  const reportLabel = reportName.toLocaleLowerCase('id-ID');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-slate-200 px-6 py-5 pr-12">
          <DialogTitle className="flex items-center gap-2 text-base text-slate-950">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
              <Printer className="h-4 w-4 text-slate-700" />
            </span>
            Pilih Template Print
          </DialogTitle>
          <DialogDescription>
            Template terpilih akan digunakan sebagai desain latar {reportLabel}.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[56vh] overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Memuat template dokumen...
            </div>
          ) : isError ? (
            <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-rose-200 bg-rose-50 px-6 text-center text-sm text-rose-700">
              Template dokumen gagal dimuat. Tutup modal lalu coba kembali.
            </div>
          ) : templates.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 text-center text-sm text-slate-500">
              Belum ada template dokumen yang dapat digunakan.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={`Template print ${reportLabel}`}>
              {templates.map((template) => {
                const templateId = String(template.id);
                const isSelected = selectedTemplateId === templateId;
                const previewUrl = getObjectStorageUrl(template.documentTemplate);

                return (
                  <button
                    key={templateId}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => onSelectTemplate(templateId)}
                    className={cn(
                      'group relative overflow-hidden rounded-lg border bg-white text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2',
                      isSelected
                        ? 'border-slate-700 ring-1 ring-slate-700'
                        : 'border-slate-200 hover:border-slate-400 hover:shadow-sm',
                    )}
                  >
                    <div className="relative h-28 overflow-hidden border-b border-slate-100 bg-slate-50">
                      {previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewUrl} alt="" className="h-full w-full object-cover object-top" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <FileText className="h-8 w-8 text-slate-300" />
                        </div>
                      )}
                      <span
                        className="absolute bottom-2 left-2 h-3 w-10 rounded-full border border-white/70 shadow-sm"
                        style={{ backgroundColor: /^#[0-9a-f]{6}$/i.test(template.tableColor) ? template.tableColor : '#1f4163' }}
                        aria-label={`Warna tabel ${template.tableColor}`}
                      />
                      {isSelected && (
                        <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white shadow">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 p-3">
                      <p className="truncate text-sm font-semibold text-slate-900">{template.name}</p>
                      <p className="truncate text-xs text-slate-500">{template.subject || 'Tanpa subject'}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-slate-200 bg-slate-50/70 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPrinting}>
            Batal
          </Button>
          <Button type="button" onClick={onPrint} disabled={!selectedTemplateId || isLoading || isPrinting}>
            {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
            {isPrinting ? 'Menyiapkan...' : 'Print Sekarang'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
