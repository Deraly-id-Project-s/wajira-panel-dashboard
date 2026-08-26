import {
  AccountingReportParams,
  BalanceSheetReport,
  MonthlyVatReport,
  MonthlyVatReportRow,
  ProfitLossReport,
  YearlyVatReport,
  YearlyVatReportRow,
} from '@/types/accounting-report.types';
import {
  formatAccountingLongDate,
  formatAccountingMonthYear,
  formatAccountingYear,
} from './laporan-akuntansi.utils';

function buildMonthlyVatRows(partnerName: string): MonthlyVatReportRow[] {
  return Array.from({ length: 16 }, (_, index) => ({
    transactionDate: '02/02/2026',
    partnerName,
    invoiceDate: '-',
    taxInvoiceNumber: '-',
    unitType: index % 2 === 0 ? 'Beat CBS' : 'Vario 125 CBS',
    engineNumber: `AJJMS0001${123 + index}`,
    frameNumber: `MH1JMEE1${1145 + index}KS0917`,
    purchasePrice: 17_000_000,
    fee: 700_000,
    unitPrice: 17_000_000,
    dpp: 14_000_000,
    vat: 1_540_000,
  }));
}

function buildYearlyVatRows(): YearlyVatReportRow[] {
  return [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ].map((masa, index) => ({
    masa,
    inputPurchasePrice: 17_000_000 + index * 250_000,
    inputDpp: 14_000_000 + index * 200_000,
    inputVat: 1_540_000 + index * 22_000,
    outputSalesPrice: 20_000_000 + index * 300_000,
    outputDpp: 17_000_000 + index * 250_000,
    outputVat: 1_870_000 + index * 27_500,
    saldoPpn: 330_000 + index * 5_500,
    paymentStatus: index % 2 === 0 ? 'LEBIH BAYAR' : 'KURANG BAYAR',
  }));
}

export function getDummyProfitLossReport(params: AccountingReportParams): ProfitLossReport {
  const periodDate = new Date(params.periodDate);

  return {
    companyName: params.companyName,
    reportTitle: 'LAPORAN LABA / (RUGI)',
    periodLabel: formatAccountingMonthYear(periodDate),
    revenueBox: {
      title: 'PENDAPATAN',
      rows: [
        { label: 'PENJUALAN MOTOR HONDA', value: 74_774_775 },
        { label: 'PENJUALAN MOTOR YAMAHA', value: null },
        { label: 'PENJUALAN MOTOR SUZUKI', value: null },
        { label: 'PENJUALAN MOTOR SPAREPARTS', value: null },
        { label: 'PENDAPATAN LAIN-LAIN', value: null },
        { label: 'RETUR PENJUALAN', value: 19_819_820 },
      ],
      totalLabel: 'TOTAL',
      totalValue: 54_954_955,
    },
    costOfGoodsSoldBox: {
      rows: [
        { label: 'HARGA POKOK PENJUALAN HONDA', value: 47_474_748 },
        { label: 'HARGA POKOK PENJUALAN YAMAHA', value: null },
        { label: 'HARGA POKOK PENJUALAN SUZUKI', value: null },
        { label: 'HARGA POKOK PENJUALAN SPAREPARTS', value: null },
      ],
      totalLabel: 'TOTAL',
      totalValue: 47_474_748,
    },
    grossProfit: 7_480_207,
    expenseBox: {
      title: 'BIAYA-BIAYA',
      rows: [
        { label: 'BIAYA ADMINISTRASI DAN UMUM', value: 5_500_000 },
        { label: 'BIAYA PENYUSUTAN INVENTARIS KANTOR', value: 291_667 },
        { label: 'BIAYA PENYUSUTAN KENDARAAN', value: null },
        { label: 'BIAYA PENYUSUTAN BANGUNAN', value: null },
      ],
      totalLabel: 'TOTAL',
      totalValue: 5_791_667,
    },
    operatingIncome: 1_688_540,
    nonOperatingBox: {
      title: 'PENDAPATAN (BEBAN) DI LUAR USAHA',
      rows: [
        { label: 'BIAYA ADMINISTRASI BANK IDR', value: 30_000 },
        { label: 'BIAYA ADMINISTRASI BANK USD', value: 2_500 },
        { label: 'BIAYA TRANSFER ANTAR BANK', value: null },
        { label: 'RUGI SELISIH KURS', value: null },
      ],
      totalLabel: 'TOTAL',
      totalValue: 32_500,
    },
    incomeBeforeTax: 1_656_040,
    fiscalCorrectionBox: {
      rows: [
        { label: 'KOREKSI FISKAL', bold: true },
        { label: 'KOREKSI POSITIF', value: null, muted: true },
        { label: 'BIAYA ADMINISTRASI BANK', value: null, indent: 1 },
        { label: 'BIAYA ADMINISTRASI BANK USD', value: null, indent: 1 },
        { label: 'KOREKSI NEGATIF', value: null, muted: true },
      ],
    },
    incomeBeforeTaxAfterCorrection: 1_656_040,
    tax: null,
    netIncomeAfterTax: 1_656_040,
    placeAndDate: `YOGYAKARTA, ${formatAccountingLongDate(periodDate)}`,
    directorName: 'ZAIFUDIN YUKHRI',
    directorTitle: 'Direktur',
  };
}

export function getDummyBalanceSheetReport(params: AccountingReportParams): BalanceSheetReport {
  const periodDate = new Date(params.periodDate);

  return {
    companyName: params.companyName,
    reportTitle: 'LAPORAN KEUANGAN',
    periodLabel: formatAccountingMonthYear(periodDate),
    assets: {
      label: 'AKTIVA',
      sections: [
        {
          title: 'Aktiva Lancar',
          rows: [
            { label: 'Kas dan Setara Kas', bold: true },
            { label: 'Cash in Hand', value: 23_600_000, indent: 1 },
            { label: 'Bank BCA IDR', value: 57_867_500, indent: 1 },
            { label: 'Bank BCA USD', value: 0, indent: 1 },
            { label: 'Piutang', bold: true },
            { label: 'Piutang Dagang', value: 0, indent: 1 },
            { label: 'Piutang Direksi', value: 0, indent: 1 },
            { label: 'Piutang Pemegang Saham', value: 0, indent: 1 },
            { label: 'Piutang Lain-lain', value: 0, indent: 1 },
            { label: 'Persediaan Barang Dagang', bold: true },
            { label: 'Persediaan Motor Yamaha', value: 0, indent: 1 },
            { label: 'Persediaan Motor Honda', value: 33_333_333, indent: 1 },
            { label: 'Persediaan Spareparts', value: 0, indent: 1 },
            { label: 'Biaya Dibayar di Muka dan Lain-lain', bold: true },
            { label: 'Sewa Gedung Dibayar di Muka', value: 0, indent: 1 },
            { label: 'Uang Muka PPh 23', value: 0, indent: 1 },
            { label: 'Uang Muka PPh 25', value: 0, indent: 1 },
            { label: 'PPN Masukan', value: 8_918_919, indent: 1 },
            { label: 'Uang Muka Pembelian Yamaha', value: 0, indent: 1 },
            { label: 'Uang Muka Pembelian Honda', value: 0, indent: 1 },
            { label: 'Uang Muka Pembelian Vespa', value: 0, indent: 1 },
            { label: 'PPN Masukan Belum Terbit', value: 0, indent: 1 },
          ],
          totalLabel: 'Jumlah Aktiva Lancar',
          totalValue: 123_719_752,
        },
        {
          title: 'Aktiva Tetap',
          rows: [
            { label: 'Inventaris Kantor', value: 14_000_000 },
            { label: 'Kendaraan', value: 0 },
            { label: 'Bangunan', value: 0 },
            { label: 'Tanah', value: 0 },
            { label: 'Akumulasi Penyusutan Inventaris Kantor', value: -291_667 },
            { label: 'Akumulasi Penyusutan Kendaraan', value: 0 },
            { label: 'Akumulasi Penyusutan Bangunan', value: 0 },
          ],
          totalLabel: 'Jumlah Aktiva Tetap',
          totalValue: 13_708_333,
        },
      ],
      totalLabel: 'JUMLAH AKTIVA',
      totalValue: 137_428_085,
    },
    liabilities: {
      label: 'PASIVA',
      sections: [
        {
          title: 'Kewajiban',
          rows: [
            { label: 'Hutang Atas Usaha', bold: true },
            { label: 'Hutang Dagang', value: null, indent: 1 },
            { label: 'Hutang Pendanaan', value: null, indent: 1 },
            { label: 'Hutang Direksi', value: 30_000_000, indent: 1 },
            { label: 'Hutang Pajak', bold: true },
            { label: 'PPH 21', value: null, indent: 1 },
            { label: 'PPH 23', value: null, indent: 1 },
            { label: 'PPH 25', value: null, indent: 1 },
            { label: 'PPH 29 (BADAN)', value: null, indent: 1 },
            { label: 'PPH KELUARAN', value: 6_045_045, indent: 1 },
            { label: 'PPH FINAL', value: null, indent: 1 },
            { label: 'HUTANG PPN', value: null, indent: 1 },
          ],
          totalLabel: 'Jumlah Kewajiban',
          totalValue: 36_045_045,
        },
        {
          title: 'Ekuitas',
          rows: [
            { label: 'MODAL DISETOR', value: 100_000_000 },
            { label: 'LABA (RUGI) DITAHAN PERIODE SEBELUMNYA', value: 1_383_040 },
            { label: 'LABA (RUGI) TAHUN BERJALAN', value: 0 },
          ],
          totalLabel: 'Jumlah Ekuitas',
          totalValue: 101_383_040,
        },
      ],
      totalLabel: 'TOTAL PASIVA',
      totalValue: 137_428_085,
    },
    placeAndDate: `YOGYAKARTA, ${formatAccountingLongDate(periodDate)}`,
    directorName: 'ZAIFUDIN YUKHRI',
    directorTitle: 'Direktur',
  };
}

export function getDummyMonthlyVatInputReport(params: AccountingReportParams): MonthlyVatReport {
  const periodDate = new Date(params.periodDate);
  const rows = buildMonthlyVatRows('UTAMA MOTOR ABADI');

  return {
    companyName: params.companyName,
    reportTitle: 'REKAPITULASI PENGHITUNGAN PAJAK PERTAMBAHAN NILAI (PPN) MASUKAN',
    periodLabel: `BULAN ${formatAccountingMonthYear(periodDate).toUpperCase()}`,
    rows,
    totals: rows.reduce(
      (accumulator, item) => ({
        purchasePrice: accumulator.purchasePrice + item.purchasePrice,
        fee: accumulator.fee + item.fee,
        unitPrice: accumulator.unitPrice + item.unitPrice,
        dpp: accumulator.dpp + item.dpp,
        vat: accumulator.vat + item.vat,
      }),
      { purchasePrice: 0, fee: 0, unitPrice: 0, dpp: 0, vat: 0 },
    ),
  };
}

export function getDummyMonthlyVatOutputReport(params: AccountingReportParams): MonthlyVatReport {
  const periodDate = new Date(params.periodDate);
  const rows = buildMonthlyVatRows('UTAMA MOTOR ABADI');

  return {
    companyName: params.companyName,
    reportTitle: 'REKAPITULASI PENGHITUNGAN PAJAK PERTAMBAHAN NILAI (PPN) KELUARAN',
    periodLabel: `BULAN ${formatAccountingMonthYear(periodDate).toUpperCase()}`,
    rows,
    totals: rows.reduce(
      (accumulator, item) => ({
        purchasePrice: accumulator.purchasePrice + item.purchasePrice,
        fee: accumulator.fee + item.fee,
        unitPrice: accumulator.unitPrice + item.unitPrice,
        dpp: accumulator.dpp + item.dpp,
        vat: accumulator.vat + item.vat,
      }),
      { purchasePrice: 0, fee: 0, unitPrice: 0, dpp: 0, vat: 0 },
    ),
  };
}

export function getDummyYearlyVatReport(params: AccountingReportParams): YearlyVatReport {
  const periodDate = new Date(params.periodDate);
  const rows = buildYearlyVatRows();

  return {
    companyName: params.companyName,
    reportTitle: 'REKAPITULASI PENGHITUNGAN PAJAK',
    periodLabel: formatAccountingYear(periodDate),
    rows,
    totals: rows.reduce(
      (accumulator, item) => ({
        inputPurchasePrice: accumulator.inputPurchasePrice + item.inputPurchasePrice,
        inputDpp: accumulator.inputDpp + item.inputDpp,
        inputVat: accumulator.inputVat + item.inputVat,
        outputSalesPrice: accumulator.outputSalesPrice + item.outputSalesPrice,
        outputDpp: accumulator.outputDpp + item.outputDpp,
        outputVat: accumulator.outputVat + item.outputVat,
        saldoPpn: accumulator.saldoPpn + item.saldoPpn,
      }),
      {
        inputPurchasePrice: 0,
        inputDpp: 0,
        inputVat: 0,
        outputSalesPrice: 0,
        outputDpp: 0,
        outputVat: 0,
        saldoPpn: 0,
      },
    ),
  };
}
