import React from 'react';
import { Page } from '../App';

interface PrivacyProps {
  navigateTo: (page: Page) => void;
}

const Privacy: React.FC<PrivacyProps> = ({ navigateTo }) => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Privacy Policy</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <strong>Effective Date:</strong> October 10, 2025 | <strong>Last Updated:</strong> October 10, 2025
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          SaveYTB is an online service that helps users convert publicly available online videos into audio (MP3) files for personal, non-commercial use. We are ad-free and supported solely by voluntary user donations.
        </p>
      </div>
      <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
        <div className="bg-white dark:bg-gray-800/60 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-3">1. Introduction</h2>
          <p className="mb-3">SaveYTB ("we", "us", "our") is an online service that helps users convert publicly available online videos into audio (MP3) files for personal, non-commercial use. This Privacy Policy explains what information we collect, how we use it, and the choices you have.</p>
          <p>We are ad-free and supported solely by voluntary user donations.</p>
        </div>

        <div className="bg-white dark:bg-gray-800/60 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-3">2. No Data Collection Policy</h2>
          <p className="mb-3">SaveYTB does not collect, store, or retain any personal data from users. We operate completely data-free:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>No user accounts or registration required</li>
            <li>No personal information is collected or stored</li>
            <li>No conversion history or user data is retained</li>
            <li>All converted files are automatically deleted within 30 minutes</li>
            <li>No tracking, analytics, or user behavior monitoring</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800/60 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-3">3. No Data Sharing</h2>
          <p className="mb-3">Since we do not collect any personal data, there is nothing to share or disclose:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>No personal information is collected, so nothing can be shared</li>
            <li>No user data is stored, so nothing can be disclosed</li>
            <li>No third-party data sharing occurs</li>
            <li>No legal requests can be fulfilled as we have no data to provide</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800/60 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-3">4. No Analytics or Tracking</h2>
          <p className="mb-3">SaveYTB does not use any analytics, tracking, or monitoring services:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>No Google Analytics or any tracking services</li>
            <li>No user behavior monitoring or analytics</li>
            <li>No third-party tracking scripts</li>
            <li>No data collection for statistics or analytics</li>
            <li>Complete privacy with no tracking whatsoever</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800/60 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-3">5. No Cookies</h2>
          <p className="mb-3">SaveYTB does not use any cookies:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>No tracking cookies</li>
            <li>No analytics cookies</li>
            <li>No advertising cookies</li>
            <li>No session cookies</li>
            <li>No cookies whatsoever - complete cookie-free operation</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800/60 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-3">6. DMCA & Copyright Requests</h2>
          <p className="mb-3">Since we do not store any data or files permanently, DMCA requests are handled differently:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>All files are automatically deleted within 30 minutes</li>
            <li>No permanent storage of converted content</li>
            <li>No user data or conversion history is retained</li>
            <li>Contact us at: <span className="text-blue-600 dark:text-blue-400 font-medium">📧 dmca@saveytb.com</span> for any concerns</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800/60 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-3">7. Third-Party Sites & Links</h2>
          <p>SaveYTB may include links to other websites (e.g., the original source pages). We do not control third-party sites and are not responsible for their privacy practices. We do not share any data with these sites as we collect no data ourselves.</p>
        </div>

        <div className="bg-white dark:bg-gray-800/60 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-3">8. Children</h2>
          <p>Our Service is not intended for children under 13. Since we do not collect any personal information from anyone, this policy applies to all users regardless of age.</p>
        </div>

        <div className="bg-white dark:bg-gray-800/60 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-3">9. Changes to this Policy</h2>
          <p>We may update this Privacy Policy occasionally. The "Last Updated" date at the top indicates the effective date of the current policy. Significant changes will be posted on this page.</p>
        </div>

        <div className="bg-white dark:bg-gray-800/60 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-3">9. Contact Us</h2>
          <p className="mb-3">If you have questions about this Privacy Policy, contact us at:</p>
          <div className="space-y-2">
            <p className="text-blue-600 dark:text-blue-400 font-medium">📧 support@saveytb.com (support/general)</p>
            <p className="text-blue-600 dark:text-blue-400 font-medium">📧 dmca@saveytb.com (copyright / takedown)</p>
          </div>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">Note: Since we collect no data, there are no data-related requests to process.</p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;