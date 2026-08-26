import { KasHarian } from "@/types/kas-harian.types"

let kasHarianDB: KasHarian[] = [
    {
        id: 1,
        uuid: 'mock-kas-harian-1',
        company_id: 1,
        cash_id: 1,
        date: "2026-12-31",
        code: "TRX-011",
        note: "Terima tagihan John Doe",
        debet: 0,
        credit: 99000000,
        company: { id: 1, name: "PT Wajira" },
        cash: { id: 1, code: 'cash_usd', description: 'BCA USD', type: 'bank' }
    },
]

export const kasHarianService = {
    getAll(companyId: string) {
        return Promise.resolve(
            kasHarianDB.filter(d => d.company?.id === Number(companyId))
        )
    },

    create(data: any) {
        const newItem: KasHarian = {
            id: Math.floor(Math.random() * 10000),
            uuid: `mock-kas-harian-${Math.floor(Math.random() * 10000)}`,
            company_id: 1,
            cash_id: 1,
            code: "TRX-" + Math.floor(Math.random() * 10000),
            debet: data.type === "debit" ? data.nominal : 0,
            credit: data.type === "kredit" ? data.nominal : 0,
            date: data.tanggal,
            note: data.keterangan,
            company: { id: 1, name: "PT Wajira" },
            cash: { id: 1, code: 'cash_idr', description: data.akun || 'Kas IDR', type: 'cash' }
        }

        kasHarianDB = [newItem, ...kasHarianDB]
        return Promise.resolve(newItem)
    },

    update(id: number, data: any) {
        kasHarianDB = kasHarianDB.map(item =>
            item.id === id
                ? {
                    ...item,
                    debet: data.type === "debit" ? data.nominal : 0,
                    credit: data.type === "kredit" ? data.nominal : 0,
                    date: data.tanggal,
                    note: data.keterangan,
                    cash: { id: 1, code: 'cash_idr', description: data.akun || 'Kas IDR', type: 'cash' },
                }
                : item
        )
        return Promise.resolve()
    },

    delete(id: number) {
        kasHarianDB = kasHarianDB.filter(item => item.id !== id)
        return Promise.resolve()
    },
}
