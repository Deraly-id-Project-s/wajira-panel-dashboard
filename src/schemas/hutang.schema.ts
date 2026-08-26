import { z } from "zod"

export const bayarHutangSchema = z.object({
    tanggal: z.date({
        required_error: "Tanggal wajib diisi",
        invalid_type_error: "Tanggal tidak valid"
    }),
    akunTerkait: z.string().min(1, "Akun wajib dipilih"),
    jumlahBayar: z
        .number({ invalid_type_error: "Jumlah harus angka" })
        .min(1, "Jumlah bayar minimal 1"),
})

export type BayarHutangFormValues = z.infer<typeof bayarHutangSchema>
