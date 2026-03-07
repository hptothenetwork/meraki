import Image from "next/image"
import Link from "next/link"

// This page is only shown if the /admin proxy rewrite is not configured.
// When ADMIN_APP_URL is set in next.config.mjs the rewrite intercepts /admin
// before this component ever renders.
export default function AdminRedirectPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex items-center justify-center gap-6">
          <Image src="/logo/logo.svg" alt="Meraki logo" width={120} height={36} priority />
          <Image src="/images/meraki-logo.png" alt="Meraki wordmark" width={120} height={36} />
          <Image src="/icon-light-32x32.png" alt="Meraki icon" width={32} height={32} />
        </div>
        <h1 className="text-xl text-foreground">Admin not configured</h1>
        <p className="mt-2 text-sm text-muted-foreground">Set ADMIN_APP_URL to your admin domain.</p>
        <div className="mt-4">
          <Link href="/" className="text-primary underline-offset-4 hover:underline" aria-label="Go to home">
            Go home
          </Link>
        </div>
      </div>
    </main>
  )
}
