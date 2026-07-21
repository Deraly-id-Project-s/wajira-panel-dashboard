"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, useScroll, useMotionValueEvent } from "framer-motion"
import { Home, LayoutDashboard, Info, Briefcase, Sparkles } from "lucide-react"

export default function Navbar() {
  const { scrollY } = useScroll()
  const [hidden, setHidden] = useState(false)
  
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0
    if (latest > 150 && latest > previous) {
      setHidden(true)
    } else {
      setHidden(false)
    }
  })

  // Desktop Navbar
  const DesktopNav = () => (
    <motion.header
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="fixed top-0 inset-x-0 h-20 bg-white/70 backdrop-blur-md border-b border-gray-100 z-[100] hidden md:flex items-center justify-between px-8"
    >
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center p-1 border border-slate-200">
          <Image src="/wajira-logo.png" alt="Wajira" width={32} height={32} className="w-full h-full object-contain drop-shadow-sm" />
        </div>
        <span className="font-extrabold text-xl tracking-tight text-slate-800">Wajira</span>
      </div>
      
      <nav className="flex space-x-8 items-center text-sm font-medium text-gray-600">
        <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
        <Link href="#how-it-works" className="hover:text-primary transition-colors">How it works</Link>
        <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
      </nav>

      <div className="flex items-center space-x-4">
        <Link href="/login" className="text-sm font-medium hover:text-blue-600 transition-colors">
          Log in
        </Link>
        <Link href="/dashboard" className="group px-6 py-2.5 rounded-full bg-blue-600 text-white text-sm font-bold shadow-clay-sm hover:shadow-clay hover:-translate-y-[2px] transition-all duration-300 flex items-center space-x-2">
          <span>Mulai Sekarang</span>
          <Sparkles className="w-4 h-4 text-white group-hover:rotate-12 transition-transform origin-center" />
        </Link>
      </div>
    </motion.header>
  )

  // Mobile Bottom Dock (Tudder Bar)
  const MobileDock = () => {
    return (
      <>
        {/* Mobile top logo sticky */}
        <div className="fixed top-0 left-0 w-full h-16 bg-gradient-to-b from-white to-transparent z-[90] flex items-center px-6 md:hidden">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center p-1 border border-slate-200">
                <Image src="/wajira-logo.png" alt="Wajira" width={28} height={28} className="w-full h-full object-contain" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-slate-800">Wajira</span>
            </div>
        </div>

        {/* Mobile floating dock */}
        <div className="fixed bottom-6 inset-x-0 z-[100] flex justify-center md:hidden pointer-events-none px-4">
          <div className="flex space-x-1 p-2 bg-white/70 backdrop-blur-xl border border-gray-100 shadow-clay rounded-3xl pointer-events-auto items-center">
            <Link href="/" className="p-3 rounded-full hover:bg-gray-100/50 text-gray-600 active:bg-gray-200 transition-colors">
              <Home className="w-6 h-6" />
            </Link>
            <Link href="#features" className="p-3 rounded-full hover:bg-gray-100/50 text-gray-600 active:bg-gray-200 transition-colors">
              <Briefcase className="w-6 h-6" />
            </Link>
            <Link href="#how-it-works" className="p-3 rounded-full hover:bg-gray-100/50 text-gray-600 active:bg-gray-200 transition-colors">
              <Info className="w-6 h-6" />
            </Link>
            <Link href="/dashboard" className="p-3 ml-2 rounded-[1.2rem] bg-primary text-white shadow-clay-sm flex flex-col items-center">
              <LayoutDashboard className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <DesktopNav />
      <MobileDock />
    </>
  )
}
