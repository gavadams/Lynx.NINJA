import { DynamicLogo } from "@/components/dynamic-logo"

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center">
          <DynamicLogo size={64} />
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-4">
            We&apos;re Under Maintenance
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            We&apos;re currently performing scheduled maintenance to improve your experience. 
            We&apos;ll be back online shortly.
          </p>
          
          <div className="bg-muted/50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              What&apos;s happening?
            </h2>
            <p className="text-muted-foreground">
              Our team is working hard to enhance the platform with new features and improvements. 
              This maintenance window ensures everything runs smoothly for you.
            </p>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Expected completion: Within the next few hours</p>
            <p className="mt-2">
              Need immediate assistance? Contact us at{" "}
              <a href="mailto:support@lynx.ninja" className="text-primary hover:underline">
                support@lynx.ninja
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
