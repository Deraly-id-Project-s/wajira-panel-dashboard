import { Piutang } from '@/@types/piutang.types';
import { MoreVertical, Search, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/router';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { SortableHeader } from '@/components/ui/sortable-header';
import { formatCurrency } from "@/lib/utils/currency"
import { useTableSort } from "@/hooks/useTableSort"

interface Props {
  data: Piutang[];
}

export default function PiutangTable({ data }: Props) {
  const [search, setSearch] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState('25');
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  // Ensure slug is a string (handle array case if necessary, though [slug] usually string)
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';

  // FILTERING
  const filteredData = data.filter((item) => item.noPenjualan.toLowerCase().includes(search.toLowerCase()) || item.namaCustomer.toLowerCase().includes(search.toLowerCase()));

  const { sortedData, sortKey, sortOrder, handleSort } = useTableSort({
    data: filteredData,
  });

  // PAGINATION
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / Number(itemsPerPage));
  const startIndex = (currentPage - 1) * Number(itemsPerPage);
  const endIndex = Math.min(startIndex + Number(itemsPerPage), totalItems);
  const paginatedData = sortedData.slice(startIndex, startIndex + Number(itemsPerPage));

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Helper to generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="space-y-4">
      {/* FILTER */}
      <div className="flex justify-start items-center gap-4">
        <div className="relative w-[250px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search here"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 h-10"
          />
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span>Show</span>
          <Select
            value={itemsPerPage}
            onValueChange={(val) => {
              setItemsPerPage(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[70px]">
              <SelectValue />
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

      <div className="bg-white rounded-md border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50/50 uppercase text-sm font-semibold text-gray-900 leading-normal">
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left">NO</th>
              <th className="py-2 text-left">
                <SortableHeader title="NO PENJUALAN" sortKey="noPenjualan" currentSortKey={sortKey as string} sortOrder={sortOrder} onSort={handleSort} className="text-gray-900" />
              </th>
              <th className="py-2 text-left">
                <SortableHeader title="TANGGAL" sortKey="tanggal" currentSortKey={sortKey as string} sortOrder={sortOrder} onSort={handleSort} className="text-gray-900" />
              </th>
              <th className="py-2 text-left">
                <SortableHeader title="NAMA CUSTOMER" sortKey="namaCustomer" currentSortKey={sortKey as string} sortOrder={sortOrder} onSort={handleSort} className="text-gray-900" />
              </th>
              <th className="py-2 text-right">
                <SortableHeader title="TOTAL JUAL" sortKey="totalJual" currentSortKey={sortKey as string} sortOrder={sortOrder} onSort={handleSort} className="text-gray-900 justify-end w-full" />
              </th>
              <th className="py-2 text-right">
                <SortableHeader title="TOTAL BAYAR" sortKey="totalBayar" currentSortKey={sortKey as string} sortOrder={sortOrder} onSort={handleSort} className="text-gray-900 justify-end w-full" />
              </th>
              <th className="py-2 text-right">
                <SortableHeader title="AMOUNT PIUTANG" sortKey="amountPiutang" currentSortKey={sortKey as string} sortOrder={sortOrder} onSort={handleSort} className="text-gray-900 justify-end w-full" />
              </th>
              <th className="px-4 py-3 text-center sticky right-0 bg-gray-50 z-10 border-l border-gray-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.length > 0 ? (
              paginatedData.map((item, i) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">{startIndex + i + 1}</td>
                  <td className="px-4 py-3 font-medium">{item.noPenjualan}</td>
                  <td className="px-4 py-3">{item.tanggal}</td>
                  <td className="px-4 py-3">{item.namaCustomer}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(item.totalJual)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(item.totalBayar)}</td>
                  <td className="px-4 py-3 text-right text-red-600 font-medium">{formatCurrency(item.amountPiutang)}</td>
                  <td className="px-4 py-3 text-center sticky right-0 bg-white z-10 border-l border-gray-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <DropdownMenuItem asChild>{slug ? <Link href={`/dashboard/${slug}/finance/data-piutang/${item.id}`}>Detail</Link> : <span className="text-gray-400 cursor-not-allowed">Detail</span>}</DropdownMenuItem>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={100} className="px-4 py-16 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="rounded-full bg-slate-50 p-4 mb-2">
                      <Search className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-base font-semibold text-slate-900">Tidak ada data ditemukan</p>
                    <p className="text-sm text-slate-500">Belum ada data atau coba gunakan kata kunci pencarian lain.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <div>
          Showing {paginatedData.length > 0 ? startIndex + 1 : 0}-{endIndex} of {totalItems} data
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
            Previous
          </Button>

          {getPageNumbers().map((page, index) => (
            <Button
              key={index}
              variant={page === currentPage ? 'outline' : 'ghost'}
              size="sm"
              className={page === currentPage ? 'bg-gray-100' : ''}
              onClick={() => typeof page === 'number' && handlePageChange(page)}
              disabled={typeof page !== 'number'}
            >
              {page}
            </Button>
          ))}

          <Button variant="outline" disabled={currentPage === totalPages || totalPages === 0} onClick={() => handlePageChange(currentPage + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
