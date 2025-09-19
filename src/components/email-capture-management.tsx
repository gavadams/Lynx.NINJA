"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  Download, 
  Mail, 
  Users, 
  Calendar,
  Copy,
  Check,
  X,
  HelpCircle
} from "lucide-react"
import { EmbedInstructions } from "@/components/embed-instructions"

interface EmailCapture {
  id: string
  title: string
  description?: string
  button_text: string
  placeholder: string
  success_message: string
  is_active: boolean
  created_at: string
  updated_at: string
  total_submissions: number
  unique_emails: number
  today_submissions: number
}

interface EmailCaptureManagementProps {
  isPremium: boolean
  selectedEmailCaptureId?: string
  onEmailCaptureSelect?: (captureId: string) => void
  emailCaptures?: any[]
}

export function EmailCaptureManagement({ 
  isPremium, 
  selectedEmailCaptureId, 
  onEmailCaptureSelect, 
  emailCaptures: externalEmailCaptures 
}: EmailCaptureManagementProps) {
  const [captures, setCaptures] = useState<EmailCapture[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCapture, setEditingCapture] = useState<EmailCapture | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    buttonText: "Subscribe",
    placeholder: "Enter your email",
    successMessage: "Thank you for subscribing!"
  })
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showInstructions, setShowInstructions] = useState<string | null>(null)

  useEffect(() => {
    if (externalEmailCaptures) {
      setCaptures(externalEmailCaptures)
      setLoading(false)
    } else {
      fetchCaptures()
    }
  }, [externalEmailCaptures])

  const fetchCaptures = async () => {
    try {
      const response = await fetch('/api/email-captures')
      if (response.ok) {
        const data = await response.json()
        setCaptures(data.captures || [])
      }
    } catch (err) {
      console.error("Error fetching captures:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.title.trim()) return

    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      const response = await fetch('/api/email-captures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Email capture form created successfully!")
        setShowCreateForm(false)
        setFormData({
          title: "",
          description: "",
          buttonText: "Subscribe",
          placeholder: "Enter your email",
          successMessage: "Thank you for subscribing!"
        })
        fetchCaptures()
      } else {
        setError(data.error || "Failed to create email capture form")
      }
    } catch (err) {
      setError("Failed to create email capture form")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingCapture || !formData.title.trim()) return

    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      const response = await fetch(`/api/email-captures/${editingCapture.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Email capture form updated successfully!")
        setEditingCapture(null)
        setFormData({
          title: "",
          description: "",
          buttonText: "Subscribe",
          placeholder: "Enter your email",
          successMessage: "Thank you for subscribing!"
        })
        fetchCaptures()
      } else {
        setError(data.error || "Failed to update email capture form")
      }
    } catch (err) {
      setError("Failed to update email capture form")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (captureId: string) => {
    if (!confirm("Are you sure you want to delete this email capture form? All submissions will be lost.")) return

    try {
      const response = await fetch(`/api/email-captures/${captureId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSuccess("Email capture form deleted successfully")
        fetchCaptures()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to delete email capture form")
      }
    } catch (err) {
      setError("Failed to delete email capture form")
    }
  }

  const handleExport = async (captureId: string) => {
    try {
      const response = await fetch(`/api/email-captures/${captureId}/submissions?export=csv`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `email-submissions-${captureId}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (err) {
      setError("Failed to export submissions")
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getEmbedCode = (captureId: string) => {
    return `<!-- ${process.env.NEXT_PUBLIC_SITE_NAME || 'Lynx.NINJA'} Email Capture Form -->
<div id="lynx-email-capture-${captureId}"></div>
<script>
  (function() {
    const script = document.createElement('script');
    script.src = '${window.location.origin}/embed/email-capture/${captureId}.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`
  }

  const getDirectLink = (captureId: string) => {
    return `${window.location.origin}/embed/email-capture/${captureId}`
  }

  if (!isPremium) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Capture Forms</CardTitle>
          <CardDescription>
            Create lead generation forms to collect email addresses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
            <p className="text-gray-600 mb-4">
              Email capture forms are available for premium users only.
            </p>
            <Button>Upgrade to Premium</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Capture Forms</CardTitle>
        <CardDescription>
          Create lead generation forms to collect email addresses from your visitors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Links Page Form Selection */}
        {onEmailCaptureSelect && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">Links Page Integration</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="linksPageEmailCapture" className="text-sm text-blue-800">
                  Form to display on your links page:
                </Label>
                <select
                  id="linksPageEmailCapture"
                  value={selectedEmailCaptureId || ''}
                  onChange={(e) => onEmailCaptureSelect(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">No form (hide from links page)</option>
                  {captures.map((capture) => (
                    <option key={capture.id} value={capture.id}>
                      {capture.title} {!capture.is_active && '(Inactive)'}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedEmailCaptureId && (
                <div className="p-3 bg-white rounded-md border border-blue-200">
                  <p className="text-xs text-blue-700">
                    <strong>✓ Active:</strong> This form will appear at the bottom of your public links page, 
                    allowing visitors to subscribe to your updates.
                  </p>
                </div>
              )}
              
              {!selectedEmailCaptureId && captures.length > 0 && (
                <div className="p-3 bg-white rounded-md border border-blue-200">
                  <p className="text-xs text-blue-700">
                    <strong>ℹ️ No form selected:</strong> Choose a form above to display it on your links page.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <X className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Create/Edit Form */}
        {(showCreateForm || editingCapture) && (
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingCapture ? "Edit Email Capture Form" : "Create New Email Capture Form"}
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Newsletter Signup"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Get the latest updates delivered to your inbox"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="buttonText">Button Text</Label>
                  <Input
                    id="buttonText"
                    value={formData.buttonText}
                    onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="placeholder">Placeholder Text</Label>
                  <Input
                    id="placeholder"
                    value={formData.placeholder}
                    onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="successMessage">Success Message</Label>
                <Input
                  id="successMessage"
                  value={formData.successMessage}
                  onChange={(e) => setFormData({ ...formData, successMessage: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={editingCapture ? handleUpdate : handleCreate}
                  disabled={saving}
                >
                  {saving ? "Saving..." : (editingCapture ? "Update" : "Create")}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingCapture(null)
                    setFormData({
                      title: "",
                      description: "",
                      buttonText: "Subscribe",
                      placeholder: "Enter your email",
                      successMessage: "Thank you for subscribing!"
                    })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Captures List */}
        {!showCreateForm && !editingCapture && (
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Your Email Capture Forms</h3>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </Button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-4">Loading email capture forms...</div>
        ) : captures.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No email capture forms created yet
          </div>
        ) : (
          <div className="space-y-4">
            {captures.map((capture) => (
              <Card key={capture.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold prevent-overflow">{capture.title}</h4>
                      <Badge variant={capture.is_active ? "default" : "secondary"} className="flex-shrink-0">
                        {capture.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    {capture.description && (
                      <p className="text-sm text-gray-600 mb-3 text-wrap-balance">{capture.description}</p>
                    )}

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span>{capture.total_submissions} total</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4 text-green-500" />
                        <span>{capture.unique_emails} unique</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        <span>{capture.today_submissions} today</span>
                      </div>
                    </div>

                    <div className="mt-3 space-y-3">
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-xs text-gray-600 mb-2">Embed Code (for websites):</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-white px-2 py-1 rounded flex-1 overflow-x-auto break-all">
                            {getEmbedCode(capture.id)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(getEmbedCode(capture.id), `embed-${capture.id}`)}
                          >
                            {copied === `embed-${capture.id}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-blue-50 rounded-md">
                        <p className="text-xs text-blue-600 mb-2">Direct Link (for testing):</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-white px-2 py-1 rounded flex-1 overflow-x-auto break-all">
                            {getDirectLink(capture.id)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(getDirectLink(capture.id), `link-${capture.id}`)}
                          >
                            {copied === `link-${capture.id}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowInstructions(capture.id)}
                      title="How to use this form"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(capture.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCapture(capture)
                        setFormData({
                          title: capture.title,
                          description: capture.description || "",
                          buttonText: capture.button_text,
                          placeholder: capture.placeholder,
                          successMessage: capture.success_message
                        })
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(capture.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Embed Instructions Modal */}
        {showInstructions && (
          <EmbedInstructions
            captureId={showInstructions}
            onClose={() => setShowInstructions(null)}
          />
        )}
      </CardContent>
    </Card>
  )
}
