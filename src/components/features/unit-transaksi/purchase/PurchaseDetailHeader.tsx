import { Button } from "@/components/ui/button"

import { useRouter } from "next/router"

interface Props {
    purchaseId: string
}

export default function PurchaseDetailHeader({ purchaseId }: Props) {
    const router = useRouter()

    return (
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-xl font-semibold">
                    Detail Pembelian Unit
                </h1>
                <p className="text-sm text-muted-foreground">
                    Informasi lengkap pembelian
                </p>
            </div>

            <div className="flex gap-2">
                <Button
                    variant="outline"
                    onClick={() =>
                        router.push(
                            `/transaksi/pembelian-unit/${purchaseId}/edit`
                        )
                    }
                >
                    Edit
                </Button>

                <Button
                    onClick={() =>
                        router.push(
                            `/transaksi/pembelian-unit/${purchaseId}/payment`
                        )
                    }
                >
                    Bayar
                </Button>
            </div>
        </div>
    )
}
