"use client"

import React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Sparkles, ArrowRight } from "lucide-react"

export default function FinalCTA() {
  return (
    <section className="bg-slate-900 py-32 px-6 relative overflow-hidden" id="pricing">
      {/* Glow Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
        <div className="w-[400px] h-[300px] md:w-[600px] md:h-[400px] bg-blue-500/20 filter blur-[100px] md:blur-[120px] rounded-full" />
        <div className="absolute w-[300px] h-[300px] md:w-[400px] md:h-[400px] bg-purple-500/20 filter blur-[80px] md:blur-[100px] rounded-full translate-x-32" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10 text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em] text-white mb-6 leading-tight">
            Siap untuk Melompat<br className="hidden md:block"/> ke Masa Depan?
          </h2>
          <p className="text-lg md:text-2xl text-slate-400 font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
            Tinggalkan cara lama. Gabungkan seluruh operasional cabang ke satu ekosistem Wajira hari ini dan rasakan lonjakan produktivitas Anda.
          </p>

          <Link href="/dashboard" className="group relative inline-flex items-center justify-center px-8 py-5 md:px-10 md:py-6 rounded-full bg-blue-600 text-white font-bold text-lg md:text-xl transition-all duration-300 hover:scale-105 hover:bg-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:shadow-[0_0_50px_rgba(37,99,235,0.8)]">
            <Sparkles className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform origin-center text-blue-200" />
            <span>Mulai Trial 14-Hari Gratis</span>
            <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <p className="text-slate-500 mt-6 text-sm">Tidak butuh kartu kredit. Setup dan instalasi dalam hitungan menit.</p>
        </motion.div>
      </div>
    </section>
  )
}
