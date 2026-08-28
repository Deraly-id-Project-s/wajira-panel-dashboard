'use client';

import { DataImportModal } from '@/components/features/master-data/DataImportModal';
import { useImportAccountGroup } from '@/hooks/useAccountGroup';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AccountGroupImportModal({ open, onOpenChange }: Props) {
    const mutation = useImportAccountGroup();
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
            entityName="Grup Akun"
            title="Import Data Grup Akun"
            description="Unggah file .xlsx untuk mengimport data grup akun."
            onImport={handleImport}
            isPending={mutation.isPending}
            templateUrl="https://docs.google.com/spreadsheets/d/1wQmTkJSGyt7vb6DA21TdHyYiDD3tLqlXxUwQA88Qb1M/edit?usp=sharing"
            exampleData={{
                headers: ['Kode Grup', 'Deskripsi'],
                row: ['GRP-001', 'Deskripsi Grup Akun']
            }}
        />
    );
}
