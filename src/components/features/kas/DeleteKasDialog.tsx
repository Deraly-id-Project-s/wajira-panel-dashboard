"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Kas } from "@/types/kas.types"
import { useDeleteKas } from "@/hooks/useKas"
import { toast } from "sonner"

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    kas: Kas | null
    companyId: string
}

export function DeleteKasDialog({
    open,
    onOpenChange,
    kas,
    companyId,
}: Props) {
    const mutation = useDeleteKas(companyId)
    const isLoading = mutation.isPending

    const handleDelete = async () => {
        if (!kas) return
        if (isLoading) return

        try {
            await mutation.mutateAsync(kas.id)
            toast.success("Data berhasil dihapus")
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error?.message || "Terjadi kesalahan")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Hapus Data Ini?</DialogTitle>
                    <DialogDescription>
                        Apa anda yakin ingin menghapus data ini?
                    </DialogDescription>
                </DialogHeader>

                <div className="flex justify-end gap-2 pt-4">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Batal
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isLoading}
                    >
                        {isLoading ? "Menghapus..." : "Hapus"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
