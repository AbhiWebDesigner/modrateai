import Link from "next/link";

export default function PrivacyPage() {
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

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-gray-400 text-sm">
            Last Updated: May 25, 2026 &nbsp;·&nbsp; https://moderateai.site/privacy
          </p>
          <div className="mt-4 h-1 w-16 bg-[#ff6b00] rounded-full" />
        </div>

        <div className="space-y-10 text-gray-300 leading-relaxed">

          {/* 1 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Introduction</h2>
            <p>
              Welcome to ModerateAI. We are an AI-powered YouTube comment moderation platform available at{" "}
              <a href="https://moderateai.site" target="_blank" rel="noopener noreferrer" className="text-[#ff6b00] hover:underline">
                https://moderateai.site
              </a>
              , designed to help Indian YouTube creators protect their communities 24/7.
            </p>
            <p className="mt-2">
              This Privacy Policy explains how we collect, use, store, share, and protect your personal information when you use our Service. By using ModerateAI, you agree to the practices described here.
            </p>
            <p className="mt-2">
              Our use of information received from Google APIs adheres to the{" "}
              <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-[#ff6b00] hover:underline">
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 2 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Information We Collect</h2>

            <h3 className="font-semibold text-[#ff6b00] mb-2 mt-4">2.1 Account Information</h3>
            <ul className="space-y-2">
              {[
                "Full name and email address",
                "Profile picture (from Google OAuth)",
                "Billing information (processed securely via payment gateway)",
                "Subscription plan and payment history",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#ff6b00] mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <h3 className="font-semibold text-[#ff6b00] mb-2 mt-6">2.2 YouTube Channel Data (via Google OAuth 2.0)</h3>
            <p className="mb-2">With your explicit permission through Google OAuth 2.0, we access:</p>
            <ul className="space-y-2">
              {[
                "YouTube channel ID and channel name",
                "YouTube OAuth access tokens and refresh tokens",
                "Comments on your videos, Shorts, Posts, and Live chat",
                "Video metadata (title, ID, publish date) needed for moderation",
                "Channel analytics data for dashboard display",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#ff6b00] mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <h3 className="font-semibold text-[#ff6b00] mb-2 mt-6">2.3 Usage and Technical Data</h3>
            <ul className="space-y-2">
              {[
                "IP address and approximate location",
                "Browser type, operating system, and device information",
                "Pages visited, features used, and time spent on the platform",
                "Error logs and performance data to improve the Service",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#ff6b00] mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <h3 className="font-semibold text-[#ff6b00] mb-2 mt-6">2.4 Communication Data</h3>
            <ul className="space-y-2">
              {[
                "Messages sent to our support team",
                "Feedback and survey responses",
                "Notification preferences (Telegram / WhatsApp numbers, if provided)",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#ff6b00] mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <hr className="border-white/10" />

          {/* 3 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. How We Use Your Data</h2>
            <p className="mb-3">We use the data we collect solely to provide and improve our Service:</p>
            <ul className="space-y-2">
              {[
                "To authenticate your identity and connect your YouTube channel",
                "To automatically scan, detect, and hide harmful or spammy comments",
                "To generate AI-powered replies to comments on your behalf",
                "To manage Live chat timeouts and spam controls",
                "To provide analytics and insights about your channel's comment activity",
                "To send Telegram and/or WhatsApp alerts about moderation activity (if enabled)",
                "To process payments and manage your subscription",
                "To communicate service updates, billing notices, and support responses",
                "To improve the accuracy and performance of our AI moderation models",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#ff6b00] mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
              🔒 We do NOT sell your data or use it for advertising — ever.
            </div>
          </section>

          <hr className="border-white/10" />

          {/* 4 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Google User Data — Limited Use Policy</h2>
            <p className="mb-3">
              ModerateAI&apos;s use of data from Google APIs follows the{" "}
              <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-[#ff6b00] hover:underline">
                Google API Services User Data Policy
              </a>
              :
            </p>
            <ul className="space-y-2">
              {[
                "We only request Google/YouTube data scopes necessary to provide the moderation service.",
                "We do not use Google user data to serve advertisements.",
                "We do not allow humans to read your Google user data unless you give explicit permission, for security purposes, or as required by law.",
                "We do not use or transfer Google user data for any purpose not described in this Privacy Policy.",
                "Your YouTube OAuth tokens are stored securely and used only to interact with your channel on your behalf.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#ff6b00] mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              You may revoke ModerateAI&apos;s access to your YouTube data at any time by visiting:{" "}
              <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-[#ff6b00] hover:underline">
                https://myaccount.google.com/permissions
              </a>
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 5 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Data Sharing and Disclosure</h2>
            <p className="mb-4">
              We do not sell, rent, or trade your personal data. We may share your information only in these limited circumstances:
            </p>

            <h3 className="font-semibold text-[#ff6b00] mb-2">5.1 Service Providers</h3>
            <p className="mb-2">We work with trusted third-party providers:</p>
            <ul className="space-y-2">
              {[
                "Supabase — secure database hosting and authentication",
                "Firebase — real-time data and notifications",
                "Payment gateway partners — for processing subscription payments",
                "Telegram / WhatsApp APIs — for sending moderation alerts (if enabled by you)",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#ff6b00] mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <h3 className="font-semibold text-[#ff6b00] mb-2 mt-5">5.2 Legal Requirements</h3>
            <p>
              We may disclose your data if required by law, court order, or government authority, or to protect the rights, safety, or property of ModerateAI, our users, or the public.
            </p>

            <h3 className="font-semibold text-[#ff6b00] mb-2 mt-5">5.3 Business Transfers</h3>
            <p>
              In the event of a merger, acquisition, or sale of assets, your data may be transferred. We will notify you via email before your data becomes subject to a different privacy policy.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 6 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Data Retention</h2>
            <ul className="space-y-2">
              {[
                "Account data is retained until you delete your account.",
                "YouTube OAuth tokens are deleted upon disconnecting your channel or deleting your account.",
                "Comment and moderation logs are retained for up to 12 months, then anonymized or deleted.",
                "Billing records are retained for 7 years as required by Indian financial regulations.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#ff6b00] mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              You may request deletion of your data at any time by contacting{" "}
              <a href="mailto:contact@moderateai.site" className="text-[#ff6b00] hover:underline">
                contact@moderateai.site
              </a>
              .
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 7 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Data Security</h2>
            <ul className="space-y-2">
              {[
                "All data is transmitted over encrypted HTTPS connections.",
                "OAuth tokens and sensitive credentials are stored using encryption at rest.",
                "Access to production databases is restricted to authorized personnel only.",
                "We conduct regular security reviews and vulnerability assessments.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#ff6b00] mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              While we take every reasonable precaution, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 8 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Your Rights (DPDPA 2023)</h2>
            <p className="mb-3">
              Under the Digital Personal Data Protection Act, 2023 and other applicable Indian laws, you have the right to:
            </p>
            <ul className="space-y-2">
              {[
                "Access — Request a copy of the personal data we hold about you.",
                "Correction — Request correction of inaccurate or incomplete data.",
                "Erasure — Request deletion of your personal data (subject to legal obligations).",
                "Withdraw Consent — Withdraw consent for data processing at any time.",
                "Grievance Redressal — Lodge a complaint with us regarding our data practices.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#ff6b00] mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact{" "}
              <a href="mailto:contact@moderateai.site" className="text-[#ff6b00] hover:underline">
                contact@moderateai.site
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 9 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Cookies and Tracking Technologies</h2>
            <p className="mb-3">ModerateAI uses cookies to:</p>
            <ul className="space-y-2">
              {[
                "Maintain your login session",
                "Remember your preferences and settings",
                "Analyze website traffic and usage patterns",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#ff6b00] mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              You can control cookie settings through your browser preferences. Disabling certain cookies may affect the functionality of the Service.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 10 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Children&apos;s Privacy</h2>
            <p>
              ModerateAI is not intended for use by individuals under the age of 18. We do not knowingly collect personal data from minors. If you believe we have collected such data inadvertently, please contact us immediately and we will delete it promptly.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 11 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">11. Third-Party Links</h2>
            <p>
              Our Service may contain links to third-party websites. We are not responsible for their privacy practices. We encourage you to review the privacy policies of any third-party sites you visit.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 12 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">12. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a prominent notice on our website. Continued use of the Service after changes are posted constitutes your acceptance.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 13 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">13. Contact Us</h2>
            <p className="mb-3">For questions or concerns about this Privacy Policy, please contact:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-[#ff6b00] mt-1">✓</span>
                <span>
                  Email:{" "}
                  <a href="mailto:contact@moderateai.site" className="text-[#ff6b00] hover:underline">
                    contact@moderateai.site
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#ff6b00] mt-1">✓</span>
                <span>
                  Website:{" "}
                  <a href="https://moderateai.site" target="_blank" rel="noopener noreferrer" className="text-[#ff6b00] hover:underline">
                    https://moderateai.site
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#ff6b00] mt-1">✓</span>
                <span>Grievance Officer: ModerateAI Data Privacy Team</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#ff6b00] mt-1">✓</span>
                <span>Address: India</span>
              </li>
            </ul>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-white/10 text-center text-gray-500 text-sm">
          © 2026 ModerateAI. Made in India 🇮🇳. All rights reserved.
        </div>
      </div>
    </div>
  );
}