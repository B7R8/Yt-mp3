import React from 'react';
import Converter from '../components/Converter';
import HowToSection from '../components/HowToSection';
import SupportLinks from '../components/SupportLinks';
import { Page } from '../App';

interface HomeProps {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  navigateTo: (page: Page) => void;
}

const Home: React.FC<HomeProps> = ({ showToast, navigateTo }) => {
  return (
    <>
      <section id="hero" className="hero">
        <h1 className="hero-title">
          YouTube to MP3
        </h1>
        <p className="hero-description">
          Free YouTube to MP3 converter - Download high-quality MP3 audio from YouTube videos instantly. Convert YouTube to MP3, YouTube video to MP3, YT to MP3 with our fast and reliable YouTube to MP3 downloader. Download YouTube MP3, YT MP3 files without registration. Best YouTube to MP3 converter for all your audio needs.
        </p>
        <Converter showToast={showToast} />
      </section>
      
      <section className="support-section">
        <SupportLinks navigateTo={navigateTo} />
      </section>
      
      <section className="reddit-section">
        <div className="reddit-content">
          <p className="reddit-text">Got questions? Join our subreddit!</p>
          <a href="https://reddit.com/r/saveytb" target="_blank" rel="noopener noreferrer" className="reddit-link" aria-label="Join SaveYTB Reddit community r/SaveYTB" title="Join SaveYTB Reddit community r/SaveYTB">
            r/SaveYTB
          </a>
        </div>
      </section>
      
      <div className="divider">
        <div className="divider-content">
          <div className="divider-line"></div>
          <div className="divider-dots">
            <div className="dot dot-blue"></div>
            <div className="dot dot-purple"></div>
            <div className="dot dot-pink"></div>
          </div>
          <div className="divider-line"></div>
        </div>
      </div>

      {/* Feature Icons - Creative Glass Tiles */}
      <div className="features-grid">
        <div className="feature-item">
          <div className="feature-icon feature-icon-secure">
            <div className="feature-icon-inner">
              <div className="feature-icon-core">
                <svg className="feature-svg" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
              </div>
            </div>
          </div>
          <h2 className="feature-title">Secure</h2>
          <p className="feature-description">Safe & Private</p>
        </div>

        <div className="feature-item">
          <div className="feature-icon feature-icon-fast">
            <div className="feature-icon-inner">
              <div className="feature-icon-core">
                <svg className="feature-svg" fill="currentColor" viewBox="0 0 24 24"><path d="M13.5 2c-5.621 0-10.211 4.443-10.475 10h3.02c.264-3.312 3.002-6 6.455-6 3.453 0 6.191 2.688 6.455 6h3.02c-.264-5.557-4.854-10-10.475-10zm0 2c4.411 0 8 3.589 8 8s-3.589 8-8 8-8-3.589-8-8 3.589-8 8-8z"/></svg>
              </div>
            </div>
          </div>
          <h2 className="feature-title">Fast</h2>
          <p className="feature-description">Quick Processing</p>
        </div>

        <div className="feature-item">
          <div className="feature-icon feature-icon-free">
            <div className="feature-icon-inner">
              <div className="feature-icon-core">
                <svg className="feature-svg" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              </div>
            </div>
          </div>
          <h2 className="feature-title">Free</h2>
          <p className="feature-description">No Cost</p>
        </div>

        <div className="feature-item">
          <div className="feature-icon feature-icon-quality">
            <div className="feature-icon-inner">
              <div className="feature-icon-core">
                <svg className="feature-svg" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
            </div>
          </div>
          <h2 className="feature-title">Quality</h2>
          <p className="feature-description">High Audio</p>
        </div>
      </div>


      <HowToSection navigateTo={navigateTo} />
      
      {/* SEO Content Section */}
      <section className="seo-section">
        <div className="seo-content">
          <div className="seo-text">
            <h2 className="seo-title">Why Choose Our YouTube to MP3 Converter?</h2>
            <div className="seo-grid">
              <div className="seo-item">
                <h3 className="seo-subtitle">Best YouTube to MP3 Downloader</h3>
                <p className="seo-description">
                  Our YouTube to MP3 converter is the fastest and most reliable way to convert YouTube videos to MP3 format. 
                  Download YouTube MP3 files instantly with our advanced YouTube to MP3 downloader. Perfect for YouTube video to MP3 conversion.
                </p>
              </div>
              <div className="seo-item">
                <h3 className="seo-subtitle">Convert YouTube to MP3 Free</h3>
                <p className="seo-description">
                  Convert YouTube to MP3 completely free with no hidden costs. Our YT to MP3 converter supports 
                  all YouTube videos including YouTube Shorts and long-form content. Best free YouTube to MP3 converter available.
                </p>
              </div>
              <div className="seo-item">
                <h3 className="seo-subtitle">YouTube Video to MP3</h3>
                <p className="seo-description">
                  Transform any YouTube video to MP3 with high-quality audio extraction. Our YouTube MP3 downloader 
                  preserves audio quality while reducing file size for easy storage. Download YouTube MP3 files instantly.
                </p>
              </div>
              <div className="seo-item">
                <h3 className="seo-subtitle">YT MP3 Converter</h3>
                <p className="seo-description">
                  The best YT MP3 converter for all your audio needs. Download YT MP3 files quickly and securely 
                  with our user-friendly YouTube to MP3 converter interface. Convert YouTube to MP3 with ease.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Terms of Use Section */}
      <section className="terms-section">
        <div className="terms-content">
          <p className="terms-text">
            By using SaveYTB, you agree to our <button onClick={() => navigateTo('terms')} className="terms-link">terms of use</button>.
          </p>
        </div>
      </section>
    </>
  );
};

export default Home;
