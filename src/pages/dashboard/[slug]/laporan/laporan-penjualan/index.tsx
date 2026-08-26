"use client"

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LaporanPenjualanFilter from '@/components/features/laporan-penjualan/LaporanPenjualanFilter';
import LaporanPenjualanPerNota from '@/components/features/laporan-penjualan/LaporanPenjualanPerNota';
import LaporanPenjualanPerTipe from '@/components/features/laporan-penjualan/LaporanPenjualanPerTipe';
import LaporanPenjualanPerCustomer from '@/components/features/laporan-penjualan/LaporanPenjualanPerCustomer';
import LaporanPenjualanSparepart from '@/components/features/laporan-penjualan/LaporanPenjualanSparepart';
import { useLaporanPenjualan } from '@/hooks/useLaporanPenjualan';
import type { SalesSparepartTransactionItem, SalesTransactionItem } from '@/services/laporan-penjualan.service';
import { format } from 'date-fns';
import { useRouter } from 'next/router';
import { useCompany } from '@/contexts/CompanyContext';
import { resolveCompanyId, getLetterheadByCompanyId } from '@/lib/print-letterhead';
import { PrintLetterPage } from '@/components/common/PrintLetterPage';

export default function LaporanPenjualanPage() {
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
    } = useLaporanPenjualan(reportItem);

    const unitData = data as SalesTransactionItem[];
    const sparepartData = data as SalesSparepartTransactionItem[];

    const slugParam = router.query.slug;
    const resolvedCompanyId = resolveCompanyId(slugParam, companyId);
    const selectedPrintBackground = getLetterheadByCompanyId(resolvedCompanyId);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        resetFiltersForTab(tab);
    };

    const handleReportItemChange = (value: string) => {
        setReportItem(value as 'unit' | 'sparepart');
        setPage(1);
    };

    const handlePrint = () => {
        window.print();
    };

    const exportToCSV = () => {
        let csvContent = "";

        const getReportTitle = () => {
            switch (activeTab) {
                case 'per-tipe': return 'REKAP PENJUALAN PER TIPE';
                case 'per-customer': return 'REKAP PENJUALAN PER CUSTOMER';
                default: return 'REKAP PENJUALAN PER NOTA';
            }
        };

        const periodText = startDate && endDate
            ? `Periode: ${format(new Date(startDate), 'dd/MM/yyyy')} s.d. ${format(new Date(endDate), 'dd/MM/yyyy')}`
            : 'Tahun 2026';

        csvContent += `"${getReportTitle()} ${reportItem.toUpperCase()}"\n`;
        csvContent += `"PT WAJIRA JAGRATARA MORINDO"\n`;
        csvContent += `"${periodText}"\n\n`;

        if (reportItem === 'sparepart') {
            const showCustomer = activeTab === 'per-customer';
            csvContent += `NO,NO PENJUALAN,TGL JUAL,${showCustomer ? 'NAMA CUSTOMER,' : ''}SPAREPART,KODE SPAREPART,QTY,HARGA JUAL,DISKON,TOTAL JUAL,STATUS\n`;

            sparepartData.forEach((item, idx) => {
                csvContent += `${idx + 1},`;
                csvContent += `"${item.transaction_code}",`;
                csvContent += `"${new Date(item.transaction_date).toLocaleDateString('id-ID')}",`;
                if (showCustomer) csvContent += `"${item.person_name || '-'}",`;
                csvContent += `"${item.sparepart_name || '-'}",`;
                csvContent += `"${item.sparepart_code || '-'}",`;
                csvContent += `${item.qty || 0},`;
                csvContent += `${item.price || 0},`;
                csvContent += `${item.discount || 0},`;
                csvContent += `${item.total || 0},`;
                csvContent += `"${item.payment_status || (item.is_paid ? 'Lunas' : 'Belum Lunas')}"\n`;
            });
        } else if (activeTab === 'per-nota') {
            csvContent += 'NO,NO PENJUALAN,TGL JUAL,TIPE UNIT,QTY,HARGA JUAL,BIAYA BBN,BIAYA EKSPEDISI,BIAYA LAINNYA,HPP,DPP,PPN,JUMLAH\n';

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
            csvContent += 'NO,NO PENJUALAN,TGL JUAL,TIPE UNIT,QTY,HARGA,BIAYA BBN,BIAYA EKSPEDISI,BIAYA LAIN,TOTAL JUAL\n';

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
            csvContent += 'NO,NO PENJUALAN,TGL JUAL,NAMA CUSTOMER,QTY,HARGA,BIAYA BBN,BIAYA EKSPEDISI,BIAYA LAIN,TOTAL JUAL\n';

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
        const link = document.createElement('a');
        const uniqueId = new Date().getTime();
        const fileName = `Laporan_Penjualan_${reportItem}_${activeTab}_${uniqueId}.csv`;
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
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
                        title="Laporan Penjualan"
                        subtitle="Pantau semua transaksi penjualan"
                    />
                </div>

                <div className="space-y-4">
                    <LaporanPenjualanFilter
                        activeTab={activeTab}
                        reportItem={reportItem}
                        startDate={startDate}
                        endDate={endDate}
                        onApplyFilters={applyFilters}
                        onPrint={handlePrint}
                        onDownload={exportToCSV}
                    />

                    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
                        <div className="flex no-print">
                            <TabsList className="flex h-auto p-1 bg-gray-50 border border-gray-100 rounded-md">
                                <TabsTrigger
                                    value="per-nota"
                                    className="rounded-lg px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                                >
                                    Laporan Penjualan Per Nota
                                </TabsTrigger>
                                <TabsTrigger
                                    value="per-tipe"
                                    className="rounded-lg px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                                >
                                    Laporan Penjualan Per Tipe
                                </TabsTrigger>
                                <TabsTrigger
                                    value="per-customer"
                                    className="rounded-lg px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                                >
                                    Laporan Penjualan Per Customer
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
                            id="laporan-penjualan-print"
                            className="laporan-penjualan-print-area"
                            letterheadSrc={selectedPrintBackground}
                        >
                            <div className="laporan-penjualan-print-content">
                                <div className="flex flex-col items-center justify-center text-center space-y-1 mb-8">
                                    <h2 className="text-[13px] font-bold uppercase text-gray-900 tracking-wide">
                                        REKAP PENJUALAN {reportItem.toUpperCase()} {activeTab.replace('-', ' ')}
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
                                        <LaporanPenjualanSparepart activeTab={activeTab} data={sparepartData} pagination={pagination} isLoading={isLoading} onPageChange={setPage} />
                                    ) : (
                                        <LaporanPenjualanPerNota data={unitData} pagination={pagination} isLoading={isLoading} onPageChange={setPage} />
                                    )}
                                </TabsContent>

                                <TabsContent value="per-tipe" className="mt-0">
                                    {reportItem === 'sparepart' ? (
                                        <LaporanPenjualanSparepart activeTab={activeTab} data={sparepartData} pagination={pagination} isLoading={isLoading} onPageChange={setPage} />
                                    ) : (
                                        <LaporanPenjualanPerTipe data={unitData} pagination={pagination} isLoading={isLoading} onPageChange={setPage} />
                                    )}
                                </TabsContent>

                                <TabsContent value="per-customer" className="mt-0">
                                    {reportItem === 'sparepart' ? (
                                        <LaporanPenjualanSparepart activeTab={activeTab} data={sparepartData} pagination={pagination} isLoading={isLoading} onPageChange={setPage} />
                                    ) : (
                                        <LaporanPenjualanPerCustomer data={unitData} pagination={pagination} isLoading={isLoading} onPageChange={setPage} />
                                    )}
                                </TabsContent>
                            </div>
                        </PrintLetterPage>
                    </Tabs>
                </div>
            </div>
        </DashboardLayout>
    );
}
