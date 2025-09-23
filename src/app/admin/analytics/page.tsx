'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Users, 
  Link as LinkIcon, 
  MousePointer, 
  Crown,
  TrendingUp,
  Globe,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalUsers: number
    totalLinks: number
    totalClicks: number
    premiumUsers: number
    conversionRate: string
  }
  trends: {
    userRegistrations: Array<{ date: string; count: number }>
    clicks: Array<{ date: string; count: number }>
  }
  topLinks: Array<{
    id: string
    title: string
    url: string
    clicks: number
    User: {
      username: string
      displayName: string
    }
  }>
  geographic: {
    topCountries: Array<{ country: string; count: number }>
  }
  devices: {
    deviceTypes: Array<{ device: string; count: number }>
    browsers: Array<{ browser: string; count: number }>
  }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7d')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/analytics?period=${period}`)
      const analyticsData = await response.json()

      if (response.ok) {
        setData(analyticsData)
      } else {
        setError(analyticsData.error || 'Failed to fetch analytics')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />
      case 'desktop':
        return <Monitor className="h-4 w-4" />
      case 'tablet':
        return <Tablet className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 bg-background dark min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-4 sm:p-6 bg-background dark min-h-screen space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Platform performance and user insights
          </p>
        </div>
        <Card className="card-ninja">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error || 'Failed to load analytics data'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 bg-background dark min-h-screen space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Platform performance and user insights
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48 bg-background border-border text-foreground">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">{(data.overview.totalUsers || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <LinkIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Links</p>
                <p className="text-2xl font-bold text-blue-600">{(data.overview.totalLinks || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MousePointer className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Clicks</p>
                <p className="text-2xl font-bold text-blue-600">{(data.overview.totalClicks || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Crown className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Premium Users</p>
                <p className="text-2xl font-bold text-blue-600">{(data.overview.premiumUsers || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500">{data.overview.conversionRate}% conversion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Links */}
        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Top Performing Links
            </CardTitle>
            <CardDescription>
              Most clicked links across the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topLinks.slice(0, 5).map((link, index) => (
                <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-600 truncate">
                      {link.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      by @{link.User.username}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-blue-600">
                      {(link.clicks || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500">clicks</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Top Countries
            </CardTitle>
            <CardDescription>
              Geographic distribution of clicks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.geographic.topCountries.slice(0, 5).map((country, index) => (
                <div key={country.country} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-blue-600">
                      {country.country}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-blue-600">
                      {(country.count || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500">clicks</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Types */}
        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardHeader>
            <CardTitle>Device Types</CardTitle>
            <CardDescription>
              Click distribution by device type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.devices.deviceTypes.map((device) => (
                <div key={device.device} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getDeviceIcon(device.device)}
                    <span className="text-sm font-medium text-blue-600 capitalize">
                      {device.device}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-blue-600">
                      {(device.count || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500">clicks</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Browser Stats */}
        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardHeader>
            <CardTitle>Browsers</CardTitle>
            <CardDescription>
              Click distribution by browser
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.devices.browsers.slice(0, 5).map((browser) => (
                <div key={browser.browser} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-blue-600">
                      {browser.browser}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-blue-600">
                      {(browser.count || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500">clicks</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
