import { Button } from '@/components/ui/button';
import { Piutang } from '@/@types/piutang.types';
import { CalendarDays, FileText, ListChecks, User, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/router';
import { formatCurrency } from "@/lib/utils/currency"

interface Props {
  data: Piutang;
  onTerima: () => void;
}

export default function PiutangDetailHeader({ data, onTerima }: Props) {
  const router = useRouter();
  // slug not required here

  const percentage = data.totalJual > 0 ? (data.totalBayar / data.totalJual) * 100 : 0;
  // isPaidOff computed but not used - omit to avoid unused variable

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10">
            <ChevronLeft size={24} className="text-gray-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Penerimaan Piutang</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <span>No Pembelian</span>
              <span className="text-blue-600 font-medium">{data.noPenjualan}</span>
            </div>
          </div>
        </div>
        <button onClick={onTerima} className="bg-[#22c55e] hover:bg-[#16a34a] text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors">
          + Terima
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informasi Pembayaran Hutang Card */}
        <div className="bg-white p-6 rounded-md border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-md">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-700">Informasi Pembayaran Hutang</h3>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Nomer Pembelian</p>
              <p className="font-medium text-gray-900">{data.noPenjualan}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Tanggal</p>
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <span className="text-gray-400">
                  <CalendarDays size={16} className="text-gray-400" />
                </span>
                <p className="font-medium text-gray-900">{data.tanggal}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Supplier</p>
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <span className="text-gray-400">
                  <User size={16} className="text-gray-400" />
                </span>
                <p className="font-medium text-gray-900">{data.namaCustomer}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Pembayaran Card */}
        <div className="bg-white p-6 rounded-md border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-pink-50 rounded-md">
              <ListChecks className="w-5 h-5 text-pink-500" />
            </div>
            <h3 className="font-medium text-gray-700">Status Pembayaran</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Total Beli</span>
              <span className="font-medium text-gray-900">{formatCurrency(data.totalJual)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Total Bayar</span>
              <span className="font-medium text-gray-900">{formatCurrency(data.totalBayar)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Total Hutang</span>
              <span className="font-medium text-gray-900">Rp 0</span>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-50">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-900">Kurang Bayar</span>
                <span className="font-bold text-red-500">{formatCurrency(data.amountPiutang)}</span>
              </div>

              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
              </div>

              <div className="text-center mt-2">
                <span className="text-green-500 text-sm font-medium">{percentage.toFixed(0)}% Terbayar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
