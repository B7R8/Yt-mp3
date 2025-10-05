import React from 'react';
import { EnvelopeIcon } from '../components/icons/EnvelopeIcon';
import { ClockIcon } from '../components/icons/ClockIcon';
import { LifebuoyIcon } from '../components/icons/LifebuoyIcon';

const Contact: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Contact Us</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">Get in touch with our team.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-start">
        {/* Left Column: Info */}
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Get in Touch</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <EnvelopeIcon className="w-6 h-6 text-brand-500" />
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <p className="text-gray-600 dark:text-gray-400">support@ytconv.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ClockIcon className="w-6 h-6 text-brand-500" />
                <div>
                  <h3 className="font-semibold">Response Time</h3>
                  <p className="text-gray-600 dark:text-gray-400">Within 24 hours</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <LifebuoyIcon className="w-6 h-6 text-brand-500" />
                <div>
                  <h3 className="font-semibold">Support</h3>
                  <p className="text-gray-600 dark:text-gray-400">24/7 Technical Support</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800/60 p-6 rounded-lg">
             <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">Quick Links</h3>
             <ul className="space-y-2">
                <li><a href="#" className="text-brand-600 dark:text-brand-400 hover:underline">→ Frequently Asked Questions</a></li>
                <li><a href="#" className="text-brand-600 dark:text-brand-400 hover:underline">→ Latest Updates</a></li>
             </ul>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="bg-white dark:bg-gray-800/60 p-6 sm:p-8 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Send us a Message</h2>
          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input type="text" name="name" id="name" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input type="email" name="email" id="email" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
              <select id="subject" name="subject" className="mt-1 block w-full pl-3 pr-10 py-2 bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm">
                <option>General Inquiry</option>
                <option>Technical Support</option>
                <option>Feedback</option>
              </select>
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
              <textarea id="message" name="message" rows={4} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"></textarea>
            </div>
            <div>
              <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-brand-500">
                Send Message
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;