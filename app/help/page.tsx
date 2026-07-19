import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help & Support — ModerateAI",
  description:
    "Find answers, troubleshoot common issues, and contact the ModerateAI support team. Get help with Google sign-in, YouTube channel connection, subscriptions, and more.",
};

const quickLinks = [
  { icon: "🚀", label: "Getting Started", href: "/documentation" },
  { icon: "🔐", label: "Google Sign-In", href: "/docs#permissions" },
  { icon: "📺", label: "Connect YouTube Channel", href: "/docs#how-it-works" },
  { icon: "💳", label: "Manage Subscription", href: "/billing" },
  { icon: "🛡️", label: "Privacy & Security", href: "/privacy" },
  { icon: "📄", label: "Documentation", href: "/documentation" },
  { icon: "🟢", label: "Status Page", href: "/status" },
];

const faqs = [
  {
    q: "How do I get started with ModerateAI?",
    a: "Sign in with your Google account, connect your YouTube channel, and grant the required permissions. ModerateAI will begin analyzing and moderating your comments automatically.",
  },
  {
    q: "How do I connect my YouTube channel?",
    a: "After signing in with Google, navigate to your dashboard and follow the channel connection flow. You will be prompted to authorize the necessary YouTube permissions.",
  },
  {
    q: "Why does ModerateAI request Google permissions?",
    a: "ModerateAI requests only the minimum permissions required to read, moderate, and reply to comments on your YouTube channel. No additional data is accessed beyond what is necessary to deliver the service.",
  },
  {
    q: "How do I revoke Google access?",
    a: "You can revoke ModerateAI's access to your Google account at any time by visiting https://myaccount.google.com/permissions and removing ModerateAI from your connected apps.",
  },
  {
    q: "How do I cancel my subscription?",
    a: "You can cancel your subscription at any time from your account settings under the Billing section. Your access will remain active until the end of the current billing period.",
  },
  {
    q: "How do I request account deletion?",
    a: "To request deletion of your account and associated data, please contact our support team. We will process your request in accordance with our Privacy Policy.",
  },
  {
    q: "How can I report a bug or issue?",
    a: "Please contact our support team with a description of the issue, the steps to reproduce it, and any relevant details. We aim to respond within 24–48 business hours.",
  },
  {
    q: "How do I update my account information?",
    a: "You can update your account details from the Settings section of your dashboard.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. ModerateAI implements industry-standard security measures including encryption in transit, encryption at rest, access controls, and continuous security monitoring. We never sell your data or use it for advertising.",
  },
  {
    q: "How do I contact support?",
    a: "You can reach our support team at support@moderateai.site. We typically respond within 24–48 business hours on business days.",
  },
];

const issues = [
  {
    title: "Unable to sign in",
    steps: [
      "Ensure you are using a valid Google account.",
      "Clear your browser cache and cookies, then try again.",
      "Try signing in using a different browser or an incognito window.",
      "If the issue persists, contact support.",
    ],
  },
  {
    title: "Google authorization failed",
    steps: [
      "Ensure you are granting all requested permissions during the authorization flow.",
      "Check that your Google account is in good standing.",
      "Try revoking and re-authorizing access via your Google account settings.",
      "If the issue persists, contact support.",
    ],
  },
  {
    title: "YouTube channel not appearing",
    steps: [
      "Confirm your YouTube channel is associated with the Google account you used to sign in.",
      "Ensure you granted YouTube channel permissions during authorization.",
      "Try disconnecting and reconnecting your channel from the dashboard.",
      "If the issue persists, contact support.",
    ],
  },
  {
    title: "Comments not syncing",
    steps: [
      "Check that your YouTube channel is connected and authorization is active.",
      "Verify that your subscription plan is active.",
      "Allow a few minutes for the initial sync to complete.",
      "If the issue persists, contact support.",
    ],
  },
  {
    title: "Moderation not running",
    steps: [
      "Ensure your moderation rules are configured in the Automation section.",
      "Confirm your subscription plan includes automated moderation.",
      "Check that your YouTube channel connection is active.",
      "If the issue persists, contact support.",
    ],
  },
  {
    title: "Subscription or billing issue",
    steps: [
      "Review your subscription status in the Billing section of your dashboard.",
      "Ensure your payment method is valid and up to date.",
      "Check your email for any billing notifications.",
      "If the issue persists, contact support.",
    ],
  },
  {
    title: "Permission denied error",
    steps: [
      "Re-authorize your Google account and ensure all required permissions are granted.",
      "Check that your account subscription is active.",
      "Try signing out and signing back in.",
      "If the issue persists, contact support.",
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white">
      {/* Header */}
      <div className="border-b border-white/10 py-6 px-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-[#ff6b00] font-bold text-xl hover:opacity-80 transition">
            ← ModerateAI
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-20 space-y-16">

        {/* 1. Hero */}
        <section className="pt-14">
          <div className="mb-2 inline-block px-3 py-1 rounded-full bg-[#ff6b00]/10 border border-[#ff6b00]/20 text-[#ff6b00] text-xs font-semibold tracking-wide uppercase">
            Help & Support
          </div>
          <h1 className="text-4xl font-bold text-white mt-4 mb-3">
            How can we help?
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mb-6">
            Find answers, troubleshoot common issues, and contact our support team.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:support@moderateai.site"
              className="px-5 py-2.5 rounded-xl bg-[#ff6b00] text-white font-semibold text-sm hover:bg-[#ff6b00]/90 transition"
            >
              Contact Support
            </a>
            <Link
              href="/docs"
              className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-300 font-semibold text-sm hover:border-[#ff6b00]/40 hover:text-white transition"
            >
              View Documentation
            </Link>
          </div>
          <div className="mt-8 h-1 w-16 bg-[#ff6b00] rounded-full" />
        </section>

        {/* 2. Quick Help */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Quick Help</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {quickLinks.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-2 hover:border-[#ff6b00]/40 hover:bg-white/8 transition group"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-white text-sm font-medium group-hover:text-[#ff6b00] transition">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. FAQs */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-2xl p-5"
              >
                <h3 className="text-white font-semibold text-sm mb-2">{faq.q}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Troubleshooting */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-2">Troubleshooting</h2>
          <p className="text-gray-400 text-sm mb-6">
            Follow the steps below to resolve common issues. If your issue is not listed, please contact support.
          </p>
          <div className="space-y-4">
            {issues.map((issue, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-2xl p-5"
              >
                <h3 className="text-white font-semibold text-sm mb-3">
                  {issue.title}
                </h3>
                <ol className="space-y-1.5 list-none">
                  {issue.steps.map((step, j) => (
                    <li key={j} className="flex items-start gap-3 text-gray-400 text-sm">
                      <span className="text-[#ff6b00] font-bold flex-shrink-0 w-4">
                        {j + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Contact Support */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Contact Support</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
            <div className="flex items-start gap-4">
              <span className="text-xl">✉️</span>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Support Email</p>
                <a
                  href="mailto:support@moderateai.site"
                  className="text-[#ff6b00] hover:underline font-medium text-sm"
                >
                  support@moderateai.site
                </a>
              </div>
            </div>
            <hr className="border-white/10" />
            <div className="flex items-start gap-4">
              <span className="text-xl">📅</span>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Support Availability</p>
                <p className="text-white text-sm font-medium">Business Days</p>
              </div>
            </div>
            <hr className="border-white/10" />
            <div className="flex items-start gap-4">
              <span className="text-xl">⏱️</span>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Expected Response Time</p>
                <p className="text-white text-sm font-medium">Typically within 24–48 business hours</p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Helpful Resources */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Helpful Resources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "📖", label: "Documentation", href: "/documentation", internal: true },
              { icon: "🔏", label: "Privacy Policy", href: "/privacy", internal: true },
              { icon: "📄", label: "Terms & Conditions", href: "/terms", internal: true },
              { icon: "🟢", label: "Status Page", href: "/status", internal: true },
              { icon: "💰", label: "Pricing", href: "/pricing", internal: true },
            ].map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-3 hover:border-[#ff6b00]/40 hover:bg-white/8 transition group"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-white text-sm font-medium group-hover:text-[#ff6b00] transition">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* 7. Security Reminder */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Security Reminder</h2>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 space-y-3">
            {[
              "Never share your Google password with anyone, including ModerateAI support.",
              "ModerateAI will never ask for your Google password or account credentials.",
              "Always verify you are on the official ModerateAI website (moderateai.site) before signing in.",
              "If you receive a suspicious message claiming to be from ModerateAI, please contact support immediately.",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-yellow-400 mt-0.5 flex-shrink-0">⚠️</span>
                <p className="text-yellow-200 text-sm leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Footer */}
      <div className="border-t border-white/10 py-8 text-center text-gray-500 text-sm">
        © 2026 ModerateAI. All rights reserved.
      </div>
    </div>
  );
}