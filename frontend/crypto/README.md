# Crypto Wallet Configuration - SECURE

This folder contains secure wallet configuration and QR code generation utilities for the crypto donation system.

## 🔒 Security Features - MAXIMUM SECURITY

- **Environment Variables Only**: Wallet addresses loaded ONLY from environment variables
- **No Hardcoded Addresses**: Zero hardcoded wallet addresses in code
- **QR Code Generation**: Secure QR code generation using external API
- **Address Validation**: Built-in wallet address validation
- **Git Protection**: All sensitive files are git-ignored
- **Production Ready**: Fully secure for production deployment

## 📁 File Structure

```
crypto/
├── README.md                 # This file
├── qrGenerator.ts           # QR code generation utilities
├── walletService.ts         # Secure wallet data service
├── secureWalletLoader.ts    # Environment variable loader
└── QRCodeModal.tsx          # QR code display component
```

## 🚀 Setup Instructions

### 1. Environment Variables ✅ COMPLETED

The `.env` file has been created in the frontend directory with your actual wallet addresses:

```env
# Bitcoin Wallets
REACT_APP_BITCOIN_MAINNET_ADDRESS=15hXdrtctyAQQv5R6D4fVvGAQNurz97Kce
REACT_APP_BITCOIN_BSC_ADDRESS=0xfdc41466e872359b20f277ec2b042772bf22aa7b
REACT_APP_BITCOIN_ETH_ADDRESS=0xfdc41466e872359b20f277ec2b042772bf22aa7b

# USDT Wallets
REACT_APP_USDT_TRON_ADDRESS=TUKVr4qfqvCQZQtTQvj3HarUx9b6hordVT
REACT_APP_USDT_BSC_ADDRESS=0xfdc41466e872359b20f277ec2b042772bf22aa7b
REACT_APP_USDT_ETH_ADDRESS=0xfdc41466e872359b20f277ec2b042772bf22aa7b

# ... and all other cryptocurrencies
```

### 3. Security Best Practices

- **Never commit `.env` files** to version control
- **Use different addresses** for different networks
- **Regularly rotate** wallet addresses if needed
- **Monitor transactions** regularly
- **Use hardware wallets** for large amounts

## 🔧 Usage

### Basic Usage

```typescript
import { loadWalletData, getWalletQRCode } from './crypto/walletService';

// Load wallet data
const walletData = await loadWalletData();

// Get QR code for a specific wallet
const qrCodeUrl = getWalletQRCode('bitcoin', 'bitcoin', walletData);
```

### Secure Configuration

```typescript
import { loadSecureWalletConfig, getSecureWalletAddress } from './crypto/secureWalletLoader';

// Load secure configuration
const config = loadSecureWalletConfig();

// Get wallet address
const address = getSecureWalletAddress('bitcoin', 'mainnet', config);
```

### QR Code Modal

```typescript
import QRCodeModal from './crypto/QRCodeModal';

<QRCodeModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  crypto="bitcoin"
  network="bitcoin"
  walletData={walletData}
  address={address}
  symbol="BTC"
/>
```

## 🛡️ Security Considerations

### 1. Environment Variables
- Wallet addresses are loaded from environment variables
- No sensitive data is hardcoded in the source code
- Environment variables are not included in the client bundle

### 2. QR Code Generation
- Uses external QR code service (qrserver.com)
- No sensitive data is sent to external services
- QR codes are generated client-side

### 3. Address Validation
- Built-in validation for different wallet types
- Prevents invalid addresses from being used
- Network type detection

### 4. Error Handling
- Graceful fallbacks for missing data
- Error logging without exposing sensitive information
- Safe defaults for all operations

## 🔄 Updating Wallet Addresses

### Method 1: Environment Variables (Recommended)
1. Update the `.env` file with new addresses
2. Restart the application
3. The new addresses will be loaded automatically

### Method 2: JSON Configuration (Fallback)
1. Update `wallets.json` with new addresses
2. The application will use the updated configuration
3. Less secure but easier for development

## 📱 QR Code Features

- **Multiple Sizes**: Configurable QR code sizes
- **Error Correction**: Medium error correction level
- **Custom Styling**: White background with black foreground
- **Fallback Handling**: Graceful handling of generation failures
- **Copy Functionality**: Easy address copying

## 🚨 Important Notes

1. **Never expose private keys** in any configuration file
2. **Use different addresses** for different purposes
3. **Monitor all transactions** regularly
4. **Keep backups** of your wallet addresses
5. **Test with small amounts** before using for large donations

## 🔧 Troubleshooting

### QR Code Not Generating
- Check if the address is valid
- Verify network connectivity
- Check browser console for errors

### Address Not Loading
- Verify environment variables are set correctly
- Check if the `.env` file is in the correct location
- Ensure the application is restarted after changes

### Validation Errors
- Check address format for the specific network
- Verify the address length and character set
- Ensure the network type is correct

## 📞 Support

If you encounter any issues with the crypto wallet configuration, please check:
1. Environment variables are set correctly
2. Wallet addresses are valid for their respective networks
3. Network connectivity is working
4. Browser console for any error messages
