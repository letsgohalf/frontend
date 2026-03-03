'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
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
            Terms of Service
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
              1. Acceptance of Terms
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Welcome to LetsGoHalf! By accessing or using our platform, mobile application, or website
              (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms").
              If you do not agree to these Terms, please do not use our Service.
            </p>
            <p className="text-neutral-600 dark:text-neutral-400">
              LetsGoHalf is a platform that connects individuals seeking roommates or shared living
              arrangements. We facilitate connections but are not a party to any agreements between users.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              2. Eligibility
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              To use LetsGoHalf, you must:
            </p>
            <ul className="list-disc pl-6 text-neutral-600 dark:text-neutral-400 space-y-2">
              <li>Be at least 18 years of age</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Not be prohibited from using the Service under applicable laws</li>
              <li>Provide accurate and complete registration information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              3. Account Registration
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              When creating an account, you agree to:
            </p>
            <ul className="list-disc pl-6 text-neutral-600 dark:text-neutral-400 space-y-2">
              <li>Provide truthful, accurate, and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Not create multiple accounts or share your account with others</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              4. Listing and Content Guidelines
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              When posting listings or content on LetsGoHalf, you agree that:
            </p>
            <ul className="list-disc pl-6 text-neutral-600 dark:text-neutral-400 space-y-2">
              <li>All property information must be accurate and not misleading</li>
              <li>You have the right to offer the accommodation (as owner, tenant with subletting rights, or authorized agent)</li>
              <li>Photos must be current and accurately represent the property</li>
              <li>Pricing information must be accurate and inclusive of disclosed fees</li>
              <li>You will not post discriminatory content based on race, religion, gender, sexual orientation, national origin, disability, or family status</li>
              <li>You will not post spam, fraudulent, or misleading content</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              5. User Conduct
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              You agree NOT to:
            </p>
            <ul className="list-disc pl-6 text-neutral-600 dark:text-neutral-400 space-y-2">
              <li>Harass, threaten, or intimidate other users</li>
              <li>Post false, misleading, or defamatory content</li>
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Attempt to gain unauthorized access to other accounts or systems</li>
              <li>Collect or store personal data about other users without consent</li>
              <li>Transmit viruses, malware, or other harmful code</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Use automated systems to access the Service without permission</li>
              <li>Engage in any form of fraud or scam</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              6. Verification Services
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              LetsGoHalf offers optional identity verification services. While we strive to verify user
              identities, we cannot guarantee the accuracy of all verifications. The verification badge
              indicates that a user has completed our verification process, but does not constitute an
              endorsement or guarantee of trustworthiness.
            </p>
            <p className="text-neutral-600 dark:text-neutral-400">
              Users are encouraged to conduct their own due diligence before entering into any agreements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              7. Communication Between Users
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              LetsGoHalf provides messaging features to facilitate communication between users. You agree to:
            </p>
            <ul className="list-disc pl-6 text-neutral-600 dark:text-neutral-400 space-y-2">
              <li>Use messaging features only for legitimate purposes related to finding roommates or shared accommodations</li>
              <li>Not send spam, promotional content, or unsolicited messages</li>
              <li>Not share personal contact information until you feel comfortable doing so</li>
              <li>Report any suspicious or inappropriate messages</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              8. Financial Transactions
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              LetsGoHalf is a connection platform and does not process rent payments or deposits.
              Any financial arrangements between users are solely between those parties. We strongly recommend:
            </p>
            <ul className="list-disc pl-6 text-neutral-600 dark:text-neutral-400 space-y-2">
              <li>Never sending money before meeting in person and viewing the property</li>
              <li>Using secure payment methods with buyer protection when possible</li>
              <li>Getting written agreements for all financial arrangements</li>
              <li>Reporting any requests for unusual payment methods as potential scams</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              9. Intellectual Property
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              The LetsGoHalf Service, including its design, features, and content (excluding user-generated content),
              is owned by LetsGoHalf and protected by intellectual property laws. You are granted a limited,
              non-exclusive, non-transferable license to use the Service for personal, non-commercial purposes.
            </p>
            <p className="text-neutral-600 dark:text-neutral-400">
              By posting content on LetsGoHalf, you grant us a non-exclusive, worldwide, royalty-free license
              to use, display, and distribute your content in connection with the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              10. Disclaimer of Warranties
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
              EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT:
            </p>
            <ul className="list-disc pl-6 text-neutral-600 dark:text-neutral-400 space-y-2">
              <li>The Service will be uninterrupted or error-free</li>
              <li>Listings or user information are accurate or reliable</li>
              <li>Any roommate match will be successful or safe</li>
              <li>Properties listed meet any particular standards</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              11. Limitation of Liability
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, LETSGOHALF SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc pl-6 text-neutral-600 dark:text-neutral-400 space-y-2">
              <li>Loss of profits, data, or goodwill</li>
              <li>Property damage or personal injury arising from user interactions</li>
              <li>Disputes between users regarding accommodations or payments</li>
              <li>Actions or content of third parties on the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              12. Indemnification
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              You agree to indemnify and hold harmless LetsGoHalf, its affiliates, officers, directors,
              employees, and agents from any claims, damages, losses, or expenses (including legal fees)
              arising from your use of the Service, violation of these Terms, or infringement of any
              third-party rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              13. Account Termination
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              We reserve the right to suspend or terminate your account at any time for:
            </p>
            <ul className="list-disc pl-6 text-neutral-600 dark:text-neutral-400 space-y-2">
              <li>Violation of these Terms</li>
              <li>Fraudulent or illegal activity</li>
              <li>Reports of harassment or inappropriate behavior</li>
              <li>Extended periods of inactivity</li>
              <li>Any other reason at our discretion with or without notice</li>
            </ul>
            <p className="text-neutral-600 dark:text-neutral-400 mt-4">
              You may delete your account at any time through the app settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              14. Changes to Terms
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              We may modify these Terms at any time. We will notify users of significant changes through
              the Service or via email. Continued use of the Service after changes constitutes acceptance
              of the modified Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              15. Governing Law
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              These Terms shall be governed by and construed in accordance with the laws of the Federal
              Republic of Nigeria, without regard to its conflict of law provisions. Any disputes arising
              under these Terms shall be subject to the exclusive jurisdiction of the courts in Lagos, Nigeria.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              16. Contact Information
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <ul className="list-none text-neutral-600 dark:text-neutral-400 space-y-2">
              <li><strong>Email:</strong> legal@letsgohalf.com</li>
              <li><strong>Support:</strong> support@letsgohalf.com</li>
            </ul>
          </section>

          {/* Related Links */}
          <div className="mt-12 pt-8 border-t border-[var(--peach-200)] dark:border-neutral-800">
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">Related documents:</p>
            <div className="flex gap-4">
              <Link
                href="/privacy"
                className="text-[var(--teal-600)] dark:text-[var(--teal-400)] font-medium hover:underline"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
