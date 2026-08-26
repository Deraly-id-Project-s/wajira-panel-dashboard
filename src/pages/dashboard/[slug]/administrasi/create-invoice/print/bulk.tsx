import * as React from 'react';
import { Printer } from 'lucide-react';
import { useRouter } from 'next/router';
import { useQueries } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import { fetchUserCompanies } from '@/services/company.service';
import { CreateInvoicePrintDocument } from '@/components/features/create-invoice/CreateInvoicePrintDocument';
import {
  buildDetailRows,
  buildPrintPayload,
  buildProcessDefaults,
  createProcessDraftPayload,
  getInvoiceProcessDraft,
} from '@/components/features/create-invoice/create-invoice.utils';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useCompany } from '@/contexts/CompanyContext';
import { getLetterheadByCompanyId, resolveCompanyId } from '@/lib/print-letterhead';
import { getDoInvoiceById } from '@/services/do-invoice.service';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';

const parseIds = (value: string | string[] | undefined) => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return [];
  return raw
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
};

const isDefined = <T,>(value: T | undefined | null): value is T => value != null;

export default function BulkCreateInvoicePrintPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const ids = React.useMemo(() => (router.isReady ? parseIds(router.query.ids) : []), [router.isReady, router.query.ids]);

  const [companyName, setCompanyName] = React.useState('WAJIRA JAGRATARA TRANSINDO');

  React.useEffect(() => {
    fetchUserCompanies()
      .then((companies) => {
        const resolvedId = resolveCompanyId(slug, companyId);
        const found = companies.find((company) => company.id === resolvedId || company.slug === slug);
        if (found?.name) setCompanyName(found.name.toUpperCase());
      })
      .catch(() => undefined);
  }, [companyId, slug]);

  const invoiceQueries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['do-invoice', 'detail', id],
      queryFn: () => getDoInvoiceById(id),
      enabled: id > 0,
    })),
  });

  const invoices = invoiceQueries.map((query) => query.data).filter(isDefined);
  const isLoading = invoiceQueries.some((query) => query.isLoading);

  const printRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Bulk-Invoices-${ids.join('-')}`,
    pageStyle: `
      @page { size: A4; margin: 0; }
      @media print {
        html, body { width: 210mm; height: 297mm; margin: 0; padding: 0; background: white; }
        .no-print { display: none !important; }
        .print-page {
          page-break-after: always !important;
          break-after: page !important;
          background: white;
          width: 210mm;
          height: 297mm;
          overflow: hidden;
        }
        .print-page:last-child {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
      }
    `,
  });

  if (!router.isReady || isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (!invoices.length) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-sm text-slate-500">Tidak ada data invoice yang ditemukan.</div>
      </DashboardLayout>
    );
  }

  const resolvedCompanyId = resolveCompanyId(router.query.slug, companyId);
  const letterheadUrl = getLetterheadByCompanyId(resolvedCompanyId) || '/invoice-letter/4-jagrataratransindo-letter.jpeg';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Cetak Massal Invoice"
          subtitle={`Total terpilih: ${invoices.length} dokumen`}
          onBack={() => router.push(`/dashboard/${slug}/administrasi/create-invoice`)}
          actions={
            <Button type="button" onClick={() => handlePrint()} variant="outline" className="w-full sm:w-auto cursor-pointer">
              <Printer className="mr-2 h-4 w-4" />
              Print All ({invoices.length})
            </Button>
          }
        />

        <div ref={printRef} className="space-y-8 bg-slate-50 p-4 rounded-md border border-gray-200 print:bg-white print:p-0 print:border-none print:space-y-0">
          {invoices.map((invoice) => {
            const draft = getInvoiceProcessDraft(invoice.id) ?? createProcessDraftPayload(invoice, buildProcessDefaults(invoice), undefined);
            const rows = buildDetailRows([invoice]);
            const payload = buildPrintPayload(invoice, rows, companyName, draft);

            return (
              <div key={invoice.id} className="print-page bg-white shadow-md print:shadow-none p-4 print:p-0 rounded-md border border-gray-200 print:border-none">
                <CreateInvoicePrintDocument
                  payload={payload}
                  letterheadUrl={letterheadUrl}
                  hideControls
                />
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
