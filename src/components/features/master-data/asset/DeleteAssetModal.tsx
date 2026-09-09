import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DeleteAssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isDeleting?: boolean;
}

export function DeleteAssetModal({ isOpen, onClose, onConfirm, isDeleting = false }: DeleteAssetModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Hapus Data Ini?</DialogTitle>
                    <DialogDescription className="pt-2 text-base text-gray-500">
                        Apa anda yakin ingin menghapus data ini?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="pt-4 flex sm:justify-end gap-2">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={onClose}
                        disabled={isDeleting}
                        className="w-full sm:w-auto"
                    >
                        Batal
                    </Button>
                    <Button 
                        type="button" 
                        variant="destructive" 
                        className="w-full sm:w-auto bg-[#e53e3e] hover:bg-[#c53030]" 
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
