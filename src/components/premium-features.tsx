"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Zap, Shield, Palette, BarChart3, Calendar, QrCode, Mail, Globe } from "lucide-react"

interface PremiumFeaturesProps {
  isPremium: boolean
  onUpgrade?: () => void
  onManageBilling?: () => void
}

const features = [
  {
    icon: Globe,
    title: "Custom Domain",
    description: "Connect your own domain (e.g., links.yourname.com)",
    premium: true
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Detailed insights with geographic data and device analytics",
    premium: true
  },
  {
    icon: Calendar,
    title: "Link Scheduling",
    description: "Schedule links to go live or expire at specific times",
    premium: true
  },
  {
    icon: Shield,
    title: "Password Protection",
    description: "Secure sensitive links with password protection",
    premium: true
  },
  {
    icon: Mail,
    title: "Email Capture",
    description: "Lead generation forms with CSV export",
    premium: true
  },
  {
    icon: QrCode,
    title: "QR Code Generation",
    description: "Create QR codes for your links automatically",
    premium: true
  },
  {
    icon: Palette,
    title: "Custom CSS",
    description: "Complete design customization with CSS editor",
    premium: true
  },
  {
    icon: Zap,
    title: "Priority Support",
    description: "Get help faster with priority support",
    premium: true
  }
]

export default function PremiumFeatures({ isPremium, onUpgrade, onManageBilling }: PremiumFeaturesProps) {
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    if (!onUpgrade) return
    
    setLoading(true)
    try {
      await onUpgrade()
    } catch (error) {
      console.error('Error upgrading:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleManageBilling = async () => {
    if (!onManageBilling) return
    
    setLoading(true)
    try {
      await onManageBilling()
    } catch (error) {
      console.error('Error opening billing portal:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Premium Status */}
      <Card className={isPremium ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Crown className={`h-6 w-6 ${isPremium ? "text-green-600" : "text-yellow-600"}`} />
            <CardTitle className={isPremium ? "text-green-900" : "text-yellow-900"}>
              {isPremium ? "Premium Active" : "Upgrade to Premium"}
            </CardTitle>
          </div>
          <CardDescription className={isPremium ? "text-green-700" : "text-yellow-700"}>
            {isPremium 
              ? "You have access to all premium features. Thank you for your support!"
              : "Unlock advanced features and take your link bio to the next level."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPremium ? (
            <div className="flex space-x-4">
              <Button onClick={handleManageBilling} disabled={loading}>
                Manage Billing
              </Button>
              <Button variant="outline" disabled>
                <Check className="h-4 w-4 mr-2" />
                Premium Active
              </Button>
            </div>
          ) : (
            <div className="flex space-x-4">
              <Button onClick={handleUpgrade} disabled={loading}>
                {loading ? "Processing..." : "Upgrade to Premium - £10/month"}
              </Button>
              <Button variant="outline" disabled>
                Free Plan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <Card key={index} className={isPremium ? "" : "opacity-60"}>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-lg ${isPremium ? "bg-green-100" : "bg-gray-100"}`}>
                  <feature.icon className={`h-6 w-6 ${isPremium ? "text-green-600" : "text-gray-400"}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                    {feature.premium && (
                      <Badge variant="secondary" className="text-xs">
                        Premium
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                </div>
                {isPremium ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Crown className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pricing Info */}
      {!isPremium && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Premium Plan - £10/month
              </h3>
              <p className="text-blue-700 mb-4">
                Cancel anytime. No long-term commitments.
              </p>
              <div className="flex justify-center space-x-4 text-sm text-blue-600">
                <span>✓ 30-day money-back guarantee</span>
                <span>✓ Cancel anytime</span>
                <span>✓ Priority support</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
