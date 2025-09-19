"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, X, QrCode } from "lucide-react"

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  linkId: string
  linkTitle: string
}

export function QRCodeModal({ isOpen, onClose, linkId, linkTitle }: QRCodeModalProps) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [url, setUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const generateQRCode = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      const response = await fetch(`/api/links/${linkId}/qr`)
      
      if (!response.ok) {
        throw new Error('Failed to generate QR code')
      }
      
      const data = await response.json()
      setQrCode(data.qrCode)
      setUrl(data.url)
    } catch (error) {
      console.error('Error generating QR code:', error)
      setError('Failed to generate QR code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const downloadQRCode = () => {
    if (!qrCode) return
    
    const link = document.createElement('a')
    link.href = qrCode
    link.download = `qr-code-${linkTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code
              </CardTitle>
              <CardDescription>
                Generate QR code for "{linkTitle}"
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!qrCode ? (
            <div className="text-center py-8">
              <QrCode className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">
                Generate a QR code that links directly to: <strong>{linkTitle}</strong>
              </p>
              <Button 
                onClick={generateQRCode} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Generating..." : "Generate QR Code"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <img 
                  src={qrCode} 
                  alt="QR Code" 
                  className="mx-auto border rounded-lg"
                />
                <p className="text-sm text-gray-600 mt-2 break-all">
                  QR Code links to: <strong>{url}</strong>
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={downloadQRCode}
                  className="flex-1"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button 
                  onClick={generateQRCode}
                  variant="outline"
                  disabled={isLoading}
                >
                  {isLoading ? "Generating..." : "Regenerate"}
                </Button>
              </div>
            </div>
          )}
          
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
