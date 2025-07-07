from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import chromadb
import time
import uuid

# Initialize FastAPI app
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ChromaDB client
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(name="new_user_data")

# Pydantic models
class StoreRequest(BaseModel):
    summary: str
    cid: str
    metadata: Optional[Dict[str, Any]] = {}

class SearchRequest(BaseModel):
    query: str

def generate_id() -> str:
    timestamp = int(time.time() * 1000)
    random_suffix = hash(str(uuid.uuid4())) % 10000
    return f"{timestamp}{random_suffix}"

@app.post("/store")
async def store_data(request: StoreRequest):
    try:
        doc_id = generate_id()
        
        metadata = {
            "cid": request.cid,
            **request.metadata
        }
        
        collection.add(
            ids=[doc_id],
            documents=[request.summary],
            metadatas=[metadata]
        )
        
        return {"message": "Stored successfully", "cid": request.cid}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to store data")

@app.post("/search")
async def search_data(request: SearchRequest):
    try:
        search_results = collection.query(
            query_texts=[request.query],
            n_results=5,
            include=["documents", "metadatas", "distances"]
        )
        
        results = []
        if search_results["ids"][0]:
            for i, doc_id in enumerate(search_results["ids"][0]):
                metadata = search_results["metadatas"][0][i]
                distance = search_results["distances"][0][i]
                summary = search_results["documents"][0][i]
                # Convert distance to similarity score (0-1 range)
                score = 1 / (1 + distance)
                
                results.append({
                    "cid": metadata.get("cid", ""),
                    "score": score,
                    "summary": summary,
                    "metadata": metadata
                })
        
        return {"results": results}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to search data")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3002)