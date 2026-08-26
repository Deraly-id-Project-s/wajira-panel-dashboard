export type JenisLaporanPenjualan =
    | "per-nota"
    | "per-type"
    | "per-supplier"

export interface FilterLaporanPenjualan {
    jenis: JenisLaporanPenjualan
    periodeAwal: string
    periodeAkhir: string
}