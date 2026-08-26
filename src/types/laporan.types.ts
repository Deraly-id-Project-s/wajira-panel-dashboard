export type JenisLaporan =
    | "rugi-laba"
    | "neraca"
    | "ppn-masukan-bulanan"
    | "ppn-keluaran-bulanan"
    | "ppn-pertahun"

export interface FilterLaporan {
    jenis: JenisLaporan
    bulan: string
    tahun: string
}