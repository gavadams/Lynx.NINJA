"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink } from "lucide-react"

export default function CustomDomainPage() {
  const searchParams = useSearchParams()
  const domain = searchParams.get('domain')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    if (domain) {
      fetchUserByDomain(domain)
    }
  }, [domain])

  const fetchUserByDomain = async (customDomain: string) => {
    try {
      setLoading(true)
      
      // In a real implementation, you would have an API endpoint
      // that looks up the user by their custom domain
      const response = await fetch(`/api/custom-domain?domain=${encodeURIComponent(customDomain)}`)
      
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data)
      } else if (response.status === 404) {
        setError("This custom domain is not configured or not active.")
      } else {
        setError("Failed to load profile for this domain.")
      }
    } catch (err) {
      setError("Failed to load profile for this domain.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Loading Profile</h1>
            <p className="text-gray-600">Finding profile for {domain}...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Domain Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Domain: {domain}</p>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = `https://${process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'www.lynx.ninja'}`}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit {process.env.NEXT_PUBLIC_SITE_NAME || 'Lynx.NINJA'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (userProfile) {
    // Redirect to the user's profile page
    window.location.href = `/${userProfile.username}`
    return null
  }

  return null
}
