from fastapi import FastAPI, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sentence_transformers import SentenceTransformer
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine
import pandas as pd
import io

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

analyzer = AnalyzerEngine()
anonymizer = AnonymizerEngine()

def anonymize_text(text):
    if not isinstance(text, str):
        return text
    results = analyzer.analyze(text=text, language='en')
    if results:
        anonymized = anonymizer.anonymize(text=text, analyzer_results=results)
        return anonymized.text
    return text

@app.post("/redact")
async def redact(file: UploadFile = File(...)):
    contents = await file.read()
    df = pd.read_excel(io.BytesIO(contents))
    df_redacted = df.applymap(anonymize_text)
    output = io.BytesIO()
    df_redacted.to_excel(output, index=False)
    output.seek(0)
    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={"Content-Disposition": f"attachment; filename=redacted_{file.filename}"}
    )
