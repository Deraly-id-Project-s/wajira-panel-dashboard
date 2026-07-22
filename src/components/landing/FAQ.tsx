"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

const faqs = [
  { q: "Apakah Wajira kompatibel dengan mobile?", a: "Tentu! Wajira dibangun dengan prinsip mobile-first yang memungkinkan kontrol penuh dari perangkat mana saja (smartphone, tablet) secara responsif." },
  { q: "Berapa lama proses instalasinya?", a: "Instalasi Wajira Cloud dilakukan instan dan siap pakai. Untuk sistem On-Premise, tim kami membutuhkan maksimal 1x24 jam untuk deployment menyeluruh ke server internal Anda." },
  { q: "Bagaimana dengan jaminan keamanannya?", a: "Keamanan adalah lapis fitur bawaan terkuat kami. Wajira menggunakan standar enkripsi AES-256 dan regulasi bank-grade privacy untuk memastikan data Anda aman terisolasi." },
  { q: "Apakah ada pelatihan untuk karyawan kami?", a: "Pasti. Kami menyediakan layanan On-Boarding interaktif serta library modul dokumentasi video step-by-step untuk membantu adaptasi seluruh divisi dari hari pertama." }
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-32 w-full bg-[#FAFAFA]" id="faq">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            Pertanyaan yang Beredar
          </h2>
          <p className="text-xl text-slate-500 font-medium">Biar kami perjelas semuanya untuk Anda.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <div key={i} className="bg-white rounded-[2rem] shadow-clay-sm overflow-hidden border border-slate-100 transition-shadow hover:shadow-clay">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-6 md:p-8 text-left focus:outline-none ring-0 highlight-none focus-visible:bg-slate-50"
                >
                  <span className="text-lg md:text-xl font-bold text-slate-800 pr-8 leading-snug">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <ChevronDown className="w-6 h-6 text-slate-400 shrink-0" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.04, 0.62, 0.23, 0.98] }}
                    >
                      <div className="px-6 md:px-8 pb-8 text-slate-600 text-[1.1rem] leading-relaxed pt-2">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
