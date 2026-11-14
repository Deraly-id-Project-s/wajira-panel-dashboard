'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Archive } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CustomableReportDocumentDialog } from '@/components/features/document-template/CustomableReportDocumentDialog';
import type { DocumentArchive } from '@/@types/document-archive.types';
import { useCompany } from '@/contexts/CompanyContext';
import {
  getCompanyName,
  getLetterheadByCompanyId,
  resolveCompanyId,
} from '@/lib/print-letterhead';
import type { ReportArchiveColumn, ReportArchiveTotal } from '@/lib/report-archive';
import { cn } from '@/lib/utils';

export interface ReportArchiveActionProps {
  reportTitle: string;
  data?: object[] | null;
  periodLabel?: string;
  columns?: ReportArchiveColumn[];
  totals?: ReportArchiveTotal[];
  totalLabel?: string;
  archiveSourceLabel?: string;
  companyName?: string;
  fallbackLetterhead?: string;
  defaultDocumentCode?: string;
  defaultArchiveName?: string;
  defaultNotes?: string;
  disabled?: boolean;
  className?: string;
  onArchiveSuccess?: (archive: DocumentArchive) => void;
}

export function ReportArchiveAction({
  reportTitle,
  data,
  periodLabel,
  columns,
  totals,
  totalLabel,
  archiveSourceLabel,
  companyName,
  fallbackLetterhead,
  defaultDocumentCode,
  defaultArchiveName,
  defaultNotes,
  disabled,
  className,
  onArchiveSuccess,
}: ReportArchiveActionProps) {
  const router = useRouter();
  const { companyId } = useCompany();
  const [open, setOpen] = useState(false);

  const resolvedCompanyId = useMemo(
    () => resolveCompanyId(router.query.slug, companyId),
    [companyId, router.query.slug],
  );

  const resolvedCompanyName = companyName ?? getCompanyName(resolvedCompanyId);
  const resolvedLetterhead = fallbackLetterhead ?? getLetterheadByCompanyId(resolvedCompanyId);
  const rows = data ?? [];

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className={cn('w-full sm:w-auto', className)}
      >
        <Archive className="mr-2 h-4 w-4" />
        Kustom & Arsipkan
      </Button>

      <CustomableReportDocumentDialog
        open={open}
        onOpenChange={setOpen}
        reportTitle={reportTitle}
        companyName={resolvedCompanyName}
        periodLabel={periodLabel}
        data={rows}
        columns={columns}
        totals={totals}
        totalLabel={totalLabel}
        archiveSourceLabel={archiveSourceLabel}
        fallbackLetterhead={resolvedLetterhead}
        defaultDocumentCode={defaultDocumentCode}
        defaultArchiveName={defaultArchiveName}
        defaultNotes={defaultNotes}
        onArchiveSuccess={onArchiveSuccess}
      />
    </>
  );
}
