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
            Effective: May 2026
          </p>
          <div className="mt-4 h-1 w-16 bg-[#ff6b00] rounded-full" />
        </div>

        <div className="space-y-10 text-gray-300 leading-relaxed">

          {/* 1 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using ModerateAI, you agree to be bound by these Terms and Conditions and all applicable laws and regulations. If you do not agree to these Terms, you must not access or use our Service.
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
              ModerateAI is an AI-powered YouTube comment moderation and management platform. Our Service provides:
            </p>
            <ul className="space-y-2">
              {[
                "Automated detection and moderation of harmful, spammy, or abusive comments",
                "AI-generated replies to comments on YouTube videos, Shorts, Community Posts, and Live Chat",
                "Live Chat progressive timeout management",
                "Analytics dashboard for comment activity and channel insights",
                "Multi-language comment moderation support",
                "Moderation alert notifications (on applicable plans)",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#ff6b00] mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-gray-400">
              Feature availability varies by subscription plan. Please refer to the Pricing page for current plan details.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 3 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Eligibility</h2>
            <p className="mb-3">To use ModerateAI, you must:</p>
            <ul className="space-y-2">
              {[
                "Be at least the minimum age required under applicable law, or have valid parental or guardian consent where permitted",
                "Hold a valid YouTube channel and Google account",
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
              You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. If you suspect unauthorized access or a security breach, please refer to the Contact section below.
            </p>
            <p className="mt-2">
              ModerateAI reserves the right to suspend or terminate accounts that violate these Terms, provide false information, or engage in fraudulent activity.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 5 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Subscription Plans and Pricing</h2>
            <p className="mb-3">
              ModerateAI offers multiple subscription plans, including a free trial option for new users.
            </p>
            <p className="mb-3">
              Current pricing, available features, usage limits, and trial availability are displayed on our{" "}
              <Link href="/pricing" className="text-[#ff6b00] hover:underline">
                Pricing page
              </Link>{" "}
              and may be updated from time to time. By purchasing a subscription, you agree to the pricing and plan details presented at the time of purchase.
            </p>
            <ul className="space-y-2">
              {[
                "All prices are displayed in Indian Rupees (INR) unless otherwise stated.",
                "ModerateAI reserves the right to modify pricing with at least 30 days' advance notice to existing subscribers.",
                "Plan features and usage limits are subject to change. Subscribers will be notified of material changes.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#ff6b00] mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <hr className="border-white/10" />

          {/* 6 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Payment and Billing</h2>
            <p className="mb-3">
              By subscribing to a paid plan, you authorize ModerateAI to charge your chosen payment method on a recurring basis according to your selected billing cycle.
            </p>
            <ul className="space-y-2">
              {[
                "All payments are processed securely through trusted third-party payment processors.",
                "Subscriptions automatically renew at the end of each billing cycle unless cancelled prior to renewal.",
                "You may cancel your subscription at any time from your account settings.",
                "Refunds are not provided for partial billing periods or unused features unless required by applicable law.",
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
              Free trials are available to new users only. One free trial per user, email address, or YouTube channel is permitted. Upon expiry of the trial period, your account will transition to a paid plan or access will be restricted until a subscription is activated.
            </p>
            <p className="mt-2">
              ModerateAI reserves the right to modify, limit, or discontinue free trial offers at any time without prior notice.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 8 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. YouTube API and Google Compliance</h2>
            <p className="mb-3">
              Our Service integrates with the YouTube Data API. By using ModerateAI, you also agree to:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-[#ff6b00] mt-1">✓</span>
                <span>
                  Google Terms of Service:{" "}
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
              You grant ModerateAI limited, scoped access to your YouTube channel data solely for the purpose of delivering moderation and reply services. We will not use your YouTube data for any purpose beyond what is described in our{" "}
              <Link href="/privacy" className="text-[#ff6b00] hover:underline">
                Privacy Policy
              </Link>
              .
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
                "Harass, threaten, or cause harm to any person or entity",
                "Distribute misinformation, hate speech, or unlawful content",
                "Attempt to circumvent, reverse-engineer, or exploit our platform",
                "Use automated tools or scripts to manipulate or abuse the Service",
                "Share, transfer, or resell account access to unauthorized third parties",
                "Engage in any conduct that disrupts, damages, or impairs the Service",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              Violation of this policy may result in immediate account suspension or termination without refund.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 10 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Intellectual Property</h2>
            <p>
              All content, software, trademarks, logos, and branding associated with ModerateAI are the exclusive intellectual property of ModerateAI and its licensors. You may not copy, reproduce, modify, or distribute any part of the Service without prior written permission.
            </p>
            <p className="mt-2">
              AI-generated replies produced on your behalf are provided for use on your YouTube channel. ModerateAI retains no ownership over such outputs once delivered to you.
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
              , which is incorporated into these Terms by reference. We are committed to protecting your personal data in accordance with the Digital Personal Data Protection Act, 2023 (DPDPA) and other applicable laws.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 12 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">12. Limitation of Liability</h2>
            <p className="mb-3">To the maximum extent permitted by applicable law, ModerateAI shall not be liable for:</p>
            <ul className="space-y-2">
              {[
                "Any indirect, incidental, special, or consequential damages arising from your use of the Service",
                "Loss of revenue, data, reputation, or goodwill resulting from moderation actions",
                "Actions taken by YouTube, Google, or other third parties that affect your channel",
                "Inaccuracies or errors in AI-generated content",
                "Service interruptions resulting from maintenance, updates, or unforeseen circumstances",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#ff6b00] mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              Our total cumulative liability to you shall not exceed the total fees paid by you in the three (3) months preceding the claim.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 13 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">13. Disclaimer of Warranties</h2>
            <p className="mb-3">
              ModerateAI is provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of any kind, express or implied. We do not guarantee that:
            </p>
            <ul className="space-y-2">
              {[
                "The Service will be uninterrupted, timely, or error-free",
                "All harmful or spammy comments will be detected or actioned",
                "AI-generated replies will be accurate, appropriate, or suitable for all contexts",
                "The Service will meet your specific requirements or expectations",
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
              Either party may terminate this agreement at any time. ModerateAI reserves the right to suspend or terminate your account immediately and without prior notice if you violate these Terms or engage in conduct that we reasonably determine to be harmful to the Service or other users. Upon termination, your access to the Service will cease and your data will be handled in accordance with our Privacy Policy.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 15 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">15. Modifications to Terms</h2>
            <p>
              We may update these Terms from time to time to reflect changes in our practices, applicable law, or Service offerings. We will notify you of material changes via email or a prominent notice on our platform. Continued use of the Service following such notification constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 16 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">16. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of India. Any disputes arising from or relating to these Terms or your use of the Service shall be subject to the exclusive jurisdiction of the courts in Hyderabad, Telangana, India.
            </p>
            <p className="mt-2">
              We encourage users to contact us through the Contact section below to seek an amicable resolution before initiating any formal legal proceedings.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 17 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3">17. Contact Information</h2>
            <p className="mb-3">For questions, concerns, or requests regarding these Terms, please contact:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-[#ff6b00] mt-1">✓</span>
                <span>
                  Email:{" "}
                  <a href="mailto:ModerateAiSite@protonmail.com" className="text-[#ff6b00] hover:underline">
                    ModerateAiSite@protonmail.com
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
                <span>Support Team: ModerateAI Support Team</span>
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