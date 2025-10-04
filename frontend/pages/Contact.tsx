import React, { useState } from 'react';
import { showToast, toastMessages } from '../utils/toast';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'name':
        return value.trim() ? '' : 'Name is required';
      case 'email':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? '' : 'Please enter a valid email address';
      case 'subject':
        return value ? '' : 'Please select a subject';
      case 'message':
        return value.trim() ? '' : 'Message is required';
      default:
        return '';
    }
  };

  const validateForm = () => {
    const errors = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      subject: validateField('subject', formData.subject),
      message: validateField('message', formData.message)
    };
    
    setFieldErrors(errors);
    
    // Check if there are any errors
    return Object.values(errors).every(error => error === '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    if (!validateForm()) {
      showToast.error(toastMessages.contact.validation);
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call - in a real app, you would send this to your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success toast
      showToast.success(toastMessages.contact.success);
      
      // Reset form and errors
      setFormData({ name: '', email: '', subject: '', message: '' });
      setFieldErrors({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      // Show error toast
      showToast.error(toastMessages.contact.failed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear field error when user starts typing
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: ''
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Contact Us
        </h1>
        <p className="text-lg text-gray-600 dark:text-dark-text-secondary">
          Get in touch with our team
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Contact Information */}
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Get in Touch
            </h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-brand-red rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Email</p>
                  <p className="text-gray-600 dark:text-dark-text-secondary">support@audioflow.com</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-brand-red rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Response Time</p>
                  <p className="text-gray-600 dark:text-dark-text-secondary">Within 24 hours</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-brand-red rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Support</p>
                  <p className="text-gray-600 dark:text-dark-text-secondary">24/7 Technical Support</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-dark-surface rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="/faq" className="text-brand-red hover:text-red-600 transition-colors">
                  → Frequently Asked Questions
                </a>
              </li>
              <li>
                <a href="/changelog" className="text-brand-red hover:text-red-600 transition-colors">
                  → Latest Updates
                </a>
              </li>
              <li>
                <a href="https://www.aiploma.com/" target="_blank" rel="noopener noreferrer" className="text-brand-red hover:text-red-600 transition-colors">
                  → Our Blog
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Send us a Message
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent bg-white dark:bg-dark-surface text-gray-900 dark:text-white ${
                  fieldErrors.name 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Your name"
              />
              {fieldErrors.name && (
                <p className="mt-1 text-sm text-red-500 dark:text-red-400">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent bg-white dark:bg-dark-surface text-gray-900 dark:text-white ${
                  fieldErrors.email 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="your.email@example.com"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-500 dark:text-red-400">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                Subject
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent bg-white dark:bg-dark-surface text-gray-900 dark:text-white ${
                  fieldErrors.subject 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Select a subject</option>
                <option value="general">General Inquiry</option>
                <option value="technical">Technical Support</option>
                <option value="feature">Feature Request</option>
                <option value="bug">Bug Report</option>
                <option value="other">Other</option>
              </select>
              {fieldErrors.subject && (
                <p className="mt-1 text-sm text-red-500 dark:text-red-400">{fieldErrors.subject}</p>
              )}
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={5}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent bg-white dark:bg-dark-surface text-gray-900 dark:text-white ${
                  fieldErrors.message 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Tell us how we can help you..."
              />
              {fieldErrors.message && (
                <p className="mt-1 text-sm text-red-500 dark:text-red-400">{fieldErrors.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-red text-white font-bold py-3 px-6 rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <span>Send Message</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
