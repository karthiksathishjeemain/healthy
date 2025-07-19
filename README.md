# Bio-Block: Secure Document Management System

Bio-Block is a decentralized document management system that leverages blockchain technology, IPFS (InterPlanetary File System), and vector databases to provide secure, verifiable storage and retrieval of documents with advanced search and filtering capabilities.

**🌐 Live Demo: [https://healthyprototype.vercel.app/](https://healthyprototype.vercel.app/)**

**🔗 Backend Services:**
- **Python Backend**: [https://bioblock-python-backend.onrender.com](https://bioblock-python-backend.onrender.com)
- **JavaScript Backend**: [https://bioblock-js-backend.onrender.com](https://bioblock-js-backend.onrender.com)

## Recent Updates (MetaDataImprovement Branch)

- **Enhanced Search Capabilities**: Added comprehensive filtering system with metadata-based search options
- **Advanced Filter Integration**: Users can now filter by data type, gender, data source, price range, and file type
- **Combined Search & Filter**: New endpoint that combines semantic search with metadata filtering for precise document discovery
- **Improved User Experience**: Enhanced search interface with toggle-able filter options and better result display

## Features

- **Document Upload**: Upload documents to IPFS with secure, decentralized storage
- **Enhanced Data Collection**: Comprehensive metadata collection including dataset title, disease tags, data type (Personal/Institution), demographics, and data source
- **Document Anonymization**: Automatic PHI anonymization for Excel files with wallet-based hashing for personal data
- **Blockchain Verification**: Store document hashes on the Ethereum blockchain for tamper-proof verification
- **Advanced Search & Filtering**: Find documents using natural language queries with vector search and comprehensive metadata filtering
- **User Dashboard**: Complete dashboard to view earnings, withdraw funds, and manage documents
- **Document Management**: View all uploaded documents with pricing and download capabilities
- **Document Downloads**: Direct download of owned documents with original encryption/decryption
- **Document Marketplace**: Set prices for documents and earn from document purchases
- **Earnings Tracking**: Real-time earnings display and withdrawal functionality
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
│   │   ├── Dashboard.js      # User dashboard with earnings and document management
│   │   ├── encryptionUtils.js # Document encryption utilities
│   │   └── DocumentStorage.sol # Smart contract source
│   └── package.json
├── javascript_backend/        # Express.js API server
│   ├── controllers/          # Business logic controllers
│   │   ├── anonymizeController.js # File anonymization logic
│   │   └── healthController.js    # Health check logic
│   ├── routes/              # API route definitions
│   │   ├── anonymize.js     # Anonymization routes
│   │   └── health.js        # Health check routes
│   ├── server.js            # Main server file
│   ├── vercel.json          # Vercel deployment config
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
- Complete user dashboard with earnings tracking
- Document management with download functionality
- Real-time earnings display and withdrawal capabilities

### JavaScript Backend (Express)
- RESTful API with organized MVC structure
- Controllers for business logic separation
- Route handlers for API endpoints
- File upload handling with multer for Excel anonymization
- Wallet-based anonymization for personal data types
- CORS enabled for cross-origin requests

### Python Backend (FastAPI)
- Text embedding service using ChromaDB
- Document search functionality with similarity scoring
- Vector storage and retrieval for semantic search

### Smart Contracts (Solidity)
- Document verification on Ethereum blockchain
- Document marketplace functionality
- Earnings tracking and withdrawal system
- User document ownership management

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
   node server.js
   ```

2. **Start the React frontend**
   ```bash
   cd prototype
   npm start
   ```
   *The frontend will automatically use the deployed Python backend*

**Option 2: Full Local Development**

1. **Start the Python backend (port 3002)**
   ```bash
   cd python_backend
   uvicorn main:app --reload --port 3002
   ```

2. **Start the JavaScript backend (port 3001)**
   ```bash
   cd javascript_backend
   node server.js
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

### JavaScript Backend (Express.js)
**🌐 Live URL**: `https://bioblock-js-backend.onrender.com`
**🔧 Local URL**: `http://localhost:3001`

- `GET /` - Root endpoint with API information
- `GET /api/health` - Health check endpoint to verify server status
- `POST /api/anonymize` - Anonymize PHI (Personal Health Information) in Excel files
  - Input: Excel file (.xlsx or .xls) via multipart form data
  - Optional: Wallet address for personal data anonymization
  - Output: Anonymized Excel file with appropriate ID generation
- Organized with MVC architecture (controllers and routes)

### Python Backend (FastAPI)
**🌐 Live URL**: `https://bioblock-python-backend.onrender.com`
**🔧 Local URL**: `http://localhost:3002`

- `GET /` - Health check and API information
- `POST /store` - Store document summaries and metadata in ChromaDB
- `POST /search` - Search documents using natural language queries
- `POST /filter` - Filter documents by metadata criteria (data type, gender, data source, price range, file type)
- `POST /search_with_filter` - Combined semantic search with metadata filtering
- Returns similarity scores, document metadata, and summaries

### Example API Usage
```bash
# Health check - JavaScript backend
curl https://bioblock-js-backend.onrender.com/api/health

# Health check - Python backend
curl https://bioblock-python-backend.onrender.com/

# Search documents (POST request)
curl -X POST https://bioblock-python-backend.onrender.com/search \
  -H "Content-Type: application/json" \
  -d '{"query": "patient information", "k": 5}'

# Filter documents by metadata
curl -X POST https://bioblock-python-backend.onrender.com/filter \
  -H "Content-Type: application/json" \
  -d '{"filters": {"dataType": "Personal", "gender": "Male"}, "n_results": 10}'

# Combined search with filters
curl -X POST https://bioblock-python-backend.onrender.com/search_with_filter \
  -H "Content-Type: application/json" \
  -d '{"query": "diabetes research", "filters": {"dataType": "Institution", "dataSource": "Hospital"}, "n_results": 5}'
```

## Environment Configuration

The application uses environment variables to configure backend URLs:

- **REACT_APP_PYTHON_BACKEND_URL**: Python backend URL (deployed on Render)
- **REACT_APP_JS_BACKEND_URL**: JavaScript backend URL (localhost or deployed)
- **REACT_APP_PINATA_JWT**: Pinata API key for IPFS uploads
- **REACT_APP_ENCRYPTION_KEY**: 32-byte key for document encryption

This allows seamless switching between local development and production environments.

## Enhanced Upload System

The document upload system has been significantly enhanced to collect comprehensive metadata:

### Required Fields
- **Dataset Title**: Unique identifier for the document
- **Description**: Detailed content description
- **Disease Tags**: Medical condition tags (e.g., cancer, diabetes, heart disease)
- **Data Type**: Personal or Institution
- **Gender**: 
  - Personal: Male, Female, Prefer not to say
  - Institution: Male, Female, Mixed
- **Age Information**:
  - Personal: Specific age
  - Institution: Age range (0-18, 19-30, 31-45, 46-60, 61-75, 76+, Mixed)
- **Data Source**: Hospital, Clinic, Laboratory, Research Institution, Medical Device, Electronic Health Record, Patient Self-Reported, Insurance Claims, Other
- **Price**: ETH price for document access

### Data Processing
All collected metadata is formatted and sent to the Python backend as:
```
Dataset Title: {user input}
Description: {user input}
Disease Tags: {user input}
Data Type: Personal/Institution
Gender: {user selection}
Age: {user input} or Age Range: {user selection}
Data Source: {user selection}
```

### Anonymization Logic
- **Personal Data**: Uses wallet address for consistent anonymization across all patient data
- **Institution Data**: Uses standard anonymization methods without wallet dependency

## Advanced Search & Filtering System

The platform features a sophisticated search system that combines semantic search with comprehensive filtering capabilities:

### Search Options
1. **Semantic Search**: Natural language queries using vector similarity
2. **Metadata Filtering**: Filter documents by specific criteria without search queries
3. **Combined Search**: Semantic search enhanced with metadata filters for precise results

### Available Filters
- **Data Type**: Personal or Institution
- **Gender**: Male, Female, Mixed, Prefer not to say
- **Data Source**: Hospital, Clinic, Laboratory, Research Institution, Medical Device, Electronic Health Record, Patient Self-Reported, Insurance Claims, Other
- **Price Range**: Custom ETH price ranges
- **File Type**: Various document formats

### Search Endpoints
- `/search` - Semantic search with natural language queries
- `/filter` - Pure metadata filtering without text search
- `/search_with_filter` - Combined semantic and metadata filtering

## How It Works

1. **Document Upload**: Users upload files through the React interface with comprehensive metadata
2. **Data Collection**: Enhanced form collects dataset title, description, disease tags, data type, demographics, and data source
3. **File Anonymization**: For personal data types, wallet address is used for anonymization; institutions use standard methods
4. **IPFS Storage**: Files are encrypted and stored on IPFS using Pinata service
5. **Blockchain Recording**: Document hashes are stored on Ethereum for verification
6. **Vector Embedding**: Document summaries with metadata are converted to vectors and stored in ChromaDB
7. **Advanced Search**: Users can search using natural language queries, apply metadata filters, or combine both for precise document discovery
8. **Document Management**: Users can view all their uploaded documents in the dashboard
9. **Earnings Tracking**: Real-time tracking of earnings from document purchases
10. **Secure Downloads**: Direct download of owned documents with automatic decryption
11. **Marketplace**: Users can purchase documents from others and earn from their own uploads

## Smart Contract

The project uses a smart contract (`DocumentStorage.sol`) deployed on the Ethereum blockchain. Key functionalities include:

- Store document IPFS hashes linked to user addresses
- Set prices for documents
- Purchase documents from other users
- Withdraw earnings from document sales
- Track user document ownership
- Manage document marketplace transactions

## Security Features

- Document hashes stored on blockchain for verification
- Decentralized storage via IPFS
- File encryption/decryption for secure document handling
- Secure wallet integration
- Advanced document anonymization with data type-specific handling
- Personal data anonymization using wallet-based hashing
- Advanced document search with multiple filter options (data type, gender, data source, price range, file type)
- Hash-based file naming for download security

## Deployment

### Live Application
**🌐 Frontend**: [https://healthyprototype.vercel.app/](https://healthyprototype.vercel.app/)
**🔗 Python Backend**: [https://bioblock-python-backend.onrender.com](https://bioblock-python-backend.onrender.com)
**🔗 JavaScript Backend**: [https://bioblock-js-backend.onrender.com](https://bioblock-js-backend.onrender.com)

### Current Deployment Status
- **Frontend**: ✅ Deployed on Vercel
- **Python Backend**: ✅ Deployed on Render
- **JavaScript Backend**: ✅ Deployed on Render
- **Smart Contract**: 🔄 Ready for Ethereum mainnet deployment

### Deployment Options
- **Frontend**: Deployed to Vercel with environment variables configured
- **Python Backend**: Can be deployed to Render or Vercel with included configuration
- **JavaScript Backend**: Can be deployed to Render, Vercel, or Heroku
  - **Render**: Use build command `npm install` and start command `node server.js`
  - **Vercel**: Uses included `vercel.json` configuration
- **Smart Contract**: Should be deployed to Ethereum mainnet for production use

### Environment Variables for Production
The application uses the following production URLs:
```env
REACT_APP_PYTHON_BACKEND_URL=https://bioblock-python-backend.onrender.com
REACT_APP_JS_BACKEND_URL=https://bioblock-js-backend.onrender.com
REACT_APP_PINATA_JWT=your_pinata_jwt_key_here
REACT_APP_ENCRYPTION_KEY=your_32_byte_encryption_key_here
```

### Deployment Commands for Render
For JavaScript backend deployment on Render:
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

For Python backend deployment on Render:
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

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