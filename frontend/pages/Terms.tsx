import React from 'react';
import { Page } from '../App';

interface TermsProps {
  navigateTo: (page: Page) => void;
}

const Terms: React.FC<TermsProps> = ({ navigateTo }) => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Terms of Use</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <strong>Effective Date:</strong> October 10, 2025 | <strong>Last Updated:</strong> October 10, 2025
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Welcome to SaveYTB.com. By accessing or using our website and services, you agree to comply with and be bound by these Terms of Use.
        </p>
      </div>
      <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
        <div className="bg-white dark:bg-gray-800/60 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-3">1. Description of Service</h2>
          <p className="mb-3">SaveYTB is an online tool that allows users to convert and download publicly available online videos into audio files for personal and non-commercial use only.</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>We do not host or store any copyrighted material on our servers</li>
            <li>All files are processed temporarily and automatically deleted after processing</li>
            <li>SaveYTB is completely ad-free and operates through voluntary user donations</li>
          </ul>
        </div>
        
        <div className="bg-white dark:bg-gray-800/60 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-3">2. User Responsibilities</h2>
          <p className="mb-3">You agree not to use the Service to:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Violate any applicable laws or third-party rights</li>
            <li>Download or convert copyrighted content without authorization from the rights holder</li>
            <li>Use the Service for commercial or mass distribution purposes</li>
          </ul>
          <p className="mt-3">You are solely responsible for the content you access, download, or share through SaveYTB.</p>
        </div>

        <div className="bg-white dark:bg-gray-800/60 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-3">3. Copyright Compliance</h2>
          <p className="mb-3">SaveYTB respects the intellectual property rights of others. If you believe that any material available through our Service infringes your copyright, please contact us at:</p>
          <p className="text-blue-600 dark:text-blue-400 font-medium">📧 dmca@saveytb.com</p>
          <p className="mt-3">and we will respond promptly according to our Copyright Policy.</p>
        </div>

        <div className="bg-white dark:bg-gray-800/60 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-3">4. Limitation of Liability</h2>
          <p className="mb-3">SaveYTB provides the Service "as is" and without any warranty. We do not guarantee uninterrupted or error-free operation.</p>
          <p>We are not liable for any damages, losses, or claims resulting from your use of the Service, including loss of data or unauthorized use of copyrighted material.</p>
        </div>

        <div className="bg-white dark:bg-gray-800/60 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-3">5. Contact Information</h2>
          <p>For any questions regarding these Terms, please contact:</p>
          <p className="text-blue-600 dark:text-blue-400 font-medium mt-2">📧 support@saveytb.com</p>
        </div>
      </div>
    </div>
  );
};

export default Terms;