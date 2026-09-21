import React from 'react';
import { DataImportModal } from '@/components/features/master-data/DataImportModal';
import { useImportRegion } from '@/hooks/useRegion';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ImportRegionModal({ open, onOpenChange }: Props) {
    const mutation = useImportRegion();

    const handleImport = async (file: File) => {
        await mutation.mutateAsync({ file });
    };

    return (
        <DataImportModal
            open={open}
            onOpenChange={onOpenChange}
            entityName="Wilayah"
            title="Import Data Wilayah"
            description="Unggah file CSV dengan struktur kolom yang sesuai untuk mengimpor data wilayah."
            onImport={handleImport}
            isPending={mutation.isPending}
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            exampleData={{
                headers: ['kode', 'nama'],
                rows: [
                    ['BDG', 'KAB. BANDUNG'],
                    ['BDGB', 'KAB. BANDUNG BARAT']
                ]
            }}
        />
    );
}