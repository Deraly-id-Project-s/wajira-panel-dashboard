import { Transaction } from '@/@types/transaction.types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTableSort } from '@/hooks/useTableSort';
import { formatDate } from '@/lib/utils/format';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { CopyBox } from '@/components/ui/copy-box';

interface Props {
  data: Transaction[];
  onEdit: (trx: Transaction) => void;
  onDelete: (trx: Transaction) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function TransactionTable({ data, onEdit, onDelete, canEdit, canDelete }: Props) {
  const { sortedData, sortKey, sortOrder, handleSort } = useTableSort({
    data,
  });

  const renderSortHeader = (key: keyof Transaction, label: string, alignment: 'left' | 'center' | 'right' = 'left') => {
    const isSorted = sortKey === key;
    const justifyClass = alignment === 'right' ? 'justify-end' : alignment === 'center' ? 'justify-center' : 'justify-start';
    const textAlignment = alignment === 'right' ? 'text-right' : alignment === 'center' ? 'text-center' : 'text-left';
    return (
      <div
        onClick={() => handleSort(key as any)}
        className={`flex items-center gap-1 cursor-pointer select-none group w-full px-4 py-4 text-xs font-semibold uppercase text-slate-500 ${textAlignment} ${justifyClass}`}
      >
        <span>{label}</span>
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
    );
  };

  return (
    <div className="rounded-md border border-gray-200 bg-white overflow-x-auto shadow-none">
      <table className="w-full text-sm">
        <thead className="bg-[#f8f9fa] border-b border-gray-200">
          <tr>
            <th className="p-0 text-center min-w-[120px] align-middle" rowSpan={2}>
              {renderSortHeader('date', 'TANGGAL', 'center')}
            </th>
            <th className="p-0 text-left min-w-[150px] align-middle" rowSpan={2}>
              {renderSortHeader('name', 'TRANSAKSI', 'left')}
            </th>
            <th className="px-4 py-2 text-center text-xs font-semibold uppercase text-slate-500 border-l border-r align-middle" colSpan={4}>
              BANK
            </th>
            <th className="px-4 py-2 text-center text-xs font-semibold uppercase text-slate-500 border-r align-middle" colSpan={2}>
              CASH
            </th>
            <th className="p-0 text-left min-w-[150px] align-middle" rowSpan={2}>
              {renderSortHeader('description', 'KETERANGAN', 'left')}
            </th>
            <th className="w-[80px] px-4 py-4 text-center text-xs font-semibold uppercase text-slate-500 align-middle sticky right-0 bg-[#f8f9fa] z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]" rowSpan={2}>
              ACTION
            </th>
          </tr>
          <tr className="border-t border-gray-200">
            {/* BANK SUBHEADER */}
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-500 border-l">Debet BCA USD</th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-500">Kredit BCA USD</th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-500">Debet BCA IDR</th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-500 border-r">Kredit BCA IDR</th>

            {/* CASH SUBHEADER */}
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-500">DEBET CASH</th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-500 border-r">KREDIT CASH</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.length > 0 ? (
            sortedData.map((trx) => (
              <tr key={trx.id} className="border-b hover:bg-gray-50 transition-colors border-slate-100 last:border-0">
                <td className="px-4 py-4 text-center text-sm text-slate-700 whitespace-nowrap">{formatDate(trx.date)}</td>
                <td className="px-4 py-4 text-left text-sm font-medium text-slate-900">
                  <CopyBox text={trx.name} />
                </td>

                {/* BANK */}
                <td className={`px-4 py-4 text-center text-sm ${trx.debitUSD ? 'text-green-600 font-medium' : 'text-slate-400'}`}>{trx.debitUSD ? currenciesFormat('usd', trx.debitUSD) : '0'}</td>
                <td className={`px-4 py-4 text-center text-sm ${trx.creditUSD ? 'text-red-600 font-medium' : 'text-slate-400'}`}>{trx.creditUSD ? currenciesFormat('usd', trx.creditUSD) : '0'}</td>
                <td className={`px-4 py-4 text-center text-sm ${trx.debitIDR ? 'text-green-600 font-medium' : 'text-slate-400'}`}>{trx.debitIDR ? currenciesFormat('idr', trx.debitIDR) : '0'}</td>
                <td className={`px-4 py-4 text-center text-sm border-r ${trx.creditIDR ? 'text-red-600 font-medium' : 'text-slate-400'}`}>{trx.creditIDR ? currenciesFormat('idr', trx.creditIDR) : '0'}</td>

                {/* CASH */}
                <td className={`px-4 py-4 text-center text-sm ${trx.debitCash ? 'text-green-600 font-medium' : 'text-slate-400'}`}>{trx.debitCash ? currenciesFormat('idr', trx.debitCash) : '0'}</td>
                <td className={`px-4 py-4 text-center text-sm border-r ${trx.creditCash ? 'text-red-600 font-medium' : 'text-slate-400'}`}>{trx.creditCash ? currenciesFormat('idr', trx.creditCash) : '0'}</td>

                <td className="px-4 py-4 text-left text-sm text-slate-500 max-w-[150px] truncate" title={trx.description}>
                  {trx.description || '-'}
                </td>
                <td className="px-4 py-4 text-center sticky right-0 bg-white group-hover:bg-gray-50 z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]">
                  <div className="flex justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
                        <DropdownMenuItem onClick={() => onEdit(trx)} disabled={!canEdit} className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(trx)} disabled={!canDelete} className="rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer">
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={100} className="py-16 h-64 text-center text-slate-500 text-sm">
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
  );
}
