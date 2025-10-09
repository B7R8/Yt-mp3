import React, { useState, useEffect } from 'react';
import { getWalletQRCode, WalletData } from './walletService';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  crypto: string;
  network: string;
  walletData: WalletData;
  address: string;
  symbol: string;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  crypto,
  network,
  walletData,
  address,
  symbol
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const qrUrl = getWalletQRCode(crypto, network, walletData, 300);
      setQrCodeUrl(qrUrl);
      setIsLoading(false);
    }
  }, [isOpen, crypto, network, walletData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#2d2d2d] rounded-xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {symbol} QR Code
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* QR Code */}
        <div className="text-center mb-4">
          {isLoading ? (
            <div className="w-64 h-64 mx-auto bg-gray-100 dark:bg-[#3a3a3a] rounded-lg flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : qrCodeUrl ? (
            <div className="w-64 h-64 mx-auto bg-white p-4 rounded-lg shadow-inner">
              <img
                src={qrCodeUrl}
                alt={`${symbol} QR Code`}
                className="w-full h-full object-contain"
                onError={() => setQrCodeUrl(null)}
              />
            </div>
          ) : (
            <div className="w-64 h-64 mx-auto bg-gray-100 dark:bg-[#3a3a3a] rounded-lg flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Failed to generate QR code</p>
            </div>
          )}
        </div>

        {/* Address */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Wallet Address:
          </label>
          <div className="bg-gray-50 dark:bg-[#3a3a3a] rounded-lg p-3">
            <p className="text-sm text-gray-900 dark:text-white break-all font-mono">
              {address}
            </p>
          </div>
        </div>

        {/* Network Info */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Network:
          </label>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {walletData[crypto]?.networks[network]?.name || network}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              navigator.clipboard.writeText(address);
              // You could add a toast notification here
            }}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Copy Address
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
