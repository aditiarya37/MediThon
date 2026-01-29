from fastapi import FastAPI
from pydantic import BaseModel
from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification
import torch

app = FastAPI(title="Pharma Text Classifier")

# ------------------ Load model ------------------
model = DistilBertForSequenceClassification.from_pretrained("pharma_model")
tokenizer = DistilBertTokenizerFast.from_pretrained("pharma_model")

model.eval()  # inference mode

# ------------------ Request schema ------------------
class TextInput(BaseModel):
    text: str

# ------------------ Endpoint ------------------
@app.post("/classify")
def classify(payload: TextInput):
    inputs = tokenizer(
        payload.text,
        return_tensors="pt",
        truncation=True
    )

    with torch.no_grad():
        outputs = model(**inputs)

    probs = torch.softmax(outputs.logits, dim=1)
    pred_id = torch.argmax(probs, dim=1).item()

    label = model.config.id2label[pred_id]
    confidence = probs[0][pred_id].item()

    return {
        "label": label,
        "confidence": round(confidence, 3)
    }
