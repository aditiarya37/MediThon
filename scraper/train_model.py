import pandas as pd
from datasets import Dataset
from transformers import (
    DistilBertTokenizerFast,
    DistilBertForSequenceClassification,
    Trainer,
    TrainingArguments
)

# ------------------ Load data ------------------
df = pd.read_csv("pharma_mentions.csv")

labels = df['label'].unique().tolist()
label2id = {l: i for i, l in enumerate(labels)}
id2label = {i: l for l, i in label2id.items()}

df['labels'] = df['label'].map(label2id)

dataset = Dataset.from_pandas(df[['text', 'labels']])

# ------------------ Tokenization ------------------
tokenizer = DistilBertTokenizerFast.from_pretrained(
    "distilbert-base-uncased"
)

def tokenize(batch):
    return tokenizer(
        batch["text"],
        truncation=True,
        padding=True
    )

dataset = dataset.map(tokenize, batched=True)

dataset.set_format(
    "torch",
    columns=["input_ids", "attention_mask", "labels"]
)

# ------------------ Model ------------------
model = DistilBertForSequenceClassification.from_pretrained(
    "distilbert-base-uncased",
    num_labels=len(labels),
    id2label=id2label,
    label2id=label2id
)

# ------------------ Training ------------------
training_args = TrainingArguments(
    output_dir="./model",
    per_device_train_batch_size=4,  # smaller batch
    num_train_epochs=3,
    logging_steps=5,
    save_strategy="epoch",
    report_to="none",
)


trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset
)

trainer.train()

# ------------------ Save ------------------
model.save_pretrained("pharma_model")
tokenizer.save_pretrained("pharma_model")
