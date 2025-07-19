from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import chromadb
import time
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(name="new_user_data")

class StoreRequest(BaseModel):
    summary: str
    dataset_title: str
    cid: str
    metadata: Optional[Dict[str, Any]] = {}

class SearchRequest(BaseModel):
    query: str

class FilterRequest(BaseModel):
    filters: Dict[str, Any]
    n_results: Optional[int] = 10

def generate_id() -> str:
    timestamp = int(time.time() * 1000)
    random_suffix = hash(str(uuid.uuid4())) % 10000
    return f"{timestamp}{random_suffix}"


@app.post("/store")
async def store_data(request: StoreRequest):
    try:
        print(f"Received request: {request}")  
        doc_id = generate_id()
        print(f"Generated ID: {doc_id}") 
        
     
        combined_document = f"Dataset Title: {request.dataset_title}\n{request.summary}"
        
        disease_tags = request.metadata.get("disease_tags")
        if disease_tags:
            combined_document += f"\nDisease Tags: {disease_tags}"
        
        metadata = {
            "cid": request.cid,
            "dataset_title": request.dataset_title,
            **request.metadata
        }
        print(f"Metadata: {metadata}") 
        print(f"Combined document: {combined_document}")
        
        collection.add(
            ids=[doc_id],
            documents=[combined_document],
            metadatas=[metadata]
        )
        
        return {"message": "Stored successfully", "cid": request.cid}
        
    except Exception as e:
        print(f"Error in store_data: {str(e)}") 
        print(f"Error type: {type(e)}") 
        import traceback
        traceback.print_exc()  
        raise HTTPException(status_code=500, detail=f"Failed to store data: {str(e)}")

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
                document = search_results["documents"][0][i]
                
                score = 1 / (1 + distance)
                
                results.append({
                    "id": doc_id,
                    "cid": metadata.get("cid", ""),
                    "score": score,
                    "summary": document,
                    "metadata": metadata
                })
        
        return {"results": results}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to search data")

@app.post("/filter")
async def filter_data(request: FilterRequest):
    try:
        print(f"Filter request: {request.filters}") 
        
        filters = request.filters
        if len(filters) > 1:
           
            and_conditions = [{key: value} for key, value in filters.items()]
            where_clause = {"$and": and_conditions}
        else:
           
            where_clause = filters
            
        print(f"Where clause: {where_clause}")  
        
       
        search_results = collection.get(
            where=where_clause,
            include=["documents", "metadatas"]
        )
        
        print(f"Filter results count: {len(search_results['ids']) if search_results['ids'] else 0}")  # Debug log
        
        results = []
        if search_results["ids"]:
            for i, doc_id in enumerate(search_results["ids"]):
                metadata = search_results["metadatas"][i]
                document = search_results["documents"][i]
                
                results.append({
                    "id": doc_id,
                    "cid": metadata.get("cid", ""),
                    "summary": document,
                    "metadata": metadata
                })
        
        if request.n_results and len(results) > request.n_results:
            results = results[:request.n_results]
        
        return {"results": results, "total_found": len(search_results["ids"])}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to filter data: {str(e)}")

@app.post("/search_with_filter")
async def search_with_filter(request: Dict[str, Any]):
    """
    Combined semantic search with metadata filtering
    Request body should contain:
    - query: text to search for
    - filters: metadata filters (optional)
    - n_results: number of results (optional, default 5)
    """
    try:
        query = request.get("query")
        filters = request.get("filters", {})
        n_results = request.get("n_results", 5)
        
        print(f"Search with filter - Query: {query}, Filters: {filters}")  
        
        if not query:
            raise HTTPException(status_code=400, detail="Query is required")
     
        search_kwargs = {
            "query_texts": [query],
            "n_results": n_results,
            "include": ["documents", "metadatas", "distances"]
        }
        
        if filters:
         
            if len(filters) > 1:
                and_conditions = [{key: value} for key, value in filters.items()]
                search_kwargs["where"] = {"$and": and_conditions}
            else:
                search_kwargs["where"] = filters
        
        search_results = collection.query(**search_kwargs)
        
        results = []
        if search_results["ids"][0]:
            for i, doc_id in enumerate(search_results["ids"][0]):
                metadata = search_results["metadatas"][0][i]
                distance = search_results["distances"][0][i]
                document = search_results["documents"][0][i]
           
                score = 1 / (1 + distance)
                
                results.append({
                    "id": doc_id,
                    "cid": metadata.get("cid", ""),
                    "score": score,
                    "summary": document,
                    "metadata": metadata
                })
        
        return {"results": results}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search with filter: {str(e)}")



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3002)