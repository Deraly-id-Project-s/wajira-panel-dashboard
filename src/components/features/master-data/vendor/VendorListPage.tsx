'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { useCompany } from '@/contexts/CompanyContext';
import { DataImportModal } from '../../master-data/DataImportModal';
import { useImportVendor } from '@/hooks/useVendor';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

export const VendorListPage = () => {
    const { companyId } = useCompany();
    const [openImport, setOpenImport] = useState(false);
    const importMutation = useImportVendor();

    const { hasPermission } = usePermissionGuard();
    const canCreate = hasPermission('master-data:create');

    const handleImport = async (file: File) => {
        if (canCreate) {
            await importMutation.mutateAsync({ companyId: companyId ?? '', file });
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Vendor"
                    subtitle="Kelola data vendor"
                    actions={
                        canCreate && (
                            <>
                                <Button onClick={() => setOpenImport(true)} variant="outline" className="w-full sm:w-auto">
                                    Import
                                </Button>
                                <Button className="button-theme-1!">
                                    + Tambah
                                </Button>
                            </>
                        )
                    }
                />

                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                    Table data vendor akan segera hadir.
                </div>
            </div>

            {canCreate && (
                <DataImportModal
                    open={openImport}
                    onOpenChange={setOpenImport}
                    title="Import Data Vendor"
                    description="Unggah file .xlsx untuk mengimport data vendor."
                    onImport={handleImport}
                    isPending={importMutation.isPending}
                    templateUrl="https://docs.google.com/spreadsheets/d/1wQmTkJSGyt7vb6DA21TdHyYiDD3tLqlXxUwQA88Qb1M/edit?usp=sharing"
                />
            )}
        </DashboardLayout>
    );
};
