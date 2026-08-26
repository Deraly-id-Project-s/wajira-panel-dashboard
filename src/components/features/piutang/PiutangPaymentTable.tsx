import { PiutangPayment } from "@/types/piutang.types"
import { useTableSort } from "@/hooks/useTableSort"
import { SortableHeader } from "@/components/ui/sortable-header"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils/currency"

interface Props {
    data: PiutangPayment[]
}

export default function PiutangPaymentTable({ data }: Props) {
    const { sortedData, sortKey, sortOrder, handleSort } = useTableSort({
        data,
    })

    const total = sortedData.reduce(
        (acc, curr) => acc + curr.jumlahBayar,
        0
    )

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
                <span>Show</span>
                <Select defaultValue="25">
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

            <div className="bg-[#f8fafc] rounded-md border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-[#f1f5f9] text-xs uppercase font-semibold text-gray-600">
                        <tr>
                            <th className="px-6 py-4 text-left">No</th>
                            <th className="py-2 text-left">
                                <SortableHeader title="KODE BAYAR" sortKey="kodeBayar" currentSortKey={sortKey as string} sortOrder={sortOrder} onSort={handleSort} className="text-gray-600 justify-start w-full px-6" />
                            </th>
                            <th className="py-2 text-left">
                                <SortableHeader title="TANGGAL" sortKey="tanggal" currentSortKey={sortKey as string} sortOrder={sortOrder} onSort={handleSort} className="text-gray-600 justify-start w-full px-6" />
                            </th>
                            <th className="py-2 text-left">
                                <SortableHeader title="KAS KELUAR" sortKey="kasMasuk" currentSortKey={sortKey as string} sortOrder={sortOrder} onSort={handleSort} className="text-gray-600 justify-start w-full px-6" />
                            </th>
                            <th className="py-2 text-right">
                                <SortableHeader title="JUMLAH BAYAR" sortKey="jumlahBayar" currentSortKey={sortKey as string} sortOrder={sortOrder} onSort={handleSort} className="text-gray-600 justify-end w-full px-6" />
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {sortedData.map((item, index) => (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">{index + 1}</td>
                                <td className="px-6 py-4 font-medium text-gray-900">{item.kodeBayar}</td>
                                <td className="px-6 py-4 text-gray-600">{item.tanggal}</td>
                                <td className="px-6 py-4 text-gray-600">{item.kasMasuk}</td>
                                <td className="px-6 py-4 text-right font-medium text-gray-900">
                                    {formatCurrency(item.jumlahBayar)}
                                </td>
                            </tr>
                        ))}
                    </tbody>

                    <tfoot className="bg-[#f8fafc] border-t border-gray-200">
                        <tr>
                            <td colSpan={4} className="px-6 py-4 text-right font-bold text-gray-700">
                                Sub Total
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-gray-900">
                                {formatCurrency(total)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="flex justify-between items-center text-sm text-gray-500 pt-2">
                <div>Showing 1-{data.length} of 100 data</div>
                <div className="flex gap-2">
                    {/* Pagination Controls placeholder */}
                </div>
            </div>
        </div>
    )
}
