import React from 'react';
import AccordionItem from '../components/AccordionItem';

const faqData = [
    {
        question: 'Is YTConv Safe?',
        answer: 'Absolutely. We prioritize your security. YTConv is free of ads, pop-ups, and malicious scripts. We don\'t ask for any personal information, and the entire conversion process is automated and secure.'
    },
    {
        question: 'How are server costs managed?',
        answer: 'YTConv runs entirely on donations from our amazing users. These contributions cover all our expenses, from server hosting to ongoing development, allowing us to keep the service free and ad-free for everyone.'
    },
    {
        question: 'How can I support YTConv?',
        answer: 'If you want to keep YTConv alive and ad-free, you can support us by using the "Buy me a coffee" or "Donate via crypto" links on the homepage. Your donations are greatly appreciated and directly support the service.'
    },
    {
        question: 'How do I choose the output audio quality?',
        answer: 'In the URL input field, click the "128K" label right next to the scissors icon. This will open the "Select Quality" box. Here, you can select the quality from 64kbps to 320kbps. If you want a smaller file, choose 64kbps, but if you want better quality, go for 320kbps. The recommended default quality is 128kbps.'
    },
    {
        question: 'Can I save my audio quality preference?',
        answer: 'Yes, just tick the box that says "Always use this quality" under the quality options. Your browser will remember this setting for future conversions, so you don\'t have to set it every time.'
    },
    {
        question: 'Can I trim the audio?',
        answer: 'Definitely. Click the scissors icon next to the URL box to open the "Trim Audio" tool. Enable the trim feature and enter your desired start and end times. Save the changes, hit convert, and your MP3 will be generated with the selected section.'
    },
    {
        question: 'Is there a limit on the number of files I can convert per day?',
        answer: 'Nope — you’re free to convert as many videos as you want each day. We believe in providing an unrestricted service to our users.'
    },
    {
        question: 'Is there a maximum video length?',
        answer: 'You can convert videos up to 12 hours long. YTConv is one of the only services that allows you to convert videos this long, making it perfect for podcasts, DJ sets, and long-form content.'
    },
    {
        question: 'What does the error “Something went wrong. Please check the video URL and try again” mean?',
        answer: 'This usually means the video link is broken, the video is no longer available, or it might be private or region-locked. Please double-check the link in your browser to confirm it works, then copy the URL directly from the address bar and try again. If the error still shows up, the video may not be convertible at this time.'
    },
    {
        question: 'Still have a question?',
        answer: 'Feel free to get in touch via our Contact page. We’ll try our best to respond within 24 hours.'
    }
];

const FAQs: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Frequently Asked Questions</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">Find answers to common questions about our service.</p>
      </div>
      <div className="space-y-4">
        {faqData.map((faq, index) => (
          <AccordionItem key={index} question={faq.question} answer={faq.answer} />
        ))}
      </div>
    </div>
  );
};

export default FAQs;