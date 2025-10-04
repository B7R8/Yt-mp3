import React from 'react';

const FAQ: React.FC = () => {
  const faqs = [
    {
      question: "How do I convert a YouTube video to MP3?",
      answer: "Simply paste the YouTube URL into the input field, select your preferred audio quality, and click the Convert button. The conversion will start automatically and you'll be able to download the MP3 file once it's complete."
    },
    {
      question: "What audio qualities are available?",
      answer: "We support multiple audio quality options: 64k, 128k, 192k, 256k, and 320k. Higher quality means larger file sizes but better audio quality."
    },
    {
      question: "Can I trim the audio before downloading?",
      answer: "Yes! Click the scissors icon next to the convert button to set start and end times for your audio clip. This is perfect for extracting specific parts of a video."
    },
    {
      question: "Is there a file size limit?",
      answer: "There's no strict file size limit, but very long videos may take longer to process. We recommend videos under 2 hours for the best experience."
    },
    {
      question: "How long does conversion take?",
      answer: "Conversion time depends on the video length and quality selected. Most videos convert within 1-3 minutes. You'll see a progress indicator during the process."
    },
    {
      question: "Are my downloads stored permanently?",
      answer: "No, for privacy reasons, all converted files are automatically deleted after 1 hour. Make sure to download your files promptly after conversion."
    },
    {
      question: "Is this service free?",
      answer: "Yes, AudioFlow is completely free to use. We don't require registration or payment for basic conversion features."
    },
    {
      question: "What video formats are supported?",
      answer: "We support all YouTube video formats including regular videos, Shorts, and live streams. The output is always in MP3 format."
    },
    {
      question: "Can I convert private or unlisted videos?",
      answer: "No, you can only convert public YouTube videos. Private, unlisted, or age-restricted videos cannot be processed."
    },
    {
      question: "Is it legal to convert YouTube videos?",
      answer: "Converting videos for personal use is generally acceptable. However, please respect copyright laws and YouTube's Terms of Service. Don't redistribute copyrighted content without permission."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-gray-600 dark:text-dark-text-secondary">
          Find answers to common questions about AudioFlow
        </p>
      </div>

      <div className="space-y-6">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-white dark:bg-dark-card rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              {faq.question}
            </h3>
            <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-600 dark:text-dark-text-secondary mb-4">
          Still have questions?
        </p>
        <a 
          href="/contact" 
          className="inline-block bg-brand-red text-white font-bold py-3 px-6 rounded-lg hover:bg-red-600 transition-colors"
        >
          Contact Us
        </a>
      </div>
    </div>
  );
};

export default FAQ;
