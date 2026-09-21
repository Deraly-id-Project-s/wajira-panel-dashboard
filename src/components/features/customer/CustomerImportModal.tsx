'use client';

import { DataImportModal } from '@/components/features/master-data/DataImportModal';
import { useImportCustomer } from '@/hooks/useCustomer';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CustomerImportModal({ open, onOpenChange }: Props) {
    const mutation = useImportCustomer();
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
            entityName="Customer"
            title="Import Data Customer"
            description="Unggah file .xlsx untuk mengimport data customer."
            onImport={handleImport}
            isPending={mutation.isPending}
            templateUrl="https://docs.google.com/spreadsheets/d/1wQmTkJSGyt7vb6DA21TdHyYiDD3tLqlXxUwQA88Qb1M/edit?usp=sharing"
            exampleData={{
                headers: ['Kode', 'Nama Customer', 'Alamat', 'Phone', 'NPWP', 'PIC', 'Maps'],
                row: ['CUS-001', 'PT Customer', 'Jl. Contoh No 123', '08123456789', '12.345.678.9-000.000', 'Budi', 'https://maps...']
            }}
        />
    );
}
