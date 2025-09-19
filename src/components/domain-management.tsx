"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, Plus, CheckCircle, XCircle, Clock, ExternalLink, Copy, Check } from "lucide-react"

interface CustomDomain {
  id: string
  domain: string
  status: 'pending' | 'verified' | 'active' | 'error'
  verificationCode: string
  createdAt: string
  updatedAt: string
}

interface DomainManagementProps {
  isPremium: boolean
}

export function DomainManagement({ isPremium }: DomainManagementProps) {
  const [domains, setDomains] = useState<CustomDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [newDomain, setNewDomain] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [activating, setActivating] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    fetchDomains()
  }, [])

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/domains')
      if (response.ok) {
        const data = await response.json()
        setDomains(data.domains || [])
      } else {
        setError("Failed to fetch domains")
      }
    } catch (err) {
      setError("Failed to fetch domains")
    } finally {
      setLoading(false)
    }
  }

  const addDomain = async () => {
    if (!newDomain.trim()) {
      setError("Please enter a domain")
      return
    }

    setIsAdding(true)
    setError(null)

    try {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        setDomains([data, ...domains])
        setNewDomain("")
        setSuccess("Domain added successfully! Please add the DNS record to verify ownership.")
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to add domain")
      }
    } catch (err) {
      setError("Failed to add domain")
    } finally {
      setIsAdding(false)
    }
  }

  const verifyDomain = async (domainId: string) => {
    setVerifying(domainId)
    setError(null)

    try {
      const response = await fetch(`/api/domains/${domainId}/verify`, {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        fetchDomains() // Refresh the list
      } else {
        setError(data.message || "Verification failed")
      }
    } catch (err) {
      setError("Failed to verify domain")
    } finally {
      setVerifying(null)
    }
  }

  const activateDomain = async (domainId: string) => {
    setActivating(domainId)
    setError(null)

    try {
      const response = await fetch(`/api/domains/${domainId}/activate`, {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        fetchDomains() // Refresh the list
      } else {
        setError(data.error || "Activation failed")
      }
    } catch (err) {
      setError("Failed to activate domain")
    } finally {
      setActivating(null)
    }
  }

  const deleteDomain = async (domainId: string) => {
    if (!confirm("Are you sure you want to delete this domain?")) return

    try {
      const response = await fetch(`/api/domains/${domainId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDomains(domains.filter(d => d.id !== domainId))
        setSuccess("Domain deleted successfully")
      } else {
        setError("Failed to delete domain")
      }
    } catch (err) {
      setError("Failed to delete domain")
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      setError("Failed to copy to clipboard")
    }
  }

  const getStatusIcon = (status: string) => {
    // Handle undefined or null status
    if (!status || typeof status !== 'string') {
      return <Clock className="h-4 w-4 text-gray-500" />
    }

    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800",
      verified: "bg-blue-100 text-blue-800",
      pending: "bg-yellow-100 text-yellow-800",
      error: "bg-red-100 text-red-800"
    }

    // Handle undefined or null status
    if (!status || typeof status !== 'string') {
      return (
        <Badge className={variants.pending}>
          Unknown
        </Badge>
      )
    }

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (!isPremium) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Custom Domains</CardTitle>
          <CardDescription>
            Use your own domain for your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
            <p className="text-gray-600 mb-4">
              Custom domains are available with our premium plan
            </p>
            <Button onClick={() => window.location.href = '/dashboard/settings'}>
              Upgrade to Premium
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Domains</CardTitle>
        <CardDescription>
          Use your own domain for your profile (e.g., yourname.com)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Add New Domain */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="domain">Add Custom Domain</Label>
            <div className="flex space-x-2 mt-1">
              <Input
                id="domain"
                placeholder="yourname.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addDomain()}
              />
              <Button 
                onClick={addDomain} 
                disabled={isAdding}
                className="px-6"
              >
                {isAdding ? "Adding..." : <><Plus className="h-4 w-4 mr-2" />Add</>}
              </Button>
            </div>
          </div>
        </div>

        {/* Domains List */}
        {loading ? (
          <div className="text-center py-4">Loading domains...</div>
        ) : domains.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No custom domains added yet
          </div>
        ) : (
          <div className="space-y-4">
            {domains.map((domain) => (
              <Card key={domain.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(domain?.status)}
                    <div>
                      <h3 className="font-semibold">{domain?.domain || 'Unknown Domain'}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStatusBadge(domain?.status)}
                        <span className="text-sm text-gray-500">
                          Added {domain?.createdAt ? new Date(domain.createdAt).toLocaleDateString() : 'Unknown date'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {domain?.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => verifyDomain(domain.id)}
                        disabled={verifying === domain.id}
                      >
                        {verifying === domain.id ? "Verifying..." : "Verify"}
                      </Button>
                    )}
                    
                    {domain?.status === 'verified' && (
                      <Button
                        size="sm"
                        onClick={() => activateDomain(domain.id)}
                        disabled={activating === domain.id}
                      >
                        {activating === domain.id ? "Activating..." : "Activate"}
                      </Button>
                    )}
                    
                    {domain?.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`https://${domain?.domain}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteDomain(domain.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* DNS Instructions */}
                {domain?.status === 'pending' && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">DNS Setup Required</h4>
                    <p className="text-sm text-blue-800 mb-2">
                      Add this TXT record to your domain's DNS settings:
                    </p>
                    <div className="bg-white p-2 rounded border text-sm font-mono">
                      <div className="flex items-center justify-between">
                        <span>Type: TXT | Name: {domain?.domain || 'Unknown'} | Value: {domain?.verificationCode || 'Unknown'}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(domain?.verificationCode || '', domain.id)}
                        >
                          {copied === domain.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}