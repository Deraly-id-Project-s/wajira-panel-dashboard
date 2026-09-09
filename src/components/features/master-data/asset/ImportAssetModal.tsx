import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ImportAssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (file: File) => void;
    isUploading?: boolean;
}

export function ImportAssetModal({ isOpen, onClose, onImport, isUploading = false }: ImportAssetModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleImport = () => {
        if (selectedFile) {
            onImport(selectedFile);
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Import Data Aset</DialogTitle>
                    <DialogDescription>
                        Unggah file CSV dengan struktur kolom yang sesuai untuk mengimpor data aset.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    <div className="rounded-md bg-blue-50 p-4">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">Panduan Struktur File CSV</h4>
                        <p className="text-xs text-blue-700 mb-3">
                            File excel/CSV anda wajib memiliki header (baris pertama) seperti di bawah ini:
                        </p>
                        <div className="rounded-md border bg-white overflow-x-auto">
        <Table className="text-xs">
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead className="h-8 py-1">name</TableHead>
                                        <TableHead className="h-8 py-1">code</TableHead>
                                        <TableHead className="h-8 py-1">purchase_date</TableHead>
                                        <TableHead className="h-8 py-1">type</TableHead>
                                        <TableHead className="h-8 py-1">price</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="py-1">Meja</TableCell>
                                        <TableCell className="py-1">MJ001</TableCell>
                                        <TableCell className="py-1">2026-01-01</TableCell>
                                        <TableCell className="py-1">inventory</TableCell>
                                        <TableCell className="py-1">50000</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                        <p className="text-[10px] text-blue-600 mt-2 font-medium">
                            * Tipe valid: inventory, vehicles, buildings, land
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="file-upload">Pilih File CSV/Excel</Label>
                        <Input
                            id="file-upload"
                            type="file"
                            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                    </div>

                    <div className="flex flex-col space-y-2 pt-4">
                        <Button onClick={handleImport} disabled={!selectedFile || isUploading} variant="outline" className="w-full sm:w-auto">
                            {isUploading ? 'Mengunggah...' : 'Import Data'}
                        </Button>
                        <Button 
                            type="button" 
                            variant="outline" 
                            className="w-full" 
                            onClick={handleClose}
                            disabled={isUploading}
                        >
                            Batal
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
