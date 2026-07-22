import Head from "next/head"
import { useEffect, useState } from "react"
import Navbar from "@/components/landing/Navbar"
import HeroSection from "@/components/landing/HeroSection"
import TrustedByMarquee from "@/components/landing/TrustedByMarquee"
import BentoFeatures from "@/components/landing/BentoFeatures"
import Integrations from "@/components/landing/Integrations"
import HowItWorks from "@/components/landing/HowItWorks"
import Testimonials from "@/components/landing/Testimonials"
import Pricing from "@/components/landing/Pricing"
import FAQ from "@/components/landing/FAQ"
import ContactUs from "@/components/landing/ContactUs"
import FinalCTA from "@/components/landing/FinalCTA"
import Footer from "@/components/landing/Footer"

export default function Home() {
  const [mounted, setMounted] = useState(false)

  // Ensure CSR rendering only
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
        <title>Wajira Dashboard</title>
      </Head>

      <div className="relative min-h-screen bg-slate-50 text-gray-900 border-none selection:bg-primary/20 selection:text-primary">
        <Navbar />
        
        <main>
          <HeroSection />
          <TrustedByMarquee />
          <BentoFeatures />
          <Integrations />
          <HowItWorks />
          <Testimonials />
          <Pricing />
          <FAQ />
          <ContactUs />
          <FinalCTA />
        </main>
        
        <Footer />
      </div>
    </>
  )
}
