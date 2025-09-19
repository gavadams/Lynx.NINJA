"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, ExternalLink } from "lucide-react"
import { useState } from "react"

interface EmbedInstructionsProps {
  captureId: string
  onClose: () => void
}

export function EmbedInstructions({ captureId, onClose }: EmbedInstructionsProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const embedCode = `<!-- ${process.env.NEXT_PUBLIC_SITE_NAME || 'Lynx.NINJA'} Email Capture Form -->
<div id="lynx-email-capture-${captureId}"></div>
<script>
  (function() {
    const script = document.createElement('script');
    script.src = '${window.location.origin}/embed/email-capture/${captureId}.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`

  const directLink = `${window.location.origin}/embed/email-capture/${captureId}`

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-4xl modal-content">
        <CardHeader>
          <CardTitle>How to Use Your Email Capture Form</CardTitle>
          <CardDescription>
            Add this form to your website to collect email addresses from visitors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Method 1: Embed Code */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Badge variant="default">Method 1</Badge>
              Embed Code (Recommended)
            </h3>
            <p className="text-gray-600 mb-4">
              Copy and paste this code into your website's HTML where you want the form to appear.
            </p>
            
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm whitespace-pre-wrap break-all">{embedCode}</pre>
            </div>
            
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => copyToClipboard(embedCode, 'embed')}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {copied === 'embed' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy Embed Code
              </button>
            </div>
          </div>

          {/* Method 2: Direct Link */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Badge variant="secondary">Method 2</Badge>
              Direct Link
            </h3>
            <p className="text-gray-600 mb-4">
              Use this link to test your form or redirect visitors to a dedicated signup page.
            </p>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <code className="text-sm break-all">{directLink}</code>
            </div>
            
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => copyToClipboard(directLink, 'link')}
                className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                {copied === 'link' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy Direct Link
              </button>
              <a
                href={directLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Test Form
              </a>
            </div>
          </div>

          {/* Platform Instructions */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Platform-Specific Instructions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">WordPress</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Go to your page/post editor</li>
                    <li>Switch to "Text" or "HTML" mode</li>
                    <li>Paste the embed code where you want the form</li>
                    <li>Publish your page</li>
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">HTML Websites</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Open your HTML file in a text editor</li>
                    <li>Find where you want the form</li>
                    <li>Paste the embed code</li>
                    <li>Save and upload your file</li>
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Squarespace</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Add a "Code Block" to your page</li>
                    <li>Paste the embed code</li>
                    <li>Save the page</li>
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Wix</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Add an "HTML Embed" element</li>
                    <li>Paste the embed code</li>
                    <li>Apply and publish</li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• The form will automatically adapt to your website's styling</li>
              <li>• All email submissions will appear in your dashboard</li>
              <li>• You can export collected emails as CSV files</li>
              <li>• The form works on mobile and desktop devices</li>
              <li>• No additional setup or configuration required</li>
            </ul>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Got it!
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
