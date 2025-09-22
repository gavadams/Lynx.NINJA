"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Link as LinkIcon, BarChart3, Palette, Zap } from "lucide-react"
import { useFeatureFlag } from "@/lib/feature-flags"
import { getSiteConfig, getUserProfileUrl } from "@/lib/config"
import Image from "next/image"

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
    <div className="min-h-screen bg-background dark">
      {/* Header */}
      <header className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 sm:py-6">
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt={siteName}
              width={240}
              height={80}
              className="h-16 sm:h-20 w-auto"
              priority
            />
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              onClick={() => router.push("/auth/signin")}
              className="btn-ninja-outline text-sm sm:text-base px-3 sm:px-6 py-2 sm:py-3"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => router.push("/auth/signup")}
              className="btn-ninja glow-ninja text-sm sm:text-base px-3 sm:px-6 py-2 sm:py-3"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12 sm:py-20">
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-heading font-bold text-foreground mb-4 sm:mb-6">
            Your bio,
            <span className="text-primary"> reimagined</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
            Link with stealth and style. Create beautiful, customizable link pages that convert. 
            Track performance, engage your audience, and grow your brand.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Button 
              size="lg" 
              onClick={() => router.push("/auth/signup")}
              className="btn-ninja glow-ninja text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
            >
              Start Free
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => router.push("/auth/signin")}
              className="btn-ninja-outline text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="py-12 sm:py-20">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground px-4">
              Powerful features designed for creators, businesses, and influencers
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card-ninja p-4 sm:p-6 hover:glow-ninja transition-all duration-300">
                <feature.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-heading font-semibold text-card-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-12 sm:py-20 text-center">
          <div className="card-ninja p-6 sm:p-12 max-w-4xl mx-auto mx-4 sm:mx-auto">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-card-foreground mb-4">
              Ready to link with stealth and style?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8">
              Join thousands of creators who trust {siteName} for their link-in-bio needs.
            </p>
            <Button 
              size="lg" 
              onClick={() => router.push("/auth/signup")}
              className="btn-ninja glow-ninja text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
            >
              Get Started Now
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-secondary text-secondary-foreground py-12">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-heading font-bold mb-4">{siteName}</h3>
            <p className="text-muted-foreground">
              © 2024 {siteName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}