"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Globe, 
  Smartphone, 
  Monitor,
  Calendar,
  Clock,
  ExternalLink,
  Crown
} from "lucide-react"

interface AnalyticsData {
  totalClicks: number
  totalLinks: number
  totalProfileViews: number
  clicksToday: number
  clicksThisWeek: number
  clicksThisMonth: number
  topLinks: Array<{
    id: string
    title: string
    url: string
    clicks: number
  }>
  deviceStats: {
    mobile: number
    desktop: number
  }
  browserStats: Array<{
    browser: string
    count: number
  }>
  recentClicks: Array<{
    id: string
    linkTitle: string
    clickedAt: string
    device: string
    browser: string
  }>
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [])

         const fetchAnalytics = async () => {
           try {
             setLoading(true)
             
             // Fetch user profile to check premium status
             const profileResponse = await fetch('/api/user/profile')
             if (profileResponse.ok) {
               const profile = await profileResponse.json()
               setIsPremium(profile.isPremium)
             }

             // Fetch analytics data
             console.log('🔍 Analytics page: Fetching analytics data...')
             const analyticsResponse = await fetch('/api/analytics')
             console.log('📊 Analytics page: Response status:', analyticsResponse.status)
             if (analyticsResponse.ok) {
               const data = await analyticsResponse.json()
               console.log('📈 Analytics page: Data received:', data)
               setAnalytics(data)
             } else {
               const errorText = await analyticsResponse.text()
               console.error('❌ Analytics page: Fetch failed:', errorText)
             }
           } catch (error) {
             console.error('Error fetching analytics:', error)
           } finally {
             setLoading(false)
           }
         }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!isPremium) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-2 text-gray-600">
            Advanced analytics are available with Premium
          </p>
        </div>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Crown className="h-6 w-6 text-yellow-600" />
              <CardTitle className="text-yellow-900">Premium Feature</CardTitle>
            </div>
            <CardDescription className="text-yellow-700">
              Advanced analytics with detailed insights, geographic data, and device analytics are available with our Premium plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-yellow-900">What you get with Premium:</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Detailed click analytics</li>
                    <li>• Geographic data (country, city)</li>
                    <li>• Device and browser breakdown</li>
                    <li>• Referrer tracking</li>
                    <li>• Time-based analytics</li>
                    <li>• Export data to CSV</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-yellow-900">Current Basic Stats:</h3>
                  <div className="text-sm text-yellow-700">
                    <p>Total Clicks: {analytics?.totalClicks || 0}</p>
                    <p>Total Links: {analytics?.totalLinks || 0}</p>
                    <p>Profile Views: {analytics?.totalProfileViews || 0}</p>
                  </div>
                </div>
              </div>
              <Button className="w-full sm:w-auto">
                Upgrade to Premium - £10/month
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-gray-600">
          Detailed insights into your link performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Clicks
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {analytics?.totalClicks || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    This Month
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {analytics?.clicksThisMonth || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    This Week
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {analytics?.clicksThisWeek || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Profile Views
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {analytics?.totalProfileViews || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Today
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {analytics?.clicksToday || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Links */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Links</CardTitle>
            <CardDescription>
              Your most clicked links this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.topLinks?.map((link, index) => (
                <div key={link.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {link.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {link.url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      {link.clicks || 0} clicks
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-4">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Device Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
            <CardDescription>
              Click distribution by device type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium">Mobile</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    {analytics?.deviceStats?.mobile || 0}
                  </div>
                  <div className="text-xs text-gray-500">
                    {analytics?.deviceStats ? 
                      Math.round((analytics.deviceStats.mobile / (analytics.deviceStats.mobile + analytics.deviceStats.desktop)) * 100) : 0}%
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Monitor className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Desktop</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    {analytics?.deviceStats?.desktop || 0}
                  </div>
                  <div className="text-xs text-gray-500">
                    {analytics?.deviceStats ? 
                      Math.round((analytics.deviceStats.desktop / (analytics.deviceStats.mobile + analytics.deviceStats.desktop)) * 100) : 0}%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest clicks on your links
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics?.recentClicks?.map((click) => (
              <div key={click.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {click.linkTitle}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(click.clickedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {click.device}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {click.browser}
                  </Badge>
                </div>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
