export interface InvoiceInfo {

    invoiceNumber: string
    date: string
    customer: string
}

export interface InvoicePayment {
    totalDpp: number
    totalPpn: number
    totalPenjualan: number
}

export interface InvoiceStatus {
    totalHarga: number
    totalBayar: number
    kurangBayar: number
    percentagePaid: number
}

export interface InvoiceItem {
    id: string
    unitType: string
    qty: number
    hargaJual: number
    biayaBbn: number
    biayaEkspedisi: number
    biayaLain: number
    hpp: number
    dpp: number
    ppn: number
    jumlah: number
}

export interface InvoiceDetail {
    info: InvoiceInfo
    payment: InvoicePayment
    status: InvoiceStatus
    items: InvoiceItem[]
}
