
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles.css';
import { useTheme } from './contexts/ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ThemeToggle from './components/ThemeToggle';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import Changelog from './pages/Changelog';
import TermsOfUse from './pages/TermsOfUse';
import PrivacyPolicy from './pages/PrivacyPolicy';

const App: React.FC = () => {
  const { theme } = useTheme();

  return (
    <ErrorBoundary>
      <Router>
        <div className={`${theme} transition-colors duration-300`}>
          <div className="bg-white dark:bg-dark-bg min-h-screen text-gray-800 dark:text-dark-text font-sans">
            <Header />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/changelog" element={<Changelog />} />
              <Route path="/terms" element={<TermsOfUse />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
            </Routes>
            <Footer />
            <ThemeToggle />
            <ScrollToTop />
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme={theme === 'dark' ? 'dark' : 'light'}
              toastClassName="custom-toast"
              bodyClassName="custom-toast-body"
            />
          </div>
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
