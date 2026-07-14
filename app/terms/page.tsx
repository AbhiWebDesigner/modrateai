import Link from "next/link";

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold text-white mb-2">Terms and Conditions</h1>
          <p className="text-gray-400 text-sm">
            Effective Date: May 25, 2026 &nbsp;·&nbsp; Website: https://moderateai.site
          </p>
          <div className="mt-4 h-1 w-16 bg-[#ff6b00] rounded-full" />
        </div>

        <div className="space-y-10 text-gray-300 leading-relaxed">

          {/* 1 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using ModerateAI available at{" "}
              <a href="https://moderateai.site" className="text-[#ff6b00] hover:underline" target="_blank" rel="noopener noreferrer">
                https://moderateai.site
              </a>
              , you agree to be bound by these Terms and Conditions. If you do not agree, you must not use our Service.
            </p>
            <p className="mt-2">
              These Terms apply to all users, including visitors, registered users, and YouTube content creators who subscribe to any of our plans.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 2 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Description of Service</h2>
            <p className="mb-3">
              ModerateAI is an AI-powered YouTube comment moderation and management tool designed for Indian YouTube creators. Our Service provides:
            </p>
            <ul className="space-y-2">
              {[
                "Automatic detection and hiding of harmful, spammy, or abusive comments",
                "AI-generated replies to comments on YouTube videos, Shorts, Posts, and Live chat",
                "Spam detection and auto-hide functionality",
                "Live chat progressive timeout management",
                "Analytics dashboard for comment and channel insights",
                "Multi-language support — 10+ Indian languages and 100+ world languages",
                "Telegram and WhatsApp notification alerts (Agency plan)",
                "API access for advanced integrations (Agency plan)",
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
            <h2 className="text-xl font-bold text-white mb-3">3. Eligibility</h2>
            <p className="mb-3">To use ModerateAI, you must:</p>
            <ul className="space-y-2">
              {[
                "Be at least 18 years of age, or have parental/guardian consent",
                "Have a valid YouTube channel and Google account",
                "Agree to comply with YouTube's Terms of Service and Community Guidelines",
                "Provide accurate registration and billing information",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#ff6b00] mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <hr className="border-white/10" />

          {/* 4 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Account Registration</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials. Notify us immediately at{" "}
              <a href="mailto:contact@moderateai.site" className="text-[#ff6b00] hover:underline">
                contact@moderateai.site
              </a>{" "}
              if you suspect unauthorized access.
            </p>
            <p className="mt-2">
              ModerateAI reserves the right to terminate accounts that violate these Terms, provide false information, or engage in fraudulent activity.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 5 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Subscription Plans and Pricing</h2>

            {[
              {
                name: "Free Trial Plan",
                price: "₹0/month",
                trial: "19-day free trial",
                features: [
                  "1 YouTube channel",
                  "1,500 comments scanned/month",
                  "All videos + Shorts + Posts scanned",
                  "Unlimited bad comments hidden for review",
                  "Live chat progressive timeouts",
                  "Spam detection & auto-hide",
                  "3 AI replies per video (45s delay)",
                  "10+ Indian languages",
                  "Basic dashboard",
                ],
              },
              {
                name: "Pro Plan",
                price: "₹349/month",
                trial: "7-day free trial",
                features: [
                  "1 YouTube channel",
                  "5,000 comments scanned/month",
                  "All videos + Shorts + Posts + Live chat",
                  "Unlimited bad comments hidden for review",
                  "Live chat progressive timeouts",
                  "Spam detection & auto-hide",
                  "Auto-replies scale with comments (45s delay)",
                  "100+ world languages",
                  "Full analytics dashboard",
                  "Telegram alerts",
                  "Priority support",
                ],
              },
              {
                name: "Agency Plan",
                price: "₹1,900/month",
                trial: "7-day free trial",
                features: [
                  "1 YouTube channel",
                  "Unlimited comments scanned",
                  "All videos + Shorts + Posts + Live chat",
                  "Unlimited bad comment hiding",
                  "Advanced timeout controls",
                  "Unlimited auto-replies",
                  "100+ world languages",
                  "Advanced analytics + exports",
                  "Telegram + WhatsApp alerts",
                  "Dedicated support",
                  "API access",
                ],
              },
            ].map((plan) => (
              <div key={plan.name} className="mt-4 p-4 rounded-xl border border-white/10 bg-white/5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-white">{plan.name}</h3>
                  <div className="text-right">
                    <span className="text-[#ff6b00] font-bold">{plan.price}</span>
                    <span className="text-gray-400 text-xs block">{plan.trial}</span>
                  </div>
                </div>
                <ul className="space-y-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-[#ff6b00] mt-0.5">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <p className="mt-4 text-sm">
              Prices are in Indian Rupees (INR). ModerateAI reserves the right to modify pricing with 30 days&apos; advance notice to existing subscribers.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 6 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Payment and Billing</h2>
            <p className="mb-3">
              By subscribing to a paid plan, you authorize ModerateAI to charge your chosen payment method on a recurring monthly basis.
            </p>
            <ul className="space-y-2">
              {[
                "All payments are processed securely through our payment gateway partners.",
                "Subscriptions automatically renew at the end of each billing cycle unless cancelled.",
                "You may cancel your subscription at any time from your account settings.",
                "Refunds are not provided for partial months or unused features unless required by applicable law.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#ff6b00] mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <hr className="border-white/10" />

          {/* 7 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Free Trial Terms</h2>
            <p>
              Free trials are offered to new users only. One free trial per user/email/channel is permitted. After the free trial ends, your account will transition to a paid plan or access will be restricted.
            </p>
            <p className="mt-2">
              ModerateAI reserves the right to modify or discontinue free trial offers at any time without prior notice.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 8 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. YouTube API and Google Compliance</h2>
            <p className="mb-3">Our Service integrates with the YouTube Data API. By using ModerateAI, you also agree to:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-[#ff6b00] mt-1">✓</span>
                <span>
                  Google&apos;s Terms of Service:{" "}
                  <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-[#ff6b00] hover:underline">
                    https://policies.google.com/terms
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#ff6b00] mt-1">✓</span>
                <span>
                  YouTube Terms of Service:{" "}
                  <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-[#ff6b00] hover:underline">
                    https://www.youtube.com/t/terms
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#ff6b00] mt-1">✓</span>
                <span>
                  Google Privacy Policy:{" "}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#ff6b00] hover:underline">
                    https://policies.google.com/privacy
                  </a>
                </span>
              </li>
            </ul>
            <p className="mt-3">
              You grant ModerateAI limited access to your YouTube channel data solely for providing moderation and reply services. We will not use your YouTube data for any other purpose without explicit consent.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 9 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Acceptable Use Policy</h2>
            <p className="mb-3">You agree NOT to use ModerateAI to:</p>
            <ul className="space-y-2">
              {[
                "Violate YouTube's Community Guidelines or Terms of Service",
                "Harass, threaten, or harm any person or entity",
                "Spread misinformation, hate speech, or illegal content",
                "Circumvent, hack, or reverse-engineer our platform",
                "Use automated bots or scripts to manipulate the Service",
                "Share account access with unauthorized third parties",
                "Engage in any activity that disrupts or damages the Service",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <hr className="border-white/10" />

          {/* 10 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Intellectual Property</h2>
            <p>
              All content, software, trademarks, logos, and branding associated with ModerateAI are the exclusive intellectual property of ModerateAI and its licensors. You may not copy, reproduce, or distribute without prior written permission.
            </p>
            <p className="mt-2">
              AI-generated replies produced on your behalf are provided for use on your YouTube channel. ModerateAI retains no ownership over such outputs once delivered.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 11 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">11. Privacy and Data Protection</h2>
            <p>
              Your use of ModerateAI is governed by our{" "}
              <Link href="/privacy" className="text-[#ff6b00] hover:underline">
                Privacy Policy
              </Link>
              . We are committed to protecting your data in accordance with the Digital Personal Data Protection Act, 2023 (DPDPA).
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 12 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">12. Limitation of Liability</h2>
            <p className="mb-3">To the maximum extent permitted by law, ModerateAI shall not be liable for:</p>
            <ul className="space-y-2">
              {[
                "Any indirect, incidental, or consequential damages from your use of the Service",
                "Loss of revenue, data, or goodwill resulting from comment moderation actions",
                "Actions taken by YouTube or Google that affect your channel",
                "Inaccuracies or errors in AI-generated replies",
                "Service interruptions due to maintenance, updates, or unforeseen events",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#ff6b00] mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              Our total liability shall not exceed the amount paid by you in the three (3) months preceding the claim.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 13 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">13. Disclaimer of Warranties</h2>
            <p className="mb-3">
              ModerateAI is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We do not guarantee that:
            </p>
            <ul className="space-y-2">
              {[
                "The Service will be uninterrupted or error-free",
                "All harmful comments will be detected or removed",
                "AI replies will always be accurate or appropriate",
                "Results will meet your specific expectations",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#ff6b00] mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <hr className="border-white/10" />

          {/* 14 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">14. Termination</h2>
            <p>
              Either party may terminate this agreement at any time. ModerateAI reserves the right to suspend or terminate your account immediately if you violate these Terms. Upon termination, your access will cease and data may be deleted per our Privacy Policy.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 15 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">15. Modifications to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you via email or a prominent website notice. Continued use after changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 16 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">16. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Hyderabad, Telangana, India.
            </p>
            <p className="mt-2">
              We encourage users to contact us at{" "}
              <a href="mailto:contact@moderateai.site" className="text-[#ff6b00] hover:underline">
                contact@moderateai.site
              </a>{" "}
              to resolve disputes amicably before initiating legal proceedings.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 17 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">17. Contact Information</h2>
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