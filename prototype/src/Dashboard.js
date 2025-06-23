import React, { useState, useEffect } from 'react';
import { Wallet, DollarSign } from 'lucide-react';
import { getEarnings, withdrawEarnings } from './contractService';

export default function Dashboard({ onBack, isWalletConnected, walletAddress }) {
  const [earnings, setEarnings] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const loadDashboardData = async () => {
    if (!isWalletConnected) return;
    
    setIsLoading(true);
    try {
      const userEarnings = await getEarnings(walletAddress);
      setEarnings(userEarnings);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (parseFloat(earnings) <= 0) {
      alert('No earnings to withdraw');
      return;
    }

    const confirmed = window.confirm(`Withdraw ${earnings} ETH to your wallet?`);
    if (!confirmed) return;

    setIsWithdrawing(true);
    try {
      const txHash = await withdrawEarnings();
      alert(`Withdrawal successful! Transaction: ${txHash}`);
      setEarnings('0');
    } catch (error) {
      console.error('Withdrawal error:', error);
      alert(`Withdrawal failed: ${error.message}`);
    } finally {
      setIsWithdrawing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [isWalletConnected, walletAddress]);

  if (!isWalletConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <Wallet size={48} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to view your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          ← Back to Main
        </button>
        <h1 className="text-2xl font-bold text-gray-800">My Dashboard</h1>
        <div></div>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign size={24} className="text-green-600" />
              <h2 className="text-xl font-semibold">Earnings</h2>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-green-600">{earnings} ETH</p>
              <p className="text-sm text-gray-500">Available to withdraw</p>
            </div>
          </div>
          
          <button
            onClick={handleWithdraw}
            disabled={parseFloat(earnings) <= 0 || isWithdrawing}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isWithdrawing ? 'Withdrawing...' : 'Withdraw Earnings'}
          </button>
        </div>
      </div>
    </div>
  );
}