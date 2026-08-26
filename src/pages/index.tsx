import Link from "next/link"
import Head from "next/head"
import { ArrowRight, LayoutDashboard, BarChart3, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useEffect, useState } from "react"
import Image from "next/image"

export default function Home() {
  const [mounted, setMounted] = useState(false)

  // Ensure CSR rendering only
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
        <title>Wajira Dashboard</title>
      </Head>

      <div className="relative min-h-screen bg-gradient-to-b from-background to-slate-50/50 pb-40 flex flex-col justify-center">
        {/* ================= HERO ================= */}
        <main className="relative z-[100] mx-auto max-w-7xl px-6 py-24 sm:py-32 flex flex-col items-center justify-center min-h-[60vh]">
          <section className="mx-auto max-w-4xl text-center space-y-8">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
              Wajira <span className="text-primary">Dashboard</span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
              Sistem dashboard internal yang modern dan responsif untuk monitoring performa keuangan,
              penjualan, dan operasional perusahaan Anda secara real-time.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link href="/dashboard">
                <Button size="lg" className="h-14 px-8 text-base rounded-full shadow-lg hover:shadow-xl transition-all gap-2 w-full sm:w-auto">
                  Masuk ke Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </section>

          {/* ================= FEATURES ================= */}
          <section className="mt-24 grid gap-8 md:grid-cols-3 w-full">
            <Card className="rounded-md p-8 shadow-sm hover:shadow-md transition-shadow border-none bg-white/50 backdrop-blur-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <LayoutDashboard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Dashboard Terpusat
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Semua data keuangan dan penjualan ditampilkan dalam satu
                dashboard yang rapi dan mudah dipahami.
              </p>
            </Card>

            <Card className="rounded-md p-8 shadow-sm hover:shadow-md transition-shadow border-none bg-white/50 backdrop-blur-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Insight & Visualisasi
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Grafik dan KPI membantu manajemen mengambil keputusan
                berbasis data secara cepat dan akurat.
              </p>
            </Card>

            <Card className="rounded-md p-8 shadow-sm hover:shadow-md transition-shadow border-none bg-white/50 backdrop-blur-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Sistem Internal Aman
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Dirancang untuk penggunaan internal perusahaan dengan
                kontrol akses dan struktur data yang aman.
              </p>
            </Card>
          </section>
        </main>

        {/* ================= FIXED FOOTER IMAGE ================= */}
        <div className="fixed bottom-0 left-0 w-full pointer-events-none z-0">
          <Image
            src="/wajira-footer-design.png"
            alt="Wajira Illustration"
            width={1920}
            height={1080}
            className="w-full h-auto object-cover max-h-[90vh] mb-1 sm:max-h-[60vh] pointer-events-auto select-none"
            draggable="false"
          />
        </div>
      </div>
    </>
  )
}