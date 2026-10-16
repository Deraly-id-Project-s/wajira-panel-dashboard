import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DeleteRouteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    routeName?: string | null;
    isDeleting?: boolean;
}

export function DeleteRouteModal({
    isOpen,
    onClose,
    onConfirm,
    routeName,
    isDeleting = false,
}: DeleteRouteModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">Hapus Data Rute?</DialogTitle>
                    <DialogDescription className="text-base pt-2">
                        {routeName ? (
                            <>
                                Apakah Anda yakin ingin menghapus rute <strong>&quot;{routeName}&quot;</strong>? Tindakan ini tidak dapat dibatalkan.
                            </>
                        ) : (
                            'Apakah Anda yakin ingin menghapus data rute ini? Tindakan ini tidak dapat dibatalkan.'
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex justify-end gap-2 pt-6">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
                        Batal
                    </Button>
                    <Button
                        type="button"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={onConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Menghapus...' : 'Hapus'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
