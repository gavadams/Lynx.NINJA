"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Mail } from "lucide-react"

interface EmailCaptureFormProps {
  captureId: string
  title: string
  description?: string
  buttonText?: string
  placeholder?: string
  successMessage?: string
  className?: string
}

export function EmailCaptureForm({
  captureId,
  title,
  description,
  buttonText = "Subscribe",
  placeholder = "Enter your email",
  successMessage = "Thank you for subscribing!",
  className = ""
}: EmailCaptureFormProps) {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError("Please enter your email address")
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/email-captures/${captureId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSuccess(true)
        setEmail("")
      } else {
        setError(data.error || "Failed to subscribe")
      }
    } catch (err) {
      setError("Failed to subscribe. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-blue-600 mb-2">
            {successMessage}
          </h3>
          <p className="text-gray-600">
            We'll keep you updated with our latest news and updates.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`${className}`}>
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <Mail className="h-8 w-8 text-blue-500 mx-auto mb-3" />
          <h3 className="text-xl font-semibold text-blue-600 mb-2">
            {title}
          </h3>
          {description && (
            <p className="text-gray-600">
              {description}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder={placeholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
              required
            />
          </div>
          
          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Subscribing..." : buttonText}
          </Button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-4">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </CardContent>
    </Card>
  )
}
