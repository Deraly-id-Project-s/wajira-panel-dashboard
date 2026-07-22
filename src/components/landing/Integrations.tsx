"use client"

import React from "react"
import Image from "next/image"
import { motion } from "framer-motion"

export default function Integrations() {
  const nodes = [
    { color: "bg-[#107C41]", label: "Excel", x: -140, y: -100 },
    { color: "bg-[#EA4335]", label: "Google", x: 140, y: -110 },
    { color: "bg-[#635BFF]", label: "Stripe", x: 170, y: 70 },
    { color: "bg-[#4A154B]", label: "Slack", x: -160, y: 80 },
    { color: "bg-[#FF9900]", label: "AWS", x: 0, y: 140 },
    { color: "bg-[#FF7A59]", label: "HubSpot", x: 0, y: -160 },
  ]

  return (
    <section className="py-32 w-full bg-slate-50 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 text-center z-10 relative">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
          Terhubung dengan segalanya.
        </h2>
        <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto mb-20 leading-relaxed">
          Wajira dilengkapi ekosistem API terbuka canggih untuk mengimpor atau mengekspor data ke perangkat favorit perusahaan secara *real-time*.
        </p>

        <div className="relative w-full h-[350px] md:h-[450px] flex items-center justify-center">
          {/* Connecting Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 hidden md:block">
             {nodes.map((n, i) => (
                <motion.line 
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut", delay: i * 0.1 }}
                  key={i} 
                  x1="50%" y1="50%" 
                  x2={`calc(50% + ${n.x * 1.5}px)`} 
                  y2={`calc(50% + ${n.y * 1.5}px)`} 
                  stroke="currentColor" 
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  className="text-slate-500"
                />
             ))}
          </svg>

          {/* Central Logo */}
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="relative w-28 h-28 md:w-36 md:h-36 bg-white rounded-[2rem] shadow-clay flex items-center justify-center z-20 border border-slate-100 p-6 md:p-8"
          >
             <Image src="/wajira-logo.png" alt="Wajira Main Hub" width={80} height={80} className="w-full h-full object-contain drop-shadow-sm" />
          </motion.div>

          {/* Peripheral Nodes (Desktop specific positions using * 1.5 scale) */}
          <div className="hidden md:block">
            {nodes.map((n, i) => (
              <motion.div 
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1 + 0.5, type: "spring", stiffness: 200 }}
                className="absolute z-10 top-1/2 left-1/2"
                style={{
                  marginLeft: `${n.x * 1.5}px`,
                  marginTop: `${n.y * 1.5}px`,
                  x: "-50%",
                  y: "-50%",
                }}
              >
                <div className="flex flex-col items-center">
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3 + (i % 3), ease: "easeInOut", delay: i * 0.2 }}
                    className={`w-20 h-20 rounded-[1.3rem] ${n.color} shadow-lg flex items-center justify-center text-white font-extrabold tracking-tight text-sm border-[3px] border-white`}
                  >
                    {n.label}
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Mobile list view for nodes (fallback if screen is too small) */}
          <div className="md:hidden flex flex-wrap gap-4 absolute -bottom-10 justify-center w-full px-4">
            {nodes.map((n, i) => (
               <div key={i} className={`px-4 py-2 rounded-full ${n.color} text-white font-bold text-xs ring-4 ring-white shadow-sm`}>
                 {n.label}
               </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
