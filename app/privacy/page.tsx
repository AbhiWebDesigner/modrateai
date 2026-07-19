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
            Last Updated: May 2026
          </p>
          <div className="mt-4 h-1 w-16 bg-[#ff6b00] rounded-full" />
        </div>

        <div className="space-y-10 text-gray-300 leading-relaxed">

          {/* 1 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Introduction</h2>
            <p>
              ModerateAI is an AI-powered YouTube comment moderation platform designed to help YouTube creators protect their communities through automated, real-time moderation.
            </p>
            <p className="mt-2">
              This Privacy Policy describes how we collect, use, store, share, and protect your personal information when you use our Service. By accessing or using ModerateAI, you agree to the practices described in this Policy.
            </p>
            <p className="mt-2">
              Our use of information received from Google APIs strictly adheres to the{" "}
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
                "Profile picture (obtained via Google OAuth)",
                "Billing information (processed securely via our payment processor)",
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
                "Comments on your videos, Shorts, Community Posts, and Live Chat",
                "Video metadata (title, ID, publish date) required for moderation",
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
                "IP address and approximate geographic location",
                "Browser type, operating system, and device information",
                "Pages visited, features used, and session duration",
                "Error logs and performance diagnostics used to improve the Service",
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
                "Messages submitted to our support team",
                "Feedback and survey responses",
                "Notification contact details (e.g. Telegram ID), if provided by you",
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
            <p className="mb-3">We use the information we collect solely to provide and improve our Service:</p>
            <ul className="space-y-2">
              {[
                "To authenticate your identity and connect your YouTube channel",
                "To automatically scan, detect, and moderate harmful or spammy comments",
                "To generate AI-powered replies to comments on your behalf",
                "To manage Live Chat moderation and timeout controls",
                "To provide analytics and insights on your channel's comment activity",
                "To send moderation alerts via third-party notification services (if enabled by you)",
                "To process payments and manage your subscription",
                "To communicate service updates, billing notices, and support responses",
                "To improve the quality, reliability, and performance of our Service",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#ff6b00] mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
              🔒 We do not sell your data, use it for advertising, or share it with third parties for their own purposes.
            </div>
          </section>

          <hr className="border-white/10" />

          {/* 4 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Google User Data — Limited Use Policy</h2>
            <p className="mb-3">
              ModerateAI&apos;s use of data obtained from Google APIs complies with the{" "}
              <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-[#ff6b00] hover:underline">
                Google API Services User Data Policy
              </a>
              , including the following Limited Use requirements:
            </p>
            <ul className="space-y-2">
              {[
                "We request only the minimum Google and YouTube data scopes necessary to deliver the moderation service.",
                "We do not use Google user data to serve advertisements.",
                "We do not use or transfer Google user data to train third-party AI or machine learning models.",
                "We do not allow human access to your Google user data except where you have given explicit permission, for security purposes, or as required by law.",
                "We do not use or transfer Google user data for any purpose not described in this Privacy Policy.",
                "Your YouTube OAuth tokens are stored securely and used exclusively to interact with your channel on your behalf.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#ff6b00] mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              You may revoke ModerateAI&apos;s access to your Google account at any time by visiting:{" "}
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
              We do not sell, rent, or trade your personal data. We share your information only in the following limited circumstances:
            </p>

            <h3 className="font-semibold text-[#ff6b00] mb-2">5.1 Trusted Service Providers</h3>
            <p className="mb-2">We engage trusted third-party providers to support our infrastructure and operations, including:</p>
            <ul className="space-y-2">
              {[
                "Secure cloud infrastructure and hosting providers",
                "Secure authentication and data storage providers",
                "Trusted payment processors for subscription billing",
                "Trusted notification providers for moderation alerts (if enabled by you)",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#ff6b00] mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-gray-400">All providers are bound by confidentiality obligations and may only process your data as necessary to provide their services to us.</p>

            <h3 className="font-semibold text-[#ff6b00] mb-2 mt-5">5.2 Legal Requirements</h3>
            <p>
              We may disclose your data if required by applicable law, court order, or governmental authority, or where necessary to protect the rights, safety, or property of ModerateAI, our users, or the public.
            </p>

            <h3 className="font-semibold text-[#ff6b00] mb-2 mt-5">5.3 Business Transfers</h3>
            <p>
              In the event of a merger, acquisition, or transfer of assets, your data may be transferred to the successor entity. We will notify you prior to your data becoming subject to a different privacy policy.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 6 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Data Retention</h2>
            <ul className="space-y-2">
              {[
                "Account data is retained for as long as your account remains active.",
                "YouTube OAuth tokens are permanently deleted upon channel disconnection or account deletion.",
                "Comment and moderation logs are retained for up to 12 months, after which they are anonymized or deleted.",
                "Billing records are retained for 7 years in compliance with applicable financial regulations.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#ff6b00] mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              To request deletion of your data, please refer to the Contact section below.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 7 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Data Security</h2>
            <p className="mb-3">We implement industry-standard security measures to protect your data:</p>
            <ul className="space-y-2">
              {[
                "Encryption in transit — all data is transmitted over secure, encrypted connections.",
                "Encryption at rest — sensitive credentials and tokens are encrypted in storage.",
                "Access controls — access to production systems is restricted to authorized personnel under least-privilege principles.",
                "Security monitoring — we employ continuous monitoring and conduct regular security reviews.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#ff6b00] mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              While we take every reasonable precaution to safeguard your data, no method of electronic transmission or storage is entirely risk-free.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 8 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Your Rights (DPDPA 2023)</h2>
            <p className="mb-3">
              Under the Digital Personal Data Protection Act, 2023 and other applicable laws, you have the right to:
            </p>
            <ul className="space-y-2">
              {[
                "Access — Request a copy of the personal data we hold about you.",
                "Correction — Request correction of inaccurate or incomplete personal data.",
                "Erasure — Request deletion of your personal data, subject to legal retention obligations.",
                "Withdraw Consent — Withdraw consent for data processing at any time without affecting prior lawful processing.",
                "Grievance Redressal — Lodge a complaint regarding our data practices.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#ff6b00] mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              To exercise any of these rights, please refer to the Contact section below. We will respond within 30 days of receiving your request.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 9 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Cookies and Tracking Technologies</h2>
            <p className="mb-3">ModerateAI uses cookies and similar technologies to:</p>
            <ul className="space-y-2">
              {[
                "Maintain your authenticated session",
                "Remember your preferences and settings",
                "Analyze usage patterns to improve the Service",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#ff6b00] mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              You may manage cookie preferences through your browser settings. Disabling certain cookies may limit the functionality of the Service.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 10 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Children&apos;s Privacy</h2>
            <p>
              ModerateAI is not intended for individuals under the minimum age required by applicable law. We do not knowingly collect personal data from minors. If you believe we have inadvertently collected such data, please refer to the Contact section below and we will delete it without delay.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 11 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">11. Third-Party Links</h2>
            <p>
              Our Service may contain links to third-party websites or services. We are not responsible for the privacy practices of those third parties. We encourage you to review the privacy policies of any external sites you visit.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 12 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">12. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy periodically to reflect changes in our practices or applicable law. We will notify you of material changes via email or a prominent notice on our platform. Continued use of the Service following such notice constitutes your acceptance of the updated Policy.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 13 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">13. Contact Us</h2>
            <p className="mb-3">For any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact:</p>
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
                <span>Privacy Officer: ModerateAI Privacy Team</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#ff6b00] mt-1">✓</span>
                <span>Jurisdiction: India</span>
              </li>
            </ul>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-white/10 text-center text-gray-500 text-sm">
          © 2026 ModerateAI. All rights reserved.
        </div>
      </div>
    </div>
  );
}