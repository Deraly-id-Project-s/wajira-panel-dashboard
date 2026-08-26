import { useState } from "react"
import { PiutangService } from "@/services/piutang.service"
import { PiutangPayment } from "@/types/piutang.types"

export function usePiutang() {
    const [data, setData] = useState(
        PiutangService.getAll()
    )

    const refresh = () =>
        setData([...PiutangService.getAll()])

    const addPayment = (id: string, payment: PiutangPayment) => {
        PiutangService.addPayment(id, payment)
        refresh()
    }

    return { data, addPayment }
}
