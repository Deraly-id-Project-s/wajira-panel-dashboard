import { useMemo, useState } from 'react';

import { getObjectStorageUrl } from '@/components/ui/storage-image';
import { useDocumentTemplates } from '@/hooks/useDocumentTemplate';

const waitForImage = (url?: string | null) => {
  if (!url) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const image = new window.Image();
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeout);
      resolve();
    };
    const timeout = window.setTimeout(finish, 2500);

    image.onload = finish;
    image.onerror = finish;
    image.src = url;
    if (image.complete) finish();
  });
};

export function useReportTemplatePrint(fallbackBackground?: string) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [printedAt, setPrintedAt] = useState(() => new Date());
  const templatesQuery = useDocumentTemplates({ page: 1, perPage: 100 });
  const templates = useMemo(() => templatesQuery.data?.data ?? [], [templatesQuery.data?.data]);
  const selectedTemplate = useMemo(
    () => templates.find((template) => String(template.id) === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );

  const openPrintDialog = () => {
    setSelectedTemplateId(null);
    setIsDialogOpen(true);
  };

  const printWithSelectedTemplate = async () => {
    if (!selectedTemplate) return false;

    setIsPreparingPrint(true);
    setPrintedAt(new Date());

    const backgroundUrl = selectedTemplate.documentTemplate
      ? getObjectStorageUrl(selectedTemplate.documentTemplate)
      : fallbackBackground;
    const signatureUrl = getObjectStorageUrl(selectedTemplate.personSignature);

    await Promise.all([waitForImage(backgroundUrl), waitForImage(signatureUrl)]);
    setIsDialogOpen(false);
    setIsPreparingPrint(false);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => window.print());
    });
    return true;
  };

  return {
    isDialogOpen,
    setIsDialogOpen,
    selectedTemplateId,
    setSelectedTemplateId,
    isPreparingPrint,
    printedAt,
    templatesQuery,
    templates,
    selectedTemplate,
    openPrintDialog,
    printWithSelectedTemplate,
  };
}
