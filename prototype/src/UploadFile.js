export const uploadToIPFS = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    console.log("jwt", process.env.REACT_APP_PINATA_JWT);
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.REACT_APP_PINATA_JWT}`,
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
