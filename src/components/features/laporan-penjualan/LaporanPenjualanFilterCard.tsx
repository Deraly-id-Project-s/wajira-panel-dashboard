"use client"

import { useRouter, useParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { format } from "date-fns"
import { FileText } from "lucide-react"
import { formatDateUI } from '@/lib/utils/date';

export default function LaporanPenjualanFilterCard() {
    const router = useRouter()
    const params = useParams()
    const slug = params?.slug as string

    const [jenis, setJenis] = useState("")
    const [awal, setAwal] = useState<Date | undefined>()
    const [akhir, setAkhir] = useState<Date | undefined>()

    const handleSubmit = () => {
        if (!jenis || !awal || !akhir) {
            toast.error("Semua field wajib diisi")
            return
        }

        router.push(
            `/dashboard/${slug}/laporan/laporan-penjualan/${jenis}?awal=${awal.toISOString()}&akhir=${akhir.toISOString()}`
        )
    }

    return (
        <div className="bg-white rounded-md border p-8 space-y-10 shadow-sm">
            <div className="flex flex-col space-y-6">

                {/* Jenis */}
                <div className="flex items-center">
                    <label className="w-48 text-sm font-medium text-gray-900">
                        Jenis Laporan
                    </label>
                    <div className="w-[300px]">
                        <Select value={jenis} onValueChange={setJenis}>
                            <SelectTrigger className="w-full bg-white border-gray-200">
                                <SelectValue placeholder="Pilih jenis laporan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="per-nota">
                                    Laporan Penjualan Per Nota
                                </SelectItem>
                                <SelectItem value="per-type">
                                    Laporan Penjualan Per Type
                                </SelectItem>
                                <SelectItem value="per-supplier">
                                    Laporan Penjualan Per Supplier
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Periode Awal */}
                <div className="flex items-center">
                    <label className="w-48 text-sm font-medium text-gray-900">
                        Periode Awal
                    </label>
                    <div className="w-[300px]">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal bg-white border-gray-200">
                                    {awal ? formatDateUI(awal) : "Pilih tanggal"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={awal}
                                    onSelect={setAwal}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* Periode Akhir */}
                <div className="flex items-center">
                    <label className="w-48 text-sm font-medium text-gray-900">
                        Periode Akhir
                    </label>
                    <div className="w-[300px]">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal bg-white border-gray-200">
                                    {akhir ? formatDateUI(akhir) : "Pilih tanggal"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={akhir}
                                    onSelect={setAkhir}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

            </div>

            {/* Button */}
            <div className="flex justify-center items-center gap-4 pt-4">
                <button
                    onClick={() => { setJenis(""); setAwal(undefined); setAkhir(undefined); }}
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                    Batal
                </button>

                <button
                    onClick={handleSubmit}
                    className="bg-[#132c4a] hover:bg-[#1e3256] text-white px-6 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                >
                    <FileText className="w-4 h-4" />
                    Simpan
                </button>
            </div>

        </div>
    )
}