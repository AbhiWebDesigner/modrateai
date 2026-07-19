import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation — ModerateAI",
  description:
    "Learn how ModerateAI works, what Google permissions are required, and how your data is protected. Production-ready AI YouTube comment moderation platform.",
};

const features = [
  {
    icon: "🛡️",
    title: "AI Comment Moderation",
    desc: "Automatically detect and action harmful, abusive, or policy-violating comments in real time.",
  },
  {
    icon: "💬",
    title: "AI Comment Replies",
    desc: "Generate contextual, on-brand replies to comments on your videos, Shorts, and Community Posts.",
  },
  {
    icon: "🚫",
    title: "Spam Detection",
    desc: "Identify and remove spam comments, promotional links, and bot activity across your channel.",
  },
  {
    icon: "⚠️",
    title: "Harmful Comment Detection",
    desc: "Detect hate speech, harassment, and harmful content using advanced AI classification.",
  },
  {
    icon: "🔴",
    title: "Live Chat Moderation",
    desc: "Monitor and moderate Live Chat in real time with progressive timeout management.",
  },
  {
    icon: "📊",
    title: "Analytics Dashboard",
    desc: "Track moderation activity, comment trends, and channel insights from a unified dashboard.",
  },
  {
    icon: "🌍",
    title: "Multi-language Support",
    desc: "Moderate comments across multiple languages without additional configuration.",
  },
  {
    icon: "🔐",
    title: "Google OAuth Integration",
    desc: "Securely connect your YouTube channel using Google OAuth 2.0 with minimal required scopes.",
  },
];

const steps = [
  "Sign in with Google",
  "Connect your YouTube channel",
  "Grant required permissions",
  "ModerateAI analyzes your comments",
  "Configured moderation rules execute",
  "Dashboard updates in real time",
];

const permissions = [
  {
    permission: "View YouTube Channel",
    purpose: "Identify and connect your YouTube channel to the Service.",
  },
  {
    permission: "Read Comments",
    purpose: "Analyze comments for spam, harmful content, and moderation.",
  },
  {
    permission: "Moderate Comments",
    purpose: "Hide, remove, or action comments based on your configured rules.",
  },
  {
    permission: "Post Comment Replies",
    purpose: "Publish AI-generated replies to comments on your behalf.",
  },
  {
    permission: "View Channel Analytics",
    purpose: "Display moderation insights and channel activity in your dashboard.",
  },
  {
    permission: "Manage Live Chat",
    purpose: "Monitor and moderate Live Chat during active streams.",
  },
];

const supported = [
  { type: "Videos", status: "Supported" },
  { type: "Shorts", status: "Supported" },
  { type: "Community Posts", status: "Supported" },
  { type: "Live Chat", status: "Supported" },
  { type: "Analytics", status: "Supported" },
];

const faqs = [
  {
    q: "What is ModerateAI?",
    a: "ModerateAI is an AI-powered YouTube comment moderation platform that helps creators automatically detect spam, harmful comments, and manage Live Chat — while providing AI-generated replies and channel analytics.",
  },
  {
    q: "How does AI moderation work?",
    a: "ModerateAI connects to your YouTube channel via Google OAuth and continuously analyzes incoming comments. When a comment matches your configured moderation rules, the appropriate action is taken automatically.",
  },
  {
    q: "Is ModerateAI affiliated with YouTube or Google?",
    a: "No. ModerateAI is an independent service that integrates with the YouTube Data API. We are not affiliated with, endorsed by, or sponsored by YouTube or Google.",
  },
  {
    q: "What Google permissions does ModerateAI request?",
    a: "We request only the minimum permissions necessary to deliver the moderation service — including reading comments, moderating comments, posting replies, and viewing basic channel analytics.",
  },
  {
    q: "Can I revoke ModerateAI's access to my Google account?",
    a: "Yes. You can revoke access at any time by visiting https://myaccount.google.com/permissions and removing ModerateAI from your connected apps.",
  },
  {
    q: "What data does ModerateAI collect?",
    a: "We collect only the data necessary to provide the Service, including your YouTube channel information, comment data for moderation, and basic account details. Please refer to our Privacy Policy for full details.",
  },
  {
    q: "Does ModerateAI delete comments automatically?",
    a: "ModerateAI can hide or remove comments based on your configured rules. All moderation actions are performed on your behalf and within your control via the dashboard settings.",
  },
  {
    q: "How is my data protected?",
    a: "We implement industry-standard security measures including encryption in transit, encryption at rest, access controls, and continuous security monitoring. Your data is never sold or shared with third parties for their own purposes.",
  },
  {
    q: "Does ModerateAI sell my data or use it for advertising?",
    a: "No. ModerateAI does not sell your data, use it for advertising, or transfer it to third parties for their own purposes — ever.",
  },
  {
    q: "How can I contact support?",
    a: "You can reach our support team at contact@moderateai.site. We aim to respond within 1–2 business days.",
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white">
      {/* Header */}
      <div className="border-b border-white/10 py-6 px-6">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/"
            className="text-[#ff6b00] font-bold text-xl hover:opacity-80 transition"
          >
            ← ModerateAI
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 py-14">
        <div className="mb-2 inline-block px-3 py-1 rounded-full bg-[#ff6b00]/10 border border-[#ff6b00]/20 text-[#ff6b00] text-xs font-semibold tracking-wide uppercase">
          Documentation
        </div>
        <h1 className="text-4xl font-bold text-white mt-4 mb-3">
          ModerateAI Documentation
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl">
          Everything you need to understand how ModerateAI works, what
          permissions are required, and how your data is protected.
        </p>
        <div className="mt-6 h-1 w-16 bg-[#ff6b00] rounded-full" />
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-20 space-y-20">

        {/* 1. Overview */}
        <section id="overview">
          <h2 className="text-2xl font-bold text-white mb-4">1. Overview</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-gray-300 leading-relaxed space-y-3">
            <p>
              ModerateAI is an AI-powered YouTube comment moderation platform
              designed to help creators protect their communities and manage
              their channels at scale.
            </p>
            <p>
              Using advanced AI, ModerateAI automatically detects spam, harmful
              content, and policy-violating comments — then takes action based
              on rules you configure. It also generates contextual AI replies to
              engage your audience on your behalf.
            </p>
            <p>
              ModerateAI supports YouTube Videos, Shorts, Community Posts, and
              Live Chat, with a unified analytics dashboard to monitor your
              channel&apos;s comment activity in real time.
            </p>
          </div>
        </section>

        {/* 2. Features */}
        <section id="features">
          <h2 className="text-2xl font-bold text-white mb-6">2. Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-2 hover:border-[#ff6b00]/30 transition"
              >
                <span className="text-2xl">{f.icon}</span>
                <h3 className="text-white font-semibold text-sm">{f.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. How It Works */}
        <section id="how-it-works">
          <h2 className="text-2xl font-bold text-white mb-6">3. How It Works</h2>
          <div className="flex flex-col items-start gap-0">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-start">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-[#ff6b00]/10 border border-[#ff6b00]/30 flex items-center justify-center text-[#ff6b00] font-bold text-sm flex-shrink-0">
                    {i + 1}
                  </div>
                  <span className="text-gray-200 font-medium">{step}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="ml-[17px] w-px h-8 bg-white/10" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 4. Google Permissions */}
        <section id="permissions">
          <h2 className="text-2xl font-bold text-white mb-2">
            4. Google Permissions
          </h2>
          <p className="text-gray-400 mb-5 text-sm">
            ModerateAI requests only the minimum permissions required to deliver
            the moderation service. The table below explains each permission and
            its purpose.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-5 py-3 text-[#ff6b00] font-semibold">
                    Permission
                  </th>
                  <th className="px-5 py-3 text-[#ff6b00] font-semibold">
                    Purpose
                  </th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((p, i) => (
                  <tr
                    key={i}
                    className="border-b border-white/5 hover:bg-white/5 transition"
                  >
                    <td className="px-5 py-3 text-white font-medium whitespace-nowrap">
                      {p.permission}
                    </td>
                    <td className="px-5 py-3 text-gray-400">{p.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. Privacy & Security */}
        <section id="privacy-security">
          <h2 className="text-2xl font-bold text-white mb-6">
            5. Privacy &amp; Security
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {[
              { icon: "🔒", label: "Encryption in transit", desc: "All data is transmitted over secure, encrypted connections." },
              { icon: "🗄️", label: "Encryption at rest", desc: "Sensitive credentials and tokens are encrypted in storage." },
              { icon: "👤", label: "Access controls", desc: "System access is restricted to authorized personnel under least-privilege principles." },
              { icon: "📡", label: "Security monitoring", desc: "Continuous monitoring and regular security reviews are conducted." },
              { icon: "📉", label: "Data minimization", desc: "We collect only the data strictly necessary to deliver the Service." },
              { icon: "✅", label: "Google API Limited Use", desc: "Full compliance with the Google API Services User Data Policy, including Limited Use requirements." },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex gap-4">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="text-white font-semibold text-sm mb-1">{item.label}</p>
                  <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 text-green-400 text-sm space-y-2">
            <p>🔒 ModerateAI <strong>never sells</strong> user data.</p>
            <p>🔒 ModerateAI <strong>never uses</strong> Google user data for advertising.</p>
            <p>🔒 ModerateAI <strong>never uses</strong> Google user data to train third-party AI models.</p>
          </div>
        </section>

        {/* 6. Supported Content */}
        <section id="supported-content">
          <h2 className="text-2xl font-bold text-white mb-5">
            6. Supported Content
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-5 py-3 text-[#ff6b00] font-semibold">Content Type</th>
                  <th className="px-5 py-3 text-[#ff6b00] font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {supported.map((s, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-5 py-3 text-white font-medium">{s.type}</td>
                    <td className="px-5 py-3">
                      <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 7. FAQs */}
        <section id="faq">
          <h2 className="text-2xl font-bold text-white mb-6">
            7. Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-2xl p-5"
              >
                <h3 className="text-white font-semibold mb-2 text-sm">
                  {faq.q}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 8. Google API Disclosure */}
        <section id="google-api">
          <h2 className="text-2xl font-bold text-white mb-4">
            8. Google API Disclosure
          </h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-gray-300 leading-relaxed space-y-3 text-sm">
            <p>
              ModerateAI uses Google OAuth 2.0 and the YouTube Data API solely
              to provide the moderation and reply services requested by the
              user. No Google user data is accessed beyond what is necessary to
              deliver these services.
            </p>
            <p>
              Google user data is processed only as described in our{" "}
              <Link href="/privacy" className="text-[#ff6b00] hover:underline">
                Privacy Policy
              </Link>
              . We do not use Google user data for advertising, to build user
              profiles, or to train third-party AI or machine learning models.
            </p>
            <p>
              ModerateAI complies fully with the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ff6b00] hover:underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
            <p>
              You may revoke ModerateAI&apos;s access to your Google account at
              any time by visiting{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ff6b00] hover:underline"
              >
                https://myaccount.google.com/permissions
              </a>
              .
            </p>
          </div>
        </section>

        {/* 9. Helpful Links */}
        <section id="links">
          <h2 className="text-2xl font-bold text-white mb-6">9. Helpful Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Privacy Policy", href: "/privacy", internal: true, icon: "🔏" },
              { label: "Terms & Conditions", href: "/terms", internal: true, icon: "📄" },
              { label: "Contact Us", href: "mailto:contact@moderateai.site", internal: false, icon: "✉️" },
              { label: "Google Account Permissions", href: "https://myaccount.google.com/permissions", internal: false, icon: "🔗" },
            ].map((link, i) =>
              link.internal ? (
                <Link
                  key={i}
                  href={link.href}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-3 hover:border-[#ff6b00]/40 hover:bg-white/8 transition group"
                >
                  <span className="text-xl">{link.icon}</span>
                  <span className="text-white font-medium text-sm group-hover:text-[#ff6b00] transition">
                    {link.label}
                  </span>
                </Link>
              ) : (
                <a
                  key={i}
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-3 hover:border-[#ff6b00]/40 hover:bg-white/8 transition group"
                >
                  <span className="text-xl">{link.icon}</span>
                  <span className="text-white font-medium text-sm group-hover:text-[#ff6b00] transition">
                    {link.label}
                  </span>
                </a>
              )
            )}
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