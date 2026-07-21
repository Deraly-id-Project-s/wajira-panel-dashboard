"use client"

import React from "react"
import { motion } from "framer-motion"
import { Star } from "lucide-react"

const testimonials = [
  { name: "John Doe", role: "CEO, Acme Corp", text: "Dashboard Wajira benar-benar mengubah cara kami melihat data internal secara langsung." },
  { name: "Jane Smith", role: "CFO, Globex", text: "Animasi yang mulus dan fitur real-time membuat tim saya sangat produktif setiap saat." },
  { name: "Ahmad", role: "CTO, StartupX", text: "Integrasi yang mudah dan desain yang sangat elegan! Layanan Support juga juara!" },
  { name: "Siti", role: "Manager, Soylent", text: "Luar biasa! Sangat modern dan responsif di mobile. Mudah dikendalikan via smartphone." },
  { name: "Budi", role: "Founder, Initech", text: "Bento features-nya sangat membantu visualisasi metrik kerja tim harian kami." },
]

export default function Testimonials() {
  return (
    <section className="py-32 w-full overflow-hidden bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
          Apa kata mereka?
        </h2>
        <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
          Dipercaya oleh pemimpin bisnis dari berbagai industri.
        </p>
      </div>

      <div className="relative flex max-w-[100vw] overflow-hidden group">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 md:w-32 bg-gradient-to-r from-slate-50 to-transparent"></div>
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 md:w-32 bg-gradient-to-l from-slate-50 to-transparent"></div>
        
        <motion.div
          className="flex items-center w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 45 }}
        >
          <div className="flex space-x-6 px-3 items-center">
             {testimonials.map((t, i) => (
              <div key={i} className="w-[320px] md:w-[350px] bg-white rounded-[2.5rem] p-8 shadow-clay-sm flex flex-col justify-between hover:shadow-clay transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex space-x-1 mb-6 text-amber-400">
                  <Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" />
                </div>
                <p className="text-slate-800 text-lg font-bold italic mb-8 leading-relaxed">
                  "{t.text}"
                </p>
                <div>
                  <h4 className="text-slate-900 font-extrabold">{t.name}</h4>
                  <p className="text-slate-500 text-sm font-medium">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex space-x-6 px-3 items-center">
             {testimonials.map((t, i) => (
              <div key={i} className="w-[320px] md:w-[350px] bg-white rounded-[2.5rem] p-8 shadow-clay-sm flex flex-col justify-between hover:shadow-clay transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex space-x-1 mb-6 text-amber-400">
                  <Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" />
                </div>
                <p className="text-slate-800 text-lg font-bold italic mb-8 leading-relaxed">
                  "{t.text}"
                </p>
                <div>
                  <h4 className="text-slate-900 font-extrabold">{t.name}</h4>
                  <p className="text-slate-500 text-sm font-medium">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
