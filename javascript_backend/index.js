require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Pool } = require('pg');

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.post('/store-summary', async (req, res) => {
  const { cid, summary } = req.body;

  if (!cid || !summary) {
    return res.status(400).json({ error: 'CID and summary are required' });
  }

  try {
    const response = await axios.post('http://localhost:8000/embed', {
      text: summary,
    });

    const embedding = response.data.embedding;

    await pool.query(
      'INSERT INTO r_data_store (cid, summary, embedding) VALUES ($1, $2, $3)',
      [cid, summary, embedding]
    );

    res.json({ status: 'stored', cid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to store summary' });
  }
});

app.listen(port, () => {
  console.log(`✅ Backend running at http://localhost:${port}`);
});
