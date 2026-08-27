'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { useCompany } from '@/contexts/CompanyContext';
import { CustomerImportModal } from '@/components/features/customer/CustomerImportModal';
import { Plus, Upload } from 'lucide-react';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

export const CustomerListPage = () => {
    const { companyId } = useCompany();
    const [openImport, setOpenImport] = useState(false);


    const { hasPermission } = usePermissionGuard();
    const canCreate = hasPermission('master-data:create');



    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Customer"
                    subtitle="Kelola data customer"
                    actions={
                        canCreate && (
                            <>
                                <Button onClick={() => setOpenImport(true)} variant="outline" className="w-full sm:w-auto">
                                    <Upload className="h-4 w-4" />
                                    Import
                                </Button>
                                <Button className="button-theme-1!">
                                    <Plus className="h-4 w-4" />
                                    Tambah
                                </Button>
                            </>
                        )
                    }
                />

                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                    Table data customer akan segera hadir.
                </div>
            </div>

            {canCreate && (
                <CustomerImportModal
                    open={openImport}
                    onOpenChange={setOpenImport}
                />
            )}
        </DashboardLayout>
    );
};
