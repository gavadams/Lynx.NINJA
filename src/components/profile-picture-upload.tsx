"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, X, Loader2 } from "lucide-react"

interface ProfilePictureUploadProps {
  currentImage?: string
  displayName: string
  onImageUpdate: (imageUrl: string | null) => void
  disabled?: boolean
}

export function ProfilePictureUpload({ 
  currentImage, 
  displayName, 
  onImageUpdate, 
  disabled = false 
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload the file
    uploadImage(file)
  }

  const uploadImage = async (file: File) => {
    setUploading(true)
    
    try {
      // Create FormData
      const formData = new FormData()
      formData.append('image', file)

      // Upload to our API
      const response = await fetch('/api/upload/profile-picture', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const { imageUrl } = await response.json()
      
      // Update the parent component
      onImageUpdate(imageUrl)
      setPreview(null)
      
      alert('Profile picture updated successfully!')
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
      setPreview(null)
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = async () => {
    setUploading(true)
    
    try {
      const response = await fetch('/api/upload/profile-picture', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove image')
      }

      onImageUpdate(null)
      alert('Profile picture removed successfully!')
    } catch (error) {
      console.error('Error removing image:', error)
      alert('Failed to remove image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const displayImage = preview || currentImage

  return (
    <div className="flex items-center space-x-4">
      <div className="relative">
        <Avatar className="h-20 w-20">
          <AvatarImage src={displayImage} alt={displayName} />
          <AvatarFallback className="text-2xl">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {uploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
      </div>
      
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground mb-1">Profile Picture</p>
        <p className="text-xs text-muted-foreground mb-3">
          Upload a custom profile picture (JPG, PNG, GIF up to 5MB)
        </p>
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || disabled}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {currentImage ? 'Change' : 'Upload'}
          </Button>
          
          {currentImage && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveImage}
              disabled={uploading || disabled}
              className="flex items-center gap-2 text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
              Remove
            </Button>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || disabled}
        />
      </div>
    </div>
  )
}
