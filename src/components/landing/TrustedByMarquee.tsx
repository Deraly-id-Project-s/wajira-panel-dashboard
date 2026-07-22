"use client"

import React from "react"
import { motion } from "framer-motion"

const companies = [
  "Acme Corp",
  "Globex",
  "Soylent",
  "Initech",
  "Umbrella",
  "Massive Dynamic",
  "Stark Ind.",
  "Wayne Ent.",
];

export default function TrustedByMarquee() {
  return (
    <section className="py-20 w-full overflow-hidden bg-white/30 backdrop-blur-sm border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-6 mb-8 text-center text-xs md:text-sm font-semibold text-gray-400 uppercase tracking-widest">
        Dipercaya oleh lebih dari 5,000+ tim enterprise
      </div>
      
      <div className="relative flex max-w-[100vw] overflow-hidden group">
        {/* Left fade gradient */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 md:w-48 bg-gradient-to-r from-slate-50 to-transparent"></div>
        {/* Right fade gradient */}
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 md:w-48 bg-gradient-to-l from-slate-50 to-transparent"></div>
        
        <motion.div
          className="flex whitespace-nowrap items-center w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
        >
          <div className="flex space-x-12 md:space-x-32 px-6 md:px-16 items-center">
             {companies.map((company, i) => (
              <span key={i} className="text-2xl md:text-4xl font-black text-gray-300 tracking-tighter hover:text-gray-400 transition-colors cursor-default select-none">{company}</span>
            ))}
          </div>
          <div className="flex space-x-12 md:space-x-32 px-6 md:px-16 items-center">
             {companies.map((company, i) => (
              <span key={i} className="text-2xl md:text-4xl font-black text-gray-300 tracking-tighter hover:text-gray-400 transition-colors cursor-default select-none">{company}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
