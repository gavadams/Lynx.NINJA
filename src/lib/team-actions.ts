'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendTeamInvitationEmail } from "@/lib/email"

export async function inviteTeamMember(teamId: string, email: string, role: string = 'member') {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Validate input parameters
    if (!email || email.trim().length === 0) {
      return { success: false, error: "❌ Email is required\n\nPlease enter a valid email address." }
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return { success: false, error: `❌ Invalid email format\n\n"${email}" is not a valid email address. Please check the format.` }
    }

    // Validate role
    const validRoles = ['owner', 'admin', 'member']
    if (!validRoles.includes(role)) {
      return { success: false, error: `❌ Invalid role\n\nRole must be one of: ${validRoles.join(', ')}` }
    }
    const { data: invitedUser, error: userError } = await supabase
      .from('User')
      .select('id, displayName')
      .eq('email', email)
      .single()

    if (userError || !invitedUser) {
      // Provide specific error messages based on the error type
      if (userError?.code === 'PGRST116') {
        return { 
          success: false, 
          error: `❌ User not found: "${email}"\n\nThis email address is not registered on our platform. Please:\n• Check the spelling of the email address\n• Ask the person to create an account first\n• Use a different email address` 
        }
      }
      
      return { 
        success: false, 
        error: `❌ Unable to find user: "${email}"\n\nPlease verify the email address is correct and the user has an account.` 
      }
    }

    // Check if user is trying to invite themselves
    if (invitedUser.id === session.user.email) {
      return { 
        success: false, 
        error: `❌ Cannot invite yourself\n\nYou cannot invite yourself to a team. You are already the owner.` 
      }
    }
    const { data: newMember, error } = await supabase
      .from('TeamMember')
      .insert({
        teamId: teamId,
        userId: invitedUser.id,
        role,
        status: 'pending',
        invitedBy: session.user.email
      })
      .select()
      .single()

    if (error) {
      // Handle specific database errors
      if (error.code === '23505') { // Unique constraint violation
        return { 
          success: false, 
          error: `❌ User already in team\n\n"${invitedUser.displayName}" (${email}) is already a member of this team or has a pending invitation.` 
        }
      }
      
      if (error.code === '23503') { // Foreign key constraint violation
        return { 
          success: false, 
          error: `❌ Invalid team or user\n\nThere was an issue with the team or user data. Please try again.` 
        }
      }
      
      return { 
        success: false, 
        error: `❌ Failed to send invitation\n\nError: ${error.message || 'Unknown error occurred'}` 
      }
    }

    // Get team and inviter details for email
    const { data: team, error: teamError } = await supabase
      .from('Team')
      .select('name')
      .eq('id', teamId)
      .single()

    const { data: inviter, error: inviterError } = await supabase
      .from('User')
      .select('displayName')
      .eq('id', session.user.email)
      .single()

    // Send email notification (non-blocking)
    if (team && inviter) {
      const acceptUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/teams/invitations/${newMember.id}`
      
      sendTeamInvitationEmail({
        to: email,
        inviterName: inviter.displayName || 'A team member',
        teamName: team.name,
        role: role,
        acceptUrl: acceptUrl
      }).catch(error => {
        console.error('Failed to send invitation email:', error)
        // Don't fail the invitation if email fails
      })
    }

    return { 
      success: true, 
      message: "Member invited successfully! An email notification has been sent.",
      member: newMember
    }
  } catch (error) {
    console.error("Error in inviteTeamMember:", error)
    return { success: false, error: "Internal server error" }
  }
}
