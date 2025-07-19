import React, { useState } from 'react';
import { decryptFile } from './encryptionUtils';
import { purchaseDocument, getDocumentPrice } from './contractService';

export default function SearchData({ onBack }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [downloading, setDownloading] = useState({});
  const [purchasing, setPurchasing] = useState({});
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dataType: '',
    gender: '',
    ageRange: '',
    dataSource: '',
    priceRange: '',
    fileType: ''
  });
  const [useFilters, setUseFilters] = useState(false);

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim() && !useFilters) {
      alert('Please enter a search query or use filters');
      return;
    }

    setIsSearching(true);
    try {
      const backendUrl =  'http://localhost:3002';
      
      let endpoint = '/search';
      let requestBody = {};
      
      if (useFilters && Object.values(filters).some(value => value !== '')) {
        // Use search_with_filter or filter endpoint based on whether there's a query
        if (searchQuery.trim()) {
          endpoint = '/search_with_filter';
          requestBody = {
            query: searchQuery.trim(),
            filters: buildFiltersObject(),
            n_results: 10
          };
        } else {
          endpoint = '/filter';
          requestBody = {
            filters: buildFiltersObject(),
            n_results: 10
          };
        }
      } else {
        // Regular search
        requestBody = {
          query: searchQuery.trim()
        };
      }

      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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

  const buildFiltersObject = () => {
    const filterObj = {};
    
    // Collect all summary-based filters
    const summaryFilters = [];
    
    if (filters.dataType) {
      summaryFilters.push(`Data Type: ${filters.dataType}`);
    }
    
    if (filters.gender) {
      summaryFilters.push(`Gender: ${filters.gender}`);
    }
    
    if (filters.dataSource) {
      summaryFilters.push(`Data Source: ${filters.dataSource}`);
    }
    
    // If we have summary filters, combine them with $and
    if (summaryFilters.length > 0) {
      if (summaryFilters.length === 1) {
        filterObj['summary'] = { '$contains': summaryFilters[0] };
      } else {
        // For multiple summary filters, use $and to ensure all conditions are met
        filterObj['$and'] = summaryFilters.map(filter => ({
          'summary': { '$contains': filter }
        }));
      }
    }
    
    if (filters.fileType) {
      filterObj['fileType'] = filters.fileType;
    }
    
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(p => parseFloat(p));
      if (!isNaN(min) && !isNaN(max)) {
        filterObj['price'] = { '$gte': min, '$lte': max };
      }
    }
    
    return filterObj;
  };

  const resetFilters = () => {
    setFilters({
      dataType: '',
      gender: '',
      ageRange: '',
      dataSource: '',
      priceRange: '',
      fileType: ''
    });
    setUseFilters(false);
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
          <div className="flex gap-2 mb-4">
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
          
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            
            {useFilters && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-600">Filters Active</span>
                <button
                  onClick={resetFilters}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
          
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Type</label>
                  <select
                    value={filters.dataType}
                    onChange={(e) => {
                      setFilters({...filters, dataType: e.target.value});
                      setUseFilters(true);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="Personal">Personal</option>
                    <option value="Institution">Institution</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={filters.gender}
                    onChange={(e) => {
                      setFilters({...filters, gender: e.target.value});
                      setUseFilters(true);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Mixed">Mixed</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Source</label>
                  <select
                    value={filters.dataSource}
                    onChange={(e) => {
                      setFilters({...filters, dataSource: e.target.value});
                      setUseFilters(true);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Sources</option>
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Type</label>
                  <select
                    value={filters.fileType}
                    onChange={(e) => {
                      setFilters({...filters, fileType: e.target.value});
                      setUseFilters(true);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="application/pdf">PDF</option>
                    <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">DOCX</option>
                    <option value="application/msword">DOC</option>
                    <option value="text/plain">TXT</option>
                    <option value="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">XLSX</option>
                    <option value="application/vnd.ms-excel">XLS</option>
                    <option value="text/csv">CSV</option>
                    <option value="application/json">JSON</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Range (ETH)</label>
                  <select
                    value={filters.priceRange}
                    onChange={(e) => {
                      setFilters({...filters, priceRange: e.target.value});
                      setUseFilters(true);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Prices</option>
                    <option value="0-0.01">0 - 0.01 ETH</option>
                    <option value="0.01-0.05">0.01 - 0.05 ETH</option>
                    <option value="0.05-0.1">0.05 - 0.1 ETH</option>
                    <option value="0.1-0.5">0.1 - 0.5 ETH</option>
                    <option value="0.5-1">0.5 - 1 ETH</option>
                    <option value="1-999">1+ ETH</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end mt-4 gap-2">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear Filters
                </button>
                <button
                  onClick={handleSearchSubmit}
                  disabled={isSearching}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
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
                    {useFilters ? 'Filtered Results' : 'Search Results'} ({resultsArray.length || 0} found)
                    {useFilters && (
                      <span className="text-sm font-normal text-blue-600 ml-2">
                        • Filters applied
                      </span>
                    )}
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
                              
                              {/* Extract and display enhanced metadata from summary */}
                              {(() => {
                                const summary = result.summary || '';
                                const extractField = (fieldName) => {
                                  const regex = new RegExp(`${fieldName}:\\s*([^\\n]+)`);
                                  const match = summary.match(regex);
                                  return match ? match[1].trim() : null;
                                };
                                
                                const dataType = extractField('Data Type');
                                const gender = extractField('Gender');
                                const age = extractField('Age');
                                const ageRange = extractField('Age Range');
                                const dataSource = extractField('Data Source');
                                const diseaseTags = extractField('Disease Tags');
                                
                                return (
                                  <>
                                    {dataType && (
                                      <div>
                                        <span className="font-medium">Data Type:</span> {dataType}
                                      </div>
                                    )}
                                    {gender && (
                                      <div>
                                        <span className="font-medium">Gender:</span> {gender}
                                      </div>
                                    )}
                                    {(age || ageRange) && (
                                      <div>
                                        <span className="font-medium">{age ? 'Age' : 'Age Range'}:</span> {age || ageRange}
                                      </div>
                                    )}
                                    {dataSource && (
                                      <div>
                                        <span className="font-medium">Data Source:</span> {dataSource}
                                      </div>
                                    )}
                                    {diseaseTags && (
                                      <div className="col-span-2">
                                        <span className="font-medium">Disease Tags:</span> {diseaseTags}
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
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