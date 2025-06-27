"""
HuggingFace Space app for computing letter prediction scores.
This version properly handles GPU availability and includes error handling.
"""

import gradio as gr
import json
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModelForCausalLM
import string
from typing import Dict, List
import pandas as pd
import os
import gc

# Check if GPU is available
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {DEVICE}")

# Available models (start with smaller ones for HF Space)
AVAILABLE_MODELS = [
    "gpt2",
    "distilgpt2",
    "gpt2-medium",
    "microsoft/DialoGPT-small",
    "EleutherAI/gpt-neo-125M",
]

# Model cache to avoid reloading
MODEL_CACHE = {}

def get_or_load_model(model_name: str):
    """Load model from cache or download it."""
    if model_name not in MODEL_CACHE:
        try:
            print(f"Loading {model_name}...")
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=torch.float16 if DEVICE == "cuda" else torch.float32,
                low_cpu_mem_usage=True
            ).to(DEVICE)
            model.eval()
            MODEL_CACHE[model_name] = (tokenizer, model)
            print(f"Loaded {model_name} successfully")
        except Exception as e:
            print(f"Error loading {model_name}: {e}")
            raise e
    return MODEL_CACHE[model_name]

def clear_gpu_memory():
    """Clear GPU memory to prevent OOM errors."""
    if DEVICE == "cuda":
        torch.cuda.empty_cache()
        gc.collect()

def get_letter_probabilities(model, tokenizer, context: str) -> Dict[str, float]:
    """Get probability distribution over next letter given context."""
    try:
        inputs = tokenizer(context, return_tensors="pt", truncation=True, max_length=512).to(DEVICE)
        
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits[0, -1, :]
            probs = torch.softmax(logits, dim=-1)
        
        letter_probs = {}
        for letter in string.ascii_lowercase:
            letter_token_ids = []
            for token_id in range(min(len(tokenizer), 50000)):  # Limit search for efficiency
                try:
                    token = tokenizer.decode([token_id])
                    if token.strip().lower().startswith(letter):
                        letter_token_ids.append(token_id)
                except:
                    continue
            
            if letter_token_ids:
                letter_prob = probs[letter_token_ids].sum().item()
                letter_probs[letter] = letter_prob
            else:
                letter_probs[letter] = 0.0
        
        return letter_probs
    except Exception as e:
        print(f"Error in get_letter_probabilities: {e}")
        raise e

def compute_optimistic_score(letter_probs: Dict[str, float], target_letter: str) -> float:
    """Compute optimistic score: if target letter is k-th most likely, score = log2(k)."""
    sorted_letters = sorted(letter_probs.items(), key=lambda x: x[1], reverse=True)
    
    target_letter = target_letter.lower()
    rank = 26  # Default worst case
    
    for i, (letter, prob) in enumerate(sorted_letters):
        if letter == target_letter:
            rank = i + 1
            break
    
    return np.log2(rank)

def evaluate_single_example(model_name: str, context: str, target_letter: str):
    """Evaluate a single example with a specific model."""
    try:
        if not context or not target_letter:
            return {"error": "Please provide both context and target letter"}
        
        if len(target_letter) != 1 or not target_letter.isalpha():
            return {"error": "Target must be a single letter"}
        
        tokenizer, model = get_or_load_model(model_name)
        
        letter_probs = get_letter_probabilities(model, tokenizer, context)
        score = compute_optimistic_score(letter_probs, target_letter)
        
        # Get top 5 predictions
        sorted_letters = sorted(letter_probs.items(), key=lambda x: x[1], reverse=True)[:5]
        top_predictions = [f"{letter}: {prob:.3f}" for letter, prob in sorted_letters]
        
        result = {
            "model": model_name,
            "score": f"{score:.2f} bits",
            "rank": int(2**score),
            "top_5_predictions": ", ".join(top_predictions),
            "target_probability": f"{letter_probs.get(target_letter.lower(), 0):.3f}"
        }
        
        clear_gpu_memory()
        return result
        
    except Exception as e:
        return {
            "model": model_name,
            "error": str(e)
        }

def batch_evaluate(snapshots_json: str, model_names: List[str], num_samples: int = 10):
    """Evaluate multiple models on a batch of snapshots."""
    try:
        # Parse snapshots
        if not snapshots_json.strip():
            return "Please provide snapshots JSON data"
        
        data = json.loads(snapshots_json)
        snapshots = data.get('snapshots', [])[:num_samples]
        
        if not snapshots:
            return "No snapshots found in the JSON data"
        
        results = []
        
        for model_name in model_names:
            model_scores = []
            
            try:
                tokenizer, model = get_or_load_model(model_name)
                
                for i, snapshot in enumerate(snapshots):
                    try:
                        context = snapshot['first_sentence'] + " " + snapshot['context']
                        target_letter = snapshot['target_letter']
                        
                        letter_probs = get_letter_probabilities(model, tokenizer, context)
                        score = compute_optimistic_score(letter_probs, target_letter)
                        model_scores.append(score)
                        
                        # Clear memory periodically
                        if i % 5 == 0:
                            clear_gpu_memory()
                    except Exception as e:
                        print(f"Error processing snapshot {i}: {e}")
                        continue
                
                if model_scores:
                    avg_score = np.mean(model_scores)
                    median_score = np.median(model_scores)
                    
                    results.append({
                        "Model": model_name,
                        "Avg Score (bits)": f"{avg_score:.2f}",
                        "Median Score (bits)": f"{median_score:.2f}",
                        "Samples": len(model_scores)
                    })
                else:
                    results.append({
                        "Model": model_name,
                        "Error": "No valid scores computed"
                    })
                
            except Exception as e:
                results.append({
                    "Model": model_name,
                    "Error": str(e)
                })
            
            # Clear memory after each model
            clear_gpu_memory()
        
        # Convert to DataFrame for nice display
        df = pd.DataFrame(results)
        return df
        
    except json.JSONDecodeError:
        return "Invalid JSON format. Please check your input."
    except Exception as e:
        return f"Error: {str(e)}"

# Gradio interface
def create_interface():
    with gr.Blocks(title="Letter Prediction Model Evaluator") as app:
        gr.Markdown("# Letter Prediction Model Evaluator")
        gr.Markdown(f"Evaluate how well language models predict the next letter in Wikipedia sentences.")
        gr.Markdown(f"**Running on: {DEVICE.upper()}**")
        
        with gr.Tab("Single Example"):
            with gr.Row():
                with gr.Column():
                    model_dropdown = gr.Dropdown(
                        choices=AVAILABLE_MODELS,
                        value="gpt2",
                        label="Select Model"
                    )
                    context_input = gr.Textbox(
                        label="Context (text before the missing letter)",
                        placeholder="The quick brown fox jumps over the lazy"
                    )
                    target_input = gr.Textbox(
                        label="Target Letter",
                        placeholder="d",
                        max_lines=1
                    )
                    eval_button = gr.Button("Evaluate")
                
                with gr.Column():
                    output = gr.JSON(label="Results")
            
            eval_button.click(
                evaluate_single_example,
                inputs=[model_dropdown, context_input, target_input],
                outputs=output
            )
        
        with gr.Tab("Batch Evaluation"):
            with gr.Row():
                with gr.Column():
                    models_checkbox = gr.CheckboxGroup(
                        choices=AVAILABLE_MODELS,
                        value=["gpt2", "distilgpt2"],
                        label="Select Models to Evaluate"
                    )
                    snapshots_input = gr.Textbox(
                        label="Snapshots JSON",
                        placeholder='{"snapshots": [...]}',
                        lines=10
                    )
                    num_samples = gr.Slider(
                        minimum=1,
                        maximum=100,
                        value=10,
                        step=1,
                        label="Number of samples to evaluate"
                    )
                    batch_button = gr.Button("Evaluate Batch")
                
                with gr.Column():
                    batch_output = gr.DataFrame(label="Results")
            
            batch_button.click(
                batch_evaluate,
                inputs=[snapshots_input, models_checkbox, num_samples],
                outputs=batch_output
            )
        
        gr.Markdown("""
        ## How it works:
        1. The model predicts probabilities for each letter
        2. We rank letters by probability and find the target letter's rank
        3. Score = log₂(rank) - lower is better!
        4. A score of 0 means the model's top choice was correct
        """)
    
    return app

if __name__ == "__main__":
    # Set HF cache directory if needed
    os.environ['HF_HOME'] = './cache'
    
    app = create_interface()
    app.launch()