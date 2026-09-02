import { DocumentTemplateSelect } from '@/components/ui/document-template-select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ReportTemplatePrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTemplateId: string | null;
  onTemplateChange: (templateId: string | null) => void;
  onPrint: () => void | Promise<unknown>;
  isPreparingPrint?: boolean;
  reportName: string;
  description?: string;
  placeholder?: string;
}

export function ReportTemplatePrintDialog({
  open,
  onOpenChange,
  selectedTemplateId,
  onTemplateChange,
  onPrint,
  isPreparingPrint = false,
  reportName,
  description,
  placeholder,
}: ReportTemplatePrintDialogProps) {
  const normalizedReportName = reportName.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeOnInteractOutside={false} className="max-h-[88vh] overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-slate-200 px-6 py-5 pr-12">
          <DialogTitle>Pilih Template Print</DialogTitle>
          <DialogDescription>
            {description ?? `Pilih desain dokumen yang akan digunakan untuk mencetak ${normalizedReportName}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[56vh] overflow-y-auto px-6 py-5">
          <DocumentTemplateSelect
            value={selectedTemplateId}
            onValueChange={onTemplateChange}
            disabled={isPreparingPrint}
            allowEmpty={false}
            placeholder={placeholder ?? `Pilih template ${normalizedReportName}`}
            variant="cards"
          />
        </div>

        <DialogFooter className="border-t border-slate-200 bg-slate-50/70 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPreparingPrint}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={() => void onPrint()}
            disabled={!selectedTemplateId || isPreparingPrint}
          >
            {isPreparingPrint ? 'Menyiapkan...' : 'Print Sekarang'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
