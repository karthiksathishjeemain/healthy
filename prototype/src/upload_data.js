import React, { useState } from 'react';
import { Upload, Wallet, FileText, DollarSign } from 'lucide-react';
import { uploadToIPFS } from './UploadFile'; 
import { storeDocumentHash } from './contractService';
import { encryptFile } from './encryptionUtils.js';

export default function UploadData({ onBack, isWalletConnected, walletAddress, onWalletConnect }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [datasetTitle, setDatasetTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [diseaseTags, setDiseaseTags] = useState('');
  const [dataType, setDataType] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [dataSource, setDataSource] = useState('');
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
    
    // For personal data, use wallet address for hashing
    if (dataType === 'Personal') {
      formData.append('walletAddress', walletAddress);
    }

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

    if (!datasetTitle.trim()) {
      alert('Please provide a dataset title');
      return;
    }

    if (!summary.trim()) {
      alert('Please provide a description of your document');
      return;
    }

    if (!diseaseTags.trim()) {
      alert('Please provide disease tags');
      return;
    }

    if (!dataType) {
      alert('Please select data type');
      return;
    }

    if (!gender) {
      alert('Please select gender');
      return;
    }

    if (dataType === 'Personal' && !age) {
      alert('Please provide age');
      return;
    }

    if (dataType === 'Institution' && !ageRange) {
      alert('Please select age range');
      return;
    }

    if (!dataSource) {
      alert('Please select data source');
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

      // Create detailed summary with all fields
      const detailedSummary = `Dataset Title: ${datasetTitle.trim()}
Description: ${summary.trim()}
Disease Tags: ${diseaseTags.trim()}
Data Type: ${dataType}
Gender: ${gender}
${dataType === 'Personal' ? `Age: ${age}` : `Age Range: ${ageRange}`}
Data Source: ${dataSource}`;

      const pythonBackendUrl = process.env.REACT_APP_PYTHON_BACKEND_URL || 'http://localhost:3002';
      const storeResponse = await fetch(`${pythonBackendUrl}/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: detailedSummary,
          cid: result.hash,
          metadata: metadata
        }),
      });

      if (!storeResponse.ok) {
        throw new Error(`Store API failed: ${storeResponse.statusText}`);
      }

      const storeResult = await storeResponse.json();
      
      alert(`Success!\nIPFS Hash: ${result.hash}\nTransaction: ${txHash}\nPrice: ${price} ETH\nStored in database: ${storeResult.message}`);
      
      // Reset all fields
      setSelectedFile(null);
      setDatasetTitle('');
      setSummary('');
      setDiseaseTags('');
      setDataType('');
      setGender('');
      setAge('');
      setAgeRange('');
      setDataSource('');
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
            <label htmlFor="datasetTitle" className="block text-sm font-medium text-gray-700 mb-2">
              <FileText size={16} className="inline mr-1" />
              Dataset Title *
            </label>
            <input
              id="datasetTitle"
              type="text"
              value={datasetTitle}
              onChange={(e) => setDatasetTitle(e.target.value)}
              placeholder="Enter dataset title..."
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!isWalletConnected ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              disabled={!isWalletConnected}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-2">
              <FileText size={16} className="inline mr-1" />
              Description *
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
          </div>

          <div className="mb-4">
            <label htmlFor="diseaseTags" className="block text-sm font-medium text-gray-700 mb-2">
              <FileText size={16} className="inline mr-1" />
              Disease Tags *
            </label>
            <input
              id="diseaseTags"
              type="text"
              value={diseaseTags}
              onChange={(e) => setDiseaseTags(e.target.value)}
              placeholder="e.g., cancer, diabetes, heart disease"
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!isWalletConnected ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              disabled={!isWalletConnected}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="dataType" className="block text-sm font-medium text-gray-700 mb-2">
              <FileText size={16} className="inline mr-1" />
              Data Type *
            </label>
            <select
              id="dataType"
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!isWalletConnected ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              disabled={!isWalletConnected}
            >
              <option value="">Select data type</option>
              <option value="Personal">Personal</option>
              <option value="Institution">Institution</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
              <FileText size={16} className="inline mr-1" />
              Gender *
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!isWalletConnected ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              disabled={!isWalletConnected}
            >
              <option value="">Select gender</option>
              {dataType === 'Personal' ? (
                <>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </>
              ) : (
                <>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Mixed">Mixed</option>
                </>
              )}
            </select>
          </div>

          {dataType === 'Personal' && (
            <div className="mb-4">
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="inline mr-1" />
                Age *
              </label>
              <input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Enter age"
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!isWalletConnected ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                disabled={!isWalletConnected}
              />
            </div>
          )}

          {dataType === 'Institution' && (
            <div className="mb-4">
              <label htmlFor="ageRange" className="block text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="inline mr-1" />
                Age Range *
              </label>
              <select
                id="ageRange"
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!isWalletConnected ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                disabled={!isWalletConnected}
              >
                <option value="">Select age range</option>
                <option value="0-18">0-18</option>
                <option value="19-30">19-30</option>
                <option value="31-45">31-45</option>
                <option value="46-60">46-60</option>
                <option value="61-75">61-75</option>
                <option value="76+">76+</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="dataSource" className="block text-sm font-medium text-gray-700 mb-2">
              <FileText size={16} className="inline mr-1" />
              Data Source *
            </label>
            <select
              id="dataSource"
              value={dataSource}
              onChange={(e) => setDataSource(e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!isWalletConnected ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              disabled={!isWalletConnected}
            >
              <option value="">Select data source</option>
              <option value="Hospital">Hospital</option>
              <option value="Clinic">Clinic</option>
              <option value="Laboratory">Laboratory</option>
              <option value="Research Institution">Research Institution</option>
              <option value="Medical Device">Medical Device</option>
              <option value="Electronic Health Record">Electronic Health Record</option>
              <option value="Patient Self-Reported">Patient Self-Reported</option>
              <option value="Insurance Claims">Insurance Claims</option>
              <option value="Other">Other</option>
            </select>
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
            disabled={!selectedFile || !isWalletConnected || !datasetTitle.trim() || !summary.trim() || !diseaseTags.trim() || !dataType || !gender || (dataType === 'Personal' && !age) || (dataType === 'Institution' && !ageRange) || !dataSource || !price || parseFloat(price) <= 0 || isUploading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? 'Uploading...' : 'Upload to IPFS & Store'}
          </button>
        </div>
      </div>
    </div>
  );
}