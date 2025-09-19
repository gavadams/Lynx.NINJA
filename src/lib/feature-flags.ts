// Feature Flags System
// This allows us to turn features on/off without code changes

import { useState, useEffect } from 'react'

export interface FeatureFlags {
  teams: boolean
  customDomains: boolean
  emailCapture: boolean
  analytics: boolean
  themes: boolean
  qrCodes: boolean
  passwordProtection: boolean
  linkScheduling: boolean
  linkExpiration: boolean
}

// Default feature flags (can be overridden by database)
const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  teams: false, // Hidden for now
  customDomains: true,
  emailCapture: true,
  analytics: true,
  themes: true,
  qrCodes: true,
  passwordProtection: true,
  linkScheduling: true,
  linkExpiration: true,
}

// Cache for feature flags (refreshed every 5 minutes)
let featureFlagsCache: FeatureFlags | null = null
let lastCacheUpdate = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Global refresh function for feature flags
let refreshCallbacks: (() => void)[] = []

export function refreshFeatureFlags() {
  // Clear cache to force refresh
  featureFlagsCache = null
  lastCacheUpdate = 0
  
  // Call all registered refresh callbacks
  refreshCallbacks.forEach(callback => callback())
}

export function registerFeatureFlagRefresh(callback: () => void) {
  refreshCallbacks.push(callback)
  return () => {
    refreshCallbacks = refreshCallbacks.filter(cb => cb !== callback)
  }
}

export async function getFeatureFlags(): Promise<FeatureFlags> {
  const now = Date.now()
  
  // Return cached flags if still valid
  if (featureFlagsCache && (now - lastCacheUpdate) < CACHE_DURATION) {
    return featureFlagsCache
  }

  try {
    // Try to fetch from database
    const response = await fetch('/api/features', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      const dbFlags: FeatureFlags = {
        teams: data.flags?.find((f: any) => f.name === 'teams')?.isEnabled ?? DEFAULT_FEATURE_FLAGS.teams,
        customDomains: data.flags?.find((f: any) => f.name === 'customDomains')?.isEnabled ?? DEFAULT_FEATURE_FLAGS.customDomains,
        emailCapture: data.flags?.find((f: any) => f.name === 'emailCapture')?.isEnabled ?? DEFAULT_FEATURE_FLAGS.emailCapture,
        analytics: data.flags?.find((f: any) => f.name === 'analytics')?.isEnabled ?? DEFAULT_FEATURE_FLAGS.analytics,
        themes: data.flags?.find((f: any) => f.name === 'themes')?.isEnabled ?? DEFAULT_FEATURE_FLAGS.themes,
        qrCodes: data.flags?.find((f: any) => f.name === 'qrCodes')?.isEnabled ?? DEFAULT_FEATURE_FLAGS.qrCodes,
        passwordProtection: data.flags?.find((f: any) => f.name === 'passwordProtection')?.isEnabled ?? DEFAULT_FEATURE_FLAGS.passwordProtection,
        linkScheduling: data.flags?.find((f: any) => f.name === 'linkScheduling')?.isEnabled ?? DEFAULT_FEATURE_FLAGS.linkScheduling,
        linkExpiration: data.flags?.find((f: any) => f.name === 'linkExpiration')?.isEnabled ?? DEFAULT_FEATURE_FLAGS.linkExpiration,
      }
      featureFlagsCache = dbFlags
    } else {
      // Fallback to default flags
      featureFlagsCache = DEFAULT_FEATURE_FLAGS
    }
    
    lastCacheUpdate = now
    return featureFlagsCache
  } catch (error) {
    console.error('Error fetching feature flags:', error)
    // Fallback to default flags
    featureFlagsCache = DEFAULT_FEATURE_FLAGS
    lastCacheUpdate = now
    return featureFlagsCache
  }
}

export function isFeatureEnabled(feature: keyof FeatureFlags): Promise<boolean> {
  return getFeatureFlags().then(flags => flags[feature])
}

// Client-side hook for React components
export function useFeatureFlag(feature: keyof FeatureFlags): boolean {
  const [isEnabled, setIsEnabled] = useState<boolean>(DEFAULT_FEATURE_FLAGS[feature])
  const [loading, setLoading] = useState(true)

  const fetchFeatureFlag = async () => {
    try {
      console.log(`🔍 Fetching feature flag: ${feature}`)
      const response = await fetch(`/api/features?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache',
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`📊 Feature flags data:`, data)
        const flag = data.flags?.find((f: any) => f.name === feature)
        console.log(`🎯 Found flag for ${feature}:`, flag)
        if (flag) {
          console.log(`✅ Setting ${feature} to:`, flag.isEnabled)
          setIsEnabled(flag.isEnabled)
        }
      }
    } catch (error) {
      console.error('Error fetching feature flag:', error)
      // Keep default value on error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeatureFlag()
  }, [feature])

  // Register for global refresh callbacks
  useEffect(() => {
    const unregister = registerFeatureFlagRefresh(fetchFeatureFlag)
    return unregister
  }, [feature])

  // Set up interval to refresh feature flags every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchFeatureFlag()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [feature])

  return isEnabled
}
