"use client"

import React from "react"
import { motion } from "framer-motion"
import { MapPin, Phone, Mail } from "lucide-react"

export default function ContactUs() {
  return (
    <section className="py-32 w-full bg-[#FAFAFA] relative overflow-hidden" id="contact">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
          
          {/* Left Text */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
              Mampir ke markas kami.
            </h2>
            <p className="text-lg md:text-xl text-slate-500 font-medium mb-12 leading-relaxed">
              Punya kebutuhan kolaborasi tingkat tinggi atau butuh kustomisasi modul *on-premise* khusus? Silakan mampir santai minum kopi bersama tim engineer kami.
            </p>

            <div className="space-y-8">
              <div className="flex items-start space-x-5">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-blue-200">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-800 mb-1">Sudirman Central Business District</h4>
                  <p className="text-slate-500 font-medium leading-relaxed">Equity Tower, Lantai 35<br/>Jl. Jend. Sudirman Kav 52-53, Jakarta Selatan</p>
                </div>
              </div>

              <div className="flex items-center space-x-5">
                <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-pink-200">
                  <Mail className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-800 mb-0">E-mail Enterprise</h4>
                  <p className="text-slate-500 font-medium leading-relaxed">hello@wajira.id</p>
                </div>
              </div>

              <div className="flex items-center space-x-5">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-amber-200">
                  <Phone className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-800 mb-0">Direct Line</h4>
                  <p className="text-slate-500 font-medium leading-relaxed">+62 811 1234 5678</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Map (Claymorphism frame) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, type: "spring", delay: 0.2 }}
            className="w-full relative group"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-pink-100 rounded-[3.5rem] blur-xl opacity-70 group-hover:opacity-100 transition duration-500" />
            <div className="relative bg-white p-4 md:p-6 rounded-[3rem] shadow-clay border border-slate-100 z-10 w-full h-[400px] md:h-[500px]">
              <div className="w-full h-full rounded-[2rem] overflow-hidden bg-slate-100 shadow-inner relative">
                {/* Embedded Google Maps (Placeholder Jakarta SCBD) */}
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15865.176008103328!2d106.8041926601449!3d-6.224376378893992!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f14e21a44c9b%3A0xc0d2bbfbfd199914!2sSudirman%20Central%20Business%20District%2C%20Senayan%2C%20Kebayoran%20Baru%2C%20South%20Jakarta%20City%2C%20Jakarta!5e0!3m2!1sen!2sid!4v1717203387815!5m2!1sen!2sid" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0, filter: "grayscale(40%) contrast(1.1) brightness(1.05)" }} 
                  allowFullScreen={true} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full object-cover transition-all duration-500 hover:filter-none absolute inset-0 z-0"
                ></iframe>
                
                {/* Hover overlay instruction */}
                <div className="absolute inset-0 z-10 bg-black/5 opacity-100 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none flex items-center justify-center">
                </div>
              </div>
            </div>
            
            {/* Small floating badge */}
             <motion.div 
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="absolute -bottom-6 -left-6 md:-left-12 bg-white py-3 px-6 md:px-8 rounded-full shadow-clay-sm border border-slate-100 z-20 flex items-center space-x-3 pointer-events-none"
             >
               <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]"></span>
               </span>
               <span className="font-extrabold text-slate-800 text-sm md:text-base tracking-tight">Wajira HQ Jakarta</span>
             </motion.div>
          </motion.div>
          
        </div>
      </div>
    </section>
  )
}
