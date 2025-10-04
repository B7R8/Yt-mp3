import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Privacy Policy
        </h1>
        <p className="text-lg text-gray-600 dark:text-dark-text-secondary">
          Last updated: October 4, 2024
        </p>
      </div>

      <div className="prose prose-lg max-w-none dark:prose-invert">
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-8 border border-gray-200 dark:border-gray-700">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              1. Information We Collect
            </h2>
            <div className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4">
              <p className="mb-3">We collect minimal information to provide our service:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>YouTube URLs:</strong> The video URLs you submit for conversion</li>
                <li><strong>Conversion Settings:</strong> Your selected audio quality and trim preferences</li>
                <li><strong>Usage Data:</strong> Basic analytics about service usage (anonymized)</li>
                <li><strong>Technical Data:</strong> IP addresses, browser type, and device information for service optimization</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              2. How We Use Your Information
            </h2>
            <div className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4">
              <p className="mb-3">We use the collected information to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Process your conversion requests</li>
                <li>Improve our service performance and reliability</li>
                <li>Monitor service usage and prevent abuse</li>
                <li>Provide customer support when needed</li>
                <li>Ensure compliance with our Terms of Use</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              3. Data Storage and Security
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4">
              <strong>Converted Files:</strong> All converted MP3 files are automatically deleted after 1 hour. We do not store your converted files permanently.
            </p>
            <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4">
              <strong>Data Security:</strong> We implement appropriate technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction.
            </p>
            <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4">
              <strong>Data Retention:</strong> We retain minimal metadata (conversion timestamps, file sizes) for service optimization purposes only. This data is anonymized and cannot be linked to individual users.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              4. Information Sharing
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4">
              We do not sell, trade, or otherwise transfer your personal information to third parties. We may share information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-dark-text-secondary">
              <li>When required by law or legal process</li>
              <li>To protect our rights, property, or safety</li>
              <li>With service providers who assist in operating our service (under strict confidentiality agreements)</li>
              <li>In case of a business transfer or acquisition (with notice to users)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              5. Cookies and Tracking
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4">
              We use minimal cookies and tracking technologies to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-dark-text-secondary">
              <li>Remember your theme preference (dark/light mode)</li>
              <li>Analyze service usage patterns (anonymized)</li>
              <li>Prevent abuse and ensure fair usage</li>
            </ul>
            <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4">
              You can disable cookies in your browser settings, though this may affect some functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              6. Third-Party Services
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4">
              Our service integrates with YouTube for video processing. When you submit a YouTube URL, we interact with YouTube's systems to extract audio content. This interaction is subject to YouTube's own terms and privacy policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              7. Your Rights
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-dark-text-secondary">
              <li>Access information we have about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Object to processing of your information</li>
              <li>Data portability (where applicable)</li>
            </ul>
            <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4">
              To exercise these rights, please contact us using the information provided below.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              8. Children's Privacy
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4">
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              9. International Users
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4">
              If you are accessing our service from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States where our servers are located.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              10. Changes to This Policy
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              11. Contact Us
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <div className="bg-gray-50 dark:bg-dark-surface rounded-lg p-4">
              <p className="text-gray-700 dark:text-dark-text-secondary">
                <strong>Email:</strong> privacy@audioflow.com<br />
                <strong>Website:</strong> <a href="/contact" className="text-brand-red hover:text-red-600">Contact Us</a>
              </p>
            </div>
          </section>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-8">
            <p className="text-sm text-gray-500 dark:text-dark-text-secondary text-center">
              This Privacy Policy is effective as of the date listed above and will remain in effect except with respect to any changes in its provisions in the future.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
