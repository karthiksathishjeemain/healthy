# Bio-Block: Secure Document Management System

Bio-Block is a decentralized document management system that leverages blockchain technology, IPFS (InterPlanetary File System), and vector databases to provide secure, verifiable storage and retrieval of documents.

## Features

- **Document Upload**: Upload documents to IPFS with secure, decentralized storage
- **Blockchain Verification**: Store document hashes on the Ethereum blockchain for tamper-proof verification
- **Semantic Search**: Find documents using natural language queries with AI-powered vector search
- **User Dashboard**: View all your documents in one place with detailed metadata
- **Document Marketplace**: Set prices for documents and earn from document purchases
- **Wallet Integration**: Seamless connection with Ethereum wallets (like MetaMask)

## Architecture

The project consists of multiple components:

### Frontend (React)
- Modern UI built with React.js and Tailwind CSS
- Wallet integration using Ethereum provider
- Document upload and search interfaces

### JavaScript Backend (Express)
- API endpoints for document storage and retrieval
- Integration with IPFS for decentralized file storage
- Connection to Qdrant vector database for semantic search

### Python Backend (FastAPI)
- Text embedding service using Sentence Transformers
- Document anonymization with Presidio

### Smart Contracts (Solidity)
- Document verification on Ethereum blockchain
- Document marketplace functionality

## Getting Started

### Prerequisites

- Node.js (v14+)
- Python (v3.8+)
- MetaMask or other Ethereum wallet
- Access to Ethereum testnet (Sepolia)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/bio-block.git
   cd bio-block
   ```

2. **Set up environment variables**

   Create a `.env` file in the `javascript_backend` directory:
   ```env
   QDRANT_API_KEY=your_qdrant_api_key
   QDRANT_URL=your_qdrant_url
   ```

   Create a `.env` file in the `prototype` directory:
   ```env
   REACT_APP_PINATA_JWT=your_pinata_jwt_key
   REACT_APP_ENCRYPTION_KEY=your_32_byte_encryption_key
   ```
   *(Create one and store it)*

3. **Install frontend dependencies**
   ```bash
   cd prototype
   npm install
   ```

4. **Install JavaScript backend dependencies**
   ```bash
   cd ../javascript_backend
   npm install
   ```

5. **Install Python backend dependencies**
   ```bash
   cd ../python_backend
   pip install -r requirements.txt
   ```

### Running the Application

1. **Start the Python backend**
   ```bash
   cd python_backend
   uvicorn main:app --reload
   ```

2. **Start the JavaScript backend**
   ```bash
   cd javascript_backend
   node index.js
   ```

3. **Start the React frontend**
   ```bash
   cd prototype
   npm start
   ```

4. **Access the application**
   
   Open your browser and navigate to `http://localhost:3000`
   Note:  In order to interact with the new_frontend.html file, open the file and press the "Go Live" button which is situated in the bottom right corner on VS Code.
## Smart Contract

The project uses a smart contract (`DocumentStorage.sol`) deployed on the Ethereum blockchain. Key functionalities include:

- Store document IPFS hashes linked to user addresses
- Set prices for documents
- Purchase documents from other users
- Withdraw earnings from document sales

## Security Features

- Document hashes stored on blockchain for verification
- Decentralized storage via IPFS
- Secure wallet integration
- Optional document anonymization for sensitive data

## Deployment

- Frontend can be deployed to Vercel or Netlify
- Python backend can be deployed to Vercel with the included `vercel.json` configuration
- JavaScript backend can be deployed to Heroku or similar services
- Smart contract should be deployed to Ethereum mainnet for production use

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgements

- [IPFS](https://ipfs.io/) for decentralized storage
- [Ethereum](https://ethereum.org/) for blockchain functionality
- [Qdrant](https://qdrant.tech/) for vector search capabilities
- [Sentence Transformers](https://www.sbert.net/) for text embeddings
- [Presidio](https://microsoft.github.io/presidio/) for data anonymization