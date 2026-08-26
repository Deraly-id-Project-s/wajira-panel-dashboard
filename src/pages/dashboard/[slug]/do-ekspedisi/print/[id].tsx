import * as React from 'react';
import { ChevronLeft, Printer } from 'lucide-react';
import { useRouter } from 'next/router';
import { useReactToPrint } from 'react-to-print';
import { DOEkspedisiPrintDocument } from '@/components/features/do-ekspedisi/DOEkspedisiPrintDocument';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useDoEkspedisiDetail } from '@/hooks/useDoEkspedisi';
import { useOrderListTarifs, useOrderListTarifItems } from '@/hooks/useOrderList';
import { Button } from '@/components/ui/button';
import type { DoEkspedisi, DoEkspedisiOrderList, DoEkspedisiOrderTarifItem, DoEkspedisiOrderTarifLoadItem } from '@/types/do-ekspedisi.types';
import { LoadingState } from '@/components/ui/loading-state';

export default function DOEkspedisiPrintPage() {
  const router = useRouter();
  const { slug, id } = router.query;

  const detailQuery = useDoEkspedisiDetail(id ? String(id) : null);
  const orderListId = detailQuery.data?.orderList?.id ?? null;

  const tarifQuery = useOrderListTarifs({
    page: 1,
    perPage: 100,
    do_orderlist_id: orderListId ?? undefined,
    order_by: 'created_at',
    order_sort: 'desc',
    enabled: Boolean(orderListId),
  });

  const tarifItemQuery = useOrderListTarifItems({
    page: 1,
    perPage: 500,
    do_orderlist_id: orderListId ?? undefined,
    order_by: 'created_at',
    order_sort: 'desc',
    enabled: Boolean(orderListId),
  });

  const effectiveData = React.useMemo<DoEkspedisi | null>(() => {
    if (!detailQuery.data) return null;

    const tarifHeaders = tarifQuery.data?.data ?? [];
    const tarifItems = tarifItemQuery.data?.data ?? [];
    const mergedOrderList: DoEkspedisiOrderList | null = detailQuery.data.orderList
      ? {
        ...detailQuery.data.orderList,
        tarifs: (tarifHeaders.length ? tarifHeaders : detailQuery.data.orderList.tarifs ?? []).map((tarif) => {
          const matchedItems = tarifItems.filter((item) => {
            const left = Number(item.doOrderListTarifId ?? 0);
            const rightA = Number(tarif.id ?? 0);
            const rightB = Number((tarif as any).tarifId ?? 0);
            return left === rightA || (rightB && left === rightB);
          });
          const mappedTarifItems: DoEkspedisiOrderTarifLoadItem[] = matchedItems.map((item) => ({
            id: Number(item.id ?? 0),
            uuid: item.uuid,
            loadContent: item.loadContent,
            qty: Number(item.qty ?? 0),
          }));

          return {
            ...tarif,
            loadContent: tarif.loadContent || mappedTarifItems[0]?.loadContent || '-',
            qty: tarif.qty || mappedTarifItems[0]?.qty || 0,
            tarifItems: mappedTarifItems.length ? mappedTarifItems : tarif.tarifItems,
          } satisfies DoEkspedisiOrderTarifItem;
        }),
      }
      : null;

    return {
      ...detailQuery.data,
      orderList: mergedOrderList,
    };
  }, [detailQuery.data, tarifQuery.data?.data, tarifItemQuery.data?.data]);

  const printRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: effectiveData ? `DO-${effectiveData.doCode}` : 'DO-Ekspedisi',
    pageStyle: `
      @page { size: A4; margin: 20mm; }
      @media print {
        html, body { background: white; color: black; }
        .no-print { display: none !important; }
      }
    `,
  });

  if (!router.isReady || detailQuery.isLoading || tarifQuery.isLoading || tarifItemQuery.isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (!detailQuery.data) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-sm text-slate-500">Data DO Ekspedisi tidak ditemukan.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="no-print flex items-center justify-between rounded-md border border-slate-200 bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/${slug}/do-ekspedisi/detail/${id}`)}
              className="rounded-md p-1 transition-colors hover:bg-slate-100"
            >
              <ChevronLeft className="h-5 w-5 text-slate-500" />
            </button>
            <div>
              <h1 className="text-[18px] font-semibold text-slate-900">DO Ekspedisi {effectiveData?.doCode}</h1>
              <p className="text-sm text-slate-500">Tanggal: {effectiveData?.date ? new Date(effectiveData.date).toLocaleDateString('id-ID') : '-'}</p>
            </div>
          </div>
          <Button type="button" onClick={() => handlePrint()} variant="outline" className="w-full sm:w-auto">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>

        <div className="flex justify-center bg-slate-50 py-8">
          <div
            ref={printRef}
            className="w-[210mm] min-h-[297mm] bg-white p-[20mm] shadow-md rounded border border-slate-200"
          >
            <DOEkspedisiPrintDocument data={effectiveData ?? detailQuery.data} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
