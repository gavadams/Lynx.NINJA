"use client"

import { useState, useEffect } from "react"
import { inviteTeamMember } from "@/lib/team-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Users, 
  Plus, 
  Mail, 
  Crown, 
  Shield, 
  User, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  ExternalLink,
  Loader2
} from "lucide-react"

interface Team {
  id: string
  name: string
  description?: string
  ownerId: string
  role: string
  memberCount: number
  createdAt: string
}

interface TeamMember {
  id: string
  userId: string
  role: string
  status: string
  invitedAt: string
  joinedAt?: string
  userName: string
  userEmail: string
  userDisplayName: string
  userProfileImage?: string
}

interface TeamLink {
  id: string
  linkId: string
  title: string
  url: string
  isActive: boolean
  clickCount: number
  createdBy: string
  createdAt: string
  creatorName: string
  creatorEmail: string
}

interface TeamManagementProps {
  isPremium: boolean
}

export function TeamManagement({ isPremium }: TeamManagementProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamLinks, setTeamLinks] = useState<TeamLink[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    inviteEmail: '',
    inviteRole: 'member'
  })

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/teams')
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams || [])
      } else {
        setError("Failed to fetch teams")
      }
    } catch (err) {
      setError("Failed to fetch teams")
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamDetails = async (teamId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}`)
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data.members || [])
        setTeamLinks(data.links || [])
      } else {
        setError("Failed to fetch team details")
      }
    } catch (err) {
      setError("Failed to fetch team details")
    }
  }

  const createTeam = async () => {
    if (!formData.name.trim()) {
      setError("Team name is required")
      return
    }

    setCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null
        })
      })

      if (response.ok) {
        const newTeam = await response.json()
        setTeams([newTeam, ...teams])
        setFormData({ name: '', description: '', inviteEmail: '', inviteRole: 'member' })
        setShowCreateForm(false)
        setSuccess("Team created successfully!")
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to create team")
      }
    } catch (err) {
      setError("Failed to create team")
    } finally {
      setCreating(false)
    }
  }

  const inviteMember = async () => {
    if (!selectedTeam || !formData.inviteEmail.trim()) {
      setError("Email is required")
      return
    }

    setInviting(true)
    setError(null)

    try {
      const result = await inviteTeamMember(
        selectedTeam.id,
        formData.inviteEmail.trim(),
        formData.inviteRole
      )

      if (result.success) {
        setFormData({ ...formData, inviteEmail: '' })
        setShowInviteForm(false)
        setSuccess(result.message || "✅ Invitation sent successfully! The user will receive an email notification.")
        fetchTeamDetails(selectedTeam.id)
      } else {
        setError(result.error || "Failed to send invitation")
      }
    } catch (err) {
      setError("Failed to send invitation")
    } finally {
      setInviting(false)
    }
  }

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team)
    fetchTeamDetails(team.id)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      owner: "bg-yellow-100 text-yellow-800",
      admin: "bg-blue-100 text-blue-800",
      member: "bg-gray-100 text-gray-800"
    }

    return (
      <Badge className={variants[role as keyof typeof variants] || variants.member}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      accepted: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      declined: "bg-red-100 text-red-800"
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
          <CardTitle>Team Collaboration</CardTitle>
          <CardDescription>
            Collaborate with team members on shared links and analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
            <p className="text-gray-600 mb-4">
              Team collaboration is available with our premium plan
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
    <div className="space-y-6">

      {/* Teams List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Your Teams
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </CardTitle>
          <CardDescription>
            Manage your teams and collaborate with others
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading teams...</div>
          ) : teams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No teams created yet
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => (
                <Card 
                  key={team.id} 
                  className={`cursor-pointer transition-all ${
                    selectedTeam?.id === team.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                  }`}
                  onClick={() => handleTeamSelect(team)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{team.name}</h3>
                      {getRoleIcon(team.role)}
                    </div>
                    {team.description && (
                      <p className="text-sm text-gray-600 mb-2">{team.description}</p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{team.memberCount} members</span>
                      <span>{new Date(team.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Team Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Team</CardTitle>
            <CardDescription>
              Create a team to collaborate with others
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter team name"
              />
            </div>
            <div>
              <Label htmlFor="teamDescription">Description (Optional)</Label>
              <Textarea
                id="teamDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter team description"
                rows={3}
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={createTeam} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                {creating ? 'Creating...' : 'Create Team'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Details */}
      {selectedTeam && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Team Members
                </div>
                <Button size="sm" onClick={() => setShowInviteForm(true)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Invite
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teamMembers.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No members yet
                </div>
              ) : (
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {member.userDisplayName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{member.userDisplayName}</div>
                          <div className="text-sm text-gray-500">{member.userEmail}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getRoleBadge(member.role)}
                        {getStatusBadge(member.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ExternalLink className="h-5 w-5 mr-2" />
                Team Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teamLinks.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No shared links yet
                </div>
              ) : (
                <div className="space-y-3">
                  {teamLinks.map((link) => (
                    <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{link.title}</div>
                        <div className="text-sm text-gray-500">{link.url}</div>
                        <div className="text-xs text-gray-400">
                          Added by {link.creatorName} • {link.clickCount} clicks
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {link.isActive ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invite Member Form */}
      {showInviteForm && selectedTeam && (
        <Card>
          <CardHeader>
            <CardTitle>Invite Team Member</CardTitle>
            <CardDescription>
              Invite someone to join {selectedTeam.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="inviteEmail">Email Address</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={formData.inviteEmail}
                onChange={(e) => {
                  setFormData({ ...formData, inviteEmail: e.target.value })
                  // Clear error/success messages when user starts typing
                  if (error) setError(null)
                  if (success) setSuccess(null)
                }}
                placeholder="Enter email address"
              />
              <p className="text-sm text-muted-foreground mt-1">
                💡 The user must already have an account on this platform
              </p>
            </div>
            <div>
              <Label htmlFor="inviteRole">Role</Label>
              <select
                id="inviteRole"
                value={formData.inviteRole}
                onChange={(e) => {
                  setFormData({ ...formData, inviteRole: e.target.value })
                  // Clear error/success messages when user changes role
                  if (error) setError(null)
                  if (success) setSuccess(null)
                }}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <Button onClick={inviteMember} disabled={inviting}>
                {inviting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                {inviting ? 'Sending...' : 'Send Invitation'}
              </Button>
              <Button variant="outline" onClick={() => setShowInviteForm(false)}>
                Cancel
              </Button>
            </div>
            
            {/* Error and Success Messages */}
            {error && (
              <Alert variant="destructive">
                <X className="h-4 w-4" />
                <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
