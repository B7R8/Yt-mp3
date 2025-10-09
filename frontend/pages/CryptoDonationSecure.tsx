import React, { useState, useEffect } from 'react';
import HeartIcon from '../components/icons/HeartIcon';
import { loadWalletData, WalletData, getWalletAddress } from '../crypto/walletService';
import { loadSecureWalletConfig, getSecureWalletAddress } from '../crypto/secureWalletLoader';
import QRCodeModal from '../crypto/QRCodeModal';

interface CryptoDonationProps {
  navigateTo?: (page: string) => void;
}

const CryptoDonation: React.FC<CryptoDonationProps> = ({ navigateTo }) => {
  const [selectedCrypto, setSelectedCrypto] = useState('bitcoin');
  const [selectedNetwork, setSelectedNetwork] = useState('bitcoin');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [walletData, setWalletData] = useState<WalletData>({});
  const [secureConfig, setSecureConfig] = useState<any>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load wallet data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load secure configuration first
        const config = loadSecureWalletConfig();
        setSecureConfig(config);
        
        // Load wallet data as fallback
        const data = await loadWalletData();
        setWalletData(data);
        
        // Set default network for selected crypto
        if (data[selectedCrypto]) {
          const networks = Object.keys(data[selectedCrypto].networks);
          if (networks.length > 0) {
            setSelectedNetwork(networks[0]);
          }
        }
      } catch (error) {
        console.error('Error loading wallet data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedCrypto]);

  // Get current wallet address
  const getCurrentAddress = (): string => {
    // Try secure config first
    if (secureConfig) {
      const address = getSecureWalletAddress(selectedCrypto, selectedNetwork, secureConfig);
      if (address) return address;
    }
    
    // Fallback to wallet data
    return getWalletAddress(selectedCrypto, selectedNetwork, walletData) || '';
  };

  // Copy address to clipboard
  const copyToClipboard = async (address: string, key: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(key);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  // Get crypto icon
  const getCryptoIcon = (crypto: string) => {
    const icons = {
      bitcoin: (
        <svg enableBackground="new 0 0 226.777 226.777" height="32px" viewBox="0 0 226.777 226.777" width="32px" className="w-8 h-8">
          <g>
            <path d="M135.715,122.244c-2.614-1.31-8.437-3.074-15.368-3.533c-6.934-0.458-15.828,0-15.828,0v30.02c0,0,9.287,0.198,15.503-0.26   c6.21-0.458,12.621-2.027,15.826-3.795c3.203-1.766,7.063-4.513,7.063-11.379C142.911,126.428,138.332,123.552,135.715,122.244z" fill="currentColor"/>
            <path d="M116.16,104.779c5.104-0.197,10.532-1.373,14.453-3.532c3.925-2.158,6.148-5.557,6.02-10.66   c-0.134-5.102-3.532-9.418-9.287-11.186c-5.757-1.766-9.613-1.897-13.998-1.962c-4.382-0.064-8.83,0.328-8.83,0.328v27.012   C104.519,104.779,111.059,104.976,116.16,104.779z" fill="currentColor"/>
            <path d="M113.413,0C50.777,0,0,50.776,0,113.413c0,62.636,50.777,113.413,113.413,113.413s113.411-50.777,113.411-113.413   C226.824,50.776,176.049,0,113.413,0z M159.591,156.777c-8.44,5.887-17.465,6.935-21.455,7.456   c-1.969,0.259-5.342,0.532-8.959,0.744v22.738h-13.998v-22.37c-2.615,0-6.361,0-10.66,0v22.37H90.522v-22.37   c-13.852,0-27.535,0-27.535,0l2.877-16.812c0,0,5.559,0,8.371,0c2.814,0,3.989-0.261,5.166-1.372   c1.177-1.113,1.439-2.812,1.439-4.188c0-1.373,0-54.286,0-57.916c0-3.628-0.295-4.61-1.963-6.473   c-1.668-1.867-5.591-2.112-7.8-2.112c-2.207,0-8.091,0-8.091,0V61.939c0,0,13.246,0,27.535,0V39.505h13.996v22.434   c3.889,0,7.537,0,10.66,0V39.505h13.998v22.703c10.435,0.647,18.203,2.635,24.983,7.645c8.766,6.475,8.306,17.724,8.11,20.406   c-0.195,2.682-1.372,7.85-3.729,11.183c-2.352,3.337-8.108,6.673-8.108,6.673s6.801,1.438,11.578,5.036   c4.771,3.598,8.307,9.941,8.106,19.229C169.923,141.668,168.027,150.891,159.591,156.777z" fill="currentColor"/>
          </g>
        </svg>
      ),
      usdt: (
        <svg enableBackground="new 0 0 226.777 226.777" height="32px" viewBox="0 0 226.777 226.777" width="32px" className="w-8 h-8">
          <g>
            <path d="M127.329,100.328v16.979c-4.464,0.224-9.133,0.347-13.94,0.347c-5.223,0-10.278-0.143-15.087-0.411v-13.556   h-0.003v-3.307c-26.678,1.284-46.427,5.897-46.427,11.392c0,6.491,27.542,11.749,61.518,11.749   c33.974,0,61.518-5.258,61.518-11.749C174.907,106.196,154.587,101.533,127.329,100.328z" fill="currentColor"/>
            <path d="M113.389-0.001C50.767-0.001,0,50.763,0,113.387c0,62.621,50.767,113.39,113.389,113.39   c62.622,0,113.388-50.769,113.388-113.39C226.777,50.763,176.01-0.001,113.389-0.001z M127.327,132.638v50.016H98.298V132.57   c-31.075-1.798-54.321-9.026-54.321-17.674c0-8.646,23.246-15.873,54.321-17.674V83.207H58.779V54.179H166.85v29.028h-39.523   l0.002,13.948c31.654,1.684,55.474,8.989,55.474,17.741C182.802,123.65,158.983,130.956,127.327,132.638z" fill="currentColor"/>
          </g>
        </svg>
      ),
      ethereum: (
        <svg viewBox="0 0 24 24" className="w-8 h-8">
          <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" fill="currentColor"/>
        </svg>
      ),
      bnb: (
        <svg data-name="Layer 1" id="Layer_1" viewBox="0 0 128 128" className="w-8 h-8" style={{ transform: 'translateY(1px)' }}>
          <rect height="18.36" transform="translate(-13.86 94.54) rotate(-45)" width="18.36" x="98.02" y="54.82"/>
          <rect height="18.36" transform="translate(-39.16 33.46) rotate(-45)" width="18.36" x="11.63" y="54.82"/>
          <polygon points="64 94.22 42.48 72.7 29.5 85.68 64 120.18 98.5 85.68 85.52 72.7 64 94.22"/>
          <polygon points="64 33.78 85.52 55.3 98.5 42.32 64 7.82 29.5 42.32 42.48 55.3 64 33.78"/>
          <rect height="18.13" transform="translate(-26.51 64) rotate(-45)" width="18.13" x="54.93" y="54.93"/>
        </svg>
      ),
      solana: (
        <svg data-name="Layer 1" id="Layer_1" viewBox="0 0 128 128" className="w-8 h-8">
          <polygon points="93.94 42.63 13.78 42.63 34.06 22.41 114.22 22.41 93.94 42.63"/>
          <polyline points="93.94 105.59 13.78 105.59 34.06 85.38 114.22 85.38"/>
          <polyline points="34.06 74.11 114.22 74.11 93.94 53.89 13.78 53.89"/>
        </svg>
      )
    };
    
    return icons[crypto as keyof typeof icons] || icons.bitcoin;
  };

  // Get crypto colors
  const getCryptoColors = (crypto: string) => {
    const colors = {
      bitcoin: 'from-orange-500 to-orange-600',
      usdt: 'from-green-500 to-green-600',
      ethereum: 'from-blue-500 to-blue-600',
      bnb: 'from-yellow-500 to-yellow-600',
      solana: 'from-purple-500 to-purple-600'
    };
    
    return colors[crypto as keyof typeof colors] || 'from-orange-500 to-orange-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#1a1a1a] py-2">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading wallet data...</p>
        </div>
      </div>
    );
  }

  const currentAddress = getCurrentAddress();
  const currentWallet = walletData[selectedCrypto];
  const currentNetwork = currentWallet?.networks[selectedNetwork];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a1a] py-2">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Cryptocurrency Donations
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400">
            Support us with your favorite cryptocurrency
          </p>
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigateTo?.('support-us')}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Support Options
          </button>
        </div>

        {/* Crypto Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Cryptocurrency</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.keys(walletData).map((key) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedCrypto(key);
                  const networks = Object.keys(walletData[key].networks);
                  if (networks.length > 0) {
                    setSelectedNetwork(networks[0]);
                  }
                }}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedCrypto === key
                    ? key === 'bitcoin' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' :
                      key === 'usdt' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                      key === 'ethereum' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' :
                      key === 'bnb' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                      key === 'solana' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' :
                      'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : key === 'bitcoin' ? 'border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600' :
                      key === 'usdt' ? 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600' :
                      key === 'ethereum' ? 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600' :
                      key === 'bnb' ? 'border-gray-200 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-600' :
                      key === 'solana' ? 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600' :
                      'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r ${getCryptoColors(key)} flex items-center justify-center text-white ${key === 'bnb' ? 'items-center justify-center' : ''}`}>
                  {getCryptoIcon(key)}
                </div>
                <p className={`text-sm font-medium text-gray-900 dark:text-white ${key === 'bnb' ? 'leading-tight' : ''}`}>
                  {walletData[key]?.name || key}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Network Selection */}
        {currentWallet && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Network</h2>
            <div className="flex flex-wrap gap-3">
              {Object.keys(currentWallet.networks).map((networkKey) => (
                <button
                  key={networkKey}
                  onClick={() => setSelectedNetwork(networkKey)}
                  className={`px-3 py-2 rounded-lg border-2 transition-all duration-200 text-sm ${
                    selectedNetwork === networkKey
                      ? selectedCrypto === 'bitcoin' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' :
                        selectedCrypto === 'usdt' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
                        selectedCrypto === 'ethereum' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' :
                        selectedCrypto === 'bnb' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' :
                        selectedCrypto === 'solana' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' :
                        'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                      : selectedCrypto === 'bitcoin' ? 'border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 text-gray-700 dark:text-gray-300' :
                        selectedCrypto === 'usdt' ? 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 text-gray-700 dark:text-gray-300' :
                        selectedCrypto === 'ethereum' ? 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 text-gray-700 dark:text-gray-300' :
                        selectedCrypto === 'bnb' ? 'border-gray-200 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-600 text-gray-700 dark:text-gray-300' :
                        selectedCrypto === 'solana' ? 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 text-gray-700 dark:text-gray-300' :
                        'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {currentWallet.networks[networkKey].name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Wallet Address */}
        {currentAddress && currentNetwork && (
          <div className="bg-white dark:bg-[#2d2d2d] rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentNetwork.symbol} Wallet Address
              </h3>
              <button
                onClick={() => setIsQRModalOpen(true)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </button>
            </div>
            
            <div className="bg-gray-50 dark:bg-[#3a3a3a] rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-900 dark:text-white break-all font-mono">
                {currentAddress}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => copyToClipboard(currentAddress, `${selectedCrypto}-${selectedNetwork}`)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  copiedAddress === `${selectedCrypto}-${selectedNetwork}`
                    ? 'bg-green-500 text-white'
                    : selectedCrypto === 'bitcoin' ? 'bg-orange-500 hover:bg-orange-600 text-white' :
                      selectedCrypto === 'usdt' ? 'bg-green-500 hover:bg-green-600 text-white' :
                      selectedCrypto === 'ethereum' ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                      selectedCrypto === 'bnb' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' :
                      selectedCrypto === 'solana' ? 'bg-purple-500 hover:bg-purple-600 text-white' :
                      'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                {copiedAddress === `${selectedCrypto}-${selectedNetwork}` ? (
                  <>
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Address
                  </>
                )}
              </button>
              
              <button
                onClick={() => setIsQRModalOpen(true)}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Show QR Code
              </button>
            </div>
          </div>
        )}

        {/* Binance User ID */}
        <div className="mt-8 bg-white dark:bg-[#2d2d2d] rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Binance User ID
          </h3>
          <div className="bg-gray-50 dark:bg-[#3a3a3a] rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-900 dark:text-white font-mono">
              {secureConfig?.binance?.userId || '123456789'}
            </p>
          </div>
          <button
            onClick={() => copyToClipboard(secureConfig?.binance?.userId || '123456789', 'binance')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              copiedAddress === 'binance'
                ? 'bg-green-500 text-white'
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}
          >
            {copiedAddress === 'binance' ? (
              <>
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy User ID
              </>
            )}
          </button>
        </div>

        {/* Thank You Message */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <HeartIcon className="w-5 h-5 text-red-500" />
            <span className="text-sm">Thank you for your support!</span>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {isQRModalOpen && currentAddress && currentNetwork && (
        <QRCodeModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          crypto={selectedCrypto}
          network={selectedNetwork}
          walletData={walletData}
          address={currentAddress}
          symbol={currentNetwork.symbol}
        />
      )}
    </div>
  );
};

export default CryptoDonation;
