from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_methods=["*"],
    allow_headers=["*"],
)

model = SentenceTransformer('all-MiniLM-L6-v2')

@app.post("/embed")
async def embed(request: Request):
    body = await request.json()
    text = body.get("text", "")
    embedding = model.encode(text).tolist()
    return {"embedding": embedding}
