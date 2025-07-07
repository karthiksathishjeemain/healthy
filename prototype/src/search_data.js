import React, { useState } from 'react';
import { decryptFile } from './encryptionUtils';
import { purchaseDocument, getDocumentPrice } from './contractService';

export default function SearchData({ onBack }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [downloading, setDownloading] = useState({});
  const [purchasing, setPurchasing] = useState({});

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a search query');
      return;
    }

    setIsSearching(true);
    try {
      const backendUrl = process.env.REACT_APP_PYTHON_BACKEND_URL || 'http://localhost:3002';
      const response = await fetch(`${backendUrl}/search`, {
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

  const handlePurchaseAndDownload = async (result, index) => {
    const cid = result.cid || result.ipfsHash || result.hash;
    if (!cid) return;

    setPurchasing(prev => ({ ...prev, [index]: true }));
    
    try {
      const price = result.metadata?.price || await getDocumentPrice(cid);
      
      if (!price || parseFloat(price) <= 0) {
        alert('Unable to get document price');
        return;
      }

      const confirmed = window.confirm(`Purchase this document for ${price} ETH?`);
      if (!confirmed) return;

      const txHash = await purchaseDocument(cid, price);
      console.log('Purchase successful:', txHash);

      setDownloading(prev => ({ ...prev, [index]: true }));
      
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
      const encryptedData = await response.text();
      
      const decryptedData = decryptFile(encryptedData);
      const bytes = new Uint8Array(atob(decryptedData).split('').map(char => char.charCodeAt(0)));
      
      const blob = new Blob([bytes], { type: result.metadata?.fileType || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = result.metadata?.fileName || `document_${index + 1}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Purchase/Download Error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setPurchasing(prev => ({ ...prev, [index]: false }));
      setDownloading(prev => ({ ...prev, [index]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          ← Back to Main
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
          <div className="space-y-4">
            {(() => {
              const resultsArray = Array.isArray(searchResults) 
                ? searchResults 
                : searchResults.results || searchResults.data || [];
              
              return (
                <>
                  <h3 className="text-lg font-semibold mb-4">
                    Search Results ({resultsArray.length || 0} found):
                  </h3>
                  
                  {resultsArray.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                      <p className="text-gray-500">No documents found matching your search query.</p>
                      <div className="mt-4 p-4 bg-gray-50 rounded text-left">
                        <p className="text-xs text-gray-600 mb-2">Debug - API Response:</p>
                        <pre className="text-xs text-gray-500 overflow-auto max-h-32">
                          {JSON.stringify(searchResults, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {resultsArray.map((result, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                          <div className="mb-4">
                            <h4 className="text-lg font-semibold text-gray-800 mb-2">
                              {result.metadata?.fileName || result.title || result.fileName || `Document ${index + 1}`}
                            </h4>
                            
                            <p className="text-gray-600 mb-3">
                              {result.summary || 
                               result.description || 
                               result.content || 
                               result.text ||
                               result.document_summary ||
                               result.doc_summary ||
                               result.metadata?.summary ||
                               result.metadata?.description ||
                               result.pageContent ||
                               result.document ||
                               'No summary available'}
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-4">
                              {result.metadata?.fileType && (
                                <div>
                                  <span className="font-medium">File Type:</span> {result.metadata.fileType}
                                </div>
                              )}
                              {result.metadata?.fileSize && (
                                <div>
                                  <span className="font-medium">Size:</span> {(result.metadata.fileSize / 1024).toFixed(1)} KB
                                </div>
                              )}
                              {result.metadata?.uploadDate && (
                                <div>
                                  <span className="font-medium">Uploaded:</span> {new Date(result.metadata.uploadDate).toLocaleDateString()}
                                </div>
                              )}
                              {result.metadata?.price && (
                                <div>
                                  <span className="font-medium">Price:</span> {result.metadata.price} ETH
                                </div>
                              )}
                              {result.score && (
                                <div>
                                  <span className="font-medium">Relevance:</span> {(result.score * 100).toFixed(1)}%
                                </div>
                              )}
                            </div>
                            
                            {(result.cid || result.ipfsHash || result.hash) && (
                              <div className="text-xs text-gray-400 mb-4 break-all">
                                <span className="font-medium">IPFS CID:</span> {result.cid || result.ipfsHash || result.hash}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                            <div className="text-xs text-gray-400">
                              {result.metadata?.walletAddress && (
                                <span>Uploaded by: {result.metadata.walletAddress}</span>
                              )}
                            </div>
                            
                            {(result.cid || result.ipfsHash || result.hash) && (
                              <button
                                onClick={() => handlePurchaseAndDownload(result, index)}
                                disabled={purchasing[index] || downloading[index]}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                              >
                                {purchasing[index] ? 'Purchasing...' : downloading[index] ? 'Downloading...' : `Purchase & Download (${result.metadata?.price || '...'} ETH)`}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}