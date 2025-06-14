export const uploadToIPFS = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': process.env.REACT_APP_PINATA_API_KEY,
        'pinata_secret_api_key': process.env.REACT_APP_PINATA_SECRET_KEY,
      },
      body: formData,
    });

    const result = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        hash: result.IpfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
      };
    } else {
      throw new Error(result.error?.details || 'Upload failed');
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};
