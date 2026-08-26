import { z } from "zod"

export const createSupplierSchema = z.object({
    name: z.string().min(1, "Nama supplier wajib diisi"),
    // address: z.string().min(1, 'Alamat wajib diisi'),
    address: z.string().optional(),
    // npwp: z.string().min(1, 'NPWP wajib diisi'),
    npwp: z.string().optional().refine(
        (val) => !val || /^[0-9]{15,16}$/.test(val),
        { message: "NPWP harus berupa 15 atau 16 digit angka" }
    ),
    pic: z.string().optional(),
    // phone: z.string().min(1, 'Nomer telepon wajib diisi'),
    phone: z.string().optional().refine(
        (val) => !val || /^\+?[0-9]*$/.test(val),
        { message: "Nomor telepon hanya boleh berisi angka dan simbol '+' di awal" }
    ),
})

export const updateSupplierSchema = z.object({
    name: z.string().min(1, "Nama supplier wajib diisi"),
    // address: z.string().min(1, 'Alamat wajib diisi'),
    address: z.string().optional(),
    // npwp: z.string().min(1, 'NPWP wajib diisi'),
    npwp: z.string().optional().refine(
        (val) => !val || /^[0-9]{15,16}$/.test(val),
        { message: "NPWP harus berupa 15 atau 16 digit angka" }
    ),
    pic: z.string().optional(),
    // phone: z.string().min(1, 'Nomer telepon wajib diisi'),
    phone: z.string().optional().refine(
        (val) => !val || /^\+?[0-9]*$/.test(val),
        { message: "Nomor telepon hanya boleh berisi angka dan simbol '+' di awal" }
    ),
})

export type CreateSupplierFormValues = z.infer<typeof createSupplierSchema>
export type UpdateSupplierFormValues = z.infer<typeof updateSupplierSchema>
