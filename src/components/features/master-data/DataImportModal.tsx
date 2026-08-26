'use client';

import { useEffect, useState } from 'react';
import { FormDialog } from '@/components/ui/form-dialog';
import { toast } from 'sonner';
import { CheckCircle2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    onImport: (file: File) => Promise<void>;
    isPending: boolean;
    templateUrl?: string;
    accept?: string;
}

export function DataImportModal({ open, onOpenChange, title, description, onImport, isPending, templateUrl, accept = '.xlsx, .xls' }: Props) {
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
            title={title}
            description={description}
            onSubmit={handleImport}
            submitLabel="Import"
            isSubmitting={isPending}
            maxWidthClassName="max-w-md"
        >
            <label className={cn(
                "block cursor-pointer rounded-lg border border-dashed px-4 py-8 text-center text-sm transition-all duration-200",
                file
                    ? "border-emerald-300 bg-emerald-50/50 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50"
                    : "border-slate-300 bg-slate-50 text-slate-600 hover:border-slate-400 hover:bg-slate-100"
            )}>
                {file ? (
                    <>
                        <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500 animate-in zoom-in duration-200" />
                        <span className="block font-semibold text-emerald-700">{file.name}</span>
                        <span className="mt-1 block text-xs text-emerald-600">File siap diimport!</span>
                    </>
                ) : (
                    <>
                        <Upload className="mx-auto mb-2 h-8 w-8 text-slate-400" />
                        <span className="block font-medium">Pilih file import</span>
                        <span className="mt-1 block text-xs text-slate-500">Klik atau seret file ke sini</span>
                    </>
                )}
                <input autoComplete="off"
                    type="file"
                    accept={accept}
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                    className="hidden"
                />
            </label>

            {templateUrl && (
                <span className="text-xs text-muted-foreground">
                    Berikut adalah <a href={templateUrl} className="text-blue-600 underline cursor-pointer" target="_blank" rel="noopener noreferrer">template import file</a>
                </span>
            )}
        </FormDialog>
    );
}
