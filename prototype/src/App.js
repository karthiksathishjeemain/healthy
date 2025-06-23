import React, { useState } from 'react';
import { Wallet, Search, Upload, User, ChevronDown } from 'lucide-react';
import SearchData from './search_data';
import UploadData from './upload_data';
import Dashboard from './Dashboard';

export default function App() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [fullWalletAddress, setFullWalletAddress] = useState('');
  const [currentView, setCurrentView] = useState('main');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
        setFullWalletAddress(address);
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
    setFullWalletAddress('');
    setIsDropdownOpen(false);
    setCurrentView('main');
  };

  const handleSearch = () => {
    setCurrentView('search');
  };

  const handleUpload = () => {
    setCurrentView('upload');
  };

  const handleDashboard = () => {
    setCurrentView('dashboard');
    setIsDropdownOpen(false);
  };

  const handleBackToMain = () => {
    setCurrentView('main');
  };

  if (currentView === 'search') {
    return <SearchData onBack={handleBackToMain} />;
  }

  if (currentView === 'upload') {
    return (
      <UploadData 
        onBack={handleBackToMain}
        isWalletConnected={isWalletConnected}
        walletAddress={fullWalletAddress}
        onWalletConnect={handleWalletConnect}
      />
    );
  }

  if (currentView === 'dashboard') {
    return (
      <Dashboard 
        onBack={handleBackToMain}
        isWalletConnected={isWalletConnected}
        walletAddress={fullWalletAddress}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="absolute top-4 right-4">
        {isWalletConnected ? (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <span className="text-sm text-gray-700">{walletAddress}</span>
              <ChevronDown size={16} className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={handleDashboard}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                >
                  View My Profile
                </button>
                <button
                  onClick={handleDisconnect}
                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Disconnect Wallet
                </button>
              </div>
            )}
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
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
            Bio-Block
          </h1>

          <div className="space-y-4">
            <button
              onClick={handleSearch}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg"
            >
              <Search size={20} />
              Search Documents
            </button>

            <button
              onClick={handleUpload}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg"
            >
              <Upload size={20} />
              Upload Document
            </button>
          </div>

          {!isWalletConnected && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-700 text-center text-sm">
                Connect your wallet to upload documents
              </p>
            </div>
          )}
        </div>
      </div>

      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}