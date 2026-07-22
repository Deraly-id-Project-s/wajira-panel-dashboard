"use client"

import React, { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

const steps = [
  {
    title: "1. Integrasi Sistem",
    desc: "Sambungkan Wajira ke data existing perusahaan Anda dalam hitungan detik. Tanpa coding.",
  },
  {
    title: "2. Sesuaikan Modul",
    desc: "Pilih modul ERP yang relevan (Penjualan, Kas, Inventory) dan atur hak akses tim.",
  },
  {
    title: "3. Monitor Seca Real-time",
    desc: "Duduk manis dan lihat grafik performa bisnis bergerak menyajikan insight berharga.",
  }
]

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Track scroll inside the container to draw the neon line
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  })

  // Height of the glowing line
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])
  
  return (
    <section id="how-it-works" ref={containerRef} className="relative py-40 bg-[#030712] text-white">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20">
        
        {/* Left Side: Text and Glowing Timeline */}
        <div className="relative">
          <div className="mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white drop-shadow-sm">
              Bagaimana ini bekerja?
            </h2>
            <p className="text-slate-400 text-lg">Hanya butuh tiga langkah simpel.</p>
          </div>

          <div className="relative pl-10 md:pl-16 space-y-32">
            {/* The Neon Track Background */}
            <div className="absolute top-0 bottom-0 left-[3px] md:left-[19px] w-[2px] bg-slate-800 rounded-full" />
            
            {/* The Glowing Neon Line */}
            <motion.div 
              style={{ height: lineHeight }}
              className="absolute top-0 left-0 md:left-[16px] w-[8px] bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.8)] z-10 origin-top"
            />
            
            {/* Steps Text */}
            {steps.map((step, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-12 md:-left-[3.2rem] mt-1 w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-700 z-0" />
                <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                <p className="text-slate-400 text-lg leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Sticky Visual (1Password Style) */}
        <div className="relative hidden md:block">
          <div className="sticky top-40 w-full aspect-square rounded-[3rem] border border-slate-800 bg-slate-900/50 backdrop-blur overflow-hidden flex items-center justify-center p-8 shadow-2xl">
            {/* Abstract visual mockup */}
            <div className="relative w-full h-full rounded-[2rem] bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-slate-700/50 flex flex-col p-6 shadow-inner">
               {/* Decorative Dashboard Elements */}
               <div className="w-full flex justify-between items-center mb-10">
                 <div className="w-20 h-4 bg-slate-700 rounded-full" />
                 <div className="w-8 h-8 bg-blue-500/20 rounded-full" />
               </div>
               
               <div className="w-full bg-slate-800/80 rounded-2xl h-1/2 flex items-end p-4 gap-4">
                  <motion.div style={{ height: useTransform(scrollYProgress, [0, 1], ["20%", "70%"]) }} className="w-full bg-blue-500 rounded-t-lg origin-bottom transition-all duration-300" />
                  <motion.div style={{ height: useTransform(scrollYProgress, [0, 1], ["40%", "90%"]) }} className="w-full bg-purple-500 rounded-t-lg origin-bottom transition-all duration-300" />
                  <motion.div style={{ height: useTransform(scrollYProgress, [0, 1], ["30%", "100%"]) }} className="w-full bg-pink-500 rounded-t-lg origin-bottom transition-all duration-300" />
               </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
