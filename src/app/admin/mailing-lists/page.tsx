'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface MailingList {
  id: string
  name: string
  description: string
  isActive: boolean
  isDefault: boolean
  createdAt: string
  updatedAt: string
  subscriberCount: number
}

interface MailingListEmail {
  id: string
  subject: string
  sentAt: string
  recipientCount: number
  openedCount: number
  clickedCount: number
}

export default function AdminMailingListsPage() {
  const [mailingLists, setMailingLists] = useState<MailingList[]>([])
  const [emails, setEmails] = useState<MailingListEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingList, setEditingList] = useState<MailingList | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    isDefault: false
  })

  useEffect(() => {
    fetchMailingLists()
    fetchEmails()
  }, [])

  const fetchMailingLists = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/mailing-lists')
      const data = await response.json()

      if (response.ok) {
        setMailingLists(data.mailingLists || [])
      } else {
        setError(data.error || 'Failed to fetch mailing lists')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchEmails = async () => {
    try {
      const response = await fetch('/api/admin/mailing-lists/emails')
      const data = await response.json()

      if (response.ok) {
        setEmails(data.emails || [])
      }
    } catch (err) {
      console.error('Error fetching emails:', err)
    }
  }

  const handleCreateList = async () => {
    try {
      const response = await fetch('/api/admin/mailing-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setShowCreateForm(false)
        setFormData({ name: '', description: '', isActive: true, isDefault: false })
        fetchMailingLists()
      } else {
        setError(data.error || 'Failed to create mailing list')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    }
  }

  const handleUpdateList = async () => {
    if (!editingList) return

    try {
      const response = await fetch(`/api/admin/mailing-lists/${editingList.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setEditingList(null)
        setFormData({ name: '', description: '', isActive: true, isDefault: false })
        fetchMailingLists()
      } else {
        setError(data.error || 'Failed to update mailing list')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    }
  }

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this mailing list? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/mailing-lists/${listId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchMailingLists()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete mailing list')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    }
  }

  const startEdit = (list: MailingList) => {
    setEditingList(list)
    setFormData({
      name: list.name,
      description: list.description,
      isActive: list.isActive,
      isDefault: list.isDefault
    })
  }

  const cancelEdit = () => {
    setEditingList(null)
    setFormData({ name: '', description: '', isActive: true, isDefault: false })
  }

  if (loading && mailingLists.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading mailing lists...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mailing Lists</h1>
          <p className="text-gray-600 mt-2">
            Manage email marketing and newsletter subscriptions
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Mailing List
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Create/Edit Form */}
      {(showCreateForm || editingList) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingList ? 'Edit Mailing List' : 'Create New Mailing List'}
            </CardTitle>
            <CardDescription>
              {editingList ? 'Update the mailing list details' : 'Set up a new mailing list for your subscribers'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Newsletter, Product Updates"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this mailing list is for"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
                />
                <Label htmlFor="isDefault">Default (auto-subscribe new users)</Label>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={editingList ? cancelEdit : () => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button onClick={editingList ? handleUpdateList : handleCreateList}>
                {editingList ? 'Update' : 'Create'} Mailing List
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mailing Lists Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mailing Lists</CardTitle>
          <CardDescription>
            Manage your email marketing lists and subscriber preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Subscribers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mailingLists.map((list) => (
                <TableRow key={list.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{list.name}</span>
                      {list.isDefault && (
                        <Badge variant="default" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">{list.description}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{list.subscriberCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={list.isActive ? "default" : "secondary"}>
                      {list.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDistanceToNow(new Date(list.createdAt), { addSuffix: true })}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(list)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteList(list.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Emails */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Emails</CardTitle>
          <CardDescription>
            Track email performance and engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emails.length === 0 ? (
            <div className="text-center py-8">
              <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No emails sent yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Clicked</TableHead>
                  <TableHead>Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emails.map((email) => (
                  <TableRow key={email.id}>
                    <TableCell className="font-medium">{email.subject}</TableCell>
                    <TableCell>{email.recipientCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{email.openedCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        <span>{email.clickedCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(email.sentAt), { addSuffix: true })}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
