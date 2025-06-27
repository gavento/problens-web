"""
HuggingFace Space app with batch processing for letter prediction.
"""

import gradio as gr
import json
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModelForCausalLM
import string
import pandas as pd
from typing import List, Dict

# Check device availability
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Starting app on {DEVICE}")

# Cache for models to avoid reloading
MODEL_CACHE = {}

def get_or_load_model(model_name: str):
    """Load model from cache or download it."""
    if model_name not in MODEL_CACHE:
        print(f"Loading {model_name}...")
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        dtype = torch.float16 if DEVICE == "cuda" else torch.float32
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=dtype,
            low_cpu_mem_usage=True
        ).to(DEVICE)
        model.eval()
        MODEL_CACHE[model_name] = (tokenizer, model)
    return MODEL_CACHE[model_name]

def compute_letter_scores(tokenizer, model, context: str, target_letter: str):
    """Compute score for a single example."""
    inputs = tokenizer(context, return_tensors="pt", truncation=True, max_length=512).to(DEVICE)
    
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits[0, -1, :]
        probs = torch.softmax(logits, dim=-1)
    
    # Calculate letter probabilities
    letter_probs = {}
    vocab_size = min(len(tokenizer), 50000)
    
    for letter in string.ascii_lowercase:
        letter_probs[letter] = 0.0
    
    for token_id in range(vocab_size):
        token = tokenizer.decode([token_id])
        clean_token = token.strip().lower()
        if clean_token and clean_token[0] in string.ascii_lowercase:
            first_letter = clean_token[0]
            letter_probs[first_letter] += probs[token_id].item()
    
    # Find rank
    sorted_letters = sorted(letter_probs.items(), key=lambda x: x[1], reverse=True)
    target_letter_lower = target_letter.lower()
    rank = 26
    
    for i, (letter, prob) in enumerate(sorted_letters):
        if letter == target_letter_lower:
            rank = i + 1
            break
    
    return np.log2(rank), rank, letter_probs

def evaluate_single_example(model_name: str, context: str, target_letter: str):
    """Evaluate a single example."""
    try:
        if not context or not target_letter:
            return {"error": "Please provide both context and target letter"}
        
        if len(target_letter) != 1 or not target_letter.isalpha():
            return {"error": "Target must be a single letter"}
        
        tokenizer, model = get_or_load_model(model_name)
        score, rank, letter_probs = compute_letter_scores(tokenizer, model, context, target_letter)
        
        # Get top 5 predictions
        sorted_letters = sorted(letter_probs.items(), key=lambda x: x[1], reverse=True)[:5]
        top_predictions = [f"{letter}: {prob:.3f}" for letter, prob in sorted_letters]
        
        return {
            "model": model_name,
            "score": f"{score:.2f} bits",
            "rank": rank,
            "top_5_predictions": ", ".join(top_predictions),
            "target_probability": f"{letter_probs.get(target_letter.lower(), 0):.3f}"
        }
        
    except Exception as e:
        return {"error": str(e)}

def batch_evaluate(snapshots_json: str, model_names: str, num_samples: int):
    """Evaluate multiple models on batch of snapshots."""
    try:
        # Parse inputs
        data = json.loads(snapshots_json)
        snapshots = data.get('snapshots', [])[:num_samples]
        
        if not snapshots:
            return pd.DataFrame({"Error": ["No snapshots found"]})
        
        # Parse model names (comma-separated)
        models = [m.strip() for m in model_names.split(',') if m.strip()]
        if not models:
            return pd.DataFrame({"Error": ["No models specified"]})
        
        results = []
        
        for model_name in models:
            try:
                tokenizer, model = get_or_load_model(model_name)
                scores = []
                
                for i, snapshot in enumerate(snapshots):
                    try:
                        context = snapshot['first_sentence'] + " " + snapshot['context']
                        target = snapshot['target_letter']
                        
                        score, _, _ = compute_letter_scores(tokenizer, model, context, target)
                        scores.append(score)
                        
                        # Clear GPU memory periodically
                        if DEVICE == "cuda" and i % 10 == 0:
                            torch.cuda.empty_cache()
                    
                    except Exception as e:
                        print(f"Error on snapshot {i}: {e}")
                
                if scores:
                    results.append({
                        "Model": model_name,
                        "Samples": len(scores),
                        "Avg Score": f"{np.mean(scores):.3f}",
                        "Median Score": f"{np.median(scores):.3f}",
                        "Min Score": f"{np.min(scores):.3f}",
                        "Max Score": f"{np.max(scores):.3f}",
                        "Std Dev": f"{np.std(scores):.3f}"
                    })
            
            except Exception as e:
                results.append({
                    "Model": model_name,
                    "Error": str(e)
                })
        
        # Also save full results as JSON
        output_data = {
            "summary": {r["Model"]: r for r in results if "Error" not in r},
            "num_snapshots": len(snapshots)
        }
        
        with open('/tmp/llm_scores.json', 'w') as f:
            json.dump(output_data, f, indent=2)
        
        return pd.DataFrame(results)
        
    except json.JSONDecodeError:
        return pd.DataFrame({"Error": ["Invalid JSON format"]})
    except Exception as e:
        return pd.DataFrame({"Error": [str(e)]})

# Create interface with both modes
with gr.Blocks(title="Letter Prediction Evaluator") as app:
    gr.Markdown("# Letter Prediction Evaluator")
    gr.Markdown(f"**Running on: {DEVICE.upper()}**")
    
    with gr.Tab("Single Evaluation"):
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
    
    with gr.Tab("Batch Evaluation"):
        gr.Markdown("### Batch Process Multiple Models")
        gr.Markdown("Paste your prediction_snapshots.json content below")
        
        with gr.Row():
            with gr.Column():
                models_input = gr.Textbox(
                    label="Model Names (comma-separated)",
                    value="gpt2, distilgpt2, gpt2-medium",
                    placeholder="gpt2, distilgpt2, microsoft/DialoGPT-small"
                )
                snapshots_input = gr.Textbox(
                    label="Snapshots JSON",
                    placeholder='{"snapshots": [...]}',
                    lines=10
                )
                num_samples = gr.Slider(
                    minimum=1,
                    maximum=1000,
                    value=100,
                    step=10,
                    label="Number of samples to evaluate"
                )
                batch_button = gr.Button("Evaluate Batch", variant="primary")
            
            with gr.Column():
                batch_output = gr.DataFrame(label="Results")
                gr.Markdown("Results are also saved to `/tmp/llm_scores.json`")
        
        batch_button.click(
            batch_evaluate,
            inputs=[snapshots_input, models_input, num_samples],
            outputs=batch_output
        )
    
    gr.Markdown("""
    ### Models you can try:
    - gpt2, distilgpt2, gpt2-medium, gpt2-large
    - EleutherAI/gpt-neo-125M, EleutherAI/gpt-neo-1.3B
    - microsoft/DialoGPT-small, microsoft/DialoGPT-medium
    """)

if __name__ == "__main__":
    app.launch()