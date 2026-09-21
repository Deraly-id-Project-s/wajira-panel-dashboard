import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
    bayarHutangSchema,
    BayarHutangFormValues,
} from "@/scheme/hutang.schema"
import { useBayarHutang } from "@/hooks/useHutang"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { MoneyInput } from "@/components/ui/money-input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { DatePicker } from "@/components/ui/date-picker"
import { format } from "date-fns"

interface Props {
    open: boolean
    onClose: () => void
    hutangId: string
}

export default function BayarHutangDialog({
    open,
    onClose,
    hutangId,
}: Props) {
    const form = useForm<BayarHutangFormValues>({
        resolver: zodResolver(bayarHutangSchema),
        defaultValues: {
            tanggal: new Date(),
            akunTerkait: "",
            jumlahBayar: 0,
        }
    })

    const mutation = useBayarHutang()

    const onSubmit = (values: BayarHutangFormValues) => {
        const formattedDate = format(values.tanggal, "dd/MM/yyyy")

        mutation.mutate(
            {
                hutangId,
                data: {
                    kodeBayar: "AUTO-CODE",
                    tanggal: formattedDate,
                    kasKeluar: values.jumlahBayar,
                    jumlahBayar: values.jumlahBayar,
                },
            },
            {
                onSuccess: () => {
                    toast.success("Pembayaran berhasil")
                    form.reset()
                    onClose()
                },
                onError: () => {
                    toast.error("Gagal melakukan pembayaran")
                }
            }
        )
    }

    const handleClose = () => {
        form.reset()
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Bayar Hutang</DialogTitle>
                    <p className="text-sm text-gray-500">
                        Masukkan detail pembayaran hutang
                    </p>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                        <FormItem>
                            <FormLabel>Kode Bayar</FormLabel>
                            <FormControl>
                                <Input
                                    value="Auto Generated Code"
                                    disabled
                                    className="bg-gray-50 text-gray-500"
                                />
                            </FormControl>
                        </FormItem>

                        <FormField
                            control={form.control}
                            name="tanggal"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tanggal</FormLabel>
                                    <FormControl>
                                        <DatePicker
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="Pilih Tanggal"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="akunTerkait"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Akun Terkait</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Pilih Akun" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="BCA">BCA (12345678)</SelectItem>
                                            <SelectItem value="MANDIRI">MANDIRI (87654321)</SelectItem>
                                            <SelectItem value="KAS">KAS BESAR</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="jumlahBayar"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Jumlah Bayar</FormLabel>
                                    <FormControl>
                                        <MoneyInput
                                            placeholder="Tambahkan nominal"
                                            {...field}
                                            value={field.value || 0}
                                            onChangeValue={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex flex-col gap-3 mt-6 pt-4">
                            <Button
                                type="submit"
                                className="w-full bg-[#1e293b] hover:bg-[#0f172a] text-white"
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending ? "Menyimpan..." : "Simpan"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={handleClose}
                            >
                                Batal
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
