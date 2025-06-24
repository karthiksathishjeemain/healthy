require('dotenv').config();
const express = require("express");
const axios = require("axios");
const { QdrantClient } = require("@qdrant/js-client-rest");
const cors = require("cors");
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
const qdrant = new QdrantClient({
     url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});
const COLLECTION_NAME = "new_user_data";

async function ensureCollection() {
    try {
        await qdrant.getCollection(COLLECTION_NAME);
    } catch {
        await qdrant.createCollection(COLLECTION_NAME, {
            vectors: {
                size: 384, 
                distance: "Cosine"
            }
        });
    }
}
ensureCollection();
const generateId = () => {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 10000);
  return Number(`${timestamp}${randomSuffix}`);
};


app.post("/store", async (req, res) => {
    const { summary, cid, metadata } = req.body;

    if (!summary || !cid) {
        return res.status(400).json({ error: "Missing 'summary' or 'cid'" });
    }

    try {
      
        const { data } = await axios.post("http://localhost:8000/embed", { text: summary });
        const embedding = data.embedding;
        // console.log("Embedding received:", embedding);
        if (!embedding || embedding.length !== 384) {
            return res.status(500).json({ error: "Invalid embedding received" });
        }
        // console.log("genered id is", generateId());
        await qdrant.upsert(COLLECTION_NAME, {
            points: [
                {
                    id: generateId(),
                    vector: embedding,
                    payload: { summary, cid, ...metadata }
                }
            ]
        });

        res.status(200).json({ message: "Stored successfully", cid });
    } catch (err) {
        console.error("Store Error:", err.message);
        res.status(500).json({ error: "Failed to store data" });
    }
});

app.post("/search", async (req, res) => {
    const { query } = req.body;
    if (!query) {
        return res.status(400).json({ error: "Missing 'query'" });
    }

    try {
        
        const { data } = await axios.post("http://localhost:8000/embed", { text: query });
        const queryVector = data.embedding;

        const searchResult = await qdrant.search(COLLECTION_NAME, {
            vector: queryVector,
            limit: 5,
            with_payload: true
        });

        const results = searchResult.map((item) => ({
            cid: item.payload.cid,
            score: item.score,
            metadata: item.payload
        }));

        res.status(200).json({ results });
    } catch (err) {
        console.error("Search Error:", err.message);
        res.status(500).json({ error: "Failed to search" });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
