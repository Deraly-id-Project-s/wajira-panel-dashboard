import { z } from "zod"

export const terimaPiutangSchema = z.object({
    tanggal: z.date({
        required_error: "Tanggal wajib diisi",
        invalid_type_error: "Tanggal tidak valid",
    }),
    kasMasuk: z.string().min(1, "Kas masuk wajib dipilih"),
    jumlahTerima: z
        .number({ invalid_type_error: "Jumlah harus angka" })
        .min(1, "Jumlah terima minimal 1"),
})

export type TerimaPiutangFormValues = z.infer<typeof terimaPiutangSchema>
