import { LoadingState } from '@/components/ui/loading-state';
import { useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { PageHeader } from "@/components/ui/page-header"
import { Card } from "@/components/ui/card"
import { useSpareparts, useImportSparepart } from "@/hooks/useSparepart"
import { SparepartTable } from "@/components/features/sparepart/SparepartTable"
import { SparepartFormDialog } from "@/components/features/sparepart/SparepartFormDialog"
import { DeleteSparepartDialog } from "@/components/features/sparepart/DeleteSparepartDialog"
import { DataImportModal } from "@/components/features/master-data/DataImportModal"
import { useCompany } from "@/contexts/CompanyContext"
import { Sparepart } from "@/types/sparepart.types"
import { usePermissionGuard } from "@/hooks/usePermissionGuard"

export default function SparepartPage() {
    const { companyId } = useCompany()
    // Defaulting to "1" if context is missing, but DashboardLayout guards this.
    const safeCompanyId = companyId || "1"

    const { hasPermission } = usePermissionGuard();
    const canCreate = hasPermission('master-data:create');
    const canEdit = hasPermission('master-data:edit');
    const canDelete = hasPermission('master-data:delete');

    const { data, isLoading, isError, refetch } = useSpareparts(safeCompanyId)
    const importMutation = useImportSparepart(safeCompanyId)

    const [selected, setSelected] = useState<Sparepart | null>(null)
    const [openForm, setOpenForm] = useState(false)
    const [openDelete, setOpenDelete] = useState(false)
    const [openImport, setOpenImport] = useState(false)

    const handleImport = async (file: File) => {
        if (!canCreate) return;
        await importMutation.mutateAsync({ file });
        refetch();
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="space-y-6">
                    <PageHeader
                        title="Sparepart"
                        subtitle="Kelola semua sparepart"
                    />
                    <Card className="rounded-md p-6">
                        <LoadingState variant="page" />
                    </Card>
                </div>
            </DashboardLayout>
        )
    }

    if (isError) {
        return (
            <DashboardLayout>
                <div className="space-y-6">
                    <PageHeader
                        title="Sparepart"
                        subtitle="Kelola semua sparepart"
                    />
                    <Card className="rounded-md p-6">
                        <div className="text-center text-destructive">Gagal memuat data</div>
                    </Card>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* HEADER */}
                <PageHeader
                    title="Sparepart"
                    subtitle="Kelola semua sparepart"
                />

                {/* TABLE CARD */}
                <div className="">
                    <SparepartTable
                        data={data?.data ?? []}
                        onEdit={(item) => {
                            if (canEdit) {
                                setSelected(item)
                                setOpenForm(true)
                            }
                        }}
                        onDelete={(item) => {
                            if (canDelete) {
                                setSelected(item)
                                setOpenDelete(true)
                            }
                        }}
                        onAdd={canCreate ? () => {
                            setSelected(null)
                            setOpenForm(true)
                        } : undefined}
                        onImport={canCreate ? () => setOpenImport(true) : undefined}
                        canEdit={canEdit}
                        canDelete={canDelete}
                    />
                </div>

                <SparepartFormDialog
                    open={openForm}
                    onOpenChange={setOpenForm}
                    sparepart={selected}
                    companyId={safeCompanyId}
                />

                <DeleteSparepartDialog
                    open={openDelete}
                    onOpenChange={setOpenDelete}
                    sparepart={selected}
                    companyId={safeCompanyId}
                />

                <DataImportModal
                    open={openImport}
                    onOpenChange={setOpenImport}
                    title="Import Data Sparepart"
                    description="Unggah file .xlsx untuk mengimport data sparepart."
                    onImport={handleImport}
                    isPending={importMutation.isPending}
                    templateUrl="https://docs.google.com/spreadsheets/d/16yxx_9Yxx9eHMx85b42dwqr7BQ8okess45wGkd-TUig/edit?usp=sharing"
                />
            </div>
        </DashboardLayout>
    )
}
