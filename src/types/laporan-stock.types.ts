export type JenisLaporanStock =
    | "laporan-stock"
    | "laporan-stock-detail"
    | "po-outstanding"
    | "so-outstanding"

export interface FilterLaporanStock {
    jenis: JenisLaporanStock
    periodeAwal: string
    periodeAkhir: string
}
