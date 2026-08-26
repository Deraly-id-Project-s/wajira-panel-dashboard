export interface Piutang {
    id: string
    noPenjualan: string
    tanggal: string
    namaCustomer: string
    totalJual: number
    totalBayar: number
    amountPiutang: number
}

export interface PiutangPayment {
    id: string
    kodeBayar: string
    tanggal: string
    kasMasuk: string
    jumlahBayar: number
}
