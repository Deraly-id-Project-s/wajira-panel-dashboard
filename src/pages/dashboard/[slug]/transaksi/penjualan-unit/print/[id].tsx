import * as React from 'react';
import { ChevronLeft, Printer } from 'lucide-react';
import { useRouter } from 'next/router';
import { useReactToPrint } from 'react-to-print';
import { fetchUserCompanies } from '@/services/company.service';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useCompany } from '@/contexts/CompanyContext';
import { getLetterheadByCompanyId, resolveCompanyId } from '@/lib/print-letterhead';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { ensureSuccess, LaravelApiResponse } from '@/lib/api/response';
import { useSalesDetail } from '@/hooks/useSales';
import SalesPrintDocument from '@/components/features/sales/SalesPrintDocument';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { useDocumentTemplate } from '@/hooks/useDocumentTemplate';

export default function SalesPrintPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const id = router.isReady && typeof router.query.id === 'string' ? router.query.id : '';
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const [companyName, setCompanyName] = React.useState('WAJIRA JAGRATARA TRANSINDO');

  const detailQuery = useSalesDetail(id);
  const templateQuery = useDocumentTemplate(detailQuery.data?.ui?.documentTemplateId ?? null);

  const detailsQuery = useQuery({
    queryKey: ['sales-print-details', id],
    queryFn: async () => {
      if (!id) return [];

      const itemsRes = await apiClient.get<LaravelApiResponse<any>>(
        '/wapi/transaction/unit-transaction/unit-transaction-item',
        { params: { unit_transaction_id: id, type: 'sales', per_page: 200 } }
      );
      const itemsPayload = ensureSuccess(itemsRes.data) as any;
      const itemRows: any[] = Array.isArray(itemsPayload)
        ? itemsPayload
        : Array.isArray(itemsPayload?.data)
          ? itemsPayload.data
          : Array.isArray(itemsPayload?.data?.data)
            ? itemsPayload.data.data
            : [];

      if (itemRows.length === 0) return [];

      const detailGroups = await Promise.all(
        itemRows.map(async (row) => {
          const itemId = String(row.id ?? '');
          const typeName = row.unit_type?.name || row.unit_type_name || '-';
          const price = Number(row.price ?? 0);
          if (!itemId) return [];

          try {
            let res: any;
            try {
              res = await apiClient.get<LaravelApiResponse<any>>(
                '/wapi/transaction/unit-transaction-item-detail',
                { params: { unit_transaction_item_id: itemId, per_page: 200 } }
              );
            } catch {
              res = await apiClient.get<LaravelApiResponse<any>>(
                '/wapi/transaction/unit-transaction/unit-transaction-item-detail',
                { params: { unit_transaction_item_id: itemId, per_page: 200 } }
              );
            }

            const payload = ensureSuccess(res.data) as any;
            const dataRows: any[] = Array.isArray(payload)
              ? payload
              : Array.isArray(payload?.data)
                ? payload.data
                : Array.isArray(payload?.data?.data)
                  ? payload.data.data
                  : [];

            return dataRows.map((detail) => ({
              id: String(detail.id ?? ''),
              unit_transaction_item_id: itemId,
              unit_type_name: typeName,
              color: detail.color || '-',
              chassis_number: detail.chassis_number || '-',
              machine_number: detail.machine_number || '-',
              price: price,
              price_usd: row.price_usd ? Number(row.price_usd) : undefined,
            }));
          } catch (err) {
            return [];
          }
        })
      );

      return detailGroups.flat();
    },
    enabled: !!id,
    staleTime: 1000 * 30,
  });

  const printRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: detailQuery.data?.ui ? `SalesInvoice-${detailQuery.data.ui.kodeJual}` : 'SalesInvoice',
    pageStyle: `
      @page { size: A4; margin: 0; }
      @media print {
        html, body { width: 210mm; height: 297mm; margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .no-print { display: none !important; }
      }
    `,
  });

  React.useEffect(() => {
    if (!router.isReady) return;
    fetchUserCompanies()
      .then((companies) => {
        const resolvedId = resolveCompanyId(slug, companyId);
        const found = companies.find((company) => company.id === resolvedId || company.slug === slug);
        if (found?.name) setCompanyName(found.name.toUpperCase());
      })
      .catch(() => undefined);
  }, [companyId, slug, router.isReady]);

  if (!router.isReady || detailQuery.isLoading || detailsQuery.isLoading || templateQuery.isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (!detailQuery.data || !detailQuery.data.ui) {
    return (
      <DashboardLayout>
        <div className="py-20 text-slate-500 text-center text-sm">Data penjualan tidak ditemukan.</div>
      </DashboardLayout>
    );
  }

  if (!detailQuery.data.ui.documentTemplateId || !templateQuery.data) {
    return (
      <DashboardLayout>
        <div className="rounded-md border bg-white p-8 text-center text-sm text-slate-500">
          Document template belum dipilih pada transaksi ini.
        </div>
      </DashboardLayout>
    );
  }

  const resolvedCompanyId = resolveCompanyId(router.query.slug, companyId);
  const letterheadUrl = getLetterheadByCompanyId(resolvedCompanyId) || '/invoice-letter/4-jagrataratransindo-letter.jpeg';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="no-print flex items-center justify-between rounded-md border border-gray-200 bg-white px-5 py-4 shadow-none">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/${slug}/transaksi/penjualan-unit/${id}`)}
              className="rounded-md p-1 transition-colors hover:bg-slate-100"
            >
              <ChevronLeft className="h-5 w-5 text-slate-500" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Sales Invoice {detailQuery.data.ui.kodeJual}</h1>
              <p className="text-sm text-slate-500">
                Tanggal: {detailQuery.data.ui.tanggal || '-'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={() => handlePrint()} variant="outline" className="w-full sm:w-auto">
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        {/* Outer preview container on screen */}
        <div className="flex justify-center bg-slate-50 py-8 no-print">
          <SalesPrintDocument
            sales={detailQuery.data.ui}
            items={detailsQuery.data ?? []}
            letterheadUrl={letterheadUrl}
            companyName={companyName}
            documentTemplate={templateQuery.data}
            hideControls
            printRef={printRef}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
