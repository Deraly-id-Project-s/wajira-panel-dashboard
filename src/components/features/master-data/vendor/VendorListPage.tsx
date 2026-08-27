'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { useCompany } from '@/contexts/CompanyContext';
import { VendorImportModal } from '@/components/features/vendor/VendorImportModal';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

export const VendorListPage = () => {
    const { companyId } = useCompany();
    const [openImport, setOpenImport] = useState(false);


    const { hasPermission } = usePermissionGuard();
    const canCreate = hasPermission('master-data:create');



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
                <VendorImportModal
                    open={openImport}
                    onOpenChange={setOpenImport}
                />
            )}
        </DashboardLayout>
    );
};
