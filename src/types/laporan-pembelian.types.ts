export type JenisLaporanPembelian =
    | "per-nota"
    | "per-type"
    | "per-supplier"

export interface FilterLaporanPembelian {
    jenis: JenisLaporanPembelian
    periodeAwal: string
    periodeAkhir: string
}