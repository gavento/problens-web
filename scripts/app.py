"""
Minimal HuggingFace Space app for letter prediction.
Works on both CPU and GPU with proper error handling.
"""

import gradio as gr
import json
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModelForCausalLM
import string

# Check device availability
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Starting app on {DEVICE}")

def evaluate_single_example(model_name: str, context: str, target_letter: str):
    """Evaluate a single example with a specific model."""
    try:
        if not context or not target_letter:
            return {"error": "Please provide both context and target letter"}
        
        if len(target_letter) != 1 or not target_letter.isalpha():
            return {"error": "Target must be a single letter"}
        
        # Load model
        print(f"Loading {model_name}...")
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        
        # Use appropriate dtype for device
        dtype = torch.float16 if DEVICE == "cuda" else torch.float32
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=dtype,
            low_cpu_mem_usage=True
        ).to(DEVICE)
        model.eval()
        
        # Tokenize
        inputs = tokenizer(context, return_tensors="pt", truncation=True, max_length=512).to(DEVICE)
        
        # Get predictions
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits[0, -1, :]
            probs = torch.softmax(logits, dim=-1)
        
        # Calculate letter probabilities
        letter_probs = {}
        vocab_size = min(len(tokenizer), 50000)  # Limit for efficiency
        
        for letter in string.ascii_lowercase:
            letter_probs[letter] = 0.0
        
        for token_id in range(vocab_size):
            token = tokenizer.decode([token_id])
            clean_token = token.strip().lower()
            if clean_token and clean_token[0] in string.ascii_lowercase:
                first_letter = clean_token[0]
                letter_probs[first_letter] += probs[token_id].item()
        
        # Find rank of target letter
        sorted_letters = sorted(letter_probs.items(), key=lambda x: x[1], reverse=True)
        target_letter_lower = target_letter.lower()
        rank = 26
        
        for i, (letter, prob) in enumerate(sorted_letters):
            if letter == target_letter_lower:
                rank = i + 1
                break
        
        score = np.log2(rank)
        
        # Get top 5 predictions
        top_5 = sorted_letters[:5]
        top_predictions = [f"{letter}: {prob:.3f}" for letter, prob in top_5]
        
        # Clean up
        del model
        if DEVICE == "cuda":
            torch.cuda.empty_cache()
        
        return {
            "model": model_name,
            "score": f"{score:.2f} bits",
            "rank": rank,
            "top_5_predictions": ", ".join(top_predictions),
            "target_probability": f"{letter_probs.get(target_letter_lower, 0):.3f}"
        }
        
    except Exception as e:
        print(f"Error: {e}")
        return {"error": str(e)}

# Create simple interface
with gr.Blocks(title="Letter Prediction Evaluator") as app:
    gr.Markdown("# Letter Prediction Evaluator")
    gr.Markdown(f"**Device: {DEVICE.upper()}**")
    
    with gr.Row():
        with gr.Column():
            model_name = gr.Textbox(
                label="Model Name",
                value="gpt2",
                placeholder="e.g., gpt2, distilgpt2"
            )
            context = gr.Textbox(
                label="Context",
                placeholder="The quick brown fox jumps over the lazy"
            )
            target = gr.Textbox(
                label="Target Letter",
                placeholder="d",
                max_lines=1
            )
            button = gr.Button("Evaluate")
        
        with gr.Column():
            output = gr.JSON(label="Results")
    
    button.click(
        evaluate_single_example,
        inputs=[model_name, context, target],
        outputs=output
    )

if __name__ == "__main__":
    app.launch()