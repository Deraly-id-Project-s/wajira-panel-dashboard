import * as React from 'react';
import { ChevronLeft, Printer } from 'lucide-react';
import { useRouter } from 'next/router';
import { useReactToPrint } from 'react-to-print';
import { fetchUserCompanies } from '@/services/company.service';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useCompany } from '@/contexts/CompanyContext';
import { getLetterheadByCompanyId, resolveCompanyId } from '@/lib/print-letterhead';
import { useSalesDetail } from '@/hooks/useSales';
import { useUnitTransactionTypeDetails } from '@/hooks/useUnitTransaction';
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

  const detailsQuery = useUnitTransactionTypeDetails(id || undefined, { page: 1, perPage: 1000 });

  const detailsList = React.useMemo(() => {
    const list = detailsQuery.data?.data ?? [];
    return list.map((item) => ({
      id: item.id,
      unit_transaction_item_id: item.unit_transaction_item_id,
      code: '',
      created_at: item.created_at,
      unit_type_name: item.unit_transaction_item?.unit_type?.name ?? '',
      color: item.color ?? '-',
      machine_number: item.machine_number ?? '-',
      chassis_number: item.chassis_number ?? '-',
      in_stock: item.in_stock,
      is_forecast: item.is_forecast,
      is_sold_unit: item.is_sold_unit,
      status: item.status ?? '',
      price: item.unit_transaction_item?.price ?? item.unit_transaction_item?.unit_type?.sell_price ?? 0,
      price_usd: item.unit_transaction_item?.price_usd ?? undefined,
      unit_transaction_bruto_total: 0,
      unit_transaction_item_total_hpp: 0,
      unit_transaction_item_total_dpp: 0,
      unit_transaction_item_total_ppn: 0,
      unit_transaction_item_bruto_total: 0,
      transaction_bbn_total: 0,
      transaction_other_fee: 0,
      expedition_fee_total: 0,
      person: { id: '', name: '' },
      warehouse_sub_block: {
        id: item.warehouse_sub_block?.id ?? '',
        name: item.warehouse_sub_block?.name ?? '',
      },
    }));
  }, [detailsQuery.data?.data]);

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
            items={detailsList}
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
