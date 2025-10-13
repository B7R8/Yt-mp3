import React, { useState } from 'react';
import { EnvelopeIcon } from '../components/icons/EnvelopeIcon';
import { ClockIcon } from '../components/icons/ClockIcon';
import { LifebuoyIcon } from '../components/icons/LifebuoyIcon';

const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: { name?: string; email?: string; message?: string } = {};
    
    // Name validation
    if (!name.trim()) {
      newErrors.name = 'Name is required.';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long.';
    }
    
    // Enhanced email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    } else {
      // More strict email validation
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      
      if (!emailRegex.test(email)) {
        newErrors.email = 'Please enter a valid email address.';
      } else {
        // Check for common fake email patterns
        const fakeEmailPatterns = [
          /^test@/i,
          /^fake@/i,
          /^dummy@/i,
          /^example@/i,
          /@test\./i,
          /@fake\./i,
          /@dummy\./i,
          /@example\./i,
          /@localhost/i,
          /@invalid/i,
          /@nonexistent/i,
          /@temp\./i,
          /@temporary\./i
        ];
        
        if (fakeEmailPatterns.some(pattern => pattern.test(email))) {
          newErrors.email = 'Please enter a real email address, not a test or fake email.';
        }
        
        // Check for disposable email domains
        const disposableDomains = [
          '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 'mailinator.com',
          'temp-mail.org', 'throwaway.email', 'getnada.com', 'maildrop.cc'
        ];
        
        const emailDomain = email.split('@')[1]?.toLowerCase();
        if (emailDomain && disposableDomains.includes(emailDomain)) {
          newErrors.email = 'Please use a permanent email address, not a temporary one.';
        }
      }
    }
    
    // Message validation
    if (!message.trim()) {
      newErrors.message = 'Message is required.';
    } else if (message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long.';
    } else if (message.trim().length > 1000) {
      newErrors.message = 'Message must be less than 1000 characters.';
    }
    
    return newErrors;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length === 0) {
      setShowConfirm(true);
    }
  };

  const confirmSend = async () => {
    setShowConfirm(false);
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject,
          message: message.trim()
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSubmitted(true);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
        
        // Reset form
        setName('');
        setEmail('');
        setSubject('General Inquiry');
        setMessage('');
        setErrors({});
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      setShowToast(true);
      // You could add error state handling here
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Contact Us</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Get in touch with the SaveYTB team for support and feedback.</p>
        {submitted && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-900/30 px-3 py-2 text-green-700 dark:text-green-300 text-sm">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.364 7.364a1 1 0 01-1.414 0L3.293 10.5a1 1 0 111.414-1.414l3.05 3.05 6.657-6.657a1 1 0 011.293-.186z" clipRule="evenodd"/></svg>
            Message sent successfully.
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-start">
        {/* Left Column: Info */}
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Get in Touch</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <EnvelopeIcon className="w-6 h-6 text-red-500" />
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <p className="text-gray-600 dark:text-gray-400">support@saveytb.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ClockIcon className="w-6 h-6 text-red-500" />
                <div>
                  <h3 className="font-semibold">Response Time</h3>
                  <p className="text-gray-600 dark:text-gray-400">Within 24 hours</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <LifebuoyIcon className="w-6 h-6 text-red-500" />
                <div>
                  <h3 className="font-semibold">Support</h3>
                  <p className="text-gray-600 dark:text-gray-400">24/7 Technical Support for SaveYTB</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="bg-white dark:bg-gray-800/60 p-6 sm:p-8 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6">Send us a Message</h2>
          <form className="space-y-6" onSubmit={onSubmit} noValidate>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} type="text" name="name" id="name" className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-900/50 border rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-error' : undefined} />
              {errors.name && <p id="name-error" className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input required value={email} onChange={(e) => setEmail(e.target.value)} type="email" name="email" id="email" className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-900/50 border rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} />
              {errors.email && <p id="email-error" className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
              <select required value={subject} onChange={(e) => setSubject(e.target.value)} id="subject" name="subject" className="mt-1 block w-full pl-3 pr-10 py-2 bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm">
                <option>General Inquiry</option>
                <option>Technical Support</option>
                <option>Feedback</option>
              </select>
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
              <textarea required value={message} onChange={(e) => setMessage(e.target.value)} id="message" name="message" rows={4} className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-900/50 border rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm ${errors.message ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} aria-invalid={!!errors.message} aria-describedby={errors.message ? 'message-error' : undefined}></textarea>
              {errors.message && <p id="message-error" className="mt-1 text-xs text-red-600">{errors.message}</p>}
            </div>
            <div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  'Send Message'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowConfirm(false)}></div>
          <div className="relative w-full max-w-sm rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-2">Confirm Submission</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Send message to SaveYTB support with the provided details?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowConfirm(false)} className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
              <button onClick={confirmSend} className="px-3 py-2 text-sm rounded-md text-white bg-red-600 hover:bg-red-700">Confirm & Send</button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="flex items-center gap-2 rounded-lg bg-green-600 text-white shadow-lg px-4 py-3 text-sm">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.364 7.364a1 1 0 01-1.414 0L3.293 10.5a1 1 0 111.414-1.414l3.05 3.05 6.657-6.657a1 1 0 011.293-.186z" clipRule="evenodd"/></svg>
            Message sent successfully.
          </div>
        </div>
      )}
    </div>
  );
};

export default Contact;