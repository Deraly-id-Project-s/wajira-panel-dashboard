"use client";

import { useMemo, useState, useEffect, type CSSProperties } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Printer } from 'lucide-react';
import { useRouter } from 'next/router';
import { useCompany } from '@/contexts/CompanyContext';
import { resolveCompanyId, getLetterheadByCompanyId } from '@/lib/print-letterhead';
import { PrintLetterPage } from '@/components/common/PrintLetterPage';
import StockTab from '@/components/features/laporan-warehouse/StockTab';
import StockDetailTab from '@/components/features/laporan-warehouse/StockDetailTab';
import PurchaseOrderTab from '@/components/features/laporan-warehouse/PurchaseOrderTab';
import SalesOrderTab from '@/components/features/laporan-warehouse/SalesOrderTab';
import { DocumentTemplatePrintFooter } from '@/components/common/DocumentTemplatePrintFooter';
import { getObjectStorageUrl } from '@/components/ui/storage-image';
import { useReportTemplatePrint } from '@/hooks/useReportTemplatePrint';
import { ReportTemplatePrintDialog } from '@/components/ui/report-template-print-dialog';

const reportMeta = {
    stock: { title: 'Stock Unit', subtitle: 'Pantau semua stock unit' },
    'stock-detail': { title: 'Stock Unit Detail', subtitle: 'Pantau detail stock unit' },
    'purchase-order': { title: 'Purchase Order Outstanding', subtitle: 'Pantau semua purchase order' },
    'sales-order': { title: 'Sales Order Outstanding', subtitle: 'Pantau semua sales order' },
} as const;

export default function LaporanStockPage() {
    const [activeTab, setActiveTab] = useState('stock');
    const [currentActions, setCurrentActions] = useState<{ print: () => void; download: () => void } | null>(null);
    const [stockPerPage, setStockPerPage] = useState(25);

    const [stockDetailPerPage, setStockDetailPerPage] = useState(25);
    const [machineNumber, setMachineNumber] = useState('');
    const [appliedMachineNumber, setAppliedMachineNumber] = useState('');

    const [poPerPage, setPoPerPage] = useState(25);
    const [poDateRange, setPoDateRange] = useState<DateRange | undefined>();
    const [appliedPoDateRange, setAppliedPoDateRange] = useState<DateRange | undefined>();

    const [soPerPage, setSoPerPage] = useState(25);
    const [soDateRange, setSoDateRange] = useState<DateRange | undefined>();
    const [appliedSoDateRange, setAppliedSoDateRange] = useState<DateRange | undefined>();

    // Trigger filters automatically
    useEffect(() => {
        const timer = setTimeout(() => {
            setAppliedMachineNumber(machineNumber.trim());
        }, 500);
        return () => clearTimeout(timer);
    }, [machineNumber]);

    useEffect(() => {
        setAppliedPoDateRange(poDateRange);
    }, [poDateRange]);

    useEffect(() => {
        setAppliedSoDateRange(soDateRange);
    }, [soDateRange]);

    const router = useRouter();
    const { companyId } = useCompany();

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

    const activeMeta = reportMeta[activeTab as keyof typeof reportMeta] ?? reportMeta.stock;

    const pageFilter = useMemo(() => {
        switch (activeTab) {
            case 'stock-detail':
                return (
                    <div className="flex flex-col sm:flex-row sm:items-end gap-3 w-full sm:w-auto">
                        <div className="space-y-1.5 w-full sm:w-auto">
                            <label className="text-[13px] font-medium text-slate-700">No Mesin</label>
                            <div className="w-full sm:w-[240px]">
                                <Input
                                    value={machineNumber}
                                    onChange={(event) => setMachineNumber(event.target.value)}
                                    placeholder="Masukkan nomor mesin"
                                    className="w-full bg-white h-9"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap h-9">
                            <span>Show</span>
                            <Select value={String(stockDetailPerPage)} onValueChange={(value) => setStockDetailPerPage(Number(value))}>
                                <SelectTrigger className="w-[70px] bg-white cursor-pointer h-9">
                                    <SelectValue placeholder="25" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem className="cursor-pointer" value="25">25</SelectItem>
                                    <SelectItem className="cursor-pointer" value="50">50</SelectItem>
                                    <SelectItem className="cursor-pointer" value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                            <span>Page</span>
                        </div>
                    </div>
                );
            case 'purchase-order':
                return (
                    <div className="flex flex-col sm:flex-row sm:items-end gap-3 w-full sm:w-auto">
                        <div className="space-y-1.5 w-full sm:w-auto">
                            <label className="text-[13px] font-medium text-slate-700">Periode Transaksi</label>
                            <div className="w-full sm:w-[280px]">
                                <DatePickerWithRange date={poDateRange} onChange={setPoDateRange} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap h-9">
                            <span>Show</span>
                            <Select value={String(poPerPage)} onValueChange={(value) => setPoPerPage(Number(value))}>
                                <SelectTrigger className="w-[70px] bg-white cursor-pointer h-9">
                                    <SelectValue placeholder="25" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem className="cursor-pointer" value="25">25</SelectItem>
                                    <SelectItem className="cursor-pointer" value="50">50</SelectItem>
                                    <SelectItem className="cursor-pointer" value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                            <span>Page</span>
                        </div>
                    </div>
                );
            case 'sales-order':
                return (
                    <div className="flex flex-col sm:flex-row sm:items-end gap-3 w-full sm:w-auto">
                        <div className="space-y-1.5 w-full sm:w-auto">
                            <label className="text-[13px] font-medium text-slate-700">Periode Transaksi</label>
                            <div className="w-full sm:w-[280px]">
                                <DatePickerWithRange date={soDateRange} onChange={setSoDateRange} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap h-9">
                            <span>Show</span>
                            <Select value={String(soPerPage)} onValueChange={(value) => setSoPerPage(Number(value))}>
                                <SelectTrigger className="w-[70px] bg-white cursor-pointer h-9">
                                    <SelectValue placeholder="25" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem className="cursor-pointer" value="25">25</SelectItem>
                                    <SelectItem className="cursor-pointer" value="50">50</SelectItem>
                                    <SelectItem className="cursor-pointer" value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                            <span>Page</span>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap h-9">
                        <span>Show</span>
                        <Select value={String(stockPerPage)} onValueChange={(value) => setStockPerPage(Number(value))}>
                            <SelectTrigger className="w-[70px] bg-white cursor-pointer h-9">
                                <SelectValue placeholder="25" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem className="cursor-pointer" value="25">25</SelectItem>
                                <SelectItem className="cursor-pointer" value="50">50</SelectItem>
                                <SelectItem className="cursor-pointer" value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                        <span>Page</span>
                    </div>
                );
        }
    }, [activeTab, machineNumber, poDateRange, poPerPage, soDateRange, soPerPage, stockDetailPerPage, stockPerPage]);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="no-print">
                    <PageHeader
                        title={activeMeta.title}
                        subtitle={activeMeta.subtitle}
                    />
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <div className="no-print flex w-full flex-col gap-4">
                        <TabsList className="flex h-auto p-1 bg-gray-50 border border-gray-100 rounded-md self-start">
                            <TabsTrigger
                                value="stock"
                                className="rounded-md px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm cursor-pointer"
                            >
                                Jumlah Stock
                            </TabsTrigger>
                            <TabsTrigger
                                value="stock-detail"
                                className="rounded-md px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm cursor-pointer"
                            >
                                Stock Detail
                            </TabsTrigger>
                            <TabsTrigger
                                value="purchase-order"
                                className="rounded-md px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm cursor-pointer"
                            >
                                Purchase Order Outstanding
                            </TabsTrigger>
                            <TabsTrigger
                                value="sales-order"
                                className="rounded-md px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm cursor-pointer"
                            >
                                Sales Order Outstanding
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Unified Filter Toolbar */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end justify-between w-full no-print">
                        <div className="w-full sm:w-auto">
                            {pageFilter}
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                            <Button onClick={templatePrint.openPrintDialog} variant="outline" className="w-full sm:w-auto h-9">
                                <Printer className="h-4 w-4 mr-2" /> Print
                            </Button>
                            <Button onClick={() => currentActions?.download()} variant="outline" className="w-full sm:w-auto h-9">
                                <Download className="h-4 w-4 mr-2" /> Download
                            </Button>
                        </div>
                    </div>

                    <PrintLetterPage
                        id="laporan-stock-print"
                        className="laporan-stock-print-area laporan-penerimaan-print-area"
                        letterheadSrc={templateBackground}
                    >
                        <div
                            className="laporan-penerimaan-print-content laporan-stock-print-content templated-report-print-content"
                            style={{ '--report-template-color': templateColor } as CSSProperties}
                        >
                            <div className="flex flex-col items-center justify-center text-center space-y-0 mb-2">
                                <h2 className="text-[13px] font-bold uppercase text-gray-900 tracking-wide">
                                    {activeMeta.title}
                                </h2>
                                <p className="text-[13px] font-bold text-gray-900 tracking-wide">
                                    PT WAJIRA JAGRATARA MORINDO
                                </p>
                                <p className="text-[13px] font-semibold text-gray-800 opacity-90">
                                    {activeTab === 'purchase-order' && appliedPoDateRange?.from
                                        ? `Periode: ${appliedPoDateRange.from.toLocaleDateString('id-ID')} ${appliedPoDateRange.to ? `s.d. ${appliedPoDateRange.to.toLocaleDateString('id-ID')}` : ''}`
                                        : activeTab === 'sales-order' && appliedSoDateRange?.from
                                            ? `Periode: ${appliedSoDateRange.from.toLocaleDateString('id-ID')} ${appliedSoDateRange.to ? `s.d. ${appliedSoDateRange.to.toLocaleDateString('id-ID')}` : ''}`
                                            : 'Periode: Bulan Berjalan'}
                                </p>
                            </div>

                            <TabsContent value="stock">
                                <StockTab perPage={stockPerPage} onActionsChange={setCurrentActions} />
                            </TabsContent>

                            <TabsContent value="stock-detail">
                                <StockDetailTab perPage={stockDetailPerPage} machineNumber={appliedMachineNumber} onActionsChange={setCurrentActions} />
                            </TabsContent>

                            <TabsContent value="purchase-order">
                                <PurchaseOrderTab perPage={poPerPage} dateRange={appliedPoDateRange} onActionsChange={setCurrentActions} />
                            </TabsContent>

                            <TabsContent value="sales-order">
                                <SalesOrderTab perPage={soPerPage} dateRange={appliedSoDateRange} onActionsChange={setCurrentActions} />
                            </TabsContent>

                            <DocumentTemplatePrintFooter template={templatePrint.selectedTemplate} />
                        </div>
                    </PrintLetterPage>
                </Tabs>

                <ReportTemplatePrintDialog
                    open={templatePrint.isDialogOpen}
                    onOpenChange={templatePrint.setIsDialogOpen}
                    selectedTemplateId={templatePrint.selectedTemplateId}
                    onTemplateChange={templatePrint.setSelectedTemplateId}
                    onPrint={templatePrint.printWithSelectedTemplate}
                    isPreparingPrint={templatePrint.isPreparingPrint}
                    reportName={activeMeta.title.toLocaleLowerCase('id-ID')}
                />
            </div>
        </DashboardLayout>
    );
}
