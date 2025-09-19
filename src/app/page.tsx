"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Link as LinkIcon, BarChart3, Palette, Zap } from "lucide-react"
import { useFeatureFlag } from "@/lib/feature-flags"
import { getSiteConfig, getUserProfileUrl } from "@/lib/config"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Feature flags
  const analyticsEnabled = useFeatureFlag('analytics')
  const themesEnabled = useFeatureFlag('themes')
  const { siteName, siteDescription } = getSiteConfig()

  useEffect(() => {
    if (status === "loading") return
    if (session) {
      router.push("/dashboard")
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const features = [
    {
      icon: LinkIcon,
      title: "Unlimited Links",
      description: "Add as many links as you want with no restrictions"
    },
    ...(analyticsEnabled ? [{
      icon: BarChart3,
      title: "Analytics",
      description: "Track clicks and performance with detailed insights"
    }] : []),
    ...(themesEnabled ? [{
      icon: Palette,
      title: "Custom Themes",
      description: "Choose from beautiful themes or create your own"
    }] : []),
    {
      icon: Zap,
      title: "Fast & Reliable",
      description: "Lightning-fast loading with 99.9% uptime"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">{siteName}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/auth/signin")}>
              Sign In
            </Button>
            <Button onClick={() => router.push("/auth/signup")}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-4 sm:px-6 lg:px-8">
        <div className="text-center py-20">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            Your Link in Bio,
            <span className="text-blue-600"> Simplified</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Create beautiful, customizable link pages that convert. 
            Track performance, engage your audience, and grow your brand.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => router.push("/auth/signup")}
              className="text-lg px-8 py-3"
            >
              Start Free
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => router.push("/auth/signin")}
              className="text-lg px-8 py-3"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-lg text-gray-600">
              Powerful features designed for creators, businesses, and influencers
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                <feature.icon className="h-8 w-8 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">{siteName}</h3>
            <p className="text-gray-400">
              © 2024 {siteName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}