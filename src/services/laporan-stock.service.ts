import { FilterLaporanStock } from "@/types/laporan-stock.types"

// TODO: Replace with actual API call
export const getLaporanStock = async (
    filter: FilterLaporanStock
) => {
    // Simulasi delay jaringan
    await new Promise((resolve) => setTimeout(resolve, 800))

    if (filter.jenis === "laporan-stock") {
        return [
            { type: "Honda Vario 160", qty: 25 },
            { type: "Honda Beat Street", qty: 15 },
            { type: "Yamaha NMAX Connected", qty: 32 },
        ]
    }

    if (filter.jenis === "laporan-stock-detail") {
        return [
            { noRangka: "MH1KE1111TK001", noMesin: "KE11E10001", type: "Honda Vario 160", status: "Tersedia" },
            { noRangka: "MH1KE2222TK002", noMesin: "KE22E20002", type: "Honda Beat Street", status: "Tersedia" },
            { noRangka: "MH1KE3333TK003", noMesin: "KE33E30003", type: "Yamaha NMAX Connected", status: "Tersedia" },
        ]
    }

    if (filter.jenis === "po-outstanding") {
        return [
            { noPo: "PO-2026-001", supplier: "PT Astra Honda Motor", totalType: 5, totalQty: 50, estimatedArrival: "2026-03-05" },
            { noPo: "PO-2026-002", supplier: "PT Yamaha Indonesia Motor Mfg", totalType: 3, totalQty: 30, estimatedArrival: "2026-03-10" },
        ]
    }

    if (filter.jenis === "so-outstanding") {
        return [
            { noSo: "SO-2026-001", customer: "Budi Santoso", totalType: 1, totalQty: 1, estimatedDelivery: "2026-03-01" },
            { noSo: "SO-2026-002", customer: "Siti Aminah", totalType: 1, totalQty: 2, estimatedDelivery: "2026-03-02" },
        ]
    }

    return []
}
