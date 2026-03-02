"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import Image from "next/image"
import { Mail, MapPin, PhoneCall, Sparkles } from "lucide-react"
import ReCAPTCHA from "react-google-recaptcha"
import type { SiteAssets } from "@/types/catalog"
import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { useLiveSiteAssets } from "@/hooks/use-live-site-assets"

export type ContactPageMode = "contact" | "custom_cut" | "details"

export function ContactPage({ siteAssets, mode = "contact" }: { siteAssets: SiteAssets; mode?: ContactPageMode }) {
  const liveSiteAssets = useLiveSiteAssets(siteAssets)
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" })
  const [customCut, setCustomCut] = useState({
    name: "",
    email: "",
    phone: "",
    style: "",
    fabric: "",
    timeline: "",
    notes: "",
  })
  const [sending, setSending] = useState(false)
  const [sendingCustom, setSendingCustom] = useState(false)
  const [done, setDone] = useState("")
  const [customDone, setCustomDone] = useState("")
  const [contactCaptchaToken, setContactCaptchaToken] = useState("")
  const [customCaptchaToken, setCustomCaptchaToken] = useState("")
  const contactCaptchaRef = useRef<ReCAPTCHA | null>(null)
  const customCaptchaRef = useRef<ReCAPTCHA | null>(null)
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""
  const contactSettings = liveSiteAssets.contact || {}
  const inboxEmail = contactSettings.email || "brandmeraki5@gmail.com"
  const showCustomCutsForm = contactSettings.enableCustomCutsForm !== false

  const contactHero =
    typeof liveSiteAssets.sectionImages?.contactHero === "string"
      ? liveSiteAssets.sectionImages.contactHero
      : Array.isArray(liveSiteAssets.sectionImages?.contactHero) && liveSiteAssets.sectionImages.contactHero[0]
        ? typeof liveSiteAssets.sectionImages.contactHero[0] === "string"
          ? liveSiteAssets.sectionImages.contactHero[0]
          : liveSiteAssets.sectionImages.contactHero[0].src
      : ""

  const submitCustomCut = async (e: React.FormEvent) => {
    e.preventDefault()
    if (recaptchaSiteKey && !customCaptchaToken) {
      setCustomDone("Please complete captcha first.")
      return
    }
    setSendingCustom(true)
    setCustomDone("")
    const res = await fetch("/api/forms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        formType: "custom_cut",
        captchaToken: customCaptchaToken,
        ...customCut,
      }),
    })
    setSendingCustom(false)
    if (res.ok) {
      setCustomDone("Custom cut request sent. We will reach out with next steps.")
      setCustomCut({ name: "", email: "", phone: "", style: "", fabric: "", timeline: "", notes: "" })
      setCustomCaptchaToken("")
      customCaptchaRef.current?.reset()
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      setCustomDone(data.error || "Failed to send custom cut request. Please try again.")
    }
  }

  const submitContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (recaptchaSiteKey && !contactCaptchaToken) {
      setDone("Please complete captcha first.")
      return
    }
    setSending(true)
    setDone("")
    const res = await fetch("/api/forms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        formType: "contact",
        captchaToken: contactCaptchaToken,
        ...form,
      }),
    })
    setSending(false)
    if (res.ok) {
      setDone("Your message was sent. We will get back to you soon.")
      setForm({ name: "", email: "", phone: "", message: "" })
      setContactCaptchaToken("")
      contactCaptchaRef.current?.reset()
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      setDone(data.error || "Failed to send. Please try again.")
    }
  }

  const heroTitle =
    mode === "custom_cut"
      ? "Design your custom Meraki cut."
      : mode === "details"
        ? "Reach MERAKI directly."
        : "Let's style your next signature look."

  const heroBody =
    mode === "custom_cut"
      ? "Share your preferred style, fabric, and timeline. Our team will guide you from idea to final fit."
      : mode === "details"
        ? "See our email, phone, and studio details on this dedicated page."
        : "Questions about sizes, custom requests, or order help. Our team reads every message from this form."
  const useMinimalTopBar = mode === "contact" || mode === "custom_cut"
  const breadcrumbCurrentLabel = mode === "custom_cut" ? "CUSTOM CUT REQUEST" : "CONTACT"

  return (
    <main className="min-h-screen bg-background">
      <Navbar
        compact={useMinimalTopBar}
        hideBrandLogo={useMinimalTopBar}
        hideSearchIcon={useMinimalTopBar}
        hideCartIcon={useMinimalTopBar}
        hideAccountIcon={useMinimalTopBar}
        alwaysShowMenuButton={useMinimalTopBar}
      />

      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(196,169,125,0.22),transparent_55%)]" />
        <div className={`mx-auto max-w-7xl px-4 md:px-8 ${useMinimalTopBar ? "pb-12 pt-16 md:pb-16 md:pt-20" : "py-12 md:py-16"}`}>
          {useMinimalTopBar && (
            <nav aria-label="Breadcrumb" className="mb-5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <Link href="/" className="hover:text-foreground">
                HOME
              </Link>
              <span className="px-2 text-muted-foreground/70">/</span>
              <span className="text-foreground/80">{breadcrumbCurrentLabel}</span>
            </nav>
          )}
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Talk to Meraki</p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl text-foreground md:text-5xl">{heroTitle}</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">{heroBody}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:px-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          {contactHero && (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <Image
                src={contactHero}
                alt="Meraki studio"
                width={1200}
                height={720}
                unoptimized
                className="h-72 w-full object-cover"
              />
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-serif text-2xl text-foreground">Contact Details</h2>
            <div className="mt-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-secondary p-2 text-foreground">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</p>
                  <p className="text-sm text-foreground">{inboxEmail}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-secondary p-2 text-foreground">
                  <PhoneCall className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Phone</p>
                  <p className="text-sm text-foreground">{contactSettings.phone || "+255 000 000 000"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-secondary p-2 text-foreground">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Studio</p>
                  <p className="text-sm text-foreground">{contactSettings.studio || "Dar es Salaam, Tanzania"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-serif text-xl text-foreground">Open the right page</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Need a tailored design? Go directly to the custom cut request page.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/custom-cut-request" className="rounded-full border border-border px-4 py-2 text-xs uppercase tracking-[0.12em] text-foreground">
                Custom Cut
              </Link>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          {mode === "details" ? (
            <div className="rounded-2xl border border-border bg-card p-8">
              <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-accent" />
                Contact info page
              </div>
              <p className="text-sm text-muted-foreground">
                Use this page for quick reference only. To send a message, use the contact form page. For tailored designs,
                use the custom cut page.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/contact" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
                  Open Contact Form
                </Link>
                <Link href="/custom-cut-request" className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground">
                  Open Custom Cut Form
                </Link>
              </div>
            </div>
          ) : mode === "custom_cut" ? (
            showCustomCutsForm ? (
              <form onSubmit={submitCustomCut} className="rounded-2xl border border-border bg-card p-6 md:p-8">
                <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Connected directly to admin forms inbox
                </div>
                <h2 className="font-serif text-3xl text-foreground">Custom Cut Request</h2>
                <p className="mt-2 text-sm text-muted-foreground">Share the style you want and we will tailor a custom option for you.</p>
                <div className="mt-4 grid gap-3">
                  <input required placeholder="Full name" value={customCut.name} onChange={(e) => setCustomCut({ ...customCut, name: e.target.value })} className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent" />
                  <input required type="email" placeholder="Email" value={customCut.email} onChange={(e) => setCustomCut({ ...customCut, email: e.target.value })} className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent" />
                  <input placeholder="Phone" value={customCut.phone} onChange={(e) => setCustomCut({ ...customCut, phone: e.target.value })} className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent" />
                  <input required placeholder="Style name / idea" value={customCut.style} onChange={(e) => setCustomCut({ ...customCut, style: e.target.value })} className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent" />
                  <input placeholder="Fabric preference" value={customCut.fabric} onChange={(e) => setCustomCut({ ...customCut, fabric: e.target.value })} className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent" />
                  <input placeholder="Needed by (date/event)" value={customCut.timeline} onChange={(e) => setCustomCut({ ...customCut, timeline: e.target.value })} className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent" />
                  <textarea required rows={4} placeholder="Measurements, color notes, or extra details..." value={customCut.notes} onChange={(e) => setCustomCut({ ...customCut, notes: e.target.value })} className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent" />
                </div>
                {recaptchaSiteKey && (
                  <div className="mt-4">
                    <ReCAPTCHA
                      ref={customCaptchaRef}
                      sitekey={recaptchaSiteKey}
                      onChange={(token) => setCustomCaptchaToken(token || "")}
                    />
                  </div>
                )}
                <button disabled={sendingCustom} className="mt-4 w-full rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">
                  {sendingCustom ? "Sending..." : "Send custom cut request"}
                </button>
                {customDone && <p className={`mt-3 text-sm ${customDone.startsWith("Failed") ? "text-destructive" : "text-foreground"}`}>{customDone}</p>}
              </form>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-8">
                <h2 className="font-serif text-3xl text-foreground">Custom cuts are currently paused</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Please use the contact form and our team will confirm availability.
                </p>
                <Link href="/contact" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
                  Go to Contact Form
                </Link>
              </div>
            )
          ) : (
            <form onSubmit={submitContact} className="rounded-2xl border border-border bg-card p-5 md:p-8">
              <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-accent" />
                Connected directly to admin forms inbox
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Full name</span>
                  <input
                    required
                    placeholder="Amina Yusuf"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</span>
                  <input
                    required
                    type="email"
                    placeholder="you@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
                  />
                </label>
              </div>

              <label className="mt-4 grid gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Phone (optional)</span>
                <input
                  placeholder="+255..."
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
                />
              </label>

              <label className="mt-4 grid gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Message</span>
                <textarea
                  required
                  placeholder="Tell us what you need..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={7}
                  className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
                />
              </label>

              {recaptchaSiteKey && (
                <div className="mt-4">
                  <ReCAPTCHA
                    ref={contactCaptchaRef}
                    sitekey={recaptchaSiteKey}
                    onChange={(token) => setContactCaptchaToken(token || "")}
                  />
                </div>
              )}

              <button
                disabled={sending}
                className="mt-6 w-full rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? "Sending..." : "Send message"}
              </button>

              {done && (
                <p className={`mt-4 text-sm ${done.startsWith("Failed") ? "text-destructive" : "text-foreground"}`}>{done}</p>
              )}
            </form>
          )}
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
