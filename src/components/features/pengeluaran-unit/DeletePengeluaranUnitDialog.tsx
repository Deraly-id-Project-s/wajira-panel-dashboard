"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
}

export default function DeletePengeluaranUnitDialog({
    open,
    onOpenChange,
    onConfirm,
    title = "Hapus Data Ini?",
    description = "Apa anda yakin ingin menghapus data ini?",
}: Props) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-[420px] rounded-md p-6 gap-6">
                <AlertDialogHeader className="text-left space-y-3">
                    <AlertDialogTitle className="text-xl font-bold text-gray-900">{title}</AlertDialogTitle>
                    <AlertDialogDescription className="text-[15px] text-gray-500 font-normal">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row justify-end gap-3 sm:gap-3 sm:space-x-0">
                    <AlertDialogCancel className="mt-0 h-10 px-6 rounded-md font-medium border-gray-200 text-gray-900 hover:bg-gray-50">Batal</AlertDialogCancel>
                    <AlertDialogAction className="h-10 px-6 rounded-md font-medium bg-[#DC2626] text-white hover:bg-red-700" onClick={onConfirm}>
                        Hapus
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}