"use client"

import { EmailCaptureForm } from "@/components/email-capture-form"

export default function TestEmailCapturePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">Test Email Capture Form</h1>
        
        {/* You'll need to create an email capture form first in settings */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> First create an email capture form in your dashboard settings, 
            then replace the captureId below with the actual ID from your form.
          </p>
        </div>

        {/* Replace 'your-capture-id' with actual ID from settings */}
        <EmailCaptureForm
          captureId="your-capture-id"
          title="Test Newsletter"
          description="This is a test email capture form"
          buttonText="Subscribe"
          placeholder="Enter your email"
          successMessage="Thank you for subscribing!"
        />
      </div>
    </div>
  )
}
