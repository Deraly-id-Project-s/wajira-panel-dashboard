export interface Hutang {
    id: string
    noPembelian: string
    tanggal: string
    namaSupplier: string
    totalBeli: number
    totalBayar: number
    amountHutang: number
}

export interface HutangPayment {
    id: string
    hutangId: string
    kodeBayar: string
    tanggal: string
    kasKeluar: number
    jumlahBayar: number
}
