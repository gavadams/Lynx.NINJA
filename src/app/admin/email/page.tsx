'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Mail,
  Send,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  UserPlus,
  BarChart3
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface EmailCapture {
  id: string
  email: string
  createdAt: string
  Link: {
    id: string
    title: string
    User: {
      username: string
    }
  }
}

interface TeamInvitation {
  id: string
  email: string
  role: string
  status: string
  invitedAt: string
  Team: {
    name: string
  }
  InvitedBy: {
    username: string
  }
}

interface EmailData {
  overview: {
    totalEmailCaptures: number
    pendingInvitations: number
    emailConfig: {
      resendConfigured: boolean
      fromEmail: string
      apiKeyLength: number
    }
    stats: {
      totalSent: number
      delivered: number
      bounced: number
      failed: number
      deliveryRate: number
      bounceRate: number
      failureRate: number
    }
  }
  recentActivity: {
    emailCaptures: EmailCapture[]
    teamInvitations: TeamInvitation[]
  }
}

export default function EmailPage() {
  const [data, setData] = useState<EmailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Test email form state
  const [testEmail, setTestEmail] = useState({
    to: '',
    subject: '',
    content: ''
  })

  // Bulk email form state
  const [bulkEmail, setBulkEmail] = useState({
    recipients: '',
    subject: '',
    content: ''
  })

  useEffect(() => {
    fetchEmailData()
  }, [])

  const fetchEmailData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/email')
      const emailData = await response.json()

      if (response.ok) {
        setData(emailData)
      } else {
        setError(emailData.error || 'Failed to fetch email data')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailAction = async (action: string, actionData?: any) => {
    setActionLoading(action)
    try {
      const response = await fetch('/api/admin/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, data: actionData }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.result.message)
        // Refresh the data
        fetchEmailData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to perform email action')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleTestEmail = () => {
    if (!testEmail.to || !testEmail.subject || !testEmail.content) {
      alert('Please fill in all fields')
      return
    }
    handleEmailAction('test_email', testEmail)
  }

  const handleBulkEmail = () => {
    if (!bulkEmail.recipients || !bulkEmail.subject || !bulkEmail.content) {
      alert('Please fill in all fields')
      return
    }
    
    const recipients = bulkEmail.recipients.split(',').map(email => email.trim())
    handleEmailAction('bulk_email', {
      recipients,
      subject: bulkEmail.subject,
      content: bulkEmail.content
    })
  }

  const handleExportEmailCaptures = () => {
    handleEmailAction('export_email_captures')
  }

  const handleResendInvitation = (invitationId: string) => {
    handleEmailAction('resend_invitation', { invitationId })
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading email data...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Management</h1>
          <p className="text-gray-600 mt-2">
            Manage email communications and captures
          </p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error || 'Failed to load email data'}</p>
            <Button onClick={fetchEmailData} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Management</h1>
          <p className="text-gray-600 mt-2">
            Manage email communications and captures
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={fetchEmailData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Email Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Email Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              {data.overview.emailConfig.resendConfigured ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">Resend API</p>
                <p className="text-xs text-gray-500">
                  {data.overview.emailConfig.resendConfigured ? 'Configured' : 'Not configured'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">From Email</p>
              <p className="text-xs text-gray-500">{data.overview.emailConfig.fromEmail}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">API Key Length</p>
              <p className="text-xs text-gray-500">{data.overview.emailConfig.apiKeyLength} characters</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Sent</p>
                <p className="text-2xl font-bold text-gray-900">{data.overview.stats.totalSent.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">{data.overview.stats.delivered.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{data.overview.stats.deliveryRate}% rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Email Captures</p>
                <p className="text-2xl font-bold text-gray-900">{data.overview.totalEmailCaptures.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserPlus className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Invites</p>
                <p className="text-2xl font-bold text-gray-900">{data.overview.pendingInvitations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Email */}
        <Card>
          <CardHeader>
            <CardTitle>Test Email</CardTitle>
            <CardDescription>
              Send a test email to verify configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="test-to">To</Label>
              <Input
                id="test-to"
                type="email"
                placeholder="test@example.com"
                value={testEmail.to}
                onChange={(e) => setTestEmail(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="test-subject">Subject</Label>
              <Input
                id="test-subject"
                placeholder="Test Email Subject"
                value={testEmail.subject}
                onChange={(e) => setTestEmail(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="test-content">Content</Label>
              <Textarea
                id="test-content"
                placeholder="Test email content..."
                rows={4}
                value={testEmail.content}
                onChange={(e) => setTestEmail(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>
            <Button 
              onClick={handleTestEmail}
              disabled={actionLoading === 'test_email'}
              className="w-full"
            >
              {actionLoading === 'test_email' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Test Email
            </Button>
          </CardContent>
        </Card>

        {/* Bulk Email */}
        <Card>
          <CardHeader>
            <CardTitle>Bulk Email</CardTitle>
            <CardDescription>
              Send emails to multiple recipients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bulk-recipients">Recipients (comma-separated)</Label>
              <Input
                id="bulk-recipients"
                placeholder="user1@example.com, user2@example.com"
                value={bulkEmail.recipients}
                onChange={(e) => setBulkEmail(prev => ({ ...prev, recipients: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="bulk-subject">Subject</Label>
              <Input
                id="bulk-subject"
                placeholder="Bulk Email Subject"
                value={bulkEmail.subject}
                onChange={(e) => setBulkEmail(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="bulk-content">Content</Label>
              <Textarea
                id="bulk-content"
                placeholder="Bulk email content..."
                rows={4}
                value={bulkEmail.content}
                onChange={(e) => setBulkEmail(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>
            <Button 
              onClick={handleBulkEmail}
              disabled={actionLoading === 'bulk_email'}
              className="w-full"
            >
              {actionLoading === 'bulk_email' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Bulk Email
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Email Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Email Actions</CardTitle>
          <CardDescription>
            Export data and manage email communications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={handleExportEmailCaptures}
              disabled={actionLoading === 'export_email_captures'}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <Download className="h-6 w-6" />
              <span className="text-sm">Export Email Captures</span>
              {actionLoading === 'export_email_captures' && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              )}
            </Button>

            <Button
              onClick={() => window.open('/api/admin/email?export=captures', '_blank')}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm">View Email Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Email Captures</CardTitle>
            <CardDescription>
              Latest email captures from forms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentActivity.emailCaptures.map((capture) => (
                <div key={capture.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{capture.email}</p>
                    <p className="text-xs text-gray-500">
                      from {capture.Link.title} by @{capture.Link.User.username}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(capture.createdAt), { addSuffix: true })}
                  </span>
                </div>
              ))}
              {data.recentActivity.emailCaptures.length === 0 && (
                <div className="text-center py-4">
                  <Mail className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No recent email captures</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Team Invitations</CardTitle>
            <CardDescription>
              Latest team invitation emails
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentActivity.teamInvitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{invitation.email}</p>
                    <p className="text-xs text-gray-500">
                      {invitation.role} in {invitation.Team.name} by @{invitation.InvitedBy.username}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={invitation.status === 'pending' ? 'secondary' : 'default'}>
                      {invitation.status}
                    </Badge>
                    {invitation.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResendInvitation(invitation.id)}
                        disabled={actionLoading === `resend_${invitation.id}`}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {data.recentActivity.teamInvitations.length === 0 && (
                <div className="text-center py-4">
                  <UserPlus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No recent team invitations</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
