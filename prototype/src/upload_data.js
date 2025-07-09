import React, { useState } from 'react';
import { Upload, Wallet, FileText, DollarSign } from 'lucide-react';
import { uploadToIPFS } from './UploadFile'; 
import { storeDocumentHash } from './contractService';
import { encryptFile } from './encryptionUtils.js';

export default function UploadData({ onBack, isWalletConnected, walletAddress, onWalletConnect }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [price, setPrice] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleSummaryChange = (event) => {
    setSummary(event.target.value);
  };

  const handlePriceChange = (event) => {
    setPrice(event.target.value);
  };

  const anonymizeFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const jsBackendUrl = process.env.REACT_APP_JS_BACKEND_URL||'http://localhost:3001/api';
    const response = await fetch(`${jsBackendUrl}/anonymize`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('File anonymization failed');
    }

    const blob = await response.blob();
    return new File([blob], `anonymized_${file.name}`, { type: file.type });
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

    if (!price || parseFloat(price) <= 0) {
      alert('Please enter a valid price in ETH');
      return;
    }
    
    setIsUploading(true);
    
    try {
      let fileToUpload = selectedFile;
      
      if (selectedFile.name.match(/\.(xlsx|xls)$/i)) {
        fileToUpload = await anonymizeFile(selectedFile);
      }
      
      const fileBuffer = await fileToUpload.arrayBuffer();
      const encryptedFile = encryptFile(new Uint8Array(fileBuffer));
      
      const result = await uploadToIPFS(encryptedFile);
      if (!result.success) {
        alert(`Upload failed: ${result.error}`);
        setIsUploading(false);
        return;
      }
      
      const txHash = await storeDocumentHash(result.hash, price);
      
      const metadata = {
        fileName: fileToUpload.name,
        fileSize: fileToUpload.size,
        fileType: fileToUpload.type,
        uploadDate: new Date().toISOString(),
        walletAddress: walletAddress,
        transactionHash: txHash,
        encrypted: true,
        price: price
      };

      const pythonBackendUrl = process.env.REACT_APP_PYTHON_BACKEND_URL || 'http://localhost:3002';
      const storeResponse = await fetch(`${pythonBackendUrl}/store`, {
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
      
      alert(`Success!\nIPFS Hash: ${result.hash}\nTransaction: ${txHash}\nPrice: ${price} ETH\nStored in database: ${storeResult.message}`);
      
      setSelectedFile(null);
      setSummary('');
      setPrice('');
      
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="absolute top-4 left-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          ← Back to Main
        </button>
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
                onClick={onWalletConnect}
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

          <div className="mb-4">
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign size={16} className="inline mr-1" />
              Price (ETH)
            </label>
            <input
              id="price"
              type="number"
              step="0.001"
              min="0"
              value={price}
              onChange={handlePriceChange}
              placeholder="0.01"
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!isWalletConnected ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              disabled={!isWalletConnected}
            />
            <p className="text-xs text-gray-500 mt-1">
              Set the price users will pay to download your document
            </p>
          </div>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || !isWalletConnected || !summary.trim() || !price || parseFloat(price) <= 0 || isUploading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? 'Uploading...' : 'Upload to IPFS & Store'}
          </button>
        </div>
      </div>
    </div>
  );
}