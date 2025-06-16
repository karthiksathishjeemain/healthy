import React, { useState } from 'react';
import { Upload, Wallet, FileText, Search } from 'lucide-react';
import { uploadToIPFS } from './UploadFile'; 
import { storeDocumentHash } from './contractService';

export default function DocumentUploadApp() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [summary, setSummary] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showSearchInterface, setShowSearchInterface] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleSummaryChange = (event) => {
    setSummary(event.target.value);
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

  const handleSearch = () => {
    setShowSearchInterface(true);
  };

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a search query');
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch('http://localhost:3000/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery.trim()
        }),
      });

      if (!response.ok) {
        throw new Error(`Search API failed: ${response.statusText}`);
      }

      const result = await response.json();
      setSearchResults(result);
    } catch (error) {
      console.error('Search Error:', error);
      alert(`Search Error: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const closeSearchInterface = () => {
    setShowSearchInterface(false);
    setSearchQuery('');
    setSearchResults(null);
  };

  const handleUpload = async () => {
    if (!isWalletConnected) {
      alert('Please connect your wallet first');
      return;
    }
    
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    if (!summary.trim()) {
      alert('Please provide a summary of your document');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Upload to IPFS
      const result = await uploadToIPFS(selectedFile);
      if (!result.success) {
        alert(`Upload failed: ${result.error}`);
        setIsUploading(false);
        return;
      }
      
      // Store hash on blockchain
      const txHash = await storeDocumentHash(result.hash);
      
      // Store in vector database
      const metadata = {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        uploadDate: new Date().toISOString(),
        walletAddress: walletAddress,
        transactionHash: txHash
      };

      const storeResponse = await fetch('http://localhost:3000/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: summary.trim(),
          cid: result.hash,
          metadata: metadata
        }),
      });

      if (!storeResponse.ok) {
        throw new Error(`Store API failed: ${storeResponse.statusText}`);
      }

      const storeResult = await storeResponse.json();
      
      alert(`Success!\nIPFS Hash: ${result.hash}\nTransaction: ${txHash}\nStored in database: ${storeResult.message}`);
      
      // Reset form
      setSelectedFile(null);
      setSummary('');
      
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showSearchInterface ? (
        // Search Page
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={closeSearchInterface}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Back to Upload
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Search Documents</h1>
            <div></div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter your search query..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                />
                <button
                  onClick={handleSearchSubmit}
                  disabled={isSearching}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-lg"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {searchResults && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Search Results:</h3>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm max-h-96">
                  {JSON.stringify(searchResults, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Upload Page
        <div className="relative">
          <div className="absolute top-4 left-4">
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Search size={16} />
              Search
            </button>
          </div>

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

              <div className={`border-2 border-dashed ${isWalletConnected ? 'border-gray-300 hover:border-blue-400' : 'border-gray-200'} rounded-lg p-6 text-center transition-colors mb-4`}>
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
                <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">
                    Selected: {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Size: {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText size={16} className="inline mr-1" />
                  Document Summary
                </label>
                <textarea
                  id="summary"
                  value={summary}
                  onChange={handleSummaryChange}
                  placeholder="Describe what this document contains..."
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${!isWalletConnected ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  rows={4}
                  disabled={!isWalletConnected}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This summary will help you find your document later
                </p>
              </div>

              <button
                onClick={handleUpload}
                disabled={!selectedFile || !isWalletConnected || !summary.trim() || isUploading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? 'Uploading...' : 'Upload to IPFS & Store'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}