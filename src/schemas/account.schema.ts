import { z } from "zod"

export const createAccountSchema = z.object({
    code: z.string().min(1, "Kode akun wajib diisi"),
    group: z.string().min(1, "Grup akun wajib diisi"),
    description: z.string().min(1, "Deskripsi wajib diisi"),
    category: z.enum(["DEBET", "KREDIT"]),
    accountType: z.enum(["AKTIVA", "PASIVA"]),
    parentId: z.string().optional(),
    isActive: z.boolean().default(true),
})

export const updateAccountSchema = z.object({
    code: z.string().min(1, "Kode akun wajib diisi").optional(),
    group: z.string().min(1, "Grup akun wajib diisi").optional(),
    description: z.string().min(1, "Deskripsi wajib diisi").optional(),
    category: z.enum(["DEBET", "KREDIT"]).optional(),
    accountType: z.enum(["AKTIVA", "PASIVA"]).optional(),
    parentId: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
})

export type CreateAccountFormValues = z.infer<typeof createAccountSchema>
export type UpdateAccountFormValues = z.infer<typeof updateAccountSchema>
