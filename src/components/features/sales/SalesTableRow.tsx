import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import {
    TableRow,
    TableCell,
} from "@/components/ui/table"
import { ReferenceLink } from '@/components/ui/reference-link';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"
import { SalesItem } from "./sales.data"
import { currenciesFormat } from "@/components/ui/currenciesFormat"
import { Badge } from "@/components/ui/badge"
import { CopyBox } from "@/components/ui/copy-box"

interface Props {
    item: SalesItem
    isSelected: boolean
    onToggle: (id: string) => void
    onDelete?: (id: string) => Promise<void> | void
    canEdit: boolean;
    canDelete: boolean;
}

/**
 * Sales Table Row - EXACT sesuai Figma dengan checkbox state dan navigasi
 */
export function SalesTableRow({ item, isSelected, onToggle, onDelete, canEdit, canDelete }: Props) {
    const router = useRouter()
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const slugQuery = router.query.slug
    const slug = Array.isArray(slugQuery) ? slugQuery[0] : slugQuery || ""

    const handleEdit = () => {
        router.push(slug ? `/dashboard/${slug}/transaksi/penjualan-unit/edit/${item.id}` : `/transaksi/penjualan-unit/edit/${item.id}`)
    }

    const handleDetail = () => {
        router.push(slug ? `/dashboard/${slug}/transaksi/penjualan-unit/${item.id}` : `/transaksi/penjualan-unit/${item.id}`)
    }

    const handleRefund = () => {
        router.push(slug ? `/dashboard/${slug}/transaksi/penjualan-unit/${item.id}/refund` : `/transaksi/penjualan-unit/${item.id}/refund`)
    }

    const handleDelete = async () => {
        if (!onDelete) return

        setIsDeleting(true)
        try {
            await onDelete(item.id)
        } finally {
            setIsDeleting(false)
            setIsDeleteOpen(false)
        }
    }

    return (
        <TableRow className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 border-b bg-white hover:bg-slate-50 border-slate-100 transition-colors">
            {/* Kode Jual - Link biru */}
            <TableCell className="px-4 py-4 text-left text-sm font-medium">
                <CopyBox text={item.kodeJual} />
            </TableCell>

            {/* Tanggal */}
            <TableCell className="px-4 py-4 text-center text-sm text-slate-700">{item.tanggal}</TableCell>

            {/* Customer */}
            <TableCell className="px-4 py-4 text-left text-sm text-slate-700">
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <ReferenceLink href={`/dashboard/${slug}/customer?search=${item.customer}`}>
                        {item.customer || '-'}
                    </ReferenceLink>
                    {item.isRefunded ? (
                        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">Sudah Refund</Badge>
                    ) : null}
                </div>
            </TableCell>

            {/* Biaya Ekspedisi */}
            <TableCell className="px-4 py-4 text-center text-sm text-slate-700">
                {currenciesFormat('idr', item.biayaEkspedisi)}
            </TableCell>

            {/* Total Biaya */}
            <TableCell className="px-4 py-4 text-center text-sm text-slate-700">
                {currenciesFormat('idr', item.totalBiaya)}
            </TableCell>

            {/* Total DPP */}
            <TableCell className="px-4 py-4 text-center text-sm text-slate-700">
                {currenciesFormat('idr', item.totalDpp)}
            </TableCell>

            {/* Total PPN */}
            <TableCell className="px-4 py-4 text-center text-sm text-slate-700">
                {currenciesFormat('idr', item.totalPpn)}
            </TableCell>

            {/* Total Jual */}
            <TableCell className="px-4 py-4 text-center text-sm font-semibold text-slate-900">
                {currenciesFormat('idr', item.totalJual)}
            </TableCell>

            {/* Kurang Bayar - MERAH */}
            <TableCell className="px-4 py-4 text-center text-sm text-red-600 font-semibold">
                {currenciesFormat('idr', item.kurangBayar)}
            </TableCell>

            {/* Action Dropdown */}
            <TableCell className="px-4 py-4 text-center sticky right-0 bg-white z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="rounded-md p-1 hover:bg-slate-100 transition-colors duration-200 hover:scale-110 active:scale-95 transform">
                            <MoreVertical className="h-4 w-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
                        <DropdownMenuItem className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer" onClick={handleEdit} disabled={!canEdit}>
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer" onClick={handleDetail}>
                            Detail
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer" onClick={handleRefund} disabled={Boolean(item.isRefunded) || !canEdit}>
                            {item.isRefunded ? 'Sudah Refund' : 'Refund'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer" onClick={() => window.open(slug ? `/dashboard/${slug}/transaksi/penjualan-unit/print/${item.id}` : `/transaksi/penjualan-unit/print/${item.id}`, '_blank')} disabled={!canEdit}>
                            Print
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsDeleteOpen(true)} className="rounded-lg px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer" disabled={!canDelete}>
                            Hapus
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Apakah anda yakin?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Data penjualan {item.kodeJual} akan dihapus permanen.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(event) => {
                                    event.preventDefault()
                                    void handleDelete()
                                }}
                                disabled={isDeleting}
                                className="bg-red-600 text-white hover:bg-red-700"
                            >
                                {isDeleting ? 'Menghapus...' : 'Hapus'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </TableCell>
        </TableRow>
    )
}
