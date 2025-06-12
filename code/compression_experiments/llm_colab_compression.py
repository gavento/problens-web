#!/usr/bin/env python3
"""
LLM Compression Analysis for Google Colab
Supports both Llama-3.1-8B and GPT-2 with sliding window compression

To use in Google Colab:
1. Upload this script and the texts/ folder to Colab
2. Run: pip install transformers torch tqdm
3. Run this script
4. Download the results JSON file when complete

Expected runtime: 30-90 minutes depending on GPU and model
Memory requirement: ~16GB GPU RAM for Llama-3.1-8B (use A100 or T4)
"""

import json
import math
import time
import os
from datetime import datetime
from pathlib import Path

import torch
from transformers import (
    AutoTokenizer, AutoModelForCausalLM, AutoConfig,
    GPT2LMHeadModel, GPT2Tokenizer
)
from tqdm import tqdm

def load_text_samples():
    """Load text samples from texts/ directory and list.json."""
    texts_dir = Path("texts")
    list_file = texts_dir / "list.json"
    
    if not list_file.exists():
        raise FileNotFoundError(f"Text list file not found: {list_file}")
    
    with open(list_file, 'r') as f:
        sample_configs = json.load(f)
    
    samples = {}
    for config in sample_configs:
        filename = config["filename"]
        filepath = texts_dir / filename
        
        if not filepath.exists():
            print(f"⚠️  Warning: {filepath} not found, skipping")
            continue
        
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read().strip()
        
        # Use filename without extension as key
        key = filepath.stem
        samples[key] = {
            "text": text,
            "name": config["name"],
            "description": config["description"],
            "filename": filename
        }
        print(f"✅ Loaded {key}: {len(text)} characters")
    
    return samples

def setup_huggingface_auth():
    """Setup HuggingFace authentication for gated models."""
    try:
        from google.colab import userdata
        hf_token = userdata.get('HF_TOKEN')
        print("✅ Found HF_TOKEN in Colab secrets")
    except:
        print("⚠️  HF_TOKEN not found in Colab secrets")
        hf_token = input("Please enter your HuggingFace token: ")
    
    if hf_token:
        from huggingface_hub import login
        login(token=hf_token)
        print("✅ Logged into HuggingFace")
    
    return hf_token

def load_llama_model(hf_token=None):
    """Load Llama-3.1-8B model."""
    model_name = "meta-llama/Llama-3.1-8B"
    print(f"🦙 Loading {model_name}...")
    
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_name, token=hf_token)
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            token=hf_token,
            torch_dtype=torch.float16,
            device_map="auto",
            trust_remote_code=True
        )
        
        # Set pad token if not present
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
            
        print(f"✅ Loaded {model_name}")
        return model, tokenizer, model_name
        
    except Exception as e:
        print(f"❌ Failed to load {model_name}: {e}")
        raise

def load_gpt2_model():
    """Load GPT-2 model."""
    model_name = "gpt2"
    print(f"🤖 Loading {model_name}...")
    
    tokenizer = GPT2Tokenizer.from_pretrained(model_name)
    model = GPT2LMHeadModel.from_pretrained(model_name)
    
    # Set pad token
    tokenizer.pad_token = tokenizer.eos_token
    
    # Move to GPU if available
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = model.to(device)
    model.eval()
    
    print(f"✅ Loaded {model_name}")
    return model, tokenizer, model_name

def compute_compression_with_sliding_window(text, model, tokenizer, model_name, max_context=1023):
    """Compute compression using sliding window approach for full text."""
    if not text:
        return 0, 0
    
    # Get device
    device = next(model.parameters()).device
    
    # Tokenize the ENTIRE text (no truncation)
    inputs = tokenizer(text, return_tensors="pt", truncation=False)
    input_ids = inputs["input_ids"].squeeze(0)  # Remove batch dimension
    
    if len(input_ids) <= 1:
        return len(text) * 8, len(input_ids)  # Fallback to naive compression
    
    total_log_prob = 0.0
    
    print(f"   🔄 Processing {len(input_ids)} tokens with sliding window...")
    
    # Process each token with sliding window context
    for i in tqdm(range(1, len(input_ids)), 
                  desc=f"   {model_name} compression", 
                  unit="tokens",
                  disable=False):
        # Get context window: up to max_context previous tokens
        start_idx = max(0, i - max_context)
        context_ids = input_ids[start_idx:i].unsqueeze(0).to(device)  # Add batch dimension
        
        # Get model predictions for this context
        with torch.no_grad():
            outputs = model(context_ids)
            logits = outputs.logits[0, -1, :]  # Get logits for the last position
        
        # Get probabilities
        token_probs = torch.softmax(logits, dim=-1)
        
        # Get actual next token
        actual_token = input_ids[i].item()
        
        # Get probability of actual token
        token_prob = token_probs[actual_token].item()
        
        # Add log probability (convert to bits: log2)
        if token_prob > 0:
            total_log_prob += math.log2(token_prob)
    
    # Total bits needed = -log probability
    total_bits = -total_log_prob
    num_tokens = len(input_ids) - 1  # Exclude first token (no prediction)
    
    return total_bits, num_tokens

def run_compression_experiments():
    """Run compression experiments on all text samples with both models."""
    print("🚀 Starting LLM Compression Experiments")
    print("=" * 60)
    
    # Setup
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    # Load text samples
    print("\n📄 Loading text samples...")
    samples = load_text_samples()
    
    if not samples:
        print("❌ No text samples found!")
        return
    
    # Setup HuggingFace auth for Llama
    print("\n🔐 Setting up HuggingFace authentication...")
    hf_token = setup_huggingface_auth()
    
    # Experiment configurations
    experiments = [
        {
            "name": "GPT-2",
            "loader": lambda: load_gpt2_model(),
            "max_context": 1023
        },
        {
            "name": "Llama-3.1-8B", 
            "loader": lambda: load_llama_model(hf_token),
            "max_context": 8191  # Llama has larger context window
        }
    ]
    
    all_results = {}
    
    for exp_config in experiments:
        exp_name = exp_config["name"]
        print(f"\n{'='*60}")
        print(f"🧮 Running {exp_name} experiments")
        print(f"{'='*60}")
        
        try:
            # Load model
            model, tokenizer, model_name = exp_config["loader"]()
            max_context = exp_config["max_context"]
            
            # Run experiments on each sample
            model_results = {}
            
            for key, sample in samples.items():
                text = sample["text"]
                print(f"\n📊 Processing: {sample['name']}")
                print(f"   File: {sample['filename']}")
                print(f"   Length: {len(text)} characters")
                
                try:
                    start_time = time.time()
                    
                    # Compute compression
                    total_bits, num_tokens = compute_compression_with_sliding_window(
                        text, model, tokenizer, model_name, max_context
                    )
                    
                    elapsed = time.time() - start_time
                    
                    # Calculate metrics
                    original_bits = len(text) * 8
                    compression_ratio = original_bits / total_bits if total_bits > 0 else 1.0
                    
                    print(f"   ✅ {model_name}: {total_bits:.0f} bits ({compression_ratio:.2f}x)")
                    print(f"   ⏱️  Time: {elapsed:.1f}s, Tokens: {num_tokens}")
                    
                    model_results[key] = {
                        "name": sample["name"],
                        "description": sample["description"],
                        "filename": sample["filename"],
                        "text_length": len(text),
                        "model_name": model_name,
                        "total_bits": round(total_bits),
                        "original_bits": original_bits,
                        "compression_ratio": round(compression_ratio, 2),
                        "num_tokens": num_tokens,
                        "processing_time": round(elapsed, 1),
                        "timestamp": datetime.now().isoformat()
                    }
                    
                except Exception as e:
                    print(f"   ❌ Error processing {key}: {e}")
                    model_results[key] = {
                        "name": sample["name"],
                        "description": sample["description"],
                        "filename": sample["filename"],
                        "model_name": model_name,
                        "error": str(e),
                        "timestamp": datetime.now().isoformat()
                    }
            
            all_results[exp_name] = model_results
            
            # Clear GPU memory
            del model, tokenizer
            torch.cuda.empty_cache()
            
        except Exception as e:
            print(f"❌ Failed to run {exp_name} experiments: {e}")
            all_results[exp_name] = {"error": str(e)}
    
    # Save results
    output_file = f"llm_compression_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_file, 'w') as f:
        json.dump(all_results, f, indent=2)
    
    print(f"\n💾 Results saved to: {output_file}")
    
    # Print summary
    print(f"\n📋 SUMMARY")
    print("=" * 60)
    
    for exp_name, results in all_results.items():
        if "error" in results:
            print(f"{exp_name}: Failed - {results['error']}")
            continue
            
        successful = [k for k, v in results.items() if "error" not in v]
        if successful:
            avg_ratio = sum(results[k]["compression_ratio"] for k in successful) / len(successful)
            print(f"{exp_name}: {avg_ratio:.2f}x average compression ({len(successful)}/{len(samples)} samples)")
    
    print(f"\n✅ All experiments complete!")
    return all_results

if __name__ == "__main__":
    # Install required packages if not present
    try:
        import transformers
        import tqdm
    except ImportError:
        print("Installing required packages...")
        import subprocess
        subprocess.run(["pip", "install", "transformers", "torch", "tqdm", "huggingface-hub"])
        print("Packages installed. Please restart runtime and run again.")
        exit()
    
    run_compression_experiments()