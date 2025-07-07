# Bio-Block: Secure Document Management System

Bio-Block is a decentralized document management system that leverages blockchain technology, IPFS (InterPlanetary File System), and vector databases to provide secure, verifiable storage and retrieval of documents.

## Features

- **Document Upload**: Upload documents to IPFS with secure, decentralized storage
- **Document Anonymization**: Automatic PHI anonymization for Excel files in healthcare
- **Blockchain Verification**: Store document hashes on the Ethereum blockchain for tamper-proof verification
- **Semantic Search**: Find documents using natural language queries with AI-powered vector search
- **User Dashboard**: View all your documents in one place with detailed metadata
- **Document Marketplace**: Set prices for documents and earn from document purchases
- **Wallet Integration**: Seamless connection with Ethereum wallets (like MetaMask)
- **Environment Flexibility**: Easy switching between local and production environments

## Project Structure

```
healthy/
├── prototype/                 # React frontend application
│   ├── src/
│   │   ├── App.js            # Main application with navigation
│   │   ├── contractService.js # Smart contract interactions
│   │   ├── UploadFile.js     # IPFS upload via Pinata
│   │   ├── upload_data.js    # Document upload interface
│   │   ├── search_data.js    # Document search interface
│   │   ├── search.js         # Enhanced search component
│   │   ├── encryptionUtils.js # Document encryption utilities
│   │   └── DocumentStorage.sol # Smart contract source
│   └── package.json
├── javascript_backend/        # Express.js API server
│   ├── index.js              # Main server file
│   └── package.json
├── python_backend/           # FastAPI service
│   ├── main.py               # ChromaDB and search endpoints
│   ├── requirements.txt
│   ├── vercel.json           # Vercel deployment config
│   └── chroma_db/            # Local ChromaDB storage
├── testing/                  # Test files and utilities
└── README.md
```

## Architecture

The project consists of multiple components:

### Frontend (React)
- Modern UI built with React.js and Tailwind CSS
- Wallet integration using Ethereum provider
- Document upload and search interfaces

### JavaScript Backend (Express)
- API endpoints for document storage and retrieval
- Integration with IPFS via Pinata for decentralized file storage
- Connection to Qdrant vector database for semantic search
- File upload handling with multer

### Python Backend (FastAPI)
- Text embedding service using ChromaDB
- Document search functionality with similarity scoring
- Vector storage and retrieval for semantic search

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
   REACT_APP_PYTHON_BACKEND_URL=your_deployed_python_backend_url
   REACT_APP_JS_BACKEND_URL=http://localhost:3001
   ```
   *Note: 
   - Generate a secure 32-byte encryption key for document encryption
   - Replace `your_deployed_python_backend_url` with your actual deployment URL
   - JavaScript backend URL can be updated when deployed*

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

**Option 1: Using Deployed Python Backend**

1. **Start the JavaScript backend (port 3001)**
   ```bash
   cd javascript_backend
   node index.js
   ```

2. **Start the React frontend**
   ```bash
   cd prototype
   npm start
   ```
   *The frontend will automatically use the deployed Python backend on Render*

**Option 2: Full Local Development**

1. **Start the Python backend (port 3002)**
   ```bash
   cd python_backend
   uvicorn main:app --reload --port 3002
   ```

2. **Start the JavaScript backend (port 3001)**
   ```bash
   cd javascript_backend
   node index.js
   ```

3. **Start the React frontend**
   ```bash
   cd prototype
   npm start
   ```
   *Update environment variables to use localhost URLs for local development*

4. **Access the application**
   
   Open your browser and navigate to `http://localhost:3000`

## API Endpoints

### JavaScript Backend (Port 3001)
- `POST /anonymize` - Anonymize PHI (Personal Health Information) in Excel files
  - Input: Excel file (.xlsx or .xls) via multipart form data
  - Output: Anonymized Excel file with wallet-based IDs
- `GET /health` - Health check endpoint to verify server status
  - Output: JSON with server status and timestamp

*Note: Document upload and Qdrant integration APIs are currently commented out*

### Python Backend (Port 3002)
- `POST /store` - Store document summaries and metadata in ChromaDB
- `POST /search` - Search documents using natural language queries
- Returns similarity scores, document metadata, and summaries

## Environment Configuration

The application uses environment variables to configure backend URLs:

- **REACT_APP_PYTHON_BACKEND_URL**: Python backend URL (deployed on Render)
- **REACT_APP_JS_BACKEND_URL**: JavaScript backend URL (localhost or deployed)
- **REACT_APP_PINATA_JWT**: Pinata API key for IPFS uploads
- **REACT_APP_ENCRYPTION_KEY**: 32-byte key for document encryption

This allows seamless switching between local development and production environments.

## How It Works

1. **Document Upload**: Users upload files through the React interface
2. **IPFS Storage**: Files are stored on IPFS using Pinata service
3. **Blockchain Recording**: Document hashes are stored on Ethereum for verification
4. **Vector Embedding**: Document summaries are converted to vectors and stored in ChromaDB
5. **Semantic Search**: Users can search using natural language, powered by vector similarity

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

### Current Deployment Status
- **Python Backend**: 🔄 Can be deployed to Render, Vercel, or similar platforms
- **JavaScript Backend**: 🔄 Can be deployed to Heroku, Render, or similar services  
- **Frontend**: 🔄 Can be deployed to Vercel, Netlify, or similar platforms

### Deployment Options
- **Frontend**: Can be deployed to Vercel or Netlify
- **Python Backend**: Already deployed to Render with `vercel.json` configuration
- **JavaScript Backend**: Can be deployed to Heroku, Render, or similar services
- **Smart Contract**: Should be deployed to Ethereum mainnet for production use

### Environment Variables for Production
Update the `.env` file with production URLs when deploying:
```env
REACT_APP_PYTHON_BACKEND_URL=https://your-python-backend.onrender.com
REACT_APP_JS_BACKEND_URL=https://your-js-backend.herokuapp.com
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgements

- [IPFS](https://ipfs.io/) for decentralized storage
- [Pinata](https://pinata.cloud/) for IPFS pinning service
- [Ethereum](https://ethereum.org/) for blockchain functionality
- [ChromaDB](https://www.trychroma.com/) for vector database capabilities
- [Qdrant](https://qdrant.tech/) for vector search capabilities
- [React](https://reactjs.org/) for frontend framework
- [FastAPI](https://fastapi.tiangolo.com/) for Python backend
- [Express.js](https://expressjs.com/) for JavaScript backend