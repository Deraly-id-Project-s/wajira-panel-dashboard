"use client"

import { useState, type CSSProperties } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LaporanPengirimanFilter from '@/components/features/laporan-pengiriman/LaporanPengirimanFilter';
import LaporanPengirimanTable from '@/components/features/laporan-pengiriman/LaporanPengirimanTable';
import LaporanPengirimanPerTipe from '@/components/features/laporan-pengiriman/LaporanPengirimanPerTipe';
import LaporanPengirimanPerCustomer from '@/components/features/laporan-pengiriman/LaporanPengirimanPerCustomer';
import { useLaporanPengiriman } from '@/hooks/useLaporanPengiriman';
import { format } from 'date-fns';
import { useRouter } from 'next/router';
import { useCompany } from '@/contexts/CompanyContext';
import { resolveCompanyId, getLetterheadByCompanyId } from '@/lib/print-letterhead';
import { PrintLetterPage } from '@/components/common/PrintLetterPage';
import { DocumentTemplatePrintFooter } from '@/components/common/DocumentTemplatePrintFooter';
import { DocumentTemplateSelect } from '@/components/features/document-template/DocumentTemplateSelect';
import { getObjectStorageUrl } from '@/components/ui/storage-image';
import { useReportTemplatePrint } from '@/hooks/useReportTemplatePrint';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type TabType = 'per-nota' | 'per-tipe' | 'per-customer';

export default function LaporanPengirimanPage() {
  const [activeTab, setActiveTab] = useState<TabType>('per-nota');

  const router = useRouter();
  const { companyId } = useCompany();
  const {
    type,
    data,
    pagination,
    isLoading,
    startDate,
    endDate,
    setPage,
    setPerPage,
    setDateRange,
    setSearch,
  } = useLaporanPengiriman();

  const slugParam = router.query.slug;
  const resolvedCompanyId = resolveCompanyId(slugParam, companyId);
  const selectedPrintBackground = getLetterheadByCompanyId(resolvedCompanyId);
  const templatePrint = useReportTemplatePrint(selectedPrintBackground);
  const templateBackground = templatePrint.selectedTemplate?.documentTemplate
    ? getObjectStorageUrl(templatePrint.selectedTemplate.documentTemplate)
    : selectedPrintBackground;
  const templateColor = templatePrint.selectedTemplate && /^#[0-9a-f]{6}$/i.test(templatePrint.selectedTemplate.tableColor)
    ? templatePrint.selectedTemplate.tableColor
    : '#1f4163';

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabType);
    setSearch('');
  };

  const handleApplyFilters = (filters: {
    startDate: string | null;
    endDate: string | null;
    search: string;
    perPage: number;
  }) => {
    setDateRange(filters.startDate, filters.endDate);
    setSearch(filters.search);
    setPerPage(filters.perPage);
  };

  const handlePrint = () => {
    templatePrint.openPrintDialog();
  };

  const exportToCSV = () => {
    if (data.length === 0) {
      alert('Tidak ada data untuk diunduh');
      return;
    }

    const headers: string[] = [
      'NO',
      'NO PENGIRIMAN',
      'TGL KIRIM',
      'NAMA CUSTOMER',
      'TIPE UNIT',
      'WARNA',
      'NO MESIN',
      'NO RANGKA',
    ];

    const rows: (string | number)[][] = data.map((item, idx) => [
      idx + 1 + (pagination.currentPage - 1) * pagination.perPage,
      item.transaction_code,
      new Date(item.receipt_date).toLocaleDateString('id-ID'),
      item.person,
      item.unit_type.name,
      item.color,
      item.machine_number,
      item.chassis_number,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-pengiriman-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="no-print">
          <PageHeader
            title="Laporan Pengiriman"
            subtitle="Pantau semua transaksi pengiriman unit"
          />
        </div>

        <div className="space-y-4">
          <LaporanPengirimanFilter
            activeTab={activeTab}
            startDate={startDate}
            endDate={endDate}
            onApplyFilters={handleApplyFilters}
            onPrint={handlePrint}
            onDownload={exportToCSV}
          />

          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            <div className="flex no-print">
              <TabsList className="flex h-auto p-1 bg-gray-50 border border-gray-100 rounded-md">
                <TabsTrigger value="per-nota" className="rounded-lg px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                  Laporan Pengiriman
                </TabsTrigger>
                <TabsTrigger value="per-tipe" className="rounded-lg px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                  Laporan Pengiriman Per Tipe
                </TabsTrigger>
                <TabsTrigger value="per-customer" className="rounded-lg px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                  Laporan Pengiriman Per Customer
                </TabsTrigger>
              </TabsList>
            </div>

            <PrintLetterPage
              id="laporan-pengiriman-print"
              className="laporan-pengiriman-print-area laporan-penerimaan-print-area"
              letterheadSrc={templateBackground}
            >
              <div
                className="laporan-pengiriman-print-content laporan-penerimaan-print-content templated-report-print-content"
                style={{ '--report-template-color': templateColor } as CSSProperties}
              >
                <div className="flex flex-col items-center justify-center text-center space-y-1 mb-8">
                  <h2 className="text-[13px] font-bold uppercase text-gray-900 tracking-wide">
                    REKAP PENGIRIMAN {activeTab.replace('-', ' ')}
                  </h2>
                  <p className="text-[13px] font-bold text-gray-900 tracking-wide">
                    PT WAJIRA JAGRATARA MORINDO
                  </p>
                  <p className="text-[13px] font-semibold text-gray-800 opacity-90">
                    {startDate && endDate
                      ? `Periode: ${format(new Date(startDate), 'dd/MM/yyyy')} s.d. ${format(new Date(endDate), 'dd/MM/yyyy')}`
                      : '2026'}
                  </p>
                </div>

                <TabsContent value="per-nota" className="mt-0">
                  <LaporanPengirimanTable
                    data={data}
                    pagination={pagination}
                    isLoading={isLoading}
                    onPageChange={setPage}
                  />
                </TabsContent>

                <TabsContent value="per-tipe" className="mt-0">
                  <LaporanPengirimanPerTipe
                    data={data}
                    pagination={pagination}
                    isLoading={isLoading}
                    onPageChange={setPage}
                  />
                </TabsContent>

                <TabsContent value="per-customer" className="mt-0">
                  <LaporanPengirimanPerCustomer
                    data={data}
                    pagination={pagination}
                    isLoading={isLoading}
                    onPageChange={setPage}
                  />
                </TabsContent>

                <DocumentTemplatePrintFooter template={templatePrint.selectedTemplate} />
              </div>
            </PrintLetterPage>
          </Tabs>
        </div>

        <Dialog open={templatePrint.isDialogOpen} onOpenChange={templatePrint.setIsDialogOpen}>
          <DialogContent closeOnInteractOutside={false} className="max-h-[88vh] overflow-hidden p-0 sm:max-w-2xl">
            <DialogHeader className="border-b border-slate-200 px-6 py-5 pr-12">
              <DialogTitle>Pilih Template Print</DialogTitle>
              <DialogDescription>Pilih desain dokumen untuk mencetak laporan pengiriman.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[56vh] overflow-y-auto px-6 py-5">
              <DocumentTemplateSelect value={templatePrint.selectedTemplateId} onValueChange={templatePrint.setSelectedTemplateId} disabled={templatePrint.isPreparingPrint} allowEmpty={false} placeholder="Pilih template laporan pengiriman" variant="cards" />
            </div>
            <DialogFooter className="border-t border-slate-200 bg-slate-50/70 px-6 py-4">
              <Button type="button" variant="outline" onClick={() => templatePrint.setIsDialogOpen(false)} disabled={templatePrint.isPreparingPrint}>Batal</Button>
              <Button type="button" onClick={() => void templatePrint.printWithSelectedTemplate()} disabled={!templatePrint.selectedTemplateId || templatePrint.isPreparingPrint}>
                {templatePrint.isPreparingPrint ? 'Menyiapkan...' : 'Print Sekarang'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
