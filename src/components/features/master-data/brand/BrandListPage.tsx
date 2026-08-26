import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { BrandTable } from './BrandTable';
import { BrandFormModal } from './BrandFormModal';
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from '@/hooks/useBrand';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { brandSchema, type BrandFormValues } from '@/schemas/brand.schema';
import type { Brand } from '@/types/brand.types';
import { toast } from 'sonner';
import { ApiResponseError, ApiValidationError } from '@/lib/api/response';

export const BrandListPage = () => {
    const { page, perPage, search, setPage, setPerPage, setSearch } = useQueryParamsTable({ defaultPerPage: 25 });
    const [searchInput, setSearchInput] = useState(search);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            if (search !== searchInput.trim()) {
                setSearch(searchInput.trim());
            }
        }, 400);
        return () => window.clearTimeout(timeout);
    }, [searchInput, search, setSearch]);

    const { hasPermission } = usePermissionGuard();
    const canCreate = hasPermission('master-data:create');
    const canEdit = hasPermission('master-data:edit');
    const canDelete = hasPermission('master-data:delete');

    const { data, isLoading, isError, isFetching } = useBrands({ page, perPage, search });
    const createMutation = useCreateBrand();
    const updateMutation = useUpdateBrand();
    const deleteMutation = useDeleteBrand();

    const [selectedToDelete, setSelectedToDelete] = useState<Brand | null>(null);
    const [editing, setEditing] = useState<Brand | null>(null);
    const [openForm, setOpenForm] = useState(false);

    const form = useForm<BrandFormValues>({
        resolver: zodResolver(brandSchema),
        defaultValues: {
            name: '',
            image: null,
        },
    });

    const handleDelete = async () => {
        if (!canDelete) return;
        if (!selectedToDelete) return;
        try {
            await deleteMutation.mutateAsync(selectedToDelete.id);
            toast.success('Merk berhasil dihapus');
        } catch (error) {
            const message = error instanceof ApiResponseError ? error.message : 'Gagal menghapus merk';
            toast.error(message);
        } finally {
            setSelectedToDelete(null);
        }
    };

    const handleAdd = () => {
        if (!canCreate) return;
        setEditing(null);
        form.reset({
            name: '',
            image: null,
        });
        setOpenForm(true);
    };

    const handleEdit = (item: Brand) => {
        if (!canEdit) return;
        setEditing(item);
        form.reset({
            name: item.name,
            image: item.image ?? null,
        });
        setOpenForm(true);
    };

    const handleSubmit = async (values: BrandFormValues) => {
        try {
            if (editing) {
                await updateMutation.mutateAsync({ id: editing.id, payload: values });
                toast.success('Merk berhasil diperbarui');
            } else {
                await createMutation.mutateAsync(values);
                toast.success('Merk berhasil dibuat');
            }
            setOpenForm(false);
            setEditing(null);
        } catch (error) {
            if (error instanceof ApiValidationError) {
                Object.entries(error.fieldErrors).forEach(([field, messages]) => {
                    form.setError(field as keyof BrandFormValues, { message: messages?.[0] || 'Validasi gagal' });
                });
                toast.error(error.message || 'Validasi gagal');
                return;
            }
            toast.error(editing ? 'Gagal memperbarui merk' : 'Gagal membuat merk');
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Merk Unit Tipe"
                    subtitle="Kelola semua merk unit tipe"
                    actions={
                        canCreate && (
                            <Button onClick={handleAdd} className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#152e4d]">
                                <Plus className="h-4 w-4" />
                                Tambah Merk
                            </Button>
                        )
                    }
                />

                <Card className="p-6">
                    {isError ? (
                        <div className="py-10 text-center text-red-600">Gagal memuat data merk</div>
                    ) : (
                        <BrandTable
                            data={data?.data ?? []}
                            meta={data?.meta}
                            search={searchInput}
                            onSearchChange={(v) => {
                                setSearchInput(v);
                            }}
                            page={page}
                            canEdit={canEdit}
                            canDelete={canDelete}
                            perPage={perPage}
                            isLoading={isLoading || isFetching}
                            onEdit={handleEdit}
                            onDelete={setSelectedToDelete}
                            onPageChange={setPage}
                            onPerPageChange={setPerPage}
                        />
                    )}
                </Card>
            </div>

            <BrandFormModal
                open={openForm}
                onOpenChange={setOpenForm}
                form={form}
                onSubmit={handleSubmit}
                title={editing ? 'Edit Merk Unit' : 'Tambah Merk Unit'}
                description={editing ? 'Perbarui informasi merk unit' : 'Masukkan informasi merk unit baru'}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
                submitLabel={editing ? 'Perbarui' : 'Simpan'}
            />

            <AlertDialog open={!!selectedToDelete} onOpenChange={(open) => !open && setSelectedToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Merk?</AlertDialogTitle>
                        <AlertDialogDescription>Tindakan ini tidak dapat dikembalikan. Data yang dihapus akan hilang permanen.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
};
