'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  CreditCard,
  Users,
  TrendingUp,
  AlertTriangle,
  MoreHorizontal,
  XCircle,
  CheckCircle,
  PoundSterling,
  Percent,
  Calendar,
  RefreshCw
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Subscription {
  id: string
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  User: {
    id: string
    email: string
    username: string
    displayName: string
  }
}

interface BillingData {
  overview: {
    totalUsers: number
    premiumUsers: number
    freeUsers: number
    conversionRate: string
    churnRate: string
    averageRevenuePerUser: string
    monthlyRecurringRevenue: number
  }
  subscriptions: {
    total: number
    statuses: Record<string, number>
    recent: Subscription[]
  }
  revenue: {
    trends: Array<{ date: string; amount: number }>
    total: number
  }
  issues: {
    recentCancellations: Array<{
      id: string
      status: string
      canceledAt: string
      User: {
        id: string
        email: string
        username: string
        displayName: string
      }
    }>
    failedPayments: Array<{
      id: string
      status: string
      currentPeriodEnd: string
      User: {
        id: string
        email: string
        username: string
        displayName: string
      }
    }>
  }
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    fetchBillingData()
  }, [period])

  const fetchBillingData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/billing?period=${period}`)
      const billingData = await response.json()

      if (response.ok) {
        setData(billingData)
      } else {
        setError(billingData.error || 'Failed to fetch billing data')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBillingAction = async (action: string, subscriptionId?: string, userId?: string, reason?: string) => {
    setActionLoading(subscriptionId || userId || '')
    try {
      const response = await fetch('/api/admin/billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          subscriptionId,
          userId,
          reason
        }),
      })

      if (response.ok) {
        // Refresh the data
        fetchBillingData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to perform billing action')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'canceled':
        return 'bg-red-100 text-red-800'
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800'
      case 'trialing':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 bg-background dark min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading billing data...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-4 sm:p-6 bg-background dark min-h-screen">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground flex items-center">
            <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 mr-3" />
            Billing Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage subscriptions and billing
          </p>
        </div>
        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error || 'Failed to load billing data'}</p>
            <Button onClick={fetchBillingData} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 bg-background dark min-h-screen">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground flex items-center">
          <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 mr-3" />
          Billing Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage subscriptions and billing
        </p>
      </div>

      <div className="flex items-center justify-end mb-6">
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

      {/* Billing Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PoundSterling className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">MRR</p>
                <p className="text-2xl font-bold text-blue-600">
                  £{data.overview.monthlyRecurringRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Premium Users</p>
                <p className="text-2xl font-bold text-blue-600">{data.overview.premiumUsers.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{data.overview.conversionRate}% conversion</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Percent className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Churn Rate</p>
                <p className="text-2xl font-bold text-blue-600">{data.overview.churnRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">ARPU</p>
                <p className="text-2xl font-bold text-blue-600">${data.overview.averageRevenuePerUser}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Subscription Status */}
        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Subscription Status
            </CardTitle>
            <CardDescription>
              Breakdown of subscription statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(data.subscriptions.statuses).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(status)}>
                      {status}
                    </Badge>
                    <span className="text-sm font-medium text-blue-600 capitalize">
                      {status.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-blue-600">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Issues */}
        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              Recent Issues
            </CardTitle>
            <CardDescription>
              Failed payments and cancellations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.issues.failedPayments.slice(0, 3).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-blue-600">
                      {payment.User.displayName || payment.User.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      Payment failed • {formatDistanceToNow(new Date(payment.currentPeriodEnd), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge className="bg-red-100 text-red-800">
                    Past Due
                  </Badge>
                </div>
              ))}
              {data.issues.recentCancellations.slice(0, 3).map((cancellation) => (
                <div key={cancellation.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-blue-600">
                      {cancellation.User.displayName || cancellation.User.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      Canceled • {formatDistanceToNow(new Date(cancellation.canceledAt), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Canceled
                  </Badge>
                </div>
              ))}
              {data.issues.failedPayments.length === 0 && data.issues.recentCancellations.length === 0 && (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No recent issues</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Subscriptions */}
      <Card className="card-ninja hover:glow-ninja transition-all duration-300">
        <CardHeader>
          <CardTitle>Recent Subscriptions</CardTitle>
          <CardDescription>
            Latest subscription activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.subscriptions.recent.map((subscription) => (
              <div key={subscription.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-sm font-medium text-blue-600">
                      {subscription.User.displayName || 'No display name'}
                    </h4>
                    <span className="text-sm text-gray-500">@{subscription.User.username}</span>
                    <Badge className={getStatusColor(subscription.status)}>
                      {subscription.status}
                    </Badge>
                    {subscription.cancelAtPeriodEnd && (
                      <Badge variant="secondary">
                        Canceling
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{subscription.User.email}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>
                      <Calendar className="h-3 w-3 inline mr-1" />
                      Renews {formatDistanceToNow(new Date(subscription.currentPeriodEnd), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={actionLoading === subscription.id}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {subscription.cancelAtPeriodEnd ? (
                        <DropdownMenuItem 
                          onClick={() => handleBillingAction('reactivate_subscription', subscription.id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reactivate
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          onClick={() => handleBillingAction('cancel_subscription', subscription.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => handleBillingAction('refund_user', undefined, subscription.User.id)}
                      >
                        <PoundSterling className="h-4 w-4 mr-2" />
                        Process Refund
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
            {data.subscriptions.recent.length === 0 && (
              <div className="text-center py-8">
                <CreditCard className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No subscriptions found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
