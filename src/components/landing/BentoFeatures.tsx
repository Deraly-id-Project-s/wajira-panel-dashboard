"use client"

import React from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { BarChart3, Cloud, Layers, ShieldCheck } from "lucide-react"

export default function BentoFeatures() {
  return (
    <section id="features" className="py-32 w-full bg-[#FAFAFA] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-20 text-center max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
            Satu alat, ratusan kemungkinan.
          </h2>
          <p className="text-xl text-gray-500 font-medium leading-relaxed">
            Lepaskan diri dari batasan software jadul. Dengan Wajira, Anda mendapatkan fleksibilitas dan kecepatan yang tiada tara.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 auto-rows-[300px] md:auto-rows-[400px]">
          {/* Card 1 - Biru Langit */}
          <motion.div
            whileHover={{ scale: 0.98, rotateX: 2, rotateY: 5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="md:col-span-2 relative overflow-hidden bg-sky-100 rounded-[3.5rem] shadow-clay-sm hover:shadow-clay p-10 flex flex-col justify-end group transition-shadow"
          >
            <div className="absolute top-10 left-10 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
              <BarChart3 className="w-8 h-8 text-sky-500" />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-3 z-10">Analitik Menyeluruh</h3>
            <p className="text-slate-700 text-lg z-10 max-w-md"> Pantau keseluruhan armada, penjualan, dan metrik kas secara real-time tanpa delay. </p>
          </motion.div>

          {/* Card 2 - Pink Cerah */}
          <motion.div
            whileHover={{ scale: 0.98, rotateX: 2, rotateY: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative overflow-hidden bg-pink-100 rounded-[3.5rem] shadow-clay-sm hover:shadow-clay p-10 flex flex-col justify-end group transition-shadow"
          >
            <div className="absolute top-10 left-10 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Cloud className="w-8 h-8 text-pink-500" />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-3 z-10">Cloud Native</h3>
            <p className="text-slate-700 text-lg z-10">Akses darimana saja.</p>
          </motion.div>

          {/* Card 3 - Amber Lembut */}
          <motion.div
            whileHover={{ scale: 0.98, rotateX: -2, rotateY: 5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative overflow-hidden bg-amber-100 rounded-[3.5rem] shadow-clay-sm hover:shadow-clay p-10 flex flex-col justify-end group transition-shadow"
          >
            <div className="absolute top-10 left-10 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-3 z-10">Keamanan Ekstra</h3>
            <p className="text-slate-700 text-lg z-10">Sistem keamanan bank grade.</p>
          </motion.div>

          {/* Card 4 - Soft Purple */}
          <motion.div
            whileHover={{ scale: 0.98, rotateX: -2, rotateY: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="md:col-span-2 relative overflow-hidden bg-purple-100 rounded-[3.5rem] shadow-clay-sm hover:shadow-clay p-10 flex flex-col justify-end group transition-shadow"
          >
            <div className="absolute top-10 left-10 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Layers className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-3 z-10">Integrasi Multi-cabang</h3>
            <p className="text-slate-700 text-lg z-10 max-w-md">Gabungkan semua laporan tiap cabang perusahaan dengan sekali klik.</p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
