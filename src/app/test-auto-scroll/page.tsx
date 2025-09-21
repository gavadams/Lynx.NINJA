"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAutoScroll } from '@/hooks/useAutoScroll'

export default function TestAutoScrollPage() {
  const [showFields, setShowFields] = useState(false)
  const { scrollToField, handleFieldFocus } = useAutoScroll()

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Auto-Scroll Test Page</h1>
        <p className="text-gray-600 mb-6">
          This page demonstrates the auto-scroll functionality. Click the button below to show edit fields,
          then click on any field to see the auto-scroll in action.
        </p>
        <Button onClick={() => setShowFields(!showFields)}>
          {showFields ? 'Hide' : 'Show'} Edit Fields
        </Button>
      </div>

      {showFields && (
        <div className="space-y-6">
          {/* Spacer to push fields off-screen */}
          <div className="h-screen bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Scroll down to see the edit fields below</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Test Edit Fields</CardTitle>
              <CardDescription>
                Click on any field below to see auto-scroll in action
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-field-1">Test Field 1</Label>
                <Input
                  id="test-field-1"
                  placeholder="Click me to test auto-scroll"
                  onFocus={() => handleFieldFocus('test-field-1')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="test-field-2">Test Field 2</Label>
                <Input
                  id="test-field-2"
                  placeholder="Click me to test auto-scroll"
                  onFocus={() => handleFieldFocus('test-field-2')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="test-field-3">Test Textarea</Label>
                <Textarea
                  id="test-field-3"
                  placeholder="Click me to test auto-scroll"
                  onFocus={() => handleFieldFocus('test-field-3')}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="test-field-4">Test Field 4</Label>
                <Input
                  id="test-field-4"
                  placeholder="Click me to test auto-scroll"
                  onFocus={() => handleFieldFocus('test-field-4')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Another spacer */}
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">More content below</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>More Test Fields</CardTitle>
              <CardDescription>
                These fields are further down the page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-field-5">Test Field 5</Label>
                <Input
                  id="test-field-5"
                  placeholder="Click me to test auto-scroll"
                  onFocus={() => handleFieldFocus('test-field-5')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="test-field-6">Test Field 6</Label>
                <Input
                  id="test-field-6"
                  placeholder="Click me to test auto-scroll"
                  onFocus={() => handleFieldFocus('test-field-6')}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
