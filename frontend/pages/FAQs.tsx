import React from 'react';
import AccordionItem from '../components/AccordionItem';
import { Page } from '../App';

interface FAQsProps {
  navigateTo: (page: Page) => void;
}

const faqData = [
    {
        question: 'What is SaveYTB YouTube to MP3 converter?',
        answer: 'SaveYTB is a completely free and ad-free YouTube to MP3 converter that allows you to convert YouTube videos to MP3 audio files instantly. Our YouTube to MP3 downloader features auto-download, audio trimming, quality selection, and works on any device without software installation - all completely free!'
    },
    {
        question: 'How to convert YouTube to MP3 with SaveYTB?',
        answer: 'To convert YouTube to MP3 with SaveYTB, simply paste the YouTube video URL into our converter, select your preferred audio quality (64K to 320K), enable auto-download if desired, and click convert. Our YouTube to MP3 converter will process the video and provide you with a downloadable MP3 file in seconds.'
    },
    {
        question: 'Is SaveYTB completely ad-free?',
        answer: 'Yes! SaveYTB is completely ad-free with no annoying pop-ups, third-party scripts, or intrusive advertisements. We prioritize your experience and keep our YouTube to MP3 converter clean and fast.'
    },
    {
        question: 'What features does SaveYTB offer?',
        answer: 'SaveYTB offers advanced features including auto-download, audio trimming, quality selection (64kbps to 320kbps), quality preference saving, and works on any device. Our YouTube to MP3 converter is completely free with no registration required.'
    },
    {
        question: 'How are server costs managed for SaveYTB?',
        answer: 'SaveYTB runs entirely on donations from our amazing users. These contributions cover all our expenses, from server hosting to ongoing development, allowing us to keep the YouTube to MP3 converter service completely free and ad-free for everyone.'
    },
    {
        question: 'How can I support SaveYTB?',
        answer: 'If you want to keep SaveYTB alive and ad-free, you can support us by using the "Buy me a coffee" or "Donate via crypto" links on the homepage. Your donations are greatly appreciated and directly support our free YouTube to MP3 converter service.'
    },
    {
        question: 'How do I choose the output audio quality?',
        answer: 'In the URL input field, click the "128K" label right next to the scissors icon. This will open the "Select Quality" box. Here, you can select the quality from 64kbps to 320kbps. If you want a smaller file, choose 64kbps, but if you want better quality, go for 320kbps. The recommended default quality is 128kbps.'
    },
    {
        question: 'Can I save my audio quality preference in SaveYTB?',
        answer: 'Yes! SaveYTB allows you to save your quality preference. Just tick the box that says "Always use this quality" under the quality options. Your browser will remember this setting for future conversions, so you don\'t have to set it every time.'
    },
    {
        question: 'Can I trim the audio with SaveYTB?',
        answer: 'Definitely! SaveYTB includes an advanced audio trimming feature. Click the scissors icon next to the URL box to open the "Trim Audio" tool. Enable the trim feature and enter your desired start and end times. Save the changes, hit convert, and your MP3 will be generated with the selected section.'
    },
    {
        question: 'Does SaveYTB have auto-download feature?',
        answer: 'Yes! SaveYTB includes an auto-download feature. Simply toggle the auto-download option before converting, and your MP3 will download automatically when the conversion is complete. No need to manually click download!'
    },
    {
        question: 'Is there a limit on the number of files I can convert per day with SaveYTB?',
        answer: 'Nope — you are free to convert as many videos as you want each day with SaveYTB. We believe in providing an unrestricted YouTube to MP3 converter service to our users.'
    },
    {
        question: 'Is there a maximum video length for SaveYTB?',
        answer: 'You can convert videos up to 12 hours long with SaveYTB. Our YouTube to MP3 converter is one of the only services that allows you to convert videos this long, making it perfect for podcasts, DJ sets, and long-form content.'
    },
    {
        question: 'What does the error “Something went wrong. Please check the video URL and try again” mean?',
        answer: 'This usually means the video link is broken, the video is no longer available, or it might be private or region-locked. Please double-check the link in your browser to confirm it works, then copy the URL directly from the address bar and try again. If the error still shows up, the video may not be convertible at this time.'
    },
    {
        question: 'Still have a question about SaveYTB?',
        answer: 'Feel free to get in touch via our Contact page. We will try our best to respond within 24 hours about our YouTube to MP3 converter service.'
    }
];

const FAQs: React.FC<FAQsProps> = ({ navigateTo }) => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Frequently Asked Questions</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Find answers to common questions about SaveYTB - your trusted YouTube to MP3 converter service.</p>
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