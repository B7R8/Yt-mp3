
import React from 'react';
import { Page } from '../App';

interface HowToProps {
  navigateTo: (page: Page) => void;
}

const HowToSection: React.FC<HowToProps> = ({ navigateTo }) => {
  return (
    <section id="how-to" className="py-8 sm:py-12 md:py-16 text-gray-700 dark:text-gray-300">
      <div className="max-w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto space-y-4 sm:space-y-6 md:space-y-8 px-2 sm:px-3 md:px-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">YouTube to MP3</h2>
          <p className="text-sm sm:text-base md:text-lg leading-relaxed">
            Convert any YouTube video to MP3 in a few seconds with our YouTube to MP3 Converter. YTConv is the safest platform to download MP3s as it doesn't contain any third-party scripts or pop-up ads. Yes, it's completely ad-free and runs on donations from our users. Our converter lets you trim the audio, and you can choose an audio quality from 64 kbps to 320 kbps. It works on any device, no software installation needed.
          </p>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-6 sm:mb-8">How to Convert YouTube to MP3</h2>
          <ol className="list-decimal list-inside space-y-4 sm:space-y-6 text-sm sm:text-base md:text-lg">
            <li>
              <strong className="font-semibold text-gray-800 dark:text-gray-200">Find YouTube video:</strong> Go to YouTube, open the video you want to convert, and copy the URL from the address bar. On mobile? Tap "Share" on the video and then hit "Copy Link." It works for YouTube Shorts too.
            </li>
            <li>
              <strong className="font-semibold text-gray-800 dark:text-gray-200">Paste the link here:</strong> Come back to this page and paste the link into the box at the top. Just make sure the link is a valid youtube video URL, it should not be a live stream, age-restricted video, or a clip.
            </li>
            <li>
              <strong className="font-semibold text-gray-800 dark:text-gray-200">Trim Audio (Optional):</strong> If you need to cut a portion of the audio from the beginning, the end, or both then you can use the trim feature. Just click the scissors icon right next to the URL field, adjust the start and end time, and click the Save button.
            </li>
            <li>
              <strong className="font-semibold text-gray-800 dark:text-gray-200">Choose the audio quality:</strong> Right next to the scissors icon, you'll see the option to choose your audio quality. Want a small file? Go for 64kbps. Prefer top quality? Select 320kbps. While downloading from YouTube 128kbps is recommended.
            </li>
            <li>
              <strong className="font-semibold text-gray-800 dark:text-gray-200">Hit convert:</strong> Click the convert button and let the magic happen.
            </li>
            <li>
              <strong className="font-semibold text-gray-800 dark:text-gray-200">Wait a few seconds:</strong> Most videos convert in under 30 seconds. Even an hour-long video usually takes less than a minute.
            </li>
            <li>
              <strong className="font-semibold text-gray-800 dark:text-gray-200">Download your MP3:</strong> Once the conversion is done, a "Download MP3" button will appear. Click on it and your MP3 will start downloading.
            </li>
            <li>
              <strong className="font-semibold text-gray-800 dark:text-gray-200">Support us:</strong> This site runs ad-free and is supported by user donations. If you like our service, please consider supporting us by clicking one of the buttons on the main page.
            </li>
            <li>
              <strong className="font-semibold text-gray-800 dark:text-gray-200">Convert another video (Optional):</strong> Want to convert another video? Just click "Convert Next" and start again.
            </li>
          </ol>
        </div>
        <p className="text-center text-md text-gray-600 dark:text-gray-400 pt-4">
          By using YTConv, you agree to our <button onClick={() => navigateTo('terms')} className="text-brand-500 hover:underline">terms of use</button>.
        </p>
      </div>
    </section>
  );
};

export default HowToSection;