'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  const router = useRouter();
  const lastUpdated = 'February 5, 2026';

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Header */}
      <header className="sticky top-0 z-40 px-5 py-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg border-b border-[var(--peach-200)] dark:border-neutral-800">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            Privacy Policy
          </h1>
        </div>
      </header>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto px-5 py-8"
      >
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p className="text-sm text-neutral-500 mb-8">Last updated: {lastUpdated}</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              1. Introduction
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              LetsGoHalf ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our
              platform, mobile application, and website (collectively, the "Service").
            </p>
            <p className="text-neutral-600 dark:text-neutral-400">
              Please read this Privacy Policy carefully. By using the Service, you consent to the practices
              described in this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              2. Information We Collect
            </h2>

            <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-200 mt-6 mb-3">
              2.1 Information You Provide
            </h3>
            <ul className="list-disc pl-6 text-neutral-600 dark:text-neutral-400 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, phone number, password, and profile photo</li>
              <li><strong>Profile Information:</strong> Bio, occupation, lifestyle preferences, budget range, and preferred locations</li>
              <li><strong>Listing Information:</strong> Property details, photos, amenities, pricing, and availability</li>
              <li><strong>Verification Documents:</strong> Government-issued ID, proof of address, or employment verification (if you choose to verify your account)</li>
              <li><strong>Communications:</strong> Messages sent through our platform, support inquiries, and feedback</li>
            </ul>

            <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-200 mt-6 mb-3">
              2.2 Information Collected Automatically
            </h3>
            <ul className="list-disc pl-6 text-neutral-600 dark:text-neutral-400 space-y-2">
              <li><strong>Device Information:</strong> Device type, operating system, unique device identifiers, and browser type</li>
              <li><strong>Log Data:</strong> IP address, access times, pages viewed, and referring URLs</li>
              <li><strong>Location Data:</strong> Approximate location based on IP address or precise location if you grant permission</li>
              <li><strong>Usage Data:</strong> Features used, search queries, listing interactions, and preferences</li>
              <li><strong>Cookies:</strong> Session cookies, preference cookies, and analytics cookies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-neutral-600 dark:text-neutral-400 space-y-2">
              <li>Create and manage your account</li>
              <li>Facilitate connections between users seeking roommates</li>
              <li>Display relevant listings based on your preferences</li>
              <li>Enable messaging and communication between users</li>
              <li>Process and respond to your inquiries and support requests</li>
              <li>Send notifications about matches, messages, and account activity</li>
              <li>Verify user identities and prevent fraud</li>
              <li>Improve and personalize the Service</li>
              <li>Analyze usage patterns and trends</li>
              <li>Enforce our Terms of Service</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              4. Information Sharing and Disclosure
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              We may share your information in the following circumstances:
            </p>

            <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-200 mt-6 mb-3">
              4.1 With Other Users
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Your public profile information (name, photo, bio, verification status) is visible to other users.
              Listing details are visible to users searching for accommodations. Contact information is only
              shared when you choose to communicate with another user.
            </p>

            <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-200 mt-6 mb-3">
              4.2 With Service Providers
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              In the occasion we share your information or data with our third-party service providers
              who perform services on our behalf — including hosting, analytics, customer support, and
              identity verification — these providers are contractually obligated to protect your information
              and may only use it for the purposes we have specified.
            </p>

            <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-200 mt-6 mb-3">
              4.3 For Legal Reasons
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              We may disclose information if required by law, court order, or government request, or if we
              believe disclosure is necessary to protect our rights, your safety, or the safety of others.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              5. Data Security
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              We implement appropriate technical and organizational security measures to protect your
              personal information, including:
            </p>
            <ul className="list-disc pl-6 text-neutral-600 dark:text-neutral-400 space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure password hashing</li>
              <li>Regular security assessments</li>
              <li>Access controls and authentication</li>
              <li>Monitoring for unauthorized access</li>
            </ul>
            <p className="text-neutral-600 dark:text-neutral-400 mt-4">
              However, no method of transmission over the Internet is 100% secure. We cannot guarantee
              absolute security of your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              6. Data Retention
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              We retain your personal information for as long as your account is active or as needed to
              provide you services. We may retain certain information after account deletion for:
            </p>
            <ul className="list-disc pl-6 text-neutral-600 dark:text-neutral-400 space-y-2">
              <li>Compliance with legal obligations</li>
              <li>Resolution of disputes</li>
              <li>Enforcement of agreements</li>
              <li>Prevention of fraud and abuse</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              7. Your Rights and Choices
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              You have the following rights regarding your personal information:
            </p>
            <ul className="list-disc pl-6 text-neutral-600 dark:text-neutral-400 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Portability:</strong> Request your data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Restrict Processing:</strong> Limit how we use your data in certain circumstances</li>
            </ul>
            <p className="text-neutral-600 dark:text-neutral-400 mt-4">
              To exercise these rights, please contact us at privacy@letsgohalf.com or through your
              account settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              8. Cookies and Tracking Technologies
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="list-disc pl-6 text-neutral-600 dark:text-neutral-400 space-y-2">
              <li>Keep you logged in</li>
              <li>Remember your preferences</li>
              <li>Understand how you use our Service</li>
              <li>Improve our Service</li>
              <li>Provide personalized content</li>
            </ul>
            <p className="text-neutral-600 dark:text-neutral-400 mt-4">
              You can control cookies through your browser settings. However, disabling cookies may
              limit some features of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              9. Third-Party Links
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Our Service may contain links to third-party websites or services. We are not responsible
              for the privacy practices of these third parties. We encourage you to read their privacy
              policies before providing any personal information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              10. Children's Privacy
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              LetsGoHalf is not intended for users under 18 years of age. We do not knowingly collect
              personal information from children under 18. If we discover that we have collected
              information from a child under 18, we will delete it immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              11. International Data Transfers
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Your information may be transferred to and processed in countries other than Nigeria.
              These countries may have different data protection laws. When we transfer your information,
              we ensure appropriate safeguards are in place to protect your data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              12. Changes to This Privacy Policy
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              We may update this Privacy Policy from time to time. We will notify you of significant
              changes by posting the new policy on this page and updating the "Last updated" date.
              We encourage you to review this policy periodically.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              13. Contact Us
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              If you have questions or concerns about this Privacy Policy or our data practices,
              please contact us:
            </p>
            <ul className="list-none text-neutral-600 dark:text-neutral-400 space-y-2">
              <li><strong>Email:</strong> privacy@letsgohalf.com</li>
              <li><strong>Support:</strong> support@letsgohalf.com</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              14. Nigeria Data Protection Regulation (NDPR) Compliance
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              We comply with the Nigeria Data Protection Regulation (NDPR) 2019. As a data controller,
              we ensure that:
            </p>
            <ul className="list-disc pl-6 text-neutral-600 dark:text-neutral-400 space-y-2">
              <li>Personal data is collected and processed lawfully and fairly</li>
              <li>Data is collected for specified, explicit, and legitimate purposes</li>
              <li>Data collected is adequate, relevant, and limited to what is necessary</li>
              <li>Data is accurate and kept up to date</li>
              <li>Data is stored only for as long as necessary</li>
              <li>Appropriate security measures protect personal data</li>
            </ul>
            <p className="text-neutral-600 dark:text-neutral-400 mt-4">
              You have the right to lodge a complaint with the National Information Technology
              Development Agency (NITDA) if you believe your data protection rights have been violated.
            </p>
          </section>

          {/* Related Links */}
          <div className="mt-12 pt-8 border-t border-[var(--peach-200)] dark:border-neutral-800">
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">Related documents:</p>
            <div className="flex gap-4">
              <Link
                href="/terms"
                className="text-[var(--teal-600)] dark:text-[var(--teal-400)] font-medium hover:underline"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
