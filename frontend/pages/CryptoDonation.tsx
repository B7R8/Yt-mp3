import React, { useState } from 'react';

const CryptoDonation: React.FC = () => {
  const [expandedCrypto, setExpandedCrypto] = useState<string>('USDT');
  const [selectedNetworks, setSelectedNetworks] = useState<{[key: string]: string}>({
    USDT: 'TRX',
    BTC: 'BTC',
    ETH: 'ETH',
    BNB: 'BSC',
    SOL: 'SOL'
  });

  const cryptoOptions = {
    USDT: {
      name: 'USDT (TetherUS)',
      networks: {
        TRX: {
          name: 'Tron (TRC20)',
          address: 'TUkiKbtAxMdNMPKHmhcNPMFcbn5N9KUHRK',
          qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPgogIDxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjE4MCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMwMDAiLz4KICA8dGV4dCB4PSIxMDAiIHk9IjEwMCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZiI+VU5ERVJfQ09OU1RSVUNUSU9OPC90ZXh0Pgo8L3N2Zz4K'
        },
        BSC: {
          name: 'BSC (BEP20)',
          address: '0x1234567890abcdef1234567890abcdef12345678',
          qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPgogIDxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjE4MCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMwMDAiLz4KICA8dGV4dCB4PSIxMDAiIHk9IjEwMCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZiI+QlNDX1FSPC90ZXh0Pgo8L3N2Zz4K'
        },
        ETH: {
          name: 'Ethereum (ERC20)',
          address: '0xabcdef1234567890abcdef1234567890abcdef12',
          qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPgogIDxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjE4MCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMwMDAiLz4KICA8dGV4dCB4PSIxMDAiIHk9IjEwMCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZiI+RVRIX1FSPC90ZXh0Pgo8L3N2Zz4K'
        }
      }
    },
    BTC: {
      name: 'BTC (Bitcoin)',
      networks: {
        BTC: {
          name: 'BTC (Bitcoin)',
          address: '14b39TnKBnpE6AoSJWcmD1X1FVSFn3t8M7',
          qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPgogIDxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjE4MCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMwMDAiLz4KICA8dGV4dCB4PSIxMDAiIHk9IjEwMCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZiI+QlRDX1FSPC90ZXh0Pgo8L3N2Zz4K'
        },
        BSC: {
          name: 'BSC (BEP20)',
          address: '0x1234567890abcdef1234567890abcdef12345678',
          qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPgogIDxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjE4MCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMwMDAiLz4KICA8dGV4dCB4PSIxMDAiIHk9IjEwMCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZiI+QlNDX1FSPC90ZXh0Pgo8L3N2Zz4K'
        },
        ETH: {
          name: 'Ethereum (ERC20)',
          address: '0xabcdef1234567890abcdef1234567890abcdef12',
          qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPgogIDxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjE4MCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMwMDAiLz4KICA8dGV4dCB4PSIxMDAiIHk9IjEwMCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZiI+RVRIX1FSPC90ZXh0Pgo8L3N2Zz4K'
        }
      }
    },
    ETH: {
      name: 'ETH (Ethereum)',
      networks: {
        ETH: {
          name: 'Ethereum (ERC20)',
          address: '0x7ddfee23bb55ad37730531bfc0304085b80355b2',
          qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPgogIDxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjE4MCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMwMDAiLz4KICA8dGV4dCB4PSIxMDAiIHk9IjEwMCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZiI+RVRIX1FSPC90ZXh0Pgo8L3N2Zz4K'
        },
        BSC: {
          name: 'BSC (BEP20)',
          address: '0x1234567890abcdef1234567890abcdef12345678',
          qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPgogIDxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjE4MCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMwMDAiLz4KICA8dGV4dCB4PSIxMDAiIHk9IjEwMCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZiI+QlNDX1FSPC90ZXh0Pgo8L3N2Zz4K'
        }
      }
    },
    BNB: {
      name: 'BNB (Binance Coin)',
      networks: {
        BSC: {
          name: 'BNB Smart Chain (BEP20)',
          address: '0x7ddfee23bb55ad37730531bfc0304085b80355b2',
          qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPgogIDxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjE4MCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMwMDAiLz4KICA8dGV4dCB4PSIxMDAiIHk9IjEwMCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZiI+Qk5CX1FSPC90ZXh0Pgo8L3N2Zz4K'
        },
        ETH: {
          name: 'Ethereum (ERC20)',
          address: '0xabcdef1234567890abcdef1234567890abcdef12',
          qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPgogIDxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjE4MCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMwMDAiLz4KICA8dGV4dCB4PSIxMDAiIHk9IjEwMCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZiI+RVRIX1FSPC90ZXh0Pgo8L3N2Zz4K'
        }
      }
    },
    SOL: {
      name: 'SOL (Solana)',
      networks: {
        SOL: {
          name: 'SOL (Solana)',
          address: '2fQRDwvt4KHYePPwrLFg7D1G8rEtJRDEEDganpF',
          qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPgogIDxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjE4MCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMwMDAiLz4KICA8dGV4dCB4PSIxMDAiIHk9IjEwMCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZiI+U09MX1FSPC90ZXh0Pgo8L3N2Zz4K'
        },
        BSC: {
          name: 'BSC (BEP20)',
          address: '0x1234567890abcdef1234567890abcdef12345678',
          qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPgogIDxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjE4MCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMwMDAiLz4KICA8dGV4dCB4PSIxMDAiIHk9IjEwMCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZiI+QlNDX1FSPC90ZXh0Pgo8L3N2Zz4K'
        }
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const toggleCrypto = (crypto: string) => {
    setExpandedCrypto(expandedCrypto === crypto ? '' : crypto);
  };

  const setSelectedNetwork = (crypto: string, network: string) => {
    setSelectedNetworks(prev => ({
      ...prev,
      [crypto]: network
    }));
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
          Donate with Crypto
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          Help keep this website ad-free for everyone by donating a few coins. Your support goes directly toward covering server costs and other ongoing expenses.
        </p>
        <div className="text-gray-900 dark:text-white font-semibold">
          Binance User ID: 40020724
        </div>
      </div>

      <div className="space-y-4">
        {/* USDT Section */}
        <div className="bg-white dark:bg-gray-800/60 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toggleCrypto('USDT')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <span className="font-medium text-gray-900 dark:text-white">USDT (TetherUS)</span>
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform ${expandedCrypto === 'USDT' ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedCrypto === 'USDT' && (
            <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
              <div className="pt-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 text-center">Select Network</h3>
                <div className="flex gap-2 mb-4 justify-center">
                  {Object.keys(cryptoOptions.USDT.networks).map((network) => (
                    <button
                      key={network}
                      onClick={() => setSelectedNetwork('USDT', network)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        selectedNetworks.USDT === network
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {network}
                    </button>
                  ))}
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
                  {cryptoOptions.USDT.networks[selectedNetworks.USDT as keyof typeof cryptoOptions.USDT.networks].name}
                </div>
                
                <div className="text-center mb-4">
                  <img 
                    src={cryptoOptions.USDT.networks[selectedNetworks.USDT as keyof typeof cryptoOptions.USDT.networks].qrCode}
                    alt="QR Code"
                    className="w-48 h-48 mx-auto border border-gray-200 dark:border-gray-600 rounded-lg"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={cryptoOptions.USDT.networks[selectedNetworks.USDT as keyof typeof cryptoOptions.USDT.networks].address}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={() => copyToClipboard(cryptoOptions.USDT.networks[selectedNetworks.USDT as keyof typeof cryptoOptions.USDT.networks].address)}
                    className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Other Crypto Options */}
        {Object.entries(cryptoOptions).filter(([key]) => key !== 'USDT').map(([key, crypto]) => (
          <div key={key} className="bg-white dark:bg-gray-800/60 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleCrypto(key)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <span className="font-medium text-gray-900 dark:text-white">{crypto.name}</span>
              <svg 
                className={`w-5 h-5 text-gray-500 transition-transform ${expandedCrypto === key ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {expandedCrypto === key && (
              <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                <div className="pt-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 text-center">Select Network</h3>
                  <div className="flex gap-2 mb-4 justify-center">
                    {Object.keys(crypto.networks).map((network) => (
                      <button
                        key={network}
                        onClick={() => setSelectedNetwork(key, network)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          selectedNetworks[key] === network
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {network}
                      </button>
                    ))}
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
                    {crypto.networks[selectedNetworks[key] as keyof typeof crypto.networks].name}
                  </div>
                  
                  <div className="text-center mb-4">
                    <img 
                      src={crypto.networks[selectedNetworks[key] as keyof typeof crypto.networks].qrCode}
                      alt="QR Code"
                      className="w-48 h-48 mx-auto border border-gray-200 dark:border-gray-600 rounded-lg"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={crypto.networks[selectedNetworks[key] as keyof typeof crypto.networks].address}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={() => copyToClipboard(crypto.networks[selectedNetworks[key] as keyof typeof crypto.networks].address)}
                      className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CryptoDonation;
