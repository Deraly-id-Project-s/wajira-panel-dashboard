"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Check, Sparkles } from "lucide-react"

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <section className="py-32 w-full bg-white relative overflow-hidden" id="pricing">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
            Investasi cerdas, <br className="hidden md:block"/> ROI tanpa batas.
          </h2>
          <p className="text-xl text-slate-500 font-medium mb-10 max-w-2xl mx-auto">
            Mulai dari gratis untuk tim kecil, bayar per modul sesuai kebutuhan khusus cabang perusahaan Anda.
          </p>

          <div className="flex items-center justify-center space-x-4 mb-20">
            <span className={`text-lg font-bold ${!isYearly ? "text-slate-900" : "text-slate-400"}`}>Bulanan</span>
            <button 
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-20 h-10 bg-slate-200 rounded-full flex items-center p-1 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-colors"
            >
              <motion.div
                className="w-8 h-8 bg-blue-600 rounded-full shadow-md"
                animate={{ x: isYearly ? 40 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-lg font-bold flex items-center ${isYearly ? "text-slate-900" : "text-slate-400"}`}>
              Tahunan <span className="text-[0.65rem] bg-amber-100 text-amber-700 px-3 py-1 rounded-full ml-3 uppercase tracking-widest font-black shadow-sm">Hemat 20%</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Basic Plan */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100 shadow-sm flex flex-col transition-all"
          >
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Starter</h3>
            <p className="text-slate-500 mb-8 font-medium">Untuk startup & UMKM</p>
            <div className="mb-10 font-black text-5xl text-slate-900">
              {isYearly ? "Rp 0" : "Rp 0"}
              <span className="text-lg font-semibold text-slate-400"> /bln</span>
            </div>
            <ul className="space-y-5 mb-10 flex-1">
              {["1 Cabang Perusahaan", "Maks 5 User Aktif", "Modul Kas Standar", "Basic Dashboard"].map((feat, i) => (
                <li key={i} className="flex items-center text-slate-700 font-bold border-b border-slate-200 pb-3 last:border-0 last:pb-0">
                  <Check className="w-5 h-5 text-emerald-500 mr-4 shrink-0" strokeWidth={3} /> {feat}
                </li>
              ))}
            </ul>
            <button className="w-full py-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors">
              Mulai Gratis
            </button>
          </motion.div>

          {/* Pro Plan */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-blue-600 rounded-[2.5rem] p-10 border border-blue-500 shadow-clay-lg flex flex-col relative overflow-hidden transform md:-translate-y-8"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 px-6 py-1.5 rounded-b-[1rem] text-xs font-black tracking-widest uppercase">
              Paling Populer
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 mt-4">Growth</h3>
            <p className="text-blue-200 mb-8 font-medium">Scale up tanpa hambatan</p>
            <div className="mb-10 font-black text-5xl text-white">
              {isYearly ? "3M" : "3.5M"}
              <span className="text-lg font-semibold text-blue-200"> /bln</span>
            </div>
            <ul className="space-y-5 mb-10 flex-1">
              {[
                "Unlimited Cabang", 
                "Hingga 50 User Aktif", 
                "Semua Modul Terbuka", 
                "Advanced Insight",
                "Integrasi API Bawaan",
                "Priority Support 24/7"
              ].map((feat, i) => (
                <li key={i} className="flex items-center text-white font-bold border-b border-blue-500 pb-3 last:border-0 last:pb-0">
                  <Check className="w-5 h-5 text-sky-300 mr-4 shrink-0" strokeWidth={3} /> {feat}
                </li>
              ))}
            </ul>
            <button className="w-full py-4 rounded-full bg-white hover:bg-slate-50 text-blue-700 font-black shadow-[0_8px_20px_0_rgba(0,0,0,0.15)] transition-shadow">
              Coba Gratis 14 Hari
            </button>
          </motion.div>

          {/* Custom Plan */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-slate-900 rounded-[2.5rem] p-10 border border-slate-800 shadow-xl flex flex-col transition-all"
          >
            <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
            <p className="text-slate-400 mb-8 font-medium">Untuk raksasa korporasi</p>
            <div className="mb-10 font-black text-5xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Custom
            </div>
            <ul className="space-y-5 mb-10 flex-1">
              {[
                "Unlimited Segalanya", 
                "Dedicated Manager", 
                "Custom Modul", 
                "SLA 99.99%",
                "On-Premise Deployment"
              ].map((feat, i) => (
                <li key={i} className="flex items-center text-slate-300 font-bold border-b border-slate-800 pb-3 last:border-0 last:pb-0">
                  <Sparkles className="w-5 h-5 text-purple-400 mr-4 shrink-0" /> {feat}
                </li>
              ))}
            </ul>
            <button className="w-full py-4 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors">
              Hubungi Sales
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
