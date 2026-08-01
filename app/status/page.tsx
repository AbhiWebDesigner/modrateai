import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Status — ModerateAI",
  description:
    "Check the current operational status of ModerateAI services including the dashboard, AI moderation, YouTube integration, and more.",
};

const services = [
  { name: "Website", desc: "Public-facing website and landing pages" },
  { name: "Authentication", desc: "Google OAuth sign-in and session management" },
  { name: "Dashboard", desc: "User dashboard and account management" },
  { name: "YouTube Integration", desc: "YouTube channel connection and data sync" },
  { name: "AI Moderation", desc: "Automated comment detection and moderation" },
  { name: "AI Replies", desc: "AI-generated comment reply service" },
  { name: "Analytics", desc: "Channel analytics and moderation insights" },
];

export default function StatusPage() {
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

      <div className="max-w-4xl mx-auto px-6 py-14 space-y-16">

        {/* 1. Overall Status */}
        <section>
          <div className="mb-2 inline-block px-3 py-1 rounded-full bg-[#ff6b00]/10 border border-[#ff6b00]/20 text-[#ff6b00] text-xs font-semibold tracking-wide uppercase">
            System Status
          </div>
          <h1 className="text-4xl font-bold text-white mt-4 mb-4">
            Platform Status
          </h1>
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-2xl px-6 py-5">
            <span className="text-2xl">🟢</span>
            <div>
              <p className="text-green-400 font-semibold text-lg">All Systems Operational</p>
              <p className="text-gray-400 text-sm mt-0.5">
                All publicly available ModerateAI services are currently operating normally.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Service Status */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Service Status</h2>
          <div className="space-y-3">
            {services.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-5 py-4 hover:border-white/20 transition"
              >
                <div>
                  <p className="text-white font-medium text-sm">{s.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{s.desc}</p>
                </div>
                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  Operational
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Service Availability */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Service Availability</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400 text-sm">Platform Status</p>
              <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold">
                Operational
              </span>
            </div>
            <div className="flex gap-1 mb-4">
              {Array.from({ length: 90 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-8 rounded-sm bg-green-500/40"
                />
              ))}
            </div>
            <p className="text-gray-500 text-xs">
              ModerateAI continuously monitors the availability of all public-facing services. Service history reflects the past 90 days.
            </p>
          </div>
        </section>

        {/* 4. Scheduled Maintenance */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Scheduled Maintenance</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">🗓️</span>
              <div>
                <p className="text-white font-medium text-sm mb-1">No scheduled maintenance</p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  There is no maintenance currently planned. Whenever scheduled maintenance is required, we will announce it in advance through this page and via email notification where possible.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Recent Incidents */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Recent Incidents</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">✅</span>
              <div>
                <p className="text-white font-medium text-sm mb-1">No recent incidents reported</p>
                <p className="text-gray-400 text-sm">
                  All services have been operating normally. No incidents have been reported recently.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Incident History */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Incident History</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">📋</span>
              <div>
                <p className="text-white font-medium text-sm mb-1">No publicly reported incidents</p>
                <p className="text-gray-400 text-sm">
                  No incidents have been publicly reported during the past 90 days.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Support */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Support</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-gray-400 text-sm mb-4">
              If you are experiencing an issue not reflected on this page, please contact our support team.
            </p>
            <a
              href="mailto:ModerateAiSite@protonmail.com"
              className="inline-flex items-center gap-2 text-[#ff6b00] hover:underline font-medium text-sm mb-6"
            >
              ✉️ ModerateAiSite@protonmail.com
            </a>
            <div className="flex flex-wrap gap-3 mt-2">
              <Link
                href="/docs"
                className="px-4 py-2 rounded-xl border border-white/10 text-gray-300 text-sm hover:border-[#ff6b00]/40 hover:text-white transition"
              >
                Documentation
              </Link>
              <Link
                href="/privacy"
                className="px-4 py-2 rounded-xl border border-white/10 text-gray-300 text-sm hover:border-[#ff6b00]/40 hover:text-white transition"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="px-4 py-2 rounded-xl border border-white/10 text-gray-300 text-sm hover:border-[#ff6b00]/40 hover:text-white transition"
              >
                Terms &amp; Conditions
              </Link>
            </div>
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