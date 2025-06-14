import React, { useState } from 'react';
import { Upload, Wallet } from 'lucide-react';
import { uploadToIPFS } from './UploadFile'; 
import { storeDocumentHash } from './contractService';
// Ensure you have this service set up
export default function DocumentUploadApp() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleWalletConnect = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
        
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        const address = accounts[0];
        const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
        setWalletAddress(shortAddress);
        setIsWalletConnected(true);
      } else {
        alert('Please install MetaMask or another Web3 wallet');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      if (error.code === 4001) {
        alert('Connection rejected by user');
      }
    }
  };

  const handleDisconnect = () => {
    setIsWalletConnected(false);
    setWalletAddress('');
  };

  // const handleUpload = async () => {
  //   if (!isWalletConnected) {
  //     alert('Please connect your wallet first');
  //     return;
  //   }
    
  //   if (!selectedFile) {
  //     alert('Please select a file first');
  //     return;
  //   }
    
  //   const result = await uploadToIPFS(selectedFile);
  //   if (result.success) {
  //     alert(`File uploaded to IPFS successfully!\nHash: ${result.hash}\nURL: ${result.url}`);
  //     setSelectedFile(null);
  //   } else {
  //     alert(`Upload failed: ${result.error}`);
  //   }
  // };

const handleUpload = async () => {
  if (!isWalletConnected) {
    alert('Please connect your wallet first');
    return;
  }
  
  if (!selectedFile) {
    alert('Please select a file first');
    return;
  }
  
  try {
    // Upload to IPFS
    const result = await uploadToIPFS(selectedFile);
    if (!result.success) {
      alert(`Upload failed: ${result.error}`);
      return;
    }
    
    // Store hash on blockchain
    const txHash = await storeDocumentHash(result.hash);
    
    alert(`Success!\nIPFS Hash: ${result.hash}\nTransaction: ${txHash}`);
    setSelectedFile(null);
  } catch (error) {
    console.error('Error:', error);
    alert(`Error: ${error.message}`);
  }
};
  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div className="absolute top-4 right-4">
        {isWalletConnected ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {walletAddress}
            </span>
            <button
              onClick={handleDisconnect}
              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={handleWalletConnect}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Wallet size={16} />
            Connect Wallet
          </button>
        )}
      </div>

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">
            Upload Document
          </h1>

          {!isWalletConnected && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-700 text-center">
                Please connect your wallet to upload documents
              </p>
              <button
                onClick={handleWalletConnect}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Wallet size={16} />
                Connect Wallet
              </button>
            </div>
          )}

          <div className={`border-2 border-dashed ${isWalletConnected ? 'border-gray-300 hover:border-blue-400' : 'border-gray-200'} rounded-lg p-6 text-center transition-colors`}>
            <Upload className={`mx-auto mb-4 ${isWalletConnected ? 'text-gray-400' : 'text-gray-300'}`} size={48} />
            
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.json"
              disabled={!isWalletConnected}
            />
            
            <label
              htmlFor="file-upload"
              className={`${isWalletConnected ? 'cursor-pointer text-blue-600 hover:text-blue-700' : 'cursor-not-allowed text-gray-400'} font-medium`}
            >
              Choose a file
            </label>
            
            <p className={`${isWalletConnected ? 'text-gray-500' : 'text-gray-400'} text-sm mt-2`}>
              or drag and drop
            </p>
            
            <p className="text-gray-400 text-xs mt-2">
              PDF, DOC, DOCX, TXT, EXCEL, CSV, JSON 
            </p>
          </div>

          {selectedFile && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-sm font-medium text-gray-700">
                Selected: {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                Size: {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || !isWalletConnected}
            className="w-full mt-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Upload to IPFS
          </button>
        </div>
      </div>
    </div>
  );
}