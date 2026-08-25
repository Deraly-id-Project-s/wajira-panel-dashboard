/**
 * Sales Data Types - EXACT dari Figma
 */
export interface UnitItem {
  id: string;
  color: string;
  engineNumber: string;
  chassisNumber: string;
}

export interface SalesLineItem {
  id: string;
  tipeUnit: string;
  qty: number;
  hargaJual: number;
  biayaBbn: number;
  biayaEkspedisi: number;
  dppTaxVersionId: string;
  ppnTaxVersionId: string;
  biayaLain: number;
  hpp: number;
  dpp: number;
  ppn: number;
  jumlah: number;
  price_usd?: number;
  price_per_unit_usd?: number;
}

export interface SalesItem {
  id: string;
  kodeJual: string;
  tanggal: string;
  customer: string;
  stockState?: string;
  isRefunded?: boolean;
  warehouse?: string;
  tipeUnit: string;
  hargaSatuan: number;
  qty: number;
  biayaBbn: number;
  biayaEkspedisi: number;
  dppTaxVersionId: string;
  ppnTaxVersionId: string;
  biayaLain: number;
  totalHpp: number;
  totalDpp: number;
  totalPpn: number;
  totalBiaya: number;
  totalJual: number;
  kurangBayar: number;
  totalBayar: number;
  lineItems: SalesLineItem[];
  units: UnitItem[];
  price_usd?: number;
  price_per_unit_usd?: number;
  documentTemplateId?: string | null;
}

/**
 * Generate mock customer names
 */
const CUSTOMERS = ['ADHITYA AGRA DHASTA', 'BUDI SANTOSO', 'CITRA DEWI LESTARI', 'DIAN PRATAMA', 'EKO WIJAYA'];

/**
 * Generate random date in January 2026
 */
function generateDate(day: number): string {
  return `${String(day).padStart(2, '0')}/01/2026`;
}

/**
 * Generate random invoice number
 */
function generateInvoice(num: number): string {
  const paddedNum = String(num).padStart(4, '0');
  return `INV-WAJ-2207/162-${paddedNum}`;
}

/**
 * Mock Data - 50 records untuk pagination
 */
export const SALES_DATA: SalesItem[] = Array.from({ length: 50 }, (_, i) => {
  const qty = Math.floor(Math.random() * 5) + 1;
  const hargaSatuan = 25000000 + i * 100000;

  const totalDpp = hargaSatuan * qty;
  const totalPpn = Math.floor(totalDpp * 0.11);
  const totalHpp = totalDpp; // Mock HPP same as DPP for simplicity

  const biayaBbn = 1500000 * qty;
  const biayaEkspedisi = 500000 * qty;
  const biayaLain = 0;
  const totalBiaya = biayaBbn + biayaEkspedisi + biayaLain;

  const totalJual = totalDpp + totalPpn + totalBiaya;
  const totalBayar = Math.floor(totalJual * 0.09);

  const lineItems: SalesLineItem[] = Array.from({ length: Math.min(3, qty) }, (_, idx) => {
    const rowQty = 1;
    const rowHpp = Math.floor(totalHpp / qty);
    const rowDpp = Math.floor(totalDpp / qty);
    const rowPpn = Math.floor(totalPpn / qty);
    const rowJumlah = rowHpp + rowPpn + Math.floor(totalBiaya / qty);

    return {
      id: `${i + 1}-${idx + 1}`,
      tipeUnit: idx % 2 === 0 ? 'Honda/ADV 160 ABS' : 'Honda/ADV 160 CBS',
      qty: rowQty,
      hargaJual: hargaSatuan,
      biayaBbn: Math.floor(biayaBbn / qty),
      biayaEkspedisi: Math.floor(biayaEkspedisi / qty),
      biayaLain,
      dppTaxVersionId: '1',
      ppnTaxVersionId: '1',
      hpp: rowHpp,
      dpp: rowDpp,
      ppn: rowPpn,
      jumlah: rowJumlah,
    };
  });

    return {
      id: String(i + 1),
      kodeJual: generateInvoice(i + 1),
      tanggal: generateDate((i % 28) + 1),
      customer: CUSTOMERS[i % CUSTOMERS.length],
      tipeUnit: 'Honda PCX 160 ABS',
      hargaSatuan,
      qty,
      biayaBbn,
      biayaEkspedisi,
      biayaLain,
      dppTaxVersionId: '1',
      ppnTaxVersionId: '1',
      totalHpp,
    totalDpp,
    totalPpn,
    totalBiaya,
    totalJual,
    totalBayar,
    kurangBayar: totalJual - totalBayar,
    lineItems,
    units: Array.from({ length: qty }, (_, j) => ({
      id: `${i}-${j}`,
      color: ['HITAM', 'PUTIH', 'MERAH'][j % 3],
      engineNumber: `KFC${1234 + i + j}`,
      chassisNumber: `MCD${5678 + i + j}`,
    })),
  };
});
