'use client';

import { useEffect, useState } from 'react';
import { FormDialog } from '@/components/ui/form-dialog';
import { toast } from 'sonner';
import { CheckCircle2, Upload, FileSpreadsheet, Download, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entityName?: string;
    title?: string;
    description?: string;
    onImport: (file: File) => Promise<void>;
    isPending: boolean;
    templateUrl?: string;
    accept?: string;
    exampleData?: {
        headers: string[];
        row: React.ReactNode[];
    };
    guideNotes?: React.ReactNode;
}

export function DataImportModal({ open, onOpenChange, entityName = 'Data', title, description, onImport, isPending, templateUrl, accept = '.xlsx, .xls', exampleData, guideNotes }: Props) {
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (!open) {
            setFile(null);
        }
    }, [open]);

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error('Pilih file terlebih dahulu');
            return;
        }

        try {
            await onImport(file);
            toast.success('Data berhasil diimport');
        } catch (error: any) {
            toast.error(error?.message || 'Terjadi kesalahan saat mengimport data');
        } finally {
            onOpenChange(false);
            setFile(null);
        }
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={title || `Import Data ${entityName}`}
            description={description || `Unggah file ${accept.replace(/\./g, '')} untuk mengimport data ${entityName.toLowerCase()}.`}
            onSubmit={handleImport}
            submitLabel="Import"
            isSubmitting={isPending}
            maxWidthClassName={exampleData ? "max-w-2xl" : "max-w-md"}
        >
            <div className="space-y-6">
                {exampleData && (
                    <div className="rounded-md bg-blue-50 p-4">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">Panduan Struktur File CSV</h4>
                        <p className="text-xs text-blue-700 mb-3">
                            File excel/CSV anda wajib memiliki header (baris pertama) seperti di bawah ini:
                        </p>
                        <div className="rounded-md border bg-white overflow-x-auto">
                            <Table className="text-xs">
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        {exampleData.headers.map((header, idx) => (
                                            <TableHead key={idx} className="h-8 py-1 whitespace-nowrap">{header}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        {exampleData.row.map((cell, idx) => (
                                            <TableCell key={idx} className="py-1 whitespace-nowrap">{cell}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                        {guideNotes && (
                            <p className="text-[10px] text-blue-600 mt-2 font-medium">
                                {guideNotes}
                            </p>
                        )}
                    </div>
                )}

                <label className={cn(
                    "group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-300",
                    file
                        ? "border-emerald-400 bg-emerald-50 hover:bg-emerald-100/50"
                        : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50"
                )}>
                    {file ? (
                        <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                            </div>
                            <span className="text-sm font-semibold text-slate-900">{file.name}</span>
                            <span className="mt-1 text-xs text-emerald-600 font-medium">File siap diproses!</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 group-hover:bg-indigo-100 group-hover:ring-indigo-200 transition-all duration-300">
                                <Upload className="h-6 w-6 text-slate-400 group-hover:text-indigo-600 transition-colors duration-300" />
                            </div>
                            <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">Klik untuk mengunggah file</span>
                            <span className="mt-1.5 text-xs text-slate-500">Mendukung format {accept.replace(/\./g, '').toUpperCase()}</span>
                        </div>
                    )}
                    <input autoComplete="off"
                        type="file"
                        accept={accept}
                        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                        className="hidden"
                    />
                </label>

                {templateUrl && (
                    <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 transition-colors hover:bg-indigo-50">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                                <FileSpreadsheet className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Butuh template data?</p>
                                <p className="text-xs text-slate-500">Gunakan format ini agar import berhasil.</p>
                            </div>
                        </div>
                        <a 
                            href={templateUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-white px-3 text-sm font-medium text-indigo-600 shadow-sm border border-slate-200 hover:bg-slate-50 hover:text-indigo-700 transition-colors"
                        >
                            <Download className="mr-2 h-4 w-4" /> Download
                        </a>
                    </div>
                )}
            </div>
        </FormDialog>
    );
}
