"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles, Smile, Gamepad2, Mic } from "lucide-react"

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center overflow-hidden pt-24 pb-20 px-6 bg-slate-50/50">
      {/* Background Blobs for Amie/Honk style */}
      <div className="absolute top-1/4 left-1/4 w-72 md:w-96 h-72 md:h-96 bg-pink-300/30 rounded-full mix-blend-multiply filter blur-[70px] md:blur-[100px] animate-pulse duration-1000" />
      <div className="absolute top-1/4 right-1/4 w-72 md:w-96 h-72 md:h-96 bg-sky-300/30 rounded-full mix-blend-multiply filter blur-[70px] md:blur-[100px] animate-pulse duration-700" />
      <div className="absolute -bottom-8 left-1/3 w-72 md:w-96 h-72 md:h-96 bg-amber-300/30 rounded-full mix-blend-multiply filter blur-[70px] md:blur-[100px] animate-pulse duration-1000" />
      
      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center mt-12 md:mt-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="inline-flex items-center space-x-2 bg-white/70 backdrop-blur-md px-4 py-2 rounded-full border border-gray-200/80 mb-6 md:mb-8 shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs md:text-sm font-semibold tracking-wide text-gray-700">Wajira Enterprise 2.0</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4, delay: 0.1 }}
          className="text-[4.5rem] leading-[0.95] md:text-[9.5rem] font-black tracking-[-0.04em] text-gray-900 mb-6 drop-shadow-sm"
        >
          Kendali Penuh, <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
            Kinerja Utuh.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl px-4 text-lg md:text-2xl text-gray-600 font-medium tracking-tight mb-10 leading-relaxed md:leading-normal"
        >
          Monitor penjualan, arus kas, dan operasional dalam satu layar cerdas.
          Desain responsif sesungguhnya untuk tim modern.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto px-6 sm:px-0"
        >
          <Link href="/dashboard" className="w-full sm:w-auto">
            <button className="group flex w-full items-center justify-center space-x-2 bg-primary text-white px-8 py-4 rounded-full font-bold text-base md:text-lg shadow-clay hover:shadow-clay-lg hover:-translate-y-1 transition-all duration-300">
              <span>Coba Gratis Sekarang</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          <button className="flex items-center justify-center space-x-2 bg-white text-gray-800 px-8 py-4 rounded-full font-bold text-base md:text-lg shadow-clay-sm hover:shadow-clay hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto mt-2 sm:mt-0">
            <span>Jadwalkan Demo</span>
          </button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5, type: "spring" }}
        className="relative mt-16 md:mt-32 z-10 w-full max-w-6xl mx-auto px-2 md:px-0"
      >
        <div className="relative rounded-[2rem] border border-gray-200/50 bg-white/40 backdrop-blur-2xl p-2 md:p-4 shadow-clay-lg">
          <div className="rounded-[1.5rem] overflow-hidden border border-gray-100 bg-white">
            <Image
              src="/wajira-footer-design.png"
              alt="Dashboard Mockup"
              width={1400}
              height={800}
              className="w-full h-auto object-cover"
              priority
            />
          </div>
          
          {/* Floating Emoji / Objects */}
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -top-6 -left-6 md:-top-12 md:-left-20 w-16 h-16 md:w-32 md:h-32 bg-white rounded-[1.5rem] shadow-clay flex items-center justify-center text-3xl md:text-6xl border border-gray-100/50"
          >
            <Smile className="w-8 h-8 md:w-16 md:h-16 text-sky-500 fill-sky-100" />
          </motion.div>

          <motion.div
            animate={{
              y: [0, 20, 0],
              rotate: [0, -15, 10, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute -bottom-6 -right-6 md:-bottom-10 md:-right-10 w-14 h-14 md:w-28 md:h-28 bg-white rounded-[1.2rem] md:rounded-[2rem] shadow-clay flex items-center justify-center text-2xl md:text-5xl border border-gray-100/50"
          >
            <Gamepad2 className="w-7 h-7 md:w-14 md:h-14 text-pink-500 fill-pink-100" />
          </motion.div>
          
          <motion.div
            animate={{
              y: [0, -15, 0],
              rotate: [0, 20, -10, 0],
            }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
            className="absolute top-1/2 -left-8 md:top-1/3 md:-right-16 w-12 h-12 md:w-24 md:h-24 bg-white rounded-[1rem] shadow-clay flex items-center justify-center border border-gray-100/50"
          >
            <Mic className="w-6 h-6 md:w-12 md:h-12 text-amber-500 fill-amber-100" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
