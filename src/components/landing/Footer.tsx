import React from "react"
import Link from "next/link"
import Image from "next/image"

export default function Footer() {
  return (
    <footer className="bg-[#030712] border-t border-slate-800 pt-20 pb-10 text-slate-400">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        
        {/* Brand */}
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center p-1 border border-slate-700">
              <Image src="/wajira-logo.png" alt="Wajira" width={32} height={32} className="w-full h-full object-contain filter grayscale invert opacity-90" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">Wajira</span>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed mb-6 pr-4">
            Sistem ERP Terpadu untuk membawa bisnismu naik level. Cepat, aman, dan dapat diandalkan oleh berbagai macam industri.
          </p>
        </div>

        {/* Links Group 1 */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-white font-bold mb-2">Produk</h4>
          <Link href="#features" className="hover:text-white transition-colors">Fitur Utama</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Harga & Paket</Link>
          <Link href="#" className="hover:text-white transition-colors">Studi Kasus</Link>
          <Link href="#" className="hover:text-white transition-colors">Update Terbaru</Link>
        </div>

        {/* Links Group 2 */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-white font-bold mb-2">Perusahaan</h4>
          <Link href="#how-it-works" className="hover:text-white transition-colors">Cara Kerja</Link>
          <Link href="#" className="hover:text-white transition-colors">Tentang Kami</Link>
          <Link href="#" className="hover:text-white transition-colors">Karir Sales</Link>
          <Link href="#" className="hover:text-white transition-colors">Hubungi Kami</Link>
        </div>

        {/* Links Group 3 */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-white font-bold mb-2">Legal</h4>
          <Link href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</Link>
          <Link href="#" className="hover:text-white transition-colors">Kebijakan Privasi</Link>
          <Link href="#" className="hover:text-white transition-colors">Keamanan Data</Link>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-6 border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between">
        <p className="text-sm text-slate-600 mb-4 md:mb-0">
          &copy; {new Date().getFullYear()} Wajira Enterprise. All rights reserved.
        </p>
        <div className="flex space-x-6 text-sm font-medium">
          <Link href="#" className="hover:text-white transition-colors">Twitter X</Link>
          <Link href="#" className="hover:text-white transition-colors">LinkedIn</Link>
          <Link href="#" className="hover:text-white transition-colors">Instagram</Link>
        </div>
      </div>
    </footer>
  )
}
