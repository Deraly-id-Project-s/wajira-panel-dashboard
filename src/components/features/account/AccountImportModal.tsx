'use client';

import { DataImportModal } from '../master-data/DataImportModal';
import { useImportAccount } from '@/hooks/useAccount';
import { useCompany } from '@/contexts/CompanyContext';
import { getStoredCompanyId } from '@/lib/session/storage';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    companyId: string | number;
}

export function AccountImportModal({ open, onOpenChange, companyId }: Props) {
    const mutation = useImportAccount();
    const { companyId: sessionCompanyId } = useCompany();
    const effectiveCompanyId = String(sessionCompanyId || getStoredCompanyId() || companyId || '');

    const handleImport = async (file: File) => {
        await mutation.mutateAsync({ companyId: effectiveCompanyId, file });
    };

    return (
        <DataImportModal
            open={open}
            onOpenChange={onOpenChange}
            title="Import Data Akun"
            description="Unggah file .xlsx untuk mengimport data akun."
            onImport={handleImport}
            isPending={mutation.isPending}
            templateUrl="https://docs.google.com/spreadsheets/d/1WdGMJEme7eGxp6GDJ-px2PmVurSdYHoKkv6za0VN8AI/edit?usp=sharing"
            exampleData={{
                headers: [
                    'Nama Customer', 'Muat', 'Bongkar', 'Jarak',
                    'UJ Towing', 'UJ CDD', 'UJ Fuso',
                    'INV CDD', 'INV Fuso', 'Status'
                ],
                row: [
                    'PT Contoh', 'Jakarta', 'Bandung', '150',
                    '500000', '300000', '700000',
                    '200000', '400000', 'Aktif'
                ]
            }}
        />
    );
}
