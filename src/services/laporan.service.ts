import { FilterLaporan } from "@/types/laporan.types"

export const getLaporanData = async (
    filter: FilterLaporan
) => {

    if (filter.jenis === "rugi-laba") {
        return {
            pendapatan: 13200231000,
            hpp: 73015000,
            labaKotor: 13200231000,
            biayaOperasional: 1200231000,
            labaBersih: 3000000000,
        }
    }

    if (filter.jenis === "neraca") {
        return {
            totalAktiva: 11200231000,
            totalPasiva: 11200231000,
        }
    }

    return {}
}