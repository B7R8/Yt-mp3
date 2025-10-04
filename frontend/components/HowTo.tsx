
import React from 'react';
import { Link } from 'react-router-dom';

const HowTo: React.FC = () => {
  const steps = [
    { title: "Find YouTube video", description: "Go to YouTube, open the video you want to convert, and copy the URL from the address bar. On mobile? Tap \"Share\" on the video and then hit \"Copy Link.\" It works for YouTube Shorts too." },
    { title: "Paste the link here", description: "Come back to this page and paste the link into the box at the top. Just make sure the link is a valid youtube video URL, it should not be a live stream, age-restricted video, or a clip." },
    { title: "Hit convert", description: "Click the convert button and let the magic happen. The conversion will start automatically." },
    { title: "Wait a few seconds", description: "Most videos convert in under 30 seconds. Even an hour-long video usually takes less than a minute. You'll see the video title appear once it's ready." },
    { title: "Download your MP3", description: "Once the conversion is done, a \"Download MP3\" button will appear. Click on it and your MP3 will start downloading to your device." },
    { title: "Convert another video (Optional)", description: "Want to convert another video? Just click \"Convert Next\" and start the process again with a new URL." },
  ];

  return (
    <section>
      <div className="text-center mb-8 md:mb-10">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 text-gray-900 dark:text-white">YouTube to MP3</h1>
        <p className="max-w-3xl mx-auto text-gray-600 dark:text-dark-text-secondary text-sm md:text-base px-4">
          Convert any YouTube video to MP3 in a few seconds with our YouTube to MP3 Converter. <strong>AudioFlow</strong> is the safest platform to download MP3s as it doesn't contain any third-party scripts or pop-up ads. Yes, it's completely ad-free and runs on donations from our users. Our converter provides high-quality audio conversion and works on any device, no software installation needed.
        </p>
      </div>

      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">How to Convert YouTube to MP3</h2>
      </div>
      
      <div className="space-y-6 md:space-y-8 max-w-3xl mx-auto">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start space-x-3 md:space-x-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 flex items-center justify-center font-bold text-sm">
              {index + 1}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-base md:text-lg text-gray-800 dark:text-dark-text mb-2">{step.title}</h4>
              <p className="text-gray-600 dark:text-dark-text-secondary text-sm md:text-base leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center mt-8 md:mt-12 text-gray-600 dark:text-gray-400 text-sm md:text-base px-4">
        By using AudioFlow, you agree to our <Link to="/terms" className="text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 font-bold underline underline-offset-2">terms of use</Link> and <Link to="/privacy" className="text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 font-bold underline underline-offset-2">privacy policy</Link>.
      </p>
    </section>
  );
};

export default HowTo;
