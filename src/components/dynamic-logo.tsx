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
  const [logoSize, setLogoSize] = useState(20) // Default size while loading
  
  // Load logo size from database
  useEffect(() => {
    const loadLogoSize = async () => {
      try {
        const size = await getLogoSize(pageType)
        console.log(`Logo size loaded for ${pageType}:`, size)
        setLogoSize(size)
      } catch (error) {
        console.error('Error loading logo size:', error)
        // Keep default size on error
      }
    }
    
    loadLogoSize()
  }, [pageType])
  
  // Listen for logo size changes (when admin updates settings)
  useEffect(() => {
    const handleLogoSizeChange = async () => {
      try {
        const newSize = await getLogoSize(pageType)
        console.log(`Logo size changed for ${pageType}:`, newSize)
        setLogoSize(newSize)
      } catch (error) {
        console.error('Error reloading logo size:', error)
      }
    }
    
    // Listen for custom events when admin updates settings
    window.addEventListener('logoSizeChanged', handleLogoSizeChange)
    
    return () => {
      window.removeEventListener('logoSizeChanged', handleLogoSizeChange)
    }
  }, [pageType])
  
  const dimensions = getLogoDimensions(logoSize)
  const baseClasses = `w-auto ${invert ? 'brightness-0 invert' : ''}`
  
  // Use inline style for dynamic height since Tailwind doesn't generate dynamic classes
  const dynamicStyle = {
    height: `${logoSize}rem`
  }
  
  console.log(`DynamicLogo ${pageType}: size=${logoSize}rem, style=`, dynamicStyle, 'dimensions=', dimensions)
  
  return (
    <Image
      src="/logo.png"
      alt={siteName}
      width={dimensions.width}
      height={dimensions.height}
      className={`${baseClasses} ${className}`}
      style={dynamicStyle}
      priority={priority}
    />
  )
}
