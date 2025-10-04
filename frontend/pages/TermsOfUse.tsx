import React from 'react';

const TermsOfUse: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Terms of Use
        </h1>
        <p className="text-lg text-gray-600 dark:text-dark-text-secondary">
          Last updated: October 4, 2024
        </p>
      </div>

      <div className="prose prose-lg max-w-none dark:prose-invert">
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-8 border border-gray-200 dark:border-gray-700">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4">
              By accessing and using AudioFlow ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              2. Description of Service
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4">
              AudioFlow is a web-based service that allows users to convert YouTube videos to MP3 audio files. The service is provided "as is" and we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              3. User Responsibilities
            </h2>
            <div className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4">
              <p className="mb-3">You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Convert copyrighted content without proper authorization</li>
                <li>Use the Service for any commercial purposes without permission</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Use the Service in any way that could damage, disable, overburden, or impair the Service</li>
                <li>Use automated systems or software to extract data from the Service</li>
                <li>Violate any applicable local, state, national, or international law or regulation</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              4. Copyright and Intellectual Property
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4">
              You are solely responsible for ensuring that you have the right to convert any content you submit to the Service. AudioFlow respects the intellectual property rights of others and expects users to do the same. We will respond to notices of alleged copyright infringement that comply with applicable law.
            </p>
            <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4">
              <strong>Important:</strong> Converting copyrighted material without permission may constitute copyright infringement. You are responsible for obtaining all necessary permissions before converting any content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              5. Privacy and Data
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4">
              We respect your privacy and are committed to protecting your personal information. Converted files are automatically deleted after 1 hour for privacy and security reasons. We do not store or retain your converted files beyond this period.
            </p>
            <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4">
              For more information about how we collect, use, and protect your information, please review our Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              6. Service Availability
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4">
              We strive to provide continuous service availability, but we do not guarantee that the Service will be available at all times. The Service may be temporarily unavailable due to maintenance, updates, or technical issues beyond our control.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              7. Limitation of Liability
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4">
              To the fullest extent permitted by law, AudioFlow shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              8. Termination
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4">
              We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              9. Changes to Terms
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              10. Contact Information
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4">
              If you have any questions about these Terms of Use, please contact us at:
            </p>
            <div className="bg-gray-50 dark:bg-dark-surface rounded-lg p-4">
              <p className="text-gray-700 dark:text-dark-text-secondary">
                <strong>Email:</strong> legal@audioflow.com<br />
                <strong>Website:</strong> <a href="/contact" className="text-brand-red hover:text-red-600">Contact Us</a>
              </p>
            </div>
          </section>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-8">
            <p className="text-sm text-gray-500 dark:text-dark-text-secondary text-center">
              By using AudioFlow, you acknowledge that you have read and understood these Terms of Use and agree to be bound by them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
