"use client"

import { useState, useEffect } from "react"
import { EmailCaptureForm } from "@/components/email-capture-form"

interface EmailCapture {
  id: string
  title: string
  description?: string
  buttonText: string
  placeholder: string
  successMessage: string
  isActive: boolean
}

export default function EmailCaptureEmbedPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const [capture, setCapture] = useState<EmailCapture | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCapture = async () => {
      try {
        const resolvedParams = await params
        const response = await fetch(`/api/email-captures/${resolvedParams.id}`)
        
        if (response.ok) {
          const data = await response.json()
          setCapture(data.capture)
        } else {
          setError("Email capture form not found")
        }
      } catch (err) {
        setError("Failed to load email capture form")
      } finally {
        setLoading(false)
      }
    }

    fetchCapture()
  }, [params])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (error || !capture) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-blue-600 mb-2">Form Not Found</h1>
          <p className="text-gray-600">This email capture form doesn't exist or has been removed.</p>
        </div>
      </div>
    )
  }

  if (!capture.isActive) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-blue-600 mb-2">Form Inactive</h1>
          <p className="text-gray-600">This email capture form is currently inactive.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <EmailCaptureForm
          captureId={capture.id}
          title={capture.title}
          description={capture.description}
          buttonText={capture.buttonText}
          placeholder={capture.placeholder}
          successMessage={capture.successMessage}
        />
      </div>
    </div>
  )
}
