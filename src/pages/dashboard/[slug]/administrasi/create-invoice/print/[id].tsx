import * as React from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { fetchUserCompanies } from '@/services/company.service';
import { PageHeader } from '@/components/ui/page-header';
import { CreateInvoicePrintDocument } from '@/components/features/create-invoice/CreateInvoicePrintDocument';
import { buildDetailRows, buildPrintPayload, buildProcessDefaults, createProcessDraftPayload, getInvoiceProcessDraft } from '@/components/features/create-invoice/create-invoice.utils';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useCompany } from '@/contexts/CompanyContext';
import { getLetterheadByCompanyId, resolveCompanyId } from '@/lib/print-letterhead';
import { useDoInvoiceDetail } from '@/hooks/useDoInvoice';
import { LoadingState } from '@/components/ui/loading-state';

export default function CreateInvoicePrintPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const id = router.isReady && typeof router.query.id === 'string' ? Number(router.query.id) : 0;
  const expeditionId = router.isReady && typeof router.query.expeditionId === 'string' ? Number(router.query.expeditionId) : 0;
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const [companyName, setCompanyName] = React.useState('WAJIRA JAGRATARA TRANSINDO');
  const detailQuery = useDoInvoiceDetail(router.isReady && id > 0 ? id : null);

  React.useEffect(() => {
    fetchUserCompanies()
      .then((companies) => {
        const resolvedId = resolveCompanyId(slug, companyId);
        const found = companies.find((company) => company.id === resolvedId || company.slug === slug);
        if (found?.name) setCompanyName(found.name.toUpperCase());
      })
      .catch(() => undefined);
  }, [companyId, slug]);

  if (!router.isReady || detailQuery.isLoading) {
    return <DashboardLayout><LoadingState variant="page" /></DashboardLayout>;
  }

  if (!detailQuery.data) {
    return <DashboardLayout><div className="py-20 text-center text-sm text-slate-500">Data invoice tidak ditemukan.</div></DashboardLayout>;
  }

  const draft = getInvoiceProcessDraft(detailQuery.data.id) ?? createProcessDraftPayload(detailQuery.data, buildProcessDefaults(detailQuery.data), expeditionId ? [expeditionId] : undefined);
  const rows = buildDetailRows([detailQuery.data], expeditionId ? [expeditionId] : draft.selectedExpeditionIds);
  const payload = buildPrintPayload(detailQuery.data, rows, companyName, draft);
  const resolvedCompanyId = resolveCompanyId(router.query.slug, companyId);
  const letterheadUrl = getLetterheadByCompanyId(resolvedCompanyId) || '/invoice-letter/4-jagrataratransindo-letter.jpeg';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={`Invoice ${payload.invoiceCode}`}
          subtitle={`Dibuat: ${payload.draft.date}`}
          onBack={() => router.push(`/dashboard/${slug}/administrasi/create-invoice/detail/${id}`)}
        />

        <CreateInvoicePrintDocument payload={payload} letterheadUrl={letterheadUrl} />
      </div>
    </DashboardLayout>
  );
}
