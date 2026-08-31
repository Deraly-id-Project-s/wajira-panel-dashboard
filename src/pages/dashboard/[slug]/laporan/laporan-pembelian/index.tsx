"use client"

import { useState, type CSSProperties } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LaporanPembelianFilter from '@/components/features/laporan-pembelian/LaporanPembelianFilter';
import LaporanPembelianPerNota from '@/components/features/laporan-pembelian/LaporanPembelianPerNota';
import LaporanPembelianPerTipe from '@/components/features/laporan-pembelian/LaporanPembelianPerTipe';
import LaporanPembelianPerSupplier from '@/components/features/laporan-pembelian/LaporanPembelianPerSupplier';
import LaporanPembelianSparepart from '@/components/features/laporan-pembelian/LaporanPembelianSparepart';
import { useLaporanPembelian } from '@/hooks/useLaporanPembelian';
import type { PurchaseSparepartTransactionItem, PurchaseTransactionItem } from '@/services/laporan-pembelian.service';
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

export default function LaporanPembelianPage() {
  const [activeTab, setActiveTab] = useState('per-nota');
  const [reportItem, setReportItem] = useState<'unit' | 'sparepart'>('unit');
  const router = useRouter();
  const { companyId } = useCompany();
  const {
    data,
    pagination,
    isLoading,
    setPage,
    applyFilters,
    resetFiltersForTab,
    startDate,
    endDate,
  } = useLaporanPembelian(reportItem);

  const unitData = data as PurchaseTransactionItem[];
  const sparepartData = data as PurchaseSparepartTransactionItem[];

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
    setActiveTab(tab);
    resetFiltersForTab(tab);
  };

  const handleReportItemChange = (value: string) => {
    setReportItem(value as 'unit' | 'sparepart');
    setPage(1);
  };

  const handlePrint = () => {
    templatePrint.openPrintDialog();
  };

  const exportToCSV = () => {
    let csvContent = "";

    const getReportTitle = () => {
      switch (activeTab) {
        case 'per-tipe': return 'REKAP PEMBELIAN PER TIPE';
        case 'per-supplier': return 'REKAP PEMBELIAN PER SUPPLIER';
        default: return 'REKAP PEMBELIAN PER NOTA';
      }
    };

    const periodText = startDate && endDate
      ? `Periode: ${format(new Date(startDate), 'dd/MM/yyyy')} s.d. ${format(new Date(endDate), 'dd/MM/yyyy')}`
      : 'Tahun 2026';

    csvContent += `"${getReportTitle()} ${reportItem.toUpperCase()}"\n`;
    csvContent += `"PT WAJIRA JAGRATARA MORINDO"\n`;
    csvContent += `"${periodText}"\n\n`;

    if (reportItem === 'sparepart') {
      const showSupplier = activeTab === 'per-supplier';
      csvContent += `NO,NO PEMBELIAN,TGL BELI,${showSupplier ? 'NAMA SUPPLIER,' : ''}SPAREPART,KODE SPAREPART,QTY,HARGA BELI,DISKON,TOTAL BELI,STATUS\n`;

      sparepartData.forEach((item, idx) => {
        csvContent += `${idx + 1},`;
        csvContent += `"${item.transaction_code}",`;
        csvContent += `"${new Date(item.transaction_date).toLocaleDateString('id-ID')}",`;
        if (showSupplier) csvContent += `"${item.person_name || '-'}",`;
        csvContent += `"${item.sparepart_name || '-'}",`;
        csvContent += `"${item.sparepart_code || '-'}",`;
        csvContent += `${item.qty || 0},`;
        csvContent += `${item.price || 0},`;
        csvContent += `${item.discount || 0},`;
        csvContent += `${item.total || 0},`;
        csvContent += `"${item.payment_status || (item.is_paid ? 'Lunas' : 'Belum Lunas')}"\n`;
      });
    } else if (activeTab === 'per-nota') {
      csvContent += "NO,NO PEMBELIAN,TGL BELI,TIPE UNIT,QTY,HARGA BELI,BIAYA BBN,BIAYA EKSPEDISI,BIAYA LAINNYA,HPP,DPP,PPN,JUMLAH\n";

      unitData.forEach((item, idx) => {
        csvContent += `${idx + 1},`;
        csvContent += `"${item.transaction_code}",`;
        csvContent += `"${new Date(item.transaction_date).toLocaleDateString('id-ID')}",`;
        csvContent += `"${item.unit_name || '-'}",`;
        csvContent += `${item.qty || 0},`;
        csvContent += `${item.price || 0},`;
        csvContent += `${item.bbn || 0},`;
        csvContent += `${item.expedition_fee || 0},`;
        csvContent += `${item.other_fee || 0},`;
        csvContent += `${item.hpp_fee || 0},`;
        csvContent += `${item.dpp || 0},`;
        csvContent += `${item.ppn || 0},`;
        csvContent += `${item.total || 0}\n`;
      });
    } else if (activeTab === 'per-tipe') {
      csvContent += "NO,NO PEMBELIAN,TGL BELI,TIPE UNIT,QTY,HARGA,BIAYA BBN,BIAYA EKSPEDISI,BIAYA LAIN,TOTAL BELI\n";

      unitData.forEach((item, idx) => {
        csvContent += `${idx + 1},`;
        csvContent += `"${item.transaction_code}",`;
        csvContent += `"${new Date(item.transaction_date).toLocaleDateString('id-ID')}",`;
        csvContent += `"${item.unit_name || '-'}",`;
        csvContent += `${item.qty || 0},`;
        csvContent += `${item.price || 0},`;
        csvContent += `${item.bbn || 0},`;
        csvContent += `${item.expedition_fee || 0},`;
        csvContent += `${item.other_fee || 0},`;
        csvContent += `${item.total || 0}\n`;
      });
    } else {
      csvContent += "NO,NO PEMBELIAN,TGL BELI,NAMA SUPPLIER,QTY,HARGA,BIAYA BBN,BIAYA EKSPEDISI,BIAYA LAIN,TOTAL BELI\n";

      unitData.forEach((item, idx) => {
        csvContent += `${idx + 1},`;
        csvContent += `"${item.transaction_code}",`;
        csvContent += `"${new Date(item.transaction_date).toLocaleDateString('id-ID')}",`;
        csvContent += `"${item.person_name || '-'}",`;
        csvContent += `${item.qty || 0},`;
        csvContent += `${item.price || 0},`;
        csvContent += `${item.bbn || 0},`;
        csvContent += `${item.expedition_fee || 0},`;
        csvContent += `${item.other_fee || 0},`;
        csvContent += `${item.total || 0}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const uniqueId = new Date().getTime();
    const fileName = `Laporan_Pembelian_${reportItem}_${activeTab}_${uniqueId}.csv`;
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="no-print">
          <PageHeader
            title="Laporan Pembelian"
            subtitle="Pantau semua transaksi pembelian"
          />
        </div>

        <div className="space-y-4">
          <LaporanPembelianFilter
            activeTab={activeTab}
            reportItem={reportItem}
            startDate={startDate}
            endDate={endDate}
            onApplyFilters={applyFilters}
            onPrint={handlePrint}
            onDownload={exportToCSV}
          />

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            {/* Tab triggers wrapped to look like pills */}
            <div className="flex no-print">
              <TabsList className="flex h-auto p-1 bg-gray-50 border border-gray-100 rounded-md">
                <TabsTrigger
                  value="per-nota"
                  className="rounded-lg px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                >
                  Laporan Pembelian Per Nota
                </TabsTrigger>
                <TabsTrigger
                  value="per-tipe"
                  className="rounded-lg px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                >
                  Laporan Pembelian Per Tipe
                </TabsTrigger>
                <TabsTrigger
                  value="per-supplier"
                  className="rounded-lg px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                >
                  Laporan Pembelian Per Supplier
                </TabsTrigger>
              </TabsList>
            </div>

            <Tabs value={reportItem} onValueChange={handleReportItemChange} className="no-print">
              <TabsList className="h-auto bg-slate-100 p-1">
                <TabsTrigger value="unit" className="px-5 py-2">Unit Tipe</TabsTrigger>
                <TabsTrigger value="sparepart" className="px-5 py-2">Sparepart</TabsTrigger>
              </TabsList>
            </Tabs>

            <PrintLetterPage
              id="laporan-pembelian-print"
              className="laporan-pembelian-print-area"
              letterheadSrc={templateBackground}
            >
              <div
                className="laporan-pembelian-print-content templated-report-print-content"
                style={{ '--report-template-color': templateColor } as CSSProperties}
              >
                <div className="flex flex-col items-center justify-center text-center space-y-1 mb-8">
                  <h2 className="text-[13px] font-bold uppercase text-gray-900 tracking-wide">
                    REKAP PEMBELIAN {reportItem.toUpperCase()} {activeTab.replace('-', ' ')}
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
                  {reportItem === 'sparepart' ? (
                    <LaporanPembelianSparepart activeTab={activeTab} data={sparepartData} pagination={pagination} isLoading={isLoading} onPageChange={setPage} />
                  ) : (
                    <LaporanPembelianPerNota data={unitData} pagination={pagination} isLoading={isLoading} onPageChange={setPage} />
                  )}
                </TabsContent>

                <TabsContent value="per-tipe" className="mt-0">
                  {reportItem === 'sparepart' ? (
                    <LaporanPembelianSparepart activeTab={activeTab} data={sparepartData} pagination={pagination} isLoading={isLoading} onPageChange={setPage} />
                  ) : (
                    <LaporanPembelianPerTipe data={unitData} pagination={pagination} isLoading={isLoading} onPageChange={setPage} />
                  )}
                </TabsContent>

                <TabsContent value="per-supplier" className="mt-0">
                  {reportItem === 'sparepart' ? (
                    <LaporanPembelianSparepart activeTab={activeTab} data={sparepartData} pagination={pagination} isLoading={isLoading} onPageChange={setPage} />
                  ) : (
                    <LaporanPembelianPerSupplier data={unitData} pagination={pagination} isLoading={isLoading} onPageChange={setPage} />
                  )}
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
              <DialogDescription>Pilih desain dokumen untuk mencetak laporan pembelian.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[56vh] overflow-y-auto px-6 py-5">
              <DocumentTemplateSelect value={templatePrint.selectedTemplateId} onValueChange={templatePrint.setSelectedTemplateId} disabled={templatePrint.isPreparingPrint} allowEmpty={false} placeholder="Pilih template laporan pembelian" variant="cards" />
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
