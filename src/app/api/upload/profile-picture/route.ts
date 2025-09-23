import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get the user from database
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Parse the form data
    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be smaller than 5MB" }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `profile-${user.id}-${timestamp}.${fileExtension}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-images')
      .getPublicUrl(fileName)

    // Update user's profile image in database
    const { error: updateError } = await supabase
      .from('User')
      .update({ profileImage: publicUrl })
      .eq('id', user.id)

    if (updateError) {
      console.error('Database update error:', updateError)
      // Try to clean up the uploaded file
      await supabase.storage.from('profile-images').remove([fileName])
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      imageUrl: publicUrl 
    })

  } catch (error) {
    console.error('Profile picture upload error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get the user from database
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id, profileImage')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // If user has a profile image, try to delete it from storage
    if (user.profileImage) {
      try {
        // Extract filename from URL
        const urlParts = user.profileImage.split('/')
        const fileName = urlParts[urlParts.length - 1]
        
        // Delete from storage
        await supabase.storage
          .from('profile-images')
          .remove([fileName])
      } catch (storageError) {
        console.error('Storage deletion error:', storageError)
        // Continue with database update even if storage deletion fails
      }
    }

    // Update user's profile image to null in database
    const { error: updateError } = await supabase
      .from('User')
      .update({ profileImage: null })
      .eq('id', user.id)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json({ error: "Failed to remove profile image" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Profile image removed successfully" 
    })

  } catch (error) {
    console.error('Profile picture removal error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
