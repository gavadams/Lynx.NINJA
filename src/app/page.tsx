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
    <div className="min-h-screen bg-background dark">
      {/* Header */}
      <header className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-heading font-bold text-foreground">{siteName}</h1>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => router.push("/auth/signin")}
              className="btn-ninja-outline"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => router.push("/auth/signup")}
              className="btn-ninja glow-ninja"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-4 sm:px-6 lg:px-8">
        <div className="text-center py-20">
          <h1 className="text-4xl sm:text-6xl font-heading font-bold text-foreground mb-6">
            Your bio,
            <span className="text-primary"> reimagined</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Link with stealth and style. Create beautiful, customizable link pages that convert. 
            Track performance, engage your audience, and grow your brand.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => router.push("/auth/signup")}
              className="btn-ninja glow-ninja text-lg px-8 py-4"
            >
              Start Free
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => router.push("/auth/signin")}
              className="btn-ninja-outline text-lg px-8 py-4"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading font-bold text-foreground mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful features designed for creators, businesses, and influencers
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card-ninja p-6 hover:glow-ninja transition-all duration-300">
                <feature.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-lg font-heading font-semibold text-card-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 text-center">
          <div className="card-ninja p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl font-heading font-bold text-card-foreground mb-4">
              Ready to link with stealth and style?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of creators who trust {siteName} for their link-in-bio needs.
            </p>
            <Button 
              size="lg" 
              onClick={() => router.push("/auth/signup")}
              className="btn-ninja glow-ninja text-lg px-8 py-4"
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