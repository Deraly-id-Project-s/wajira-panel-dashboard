"use client";

import { useEffect, useMemo, useState } from 'react';
import { Check, Search, Trash, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DispatchUnitTableRow } from '@/@types/pengeluaran-unit.types';
import DeletePengeluaranUnitDialog from './DeletePengeluaranUnitDialog';
import { useTableSort } from '@/hooks/useTableSort';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Props {
    data: DispatchUnitTableRow[];
    onDelete: (ids: number[]) => Promise<void>;
    onCancel?: () => void;
}

export default function PengeluaranUnitEditTable({ data, onDelete, onCancel }: Props) {
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState('25');
    const [currentPage, setCurrentPage] = useState(1);
    const [selected, setSelected] = useState<number[]>([]);
    const [confirmDeleteIds, setConfirmDeleteIds] = useState<number[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        setSelected([]);
    }, [data]);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setSearch(searchInput.trim());
        }, 400);
        return () => window.clearTimeout(timeout);
    }, [searchInput]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return data.filter((item) =>
            [item.salesCode, item.unitTypeName, item.color, item.machineNumber, item.chassisNumber].some((field) =>
                field.toLowerCase().includes(q)
            )
        );
    }, [data, search]);

    const { sortedData, sortKey, sortOrder, handleSort } = useTableSort({
        data: filtered,
    });

    const renderSortHeader = (key: string, label: string) => {
        const isSorted = sortKey === key;
        return (
            <TableHead
                onClick={() => handleSort(key as any)}
                className="px-4 py-4 text-xs font-semibold uppercase text-slate-500 cursor-pointer select-none group whitespace-nowrap text-left"
            >
                <div className="flex items-center gap-1 justify-start">
                    {label}
                    {isSorted ? (
                        sortOrder === 'asc' ? (
                            <ArrowUp className="h-3 w-3 text-indigo-500 shrink-0" />
                        ) : (
                            <ArrowDown className="h-3 w-3 text-indigo-500 shrink-0" />
                        )
                    ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-70 transition-opacity duration-150 shrink-0" />
                    )}
                </div>
            </TableHead>
        );
    };

    const perPage = Number(itemsPerPage);
    const totalItems = sortedData.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
    const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * perPage;
    const endIndex = totalItems === 0 ? 0 : Math.min(startIndex + perPage, totalItems);
    const paginated = sortedData.slice(startIndex, startIndex + perPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage, search]);

    const toggleSelect = (id: number) => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
    };

    const toggleAll = () => {
        if (paginated.length === 0) return;
        const allIds = paginated.map((d) => d.id);
        const isAllSelected = allIds.every((id) => selected.includes(id));
        setSelected((prev) => (isAllSelected ? prev.filter((id) => !allIds.includes(id)) : Array.from(new Set([...prev, ...allIds]))));
    };

    const handleDeleteSelected = async () => {
        if (confirmDeleteIds.length === 0) return;
        setIsDeleting(true);
        await onDelete(confirmDeleteIds);
        setSelected((prev) => prev.filter((id) => !confirmDeleteIds.includes(id)));
        setConfirmDeleteIds([]);
        setIsDeleting(false);
    };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else if (currentPage <= 3) {
            pages.push(1, 2, 3, 4, '...', totalPages);
        } else if (currentPage >= totalPages - 2) {
            pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
            pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
        return pages;
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative w-full sm:w-[300px]">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input placeholder="Search here" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9 bg-white" />
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap">
                        <span>Show</span>
                        <Select value={itemsPerPage} onValueChange={(val) => setItemsPerPage(val)}>
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
            </div>

            <div className="flex items-center justify-between min-h-[40px]">
                <div className="flex items-center gap-2 text-[15px] text-gray-500">
                    <Check size={20} className="text-[#1FBE78]" strokeWidth={2.5} />
                    <span>{selected.length} data terpilih</span>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" className="h-10 px-6 font-medium text-gray-600 hover:text-gray-900 bg-transparent" onClick={onCancel}>
                        Batal
                    </Button>
                    <Button size="sm" className="h-10 px-5 bg-[#DC2626] hover:bg-red-700 font-medium rounded-md gap-2 text-white" onClick={() => setConfirmDeleteIds(selected)} disabled={selected.length === 0 || isDeleting}>
                        <Trash size={16} /> Hapus
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-md border border-gray-200 overflow-x-auto">
                <Table className="w-full text-sm">
                    <TableHeader className="bg-[#f8f9fa] border-b border-gray-200">
                        <TableRow>
                            <TableHead className="px-4 py-4 text-center w-[48px]">
                                <Checkbox checked={paginated.length > 0 && paginated.every((d) => selected.includes(d.id))} onCheckedChange={() => toggleAll()} />
                            </TableHead>
                            {renderSortHeader('id', 'NO')}
                            {renderSortHeader('salesCode', 'KODE JUAL')}
                            {renderSortHeader('unitTypeName', 'TIPE UNIT')}
                            {renderSortHeader('color', 'WARNA')}
                            {renderSortHeader('machineNumber', 'NO MESIN')}
                            {renderSortHeader('chassisNumber', 'NO RANGKA')}
                            {renderSortHeader('inStock', 'STATUS STOCK')}
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {paginated.length > 0 ? (
                            paginated.map((item, index) => (
                                <TableRow key={item.id} className="group hover:bg-gray-50/70 border-b transition-colors border-slate-100">
                                    <TableCell className="px-4 py-4 text-center sticky right-0 bg-white group-hover:bg-gray-50 z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]">
                                        <Checkbox checked={selected.includes(item.id)} onCheckedChange={() => toggleSelect(item.id)} />
                                    </TableCell>
                                    <TableCell className="px-4 py-4 text-left text-sm text-slate-700">{startIndex + index + 1}</TableCell>
                                    <TableCell className="px-4 py-4 text-left text-sm text-slate-700">{item.salesCode}</TableCell>
                                    <TableCell className="px-4 py-4 text-left text-sm text-slate-700">{item.unitTypeName}</TableCell>
                                    <TableCell className="px-4 py-4 text-left text-sm text-slate-700">{item.color}</TableCell>
                                    <TableCell className="px-4 py-4 text-left text-sm text-slate-700">{item.machineNumber}</TableCell>
                                    <TableCell className="px-4 py-4 text-left text-sm text-slate-700">{item.chassisNumber}</TableCell>
                                    <TableCell className="px-4 py-4 text-left text-sm text-slate-700">
                                        {item.inStock === true ? (
                                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Tersedia</Badge>
                                        ) : item.inStock === false ? (
                                            <Badge variant="outline" className="border-amber-200 text-amber-700">Terjual</Badge>
                                        ) : (
                                            <Badge variant="outline" className="border-gray-200 text-gray-700">-</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow className="group">
                                <TableCell colSpan={100} className="px-4 py-16 text-center text-gray-500 text-sm">
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

            <div className="flex justify-between items-center text-sm text-gray-500 mt-4">
                <div>
                    Showing {totalItems === 0 ? 0 : startIndex + 1}-{endIndex} of {totalItems} data
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-transparent hover:text-gray-900 px-3" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                        Previous
                    </Button>
                    {getPageNumbers().map((page, idx) => (
                        <Button
                            key={idx}
                            variant={page === currentPage ? 'outline' : 'ghost'}
                            size="sm"
                            className={`w-8 h-8 p-0 border-gray-200 ${page === currentPage ? 'text-gray-900 hover:bg-gray-50' : 'text-gray-600 hover:bg-transparent hover:text-gray-900 border-transparent'}`}
                            onClick={() => typeof page === 'number' && setCurrentPage(page)}
                            disabled={typeof page !== 'number'}
                        >
                            {page}
                        </Button>
                    ))}
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-transparent hover:text-gray-900 px-3" disabled={currentPage === totalPages || totalItems === 0} onClick={() => setCurrentPage((p) => p + 1)}>
                        Next
                    </Button>
                </div>
            </div>

            <DeletePengeluaranUnitDialog
                open={confirmDeleteIds.length > 0}
                onOpenChange={(open) => !open && setConfirmDeleteIds([])}
                onConfirm={handleDeleteSelected}
            />
        </div>
    );
}