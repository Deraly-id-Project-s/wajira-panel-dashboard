import { Card } from "@/components/ui/card"
import { CalendarDays, FileText, ListChecks, User } from "lucide-react" // Changed icon
import { Hutang } from "@/@types/hutang.types"
import { formatCurrency } from "@/lib/utils/currency"

interface Props {
    data: Hutang
}

export default function HutangDetailHeader({ data }: Props) {
    const percentPaid =
        data.totalBeli === 0
            ? 0
            : Math.min(
                100,
                Math.round((data.totalBayar / data.totalBeli) * 100)
            )

    return (
        <div className="grid grid-cols-2 gap-6">
            {/* LEFT CARD - INFORMASI HUTANG */}
            <Card className="p-6 rounded-md border shadow-sm space-y-6">
                <div className="flex items-start gap-4">
                    <div className="bg-blue-50 p-2.5 rounded-md">
                        <FileText
                            size={20}
                            className="text-blue-600"
                        />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">
                            Informasi Hutang
                        </h3>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="text-gray-500 text-xs mb-1">
                            Nomer Penjualan
                        </p>
                        <p className="font-medium text-gray-900">
                            {data.noPembelian}
                        </p>
                    </div>

                    <div>
                        <p className="text-gray-500 text-xs mb-1">
                            Tanggal
                        </p>
                        <div className="flex items-center gap-2 text-gray-900 font-medium">
                            <CalendarDays size={16} className="text-gray-400" />
                            <span>{data.tanggal}</span>
                        </div>
                    </div>

                    <div>
                        <p className="text-gray-500 text-xs mb-1">
                            Supplier
                        </p>
                        <div className="flex items-center gap-2 text-gray-900 font-medium">
                            {/* Assuming User Icon or similar for Supplier if needed, but text is fine */}
                            <User size={16} className="text-gray-400" />
                            <span>{data.namaSupplier}</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* RIGHT CARD - STATUS PEMBAYARAN */}
            <Card className="p-6 rounded-md border shadow-sm space-y-6">
                <div className="flex items-start gap-4">
                    <div className="bg-red-50 p-2.5 rounded-md">
                        <ListChecks
                            size={20}
                            className="text-red-500"
                        />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">
                            Status Pembayaran
                        </h3>
                    </div>
                </div>

                <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">
                            Total Beli
                        </span>
                        <span className="font-medium text-gray-900">
                            {formatCurrency(data.totalBeli)}
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">
                            Total Bayar
                        </span>
                        <span className="font-medium text-gray-900">
                            {formatCurrency(data.totalBayar)}
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">
                            Total Hutang
                        </span>
                        <span className="font-medium text-gray-900">
                            {formatCurrency(data.amountHutang)}
                        </span>
                    </div>
                </div>

                <div className="pt-2 border-t border-gray-100 mt-2">
                    <div className="flex justify-between mb-3 text-sm items-center">
                        <span className="font-medium text-gray-900">Kurang Bayar</span>
                        <span className="text-red-500 font-semibold text-lg">
                            {formatCurrency(data.amountHutang)}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex flex-col gap-2">
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gray-800 transition-all rounded-full"
                                style={{ width: `${percentPaid}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                            {percentPaid}% Terbayar
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    )
}
