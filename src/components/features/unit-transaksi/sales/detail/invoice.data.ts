import { InvoiceDetail } from "./invoice.types"


/**
 * Mock data untuk Invoice Detail
 * 15 items untuk testing pagination
 */
export const INVOICE_DETAIL: InvoiceDetail = {
    info: {
        invoiceNumber: "INV-WAJ/20260128-0021",
        date: "28/01/2026",
        customer: "ADHITYA AGRA DHASTA",
    },
    payment: {
        totalDpp: 381857850,
        totalPpn: 41996185,
        totalPenjualan: 423800000,
    },
    status: {
        totalHarga: 423800000,
        totalBayar: 41996185,
        kurangBayar: 381803815,
        percentagePaid: 9,
    },
    items: Array.from({ length: 15 }, (_, i) => ({
        id: String(i + 1),
        unitType: `Honda/ADV 160 ABS ${i % 3 === 0 ? 'Premium' : i % 2 === 0 ? 'Standard' : 'Deluxe'}`,
        qty: 1,
        hargaJual: 35400000 + (i * 100000),
        biayaBbn: 0,
        biayaEkspedisi: 0,
        biayaLain: 0,
        hpp: 31891892,
        dpp: 31891892,
        ppn: 3508108,
        jumlah: 212400000,
    })),
}
