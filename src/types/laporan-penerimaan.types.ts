export type JenisLaporanPenerimaan =
    | "per-nota"
    | "per-type"
    | "per-supplier"

export interface FilterLaporanPenerimaan {
    jenis: JenisLaporanPenerimaan
    periodeAwal: string
    periodeAkhir: string
}
