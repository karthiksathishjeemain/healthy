import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0xd9145CCE52D386f254917e481eB44e9943F39138';
const CONTRACT_ABI =[
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "ipfsHash",
				"type": "string"
			}
		],
		"name": "storeDocument",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "getDocuments",
		"outputs": [
			{
				"internalType": "string[]",
				"name": "",
				"type": "string[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getMyDocuments",
		"outputs": [
			{
				"internalType": "string[]",
				"name": "",
				"type": "string[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]
//  [
//   {
//     "inputs": [{"internalType": "string", "name": "ipfsHash", "type": "string"}],
//     "name": "storeDocument",
//     "outputs": [],
//     "stateMutability": "nonpayable",
//     "type": "function"
//   },
//   {
//     "inputs": [],
//     "name": "getMyDocuments",
//     "outputs": [{"internalType": "string[]", "name": "", "type": "string[]"}],
//     "stateMutability": "view",
//     "type": "function"
//   }
// ];

export const storeDocumentHash = async (ipfsHash) => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  
  const tx = await contract.storeDocument(ipfsHash);
  await tx.wait();
    console.log(`Transaction successful with hash: ${tx.hash}`);
  return tx.hash;
};
