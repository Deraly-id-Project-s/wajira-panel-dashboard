import type { DocumentTemplate } from '@/@types/document-template.types';
import { getObjectStorageUrl } from '@/components/ui/storage-image';

interface DocumentTemplatePrintFooterProps {
  template: DocumentTemplate | null;
}

const htmlToPlainText = (value?: string | null) =>
  (value ?? '')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export function DocumentTemplatePrintFooter({ template }: DocumentTemplatePrintFooterProps) {
  if (!template) return null;

  const signatureUrl = getObjectStorageUrl(template.personSignature);
  const footerText = htmlToPlainText(template.footerInformation);

  return (
    <div className="document-template-print-footer hidden items-end justify-between gap-8 text-[7pt] text-slate-600 print:flex">
      <p className="max-w-[115mm] whitespace-pre-line leading-snug">{footerText}</p>
      <div className="min-w-[42mm] text-center text-slate-800">
        <p>Mengetahui,</p>
        <div className="flex h-[14mm] items-center justify-center">
          {signatureUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={signatureUrl} alt="" className="max-h-[14mm] max-w-[36mm] object-contain" />
          )}
        </div>
        <p className="border-t border-slate-700 pt-1 font-semibold">{template.personSigner || '-'}</p>
      </div>
    </div>
  );
}
