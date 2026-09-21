'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { unitTransactionService } from '@/services/unitTransaction.service';
import { toast } from 'sonner';
import { LoadingState } from '@/components/ui/loading-state';
import { cn } from '@/lib/utils';

const stockStateConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'border-slate-200 bg-slate-50 text-slate-600' },
  cancel: { label: 'Batal', className: 'border-rose-200 bg-rose-50 text-rose-700' },
  prepare: { label: 'Disiapkan', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  purchase_order: { label: 'Purchase Order', className: 'border-blue-200 bg-blue-50 text-blue-700' },
  in_transit: { label: 'Dalam Perjalanan', className: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
  receipt: { label: 'Diterima', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'purchase' | 'sales';
}

interface VehicleDetailItem {
  id: number;
  color: string;
  machine_number: string;
  chassis_number: string;
  in_stock: boolean;
  is_forecast: boolean;
  status: string;
  stock_state?: string;
  unit_transaction_item?: {
    unit_transaction?: {
      id: number;
      code: string;
      type: string;
      stock_state: string;
    };
  };
}

export default function SearchVehicleModal({ open, onOpenChange, type }: Props) {
  const router = useRouter();
  const { slug } = router.query;

  const [searchOf, setSearchOf] = useState<string>('chassis_number');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<VehicleDetailItem[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalEntries, setTotalEntries] = useState<number>(0);

  // Clear state when modal closes
  useEffect(() => {
    if (!open) {
      setResults([]);
      setSearchQuery('');
      setCurrentPage(1);
      setTotalPages(1);
      setTotalEntries(0);
    }
  }, [open]);

  const handleSearch = async (pageNumber = 1) => {
    if (!searchQuery.trim()) {
      toast.error('Silakan isi kata kunci pencarian');
      return;
    }

    setLoading(true);
    try {
      const response = await unitTransactionService.searchUnitVehicleDetails({
        type,
        search_of: searchOf,
        search: searchQuery.trim(),
        page: pageNumber,
        per_page: 10,
      });

      if (response) {
        setResults(response.data || []);
        setCurrentPage(response.current_page || 1);
        setTotalPages(response.last_page || 1);
        setTotalEntries(response.total || 0);
      } else {
        setResults([]);
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Gagal mencari data kendaraan';
      toast.error(message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (item: VehicleDetailItem) => {
    const transactionId = item.unit_transaction_item?.unit_transaction?.id;
    if (!transactionId) {
      toast.error('Data transaksi tidak valid');
      return;
    }

    onOpenChange(false);
    const detailPath = type === 'purchase'
      ? `/dashboard/${slug}/transaksi/pembelian-unit/${transactionId}`
      : `/dashboard/${slug}/transaksi/penjualan-unit/${transactionId}`;

    void router.push(detailPath);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto w-full rounded-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">Cari Data Kendaraan</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Search Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-slate-50 p-4 rounded-md border border-slate-100">
            <div className="w-full sm:w-1/3 space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cari Berdasarkan</label>
              <Select value={searchOf} onValueChange={setSearchOf}>
                <SelectTrigger className="bg-white h-11 border-slate-200 rounded-md shadow-none">
                  <SelectValue placeholder="Pilih kriteria" />
                </SelectTrigger>
                <SelectContent className="rounded-md border-slate-200">
                  <SelectItem value="chassis_number">No. Rangka</SelectItem>
                  <SelectItem value="machine_number">No. Mesin</SelectItem>
                  <SelectItem value="color">Warna</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:flex-1 space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kata Kunci</label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Masukkan kata kunci..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void handleSearch(1);
                    }
                  }}
                  className="bg-white h-11 border-slate-200 rounded-md pr-10 shadow-none focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                />
                <Search className="absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <Button
              type="button"
              className="mt-5"
              onClick={() => void handleSearch(1)}
              disabled={loading}
              variant="default"
            >
              {loading ? <LoadingState variant="inline" text={null} /> : 'Cari'}
            </Button>
          </div>

          {/* Results Table */}
          <div className="relative overflow-x-auto rounded-md border border-slate-100 bg-white">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-xs font-bold uppercase text-slate-500 py-3.5">Kode Transaksi</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-slate-500 py-3.5">No. Rangka</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-slate-500 py-3.5">No. Mesin</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-slate-500 py-3.5">Warna</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-slate-500 py-3.5 text-center">Stok</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-slate-500 py-3.5 text-center">Kondisi</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-slate-500 py-3.5 text-center">Posisi Stok</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center text-slate-500">
                      <LoadingState variant="section" text="Mencari data..." />
                    </TableCell>
                  </TableRow>
                ) : results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center text-slate-400 text-sm">
                      Silakan masukkan kata kunci dan cari
                    </TableCell>
                  </TableRow>
                ) : (
                  results.map((item) => {
                    const trans = item.unit_transaction_item?.unit_transaction;
                    const state = item.stock_state || trans?.stock_state || 'draft';
                    const stockConfig = stockStateConfig[state] ?? {
                      label: state.replace(/_/g, ' '),
                      className: 'border-slate-200 bg-slate-50 text-slate-700',
                    };

                    return (
                      <TableRow
                        key={item.id}
                        onClick={() => handleRowClick(item)}
                        className="cursor-pointer border-b hover:bg-slate-50/70 border-slate-100 transition-colors"
                      >
                        <TableCell className="font-semibold text-blue-600 py-3.5">
                          {trans?.code || '-'}
                        </TableCell>
                        <TableCell className="font-medium text-slate-700 py-3.5">
                          {item.chassis_number || '-'}
                        </TableCell>
                        <TableCell className="text-slate-600 py-3.5">
                          {item.machine_number || '-'}
                        </TableCell>
                        <TableCell className="text-slate-600 py-3.5">
                          <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-md uppercase">
                            {item.color || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center py-3.5">
                          <Badge
                            variant="outline"
                            className={
                              item.in_stock
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold'
                                : 'border-rose-200 bg-rose-50 text-rose-700 font-semibold'
                            }
                          >
                            {item.in_stock ? 'Tersedia' : 'Tidak Tersedia'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center py-3.5">
                          <Badge
                            variant="outline"
                            className="capitalize border-slate-200 bg-slate-50 text-slate-700 font-semibold"
                          >
                            {item.status?.replace(/_/g, ' ') || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center py-3.5">
                          <Badge variant="outline" className={cn('capitalize font-semibold', stockConfig.className)}>
                            {stockConfig.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {results.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500">
              <p>Menampilkan {results.length} data dari total {totalEntries}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1 || loading}
                  onClick={() => void handleSearch(currentPage - 1)}
                  className="rounded-md border-slate-200 h-9"
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages || loading}
                  onClick={() => void handleSearch(currentPage + 1)}
                  className="rounded-md border-slate-200 h-9"
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
