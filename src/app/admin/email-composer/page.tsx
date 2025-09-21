'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Mail, 
  Send, 
  Save, 
  Eye, 
  Clock, 
  Users, 
  Loader2,
  AlertCircle,
  CheckCircle,
  Calendar,
  FileText
} from 'lucide-react'
import { RichTextEditor } from '@/components/rich-text-editor'
import { format } from 'date-fns'

interface MailingList {
  id: string
  name: string
  description: string
  subscriberCount: number
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  htmlContent: string
}

export default function EmailComposerPage() {
  const [mailingLists, setMailingLists] = useState<MailingList[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  
  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    htmlContent: '',
    mailingListId: '',
    templateId: '',
    scheduledAt: '',
    isScheduled: false,
    previewText: ''
  })

  useEffect(() => {
    fetchMailingLists()
    fetchTemplates()
  }, [])

  const fetchMailingLists = async () => {
    try {
      const response = await fetch('/api/admin/mailing-lists')
      const data = await response.json()

      if (response.ok) {
        setMailingLists(data.mailingLists || [])
      } else {
        setError(data.error || 'Failed to fetch mailing lists')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/email-templates')
      const data = await response.json()

      if (response.ok) {
        setTemplates(data.templates || [])
      } else {
        console.error('Failed to fetch templates:', data.error)
      }
    } catch (err) {
      console.error('Error fetching templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setFormData(prev => ({
        ...prev,
        subject: template.subject,
        content: template.content,
        htmlContent: template.htmlContent,
        templateId
      }))
    }
  }

  const handleSend = async () => {
    if (!formData.subject || !formData.htmlContent || !formData.mailingListId) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setSending(true)
      setError(null)

      const response = await fetch('/api/admin/email-composer/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          scheduledAt: formData.isScheduled ? formData.scheduledAt : null
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message || 'Email sent successfully!')
        setFormData({
          subject: '',
          content: '',
          htmlContent: '',
          mailingListId: '',
          templateId: '',
          scheduledAt: '',
          isScheduled: false,
          previewText: ''
        })
      } else {
        setError(data.error || 'Failed to send email')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!formData.subject || !formData.htmlContent) {
      setError('Please fill in subject and content to save as template')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const response = await fetch('/api/admin/email-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${formData.subject} - ${new Date().toLocaleDateString()}`,
          subject: formData.subject,
          content: formData.content,
          htmlContent: formData.htmlContent
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Template saved successfully!')
        fetchTemplates()
      } else {
        setError(data.error || 'Failed to save template')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const selectedMailingList = mailingLists.find(list => list.id === formData.mailingListId)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading email composer...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Composer</h1>
          <p className="text-gray-600 mt-2">
            Create and send emails to your mailing lists
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveTemplate}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Template
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Details</CardTitle>
              <CardDescription>
                Compose your email content and select recipients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Selection */}
              <div>
                <Label htmlFor="template">Email Template (Optional)</Label>
                <Select onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template or start from scratch" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject */}
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter email subject"
                />
              </div>

              {/* Preview Text */}
              <div>
                <Label htmlFor="previewText">Preview Text</Label>
                <Textarea
                  id="previewText"
                  value={formData.previewText}
                  onChange={(e) => setFormData(prev => ({ ...prev, previewText: e.target.value }))}
                  placeholder="Brief preview text shown in email clients"
                  rows={2}
                />
              </div>

              {/* Content Editor */}
              <div>
                <Label>Email Content *</Label>
                {previewMode ? (
                  <div className="border rounded-lg p-4 min-h-[400px] bg-white">
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: formData.htmlContent || '<p>No content to preview</p>' }}
                    />
                  </div>
                ) : (
                  <RichTextEditor
                    content={formData.htmlContent}
                    onChange={(htmlContent) => setFormData(prev => ({ ...prev, htmlContent }))}
                    placeholder="Write your email content here..."
                    className="min-h-[400px]"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Mailing List Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Recipients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="mailingList">Mailing List *</Label>
                <Select 
                  value={formData.mailingListId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, mailingListId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mailing list" />
                  </SelectTrigger>
                  <SelectContent>
                    {mailingLists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{list.name}</span>
                          <Badge variant="secondary" className="ml-2">
                            {list.subscriberCount} subscribers
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedMailingList && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      {selectedMailingList.subscriberCount} subscribers
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    {selectedMailingList.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card>
            <CardHeader>
              <CardTitle>Send Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isScheduled"
                  checked={formData.isScheduled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isScheduled: checked }))}
                />
                <Label htmlFor="isScheduled">Schedule for later</Label>
              </div>

              {formData.isScheduled && (
                <div>
                  <Label htmlFor="scheduledAt">Send Date & Time</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              )}

              <div className="pt-4">
                <Button
                  onClick={handleSend}
                  disabled={sending || !formData.subject || !formData.htmlContent || !formData.mailingListId}
                  className="w-full"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {formData.isScheduled ? 'Scheduling...' : 'Sending...'}
                    </>
                  ) : (
                    <>
                      {formData.isScheduled ? (
                        <>
                          <Clock className="h-4 w-4 mr-2" />
                          Schedule Email
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Now
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Email Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Email Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subject Length:</span>
                <span className={formData.subject.length > 50 ? 'text-orange-600' : 'text-green-600'}>
                  {formData.subject.length}/50
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Content Length:</span>
                <span>{formData.htmlContent.length} characters</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Recipients:</span>
                <span>{selectedMailingList?.subscriberCount || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
