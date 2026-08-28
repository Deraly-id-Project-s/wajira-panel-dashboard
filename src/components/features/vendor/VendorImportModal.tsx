'use client';

import { DataImportModal } from '@/components/features/master-data/DataImportModal';
import { useImportVendor } from '@/hooks/useVendor';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function VendorImportModal({ open, onOpenChange }: Props) {
    const mutation = useImportVendor();
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
            entityName="Vendor"
            title="Import Data Vendor"
            description="Unggah file .xlsx untuk mengimport data vendor."
            onImport={handleImport}
            isPending={mutation.isPending}
            templateUrl="https://docs.google.com/spreadsheets/d/1wQmTkJSGyt7vb6DA21TdHyYiDD3tLqlXxUwQA88Qb1M/edit?usp=sharing"
            exampleData={{
                headers: ['Kode Vendor', 'Nama Vendor', 'Alamat', 'PIC', 'Phone'],
                row: ['VND-001', 'PT Vendor', 'Jl. Contoh', 'Budi', '08123456789']
            }}
        />
    );
}
