'use client';

import { DataImportModal } from '@/components/features/master-data/DataImportModal';
import { useImportDealer } from '@/hooks/useDealer';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DealerImportModal({ open, onOpenChange }: Props) {
    const mutation = useImportDealer();
    const { companyId } = useCompany();

    const handleImport = async (file: File) => {
        if (!companyId) {
            toast.error('Company ID tidak ditemukan');
            return;
        }
        await mutation.mutateAsync({ companyId: String(companyId), file });
    };

    return (
        <DataImportModal
            open={open}
            onOpenChange={onOpenChange}
            entityName="Dealer"
            title="Import Data Dealer"
            description="Unggah file .xlsx untuk mengimport data dealer."
            onImport={handleImport}
            isPending={mutation.isPending}
            templateUrl="https://docs.google.com/spreadsheets/d/1wQmTkJSGyt7vb6DA21TdHyYiDD3tLqlXxUwQA88Qb1M/edit?usp=sharing"
            exampleData={{
                headers: ['Kode Dealer', 'Nama Dealer', 'Alamat', 'PIC', 'Phone'],
                row: ['DLR-001', 'Dealer Pusat', 'Jl. Contoh', 'Budi', '08123456789']
            }}
        />
    );
}
