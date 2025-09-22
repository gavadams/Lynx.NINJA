'use client'

import Image from "next/image"
import { getLogoSize, getLogoDimensions } from "@/lib/logo-sizes"
import { getSiteConfig } from "@/lib/config"
import { useEffect, useState } from "react"

interface DynamicLogoProps {
  pageType: 'landingPage' | 'dashboard' | 'authPages' | 'publicProfile'
  className?: string
  priority?: boolean
  invert?: boolean
}

export function DynamicLogo({ 
  pageType, 
  className = "", 
  priority = false,
  invert = false 
}: DynamicLogoProps) {
  const { siteName } = getSiteConfig()
  const [logoSize, setLogoSize] = useState(getLogoSize(pageType))
  
  // Listen for logo size changes
  useEffect(() => {
    const handleStorageChange = () => {
      setLogoSize(getLogoSize(pageType))
    }
    
    window.addEventListener('storage', handleStorageChange)
    // Also listen for custom events (for same-tab updates)
    window.addEventListener('logoSizeChanged', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('logoSizeChanged', handleStorageChange)
    }
  }, [pageType])
  
  const dimensions = getLogoDimensions(logoSize)
  const baseClasses = `w-auto ${invert ? 'brightness-0 invert' : ''}`
  
  return (
    <Image
      src="/logo.png"
      alt={siteName}
      width={dimensions.width}
      height={dimensions.height}
      className={`${baseClasses} ${className}`}
      priority={priority}
    />
  )
}
