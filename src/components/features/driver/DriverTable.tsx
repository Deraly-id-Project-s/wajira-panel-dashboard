import { useCallback, useMemo, useState } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useActivateDriver, useDeactivateDriver } from '@/hooks/useDriver';
import { getDriverPassword } from '@/services/driver.service';
import type { Driver } from '@/@types/driver.types';
import type { PaginationMeta } from '@/@types/pagination.types';
import { ReferenceLink } from '@/components/ui/reference-link';
import { CopyBox } from '@/components/ui/copy-box';

interface DriverTableProps {
    data: Driver[];
    meta?: PaginationMeta;
    isLoading?: boolean;
    page: number;
    perPage: number;
    canEdit: boolean;
    canDelete: boolean;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
    onView: (driver: Driver) => void;
    onEdit: (driver: Driver) => void;
    onDelete: (driver: Driver) => void;
}

const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return '-';
    try {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
};

export function DriverTable({
    data,
    meta,
    isLoading = false,
    page,
    perPage,
    canEdit,
    canDelete,
    onPageChange,
    onPerPageChange,
    onView,
    onEdit,
    onDelete,
}: DriverTableProps) {
    const activateMutation = useActivateDriver();
    const deactivateMutation = useDeactivateDriver();
    const [fetchingPasswordId, setFetchingPasswordId] = useState<number | string | null>(null);

    const handleToggleStatus = useCallback(async (driver: Driver, checked: boolean) => {
        try {
            if (checked) await activateMutation.mutateAsync(driver.id);
            else await deactivateMutation.mutateAsync(driver.id);
            toast.success(`Driver ${driver.name} berhasil ${checked ? 'diaktifkan' : 'dinonaktifkan'}`);
        } catch (error: any) {
            toast.error(error?.message || 'Gagal mengubah status driver');
        }
    }, [activateMutation, deactivateMutation]);

    const handleCopyPassword = useCallback(async (driverId: number | string) => {
        setFetchingPasswordId(driverId);
        try {
            const password = await getDriverPassword(driverId);
            await navigator.clipboard.writeText(password);
            toast.success('Password berhasil disalin ke clipboard');
        } catch (error: any) {
            toast.error(error?.message || 'Gagal menyalin password');
        } finally {
            setFetchingPasswordId(null);
        }
    }, []);

    const columns = useMemo<ColumnDef<Driver>[]>(
        () => [
            {
                header: 'NAMA DRIVER',
                accessorKey: 'name',
                sortable: true,
                className: 'font-semibold text-gray-900',
                cell: (item) => item.name || '-',
            },
            {
                header: 'USERNAME',
                accessorKey: 'username',
                sortable: true,
                cell: (item) => item.username || '-',
            },
            {
                header: 'ALAMAT',
                accessorKey: 'address',
                sortable: true,
                cell: (item) => (
                    <span className="line-clamp-2 max-w-[220px]" title={item.address ?? undefined}>
                        {item.address || '-'}
                    </span>
                ),
            },
            {
                header: 'KTP',
                accessorKey: 'identityNumber',
                sortable: true,
                cell: (item) => item.identityNumber ? <CopyBox text={item.identityNumber} /> : '-',
            },
            {
                header: 'PHONE',
                accessorKey: 'phone',
                sortable: true,
                cell: (item) =>
                    item.phone ? (
                        <ReferenceLink target="_blank" href={`https://wa.me/${item.phone.replace(/^0/, '62')}`}>
                            {item.phone}
                        </ReferenceLink>
                    ) : (
                        '-'
                    ),
            },
            {
                header: 'SIM',
                accessorKey: 'driveLicenseNumber',
                sortable: true,
                cell: (item) => item.driveLicenseNumber ? <CopyBox text={item.driveLicenseNumber} /> : '-',
            },
            {
                header: 'TGL GABUNG',
                accessorKey: 'joinedAt',
                sortable: true,
                cell: (item) => formatDate(item.joinedAt),
            },
            {
                header: 'STATUS',
                alignment: 'center',
                cell: (item) => {
                    const active = item.isActive === true || item.isActive === 1;
                    const pending = (activateMutation.isPending && activateMutation.variables === item.id) || (deactivateMutation.isPending && deactivateMutation.variables === item.id);
                    return <div className="flex items-center justify-center gap-2"><Switch checked={active} onCheckedChange={(checked) => handleToggleStatus(item, checked)} disabled={!canEdit || pending} /></div>;
                },
            },
            {
                header: 'ACTION',
                alignment: 'center',
                sticky: 'right',
                cell: (item) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
                            <DropdownMenuItem
                                onSelect={(e) => {
                                    e.preventDefault();
                                    onView(item);
                                }}
                                className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
                            >
                                Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={(e) => {
                                    e.preventDefault();
                                    onEdit(item);
                                }}
                                disabled={!canEdit}
                                className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
                            >
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleCopyPassword(item.id)}
                                disabled={!canEdit || fetchingPasswordId !== null}
                                className="rounded-lg px-3 py-2 text-sm cursor-pointer disabled:pointer-events-none disabled:opacity-50"
                            >
                                {fetchingPasswordId === item.id ? 'Menyalin...' : 'Salin Password'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={(e) => {
                                    e.preventDefault();
                                    onDelete(item);
                                }}
                                disabled={!canDelete}
                                className="rounded-lg px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                            >
                                Hapus
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            },
        ],
        [onView, onEdit, onDelete, canEdit, canDelete, activateMutation.isPending, activateMutation.variables, deactivateMutation.isPending, deactivateMutation.variables, handleToggleStatus, fetchingPasswordId, handleCopyPassword]
    );

    return (
        <BaseTable
            data={data}
            columns={columns}
            loading={isLoading}
            defaultSort={{ key: 'name', direction: 'asc' }}
            meta={{
                currentPage: page,
                perPage,
                lastPage: meta?.lastPage ?? 1,
                total: meta?.total ?? data.length,
            }}
            onPageChange={onPageChange}
        />
    );
}
