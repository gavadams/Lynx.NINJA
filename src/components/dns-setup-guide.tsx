"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Check, ExternalLink, Info } from "lucide-react"

interface DNSSetupGuideProps {
  domain: string
  verificationCode: string
  onClose?: () => void
}

export function DNSSetupGuide({ domain, verificationCode, onClose }: DNSSetupGuideProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error("Failed to copy to clipboard")
    }
  }

  const dnsRecords = [
    {
      id: 'verification',
      type: 'TXT',
      name: domain,
      value: verificationCode,
      ttl: '300',
      description: 'Domain verification record'
    },
    {
      id: 'cname',
      type: 'CNAME',
      name: 'www',
      value: process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'www.lynx.ninja',
      ttl: '300',
      description: 'WWW subdomain redirect'
    },
    {
      id: 'apex',
      type: 'A',
      name: '@',
      value: '76.76.19.61', // This would be your actual IP
      ttl: '300',
      description: 'Apex domain redirect (if supported)'
    }
  ]

  const providers = [
    {
      name: 'Cloudflare',
      url: 'https://dash.cloudflare.com',
      steps: [
        'Log in to your Cloudflare dashboard',
        'Select your domain',
        'Go to DNS > Records',
        'Click "Add record"',
        'Select the record type and enter the values',
        'Click "Save"'
      ]
    },
    {
      name: 'GoDaddy',
      url: 'https://dcc.godaddy.com',
      steps: [
        'Log in to your GoDaddy account',
        'Go to My Products > DNS',
        'Find your domain and click "Manage"',
        'Click "Add" to create a new record',
        'Select the record type and enter the values',
        'Click "Save"'
      ]
    },
    {
      name: 'Namecheap',
      url: 'https://ap.www.namecheap.com',
      steps: [
        'Log in to your Namecheap account',
        'Go to Domain List and click "Manage"',
        'Go to Advanced DNS tab',
        'Click "Add New Record"',
        'Select the record type and enter the values',
        'Click "Save"'
      ]
    },
    {
      name: 'Google Domains',
      url: 'https://domains.google.com',
      steps: [
        'Log in to your Google Domains account',
        'Select your domain',
        'Go to DNS tab',
        'Click "Custom records"',
        'Add the new record with the values',
        'Click "Save"'
      ]
    }
  ]

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Info className="h-5 w-5 mr-2" />
          DNS Setup Guide for {domain}
        </CardTitle>
        <CardDescription>
          Follow these steps to configure your domain's DNS settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="records" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="records">DNS Records</TabsTrigger>
            <TabsTrigger value="providers">DNS Providers</TabsTrigger>
            <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
          </TabsList>

          <TabsContent value="records" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Required DNS Records</h3>
              <p className="text-sm text-gray-600">
                Add these DNS records to your domain's DNS settings. The verification record is required first.
              </p>
              
              {dnsRecords.map((record) => (
                <Card key={record.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{record.type}</Badge>
                      <span className="font-medium">{record.description}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(`${record.type} ${record.name} ${record.value}`, record.id)}
                    >
                      {copied === record.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm font-mono bg-gray-50 p-3 rounded">
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <div className="font-semibold">{record.type}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <div className="font-semibold">{record.name}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Value:</span>
                      <div className="font-semibold break-all">{record.value}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">TTL:</span>
                      <div className="font-semibold">{record.ttl}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="providers" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">DNS Provider Instructions</h3>
              <p className="text-sm text-gray-600">
                Select your DNS provider for specific setup instructions.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providers.map((provider) => (
                  <Card key={provider.name} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{provider.name}</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(provider.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open
                      </Button>
                    </div>
                    
                    <ol className="text-sm space-y-1">
                      {provider.steps.map((step, index) => (
                        <li key={index} className="flex items-start">
                          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full mr-2 mt-0.5">
                            {index + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="troubleshooting" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Troubleshooting</h3>
              
              <div className="space-y-4">
                <Card className="p-4">
                  <h4 className="font-semibold mb-2">DNS Propagation</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    DNS changes can take up to 48 hours to propagate worldwide, but usually take 15-30 minutes.
                  </p>
                  <ul className="text-sm space-y-1">
                    <li>• Use online DNS checkers to verify your records</li>
                    <li>• Clear your browser cache and try again</li>
                    <li>• Try accessing from a different network</li>
                  </ul>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold mb-2">Common Issues</h4>
                  <ul className="text-sm space-y-1">
                    <li>• <strong>Record not found:</strong> Make sure the TXT record is exactly as shown</li>
                    <li>• <strong>Wrong record type:</strong> Ensure you're adding a TXT record, not A or CNAME</li>
                    <li>• <strong>Case sensitivity:</strong> DNS records are case-sensitive</li>
                    <li>• <strong>Extra spaces:</strong> Remove any leading/trailing spaces from values</li>
                  </ul>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold mb-2">Need Help?</h4>
                  <p className="text-sm text-gray-600">
                    If you're still having trouble, contact your DNS provider's support team or reach out to our support.
                  </p>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {onClose && (
          <div className="flex justify-end mt-6">
            <Button onClick={onClose}>
              Got it, I'll set this up
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
