'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { X, Flag, CheckCircle, AlertCircle } from 'lucide-react'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  reportType: 'user' | 'link'
  reportedUserId?: string
  reportedLinkId?: string
  reportedUserName?: string
  reportedLinkTitle?: string
}

const REPORT_TYPES = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Inappropriate Content' },
  { value: 'malicious', label: 'Malicious/Scam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'fake', label: 'Fake/Impersonation' },
  { value: 'other', label: 'Other' }
]

export function ReportModal({
  isOpen,
  onClose,
  reportType,
  reportedUserId,
  reportedLinkId,
  reportedUserName,
  reportedLinkTitle
}: ReportModalProps) {
  const [selectedReportType, setSelectedReportType] = useState('')
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedReportType || !reason.trim()) {
      setErrorMessage('Please select a report type and provide a reason.')
      setSubmitStatus('error')
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType: selectedReportType,
          reason: reason.trim(),
          description: description.trim() || null,
          reportedUserId: reportType === 'user' ? reportedUserId : null,
          reportedLinkId: reportType === 'link' ? reportedLinkId : null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitStatus('success')
        // Reset form
        setSelectedReportType('')
        setReason('')
        setDescription('')
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose()
          setSubmitStatus('idle')
        }, 2000)
      } else {
        setSubmitStatus('error')
        setErrorMessage(data.error || 'Failed to submit report. Please try again.')
      }
    } catch (error) {
      setSubmitStatus('error')
      setErrorMessage('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
      setSubmitStatus('idle')
      setErrorMessage('')
      setSelectedReportType('')
      setReason('')
      setDescription('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Flag className="h-5 w-5 mr-2 text-red-600" />
              <CardTitle>Report Content</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Report {reportType === 'user' ? `@${reportedUserName}` : `"${reportedLinkTitle}"`} for review
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {submitStatus === 'success' ? (
            <div className="text-center py-6">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-600 mb-2">Report Submitted</h3>
              <p className="text-sm text-gray-600">
                Thank you for helping keep our community safe. We'll review your report and take appropriate action.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="reportType">What's the issue?</Label>
                <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="reason">Brief reason *</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Contains spam content"
                  maxLength={200}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Additional details (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide any additional context that might help with the review..."
                  rows={3}
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {description.length}/1000 characters
                </p>
              </div>

              {submitStatus === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !selectedReportType || !reason.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
