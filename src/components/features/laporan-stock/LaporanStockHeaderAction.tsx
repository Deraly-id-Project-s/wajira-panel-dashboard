"use client"

import { toast } from "sonner"
import { Printer, Download } from "lucide-react"

export default function LaporanStockHeaderAction() {

    const handlePrint = () => {
        window.print()
    }

    const handleDownload = () => {
        toast.success("File berhasil didownload")
    }

    return (
        <div className="flex justify-end gap-3">
            <button
                onClick={handlePrint}
                className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
                <Printer className="w-4 h-4" />
                Print
            </button>

            <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-[#00d26a] hover:bg-[#00b85c] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
            >
                <Download className="w-4 h-4" />
                Download
            </button>
        </div>
    )
}
