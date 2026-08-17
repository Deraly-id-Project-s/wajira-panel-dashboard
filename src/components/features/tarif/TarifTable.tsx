import React from 'react';
import { Search, Plus, MoreVertical, History } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import type { Tarif } from '@/@types/tarif.types';
import { cn } from '@/lib/utils';
import { LoadingState } from '@/components/ui/loading-state';

interface TarifTableProps {
    tarifs: Tarif[];
    search: string;
    onSearchChange: (value: string) => void;
    isLoading?: boolean;
    page: number;
    perPage: number;
    totalData: number;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
    onAdd: () => void;
    onEdit: (tarif: Tarif) => void;
    onVersioning: (tarif: Tarif) => void;
    onDelete: (tarif: Tarif) => void;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
}

const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export function TarifTable({
    tarifs,
    search,
    onSearchChange,
    isLoading = false,
    page,
    perPage,
    totalData,
    onPageChange,
    onPerPageChange,
    onAdd,
    onEdit,
    onVersioning,
    onDelete,
    canCreate,
    canEdit,
    canDelete,
}: TarifTableProps) {
    const totalPages = Math.ceil(totalData / perPage);
    const startData = totalData === 0 ? 0 : (page - 1) * perPage + 1;
    const endData = Math.min(page * perPage, totalData);

    const renderPaginationNumbers = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                    key={p}
                    variant="ghost"
                    size="sm"
                    onClick={() => onPageChange(p)}
                    className={cn(
                        'h-9 min-w-9 rounded-md border px-3 text-sm font-medium shadow-none',
                        p === page
                            ? 'border-slate-200 bg-white text-slate-950 shadow-sm'
                            : 'border-transparent bg-transparent text-slate-700 hover:border-slate-200 hover:bg-white',
                    )}
                >
                    {p}
                </Button>
            ));
        }

        const pages: (number | string)[] = [];
        if (page <= 3) {
            for (let i = 1; i <= 4; i++) pages.push(i);
            pages.push('...');
            pages.push(totalPages);
        } else if (page >= totalPages - 2) {
            pages.push(1);
            pages.push('...');
            for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            pages.push('...');
            pages.push(page - 1, page, page + 1);
            pages.push('...');
            pages.push(totalPages);
        }

        return pages.map((p, idx) => (
            <Button
                key={idx}
                variant="ghost"
                size="sm"
                disabled={p === '...'}
                onClick={() => typeof p === 'number' && onPageChange(p)}
                className={cn(
                    'h-9 min-w-9 rounded-md border px-3 text-sm font-medium shadow-none',
                    p === page
                        ? 'border-slate-200 bg-white text-slate-950 shadow-sm'
                        : p === '...'
                            ? 'border-transparent bg-transparent text-slate-500 cursor-default hover:bg-transparent hover:border-transparent'
                            : 'border-transparent bg-transparent text-slate-700 hover:border-slate-200 hover:bg-white',
                )}
            >
                {p}
            </Button>
        ));
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative w-full sm:w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search here"
                            className="pl-9 bg-white"
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap">
                        <span>Show</span>
                        <Select value={perPage.toString()} onValueChange={(v) => onPerPageChange(Number(v))}>
                            <SelectTrigger className="w-[70px] bg-white">
                                <SelectValue placeholder="25" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                        <span>Page</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {canCreate && (
                        <Button onClick={onAdd} className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#152e4d]">
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah
                        </Button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border border-gray-200 bg-white overflow-x-auto shadow-none">
                <Table className="min-w-[1100px]">
                    <TableHeader className="bg-[#f8f9fa] border-b border-gray-200">
                        <TableRow className="hover:bg-[#f8f9fa]">
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase px-4 py-4 text-left">
                                LOADING IN
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase px-4 py-4 text-left">
                                LOADING OUT
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase px-4 py-4 text-center">
                                JARAK (KM)
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase px-4 py-4 text-right">
                                UJ TOWING
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase px-4 py-4 text-right">
                                UJ CDD
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase px-4 py-4 text-right">
                                UJ FUSO
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase px-4 py-4 text-right">
                                INV CDD
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase px-4 py-4 text-right">
                                INV FUSO
                            </TableHead>
                            <TableHead className="w-[80px] px-4 py-4 text-center text-xs font-semibold text-slate-500 uppercase sticky right-0 bg-[#f8f9fa] z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]">
                                ACTION
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={100} className="px-4 py-16 text-center bg-white">
                                    <LoadingState variant="section" text="Memuat data..." />
                                </td>
                            </tr>
                        ) : tarifs.length > 0 ? (
                            tarifs.map((tarif) => (
                                <TableRow key={tarif.id} className="group hover:bg-gray-50 transition-colors">
                                    <TableCell className="px-4 py-4 text-sm text-gray-600 text-left whitespace-nowrap">
                                        {tarif.loadingIn || '-'}
                                    </TableCell>
                                    <TableCell className="px-4 py-4 text-sm text-gray-600 text-left whitespace-nowrap">
                                        {tarif.loadingOut || '-'}
                                    </TableCell>
                                    <TableCell className="px-4 py-4 text-sm text-gray-600 text-center font-medium">
                                        {tarif.distance ?? '-'}
                                    </TableCell>
                                    <TableCell className="px-4 py-4 text-sm text-gray-600 text-right whitespace-nowrap">
                                        {formatCurrency(tarif.ujTowing)}
                                    </TableCell>
                                    <TableCell className="px-4 py-4 text-sm text-gray-600 text-right whitespace-nowrap">
                                        {formatCurrency(tarif.ujCdd)}
                                    </TableCell>
                                    <TableCell className="px-4 py-4 text-sm text-gray-600 text-right whitespace-nowrap">
                                        {formatCurrency(tarif.ujFuso)}
                                    </TableCell>
                                    <TableCell className="px-4 py-4 text-sm text-gray-600 text-right whitespace-nowrap">
                                        {formatCurrency(tarif.invCdd)}
                                    </TableCell>
                                    <TableCell className="px-4 py-4 text-sm text-gray-600 text-right whitespace-nowrap">
                                        {formatCurrency(tarif.invFuso)}
                                    </TableCell>
                                    <TableCell className="px-4 py-4 text-center sticky right-0 bg-white group-hover:bg-gray-50 z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]">
                                        <div className="flex justify-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                                                        <MoreVertical className="h-4 w-4 text-gray-500" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
                                                    <DropdownMenuItem
                                                        onClick={() => onVersioning(tarif)}
                                                        className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
                                                    >
                                                        Detail
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => onEdit(tarif)}
                                                        disabled={!canEdit}
                                                        className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
                                                    >
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => onDelete(tarif)}
                                                        disabled={!canDelete}
                                                        className="rounded-lg px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                                                    >
                                                        Hapus
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow className="group">
                                <TableCell colSpan={100} className="h-32 text-center text-gray-552 py-16 text-sm">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <div className="rounded-full bg-slate-50 p-4 mb-2">
                                            <Search className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <p className="text-base font-semibold text-slate-900">Tidak ada data ditemukan</p>
                                        <p className="text-sm text-slate-500">Belum ada data atau coba gunakan kata kunci pencarian lain.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-4 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between px-1">
                <div className="text-sm text-gray-500">
                    Showing {startData}-{endData} of {totalData} data
                </div>

                {totalPages > 1 && (
                    <div className="flex flex-wrap items-center justify-end gap-1 text-slate-800">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onPageChange(page - 1)}
                            disabled={page === 1}
                            className="h-9 rounded-md px-2 text-sm font-medium hover:bg-transparent disabled:text-slate-300"
                        >
                            Previous
                        </Button>

                        {renderPaginationNumbers()}

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onPageChange(page + 1)}
                            disabled={page === totalPages}
                            className="h-9 rounded-md px-2 text-sm font-medium hover:bg-transparent disabled:text-slate-300"
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
