"""
RunPod script for evaluating letter prediction on both small and large language models.
Supports models like GPT-2 variants, GPT-Neo, and Llama models.
"""

import json
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModelForCausalLM
from tqdm import tqdm
import string
import os
import gc
import argparse
from datetime import datetime
import psutil
from collections import Counter

# Check available memory and device
def get_system_info():
    """Get system information."""
    device = "cuda" if torch.cuda.is_available() else "cpu"
    if device == "cuda":
        gpu_name = torch.cuda.get_device_name(0)
        gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1e9
        print(f"GPU: {gpu_name} ({gpu_memory:.1f} GB)")
    
    cpu_memory = psutil.virtual_memory().total / 1e9
    print(f"CPU Memory: {cpu_memory:.1f} GB")
    print(f"Using device: {device}")
    return device

# Model configurations
MODEL_CONFIGS = {
    # Small models (can run on most GPUs)
    "small": [
        "gpt2",
        "distilgpt2",
        "gpt2-medium",
        "gpt2-large",
        "gpt2-xl",
        "EleutherAI/gpt-neo-125M",
        "EleutherAI/gpt-neo-1.3B",
        "EleutherAI/gpt-neo-2.7B",
        "microsoft/DialoGPT-small",
        "microsoft/DialoGPT-medium",
        "microsoft/DialoGPT-large",
    ],
    # Medium models (need ~16GB GPU)
    "medium": [
        "EleutherAI/gpt-j-6B",
        "facebook/opt-6.7b",
        "facebook/opt-13b",
    ],
    # Large models (need 24GB+ GPU)
    "large": [
        "meta-llama/Llama-2-7b-hf",
        "meta-llama/Llama-2-13b-hf",
        "meta-llama/Meta-Llama-3-8B",
        "meta-llama/Meta-Llama-3.1-8B",
        "mistralai/Mistral-7B-v0.1",
        "tiiuae/falcon-7b",
    ]
}

def load_model_with_config(model_name, device, load_in_8bit=False, load_in_4bit=False):
    """Load model with appropriate configuration based on available memory."""
    print(f"\nLoading {model_name}...")
    
    # Token for gated models (set via environment variable)
    token = os.environ.get("HF_TOKEN", None)
    
    try:
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(model_name, token=token)
        
        # Determine loading strategy
        if "llama" in model_name.lower() or model_name in MODEL_CONFIGS["large"]:
            # For large models, use quantization
            if load_in_4bit:
                from transformers import BitsAndBytesConfig
                quantization_config = BitsAndBytesConfig(
                    load_in_4bit=True,
                    bnb_4bit_compute_dtype=torch.float16,
                    bnb_4bit_use_double_quant=True,
                    bnb_4bit_quant_type="nf4"
                )
                model = AutoModelForCausalLM.from_pretrained(
                    model_name,
                    quantization_config=quantization_config,
                    device_map="auto",
                    token=token
                )
            elif load_in_8bit:
                model = AutoModelForCausalLM.from_pretrained(
                    model_name,
                    load_in_8bit=True,
                    device_map="auto",
                    token=token
                )
            else:
                # Full precision with device_map for large models
                model = AutoModelForCausalLM.from_pretrained(
                    model_name,
                    torch_dtype=torch.float16,
                    device_map="auto",
                    token=token
                )
        else:
            # For smaller models, use standard loading
            dtype = torch.float16 if device == "cuda" else torch.float32
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=dtype,
                low_cpu_mem_usage=True,
                token=token
            ).to(device)
        
        model.eval()
        print(f"Successfully loaded {model_name}")
        return tokenizer, model
        
    except Exception as e:
        print(f"Error loading {model_name}: {e}")
        return None, None

def get_letter_probabilities_efficient(model, tokenizer, context, device):
    """Get letter probabilities more efficiently."""
    inputs = tokenizer(context, return_tensors="pt", truncation=True, max_length=512)
    
    # Move inputs to correct device
    if hasattr(model, 'device'):
        inputs = {k: v.to(model.device) for k, v in inputs.items()}
    else:
        inputs = {k: v.to(device) for k, v in inputs.items()}
    
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits[0, -1, :]
        probs = torch.softmax(logits, dim=-1)
    
    # Build letter to token mapping more efficiently
    letter_probs = {letter: 0.0 for letter in string.ascii_lowercase}
    
    # Only check a subset of vocabulary for efficiency
    vocab_size = min(len(tokenizer), 50000)
    
    # Batch decode tokens for efficiency
    batch_size = 1000
    for i in range(0, vocab_size, batch_size):
        batch_ids = list(range(i, min(i + batch_size, vocab_size)))
        tokens = tokenizer.convert_ids_to_tokens(batch_ids)
        
        for token_id, token in zip(batch_ids, tokens):
            if token:
                # Handle different tokenizer formats
                clean_token = token.replace("Ġ", "").replace("▁", "").strip().lower()
                if clean_token and clean_token[0] in string.ascii_lowercase:
                    letter_probs[clean_token[0]] += probs[token_id].item()
    
    return letter_probs

def evaluate_model(model_name, snapshots, device, args):
    """Evaluate a single model on all snapshots."""
    # Load model
    tokenizer, model = load_model_with_config(
        model_name, 
        device, 
        load_in_8bit=args.load_8bit,
        load_in_4bit=args.load_4bit
    )
    
    if model is None:
        return {
            'model': model_name,
            'error': 'Failed to load model'
        }
    
    scores = []
    failed_count = 0
    letters_before_correct = []  # Track letters guessed before correct one
    
    # Process snapshots
    for i, snapshot in enumerate(tqdm(snapshots, desc=f"Evaluating {model_name}")):
        try:
            context = snapshot['first_sentence'] + " " + snapshot['context']
            target_letter = snapshot['target_letter'].lower()
            
            # Get letter probabilities
            letter_probs = get_letter_probabilities_efficient(model, tokenizer, context, device)
            
            # Calculate rank and get letters before correct one
            sorted_letters = sorted(letter_probs.items(), key=lambda x: x[1], reverse=True)
            rank = 26  # Default worst case
            guessed_before = []
            
            for idx, (letter, prob) in enumerate(sorted_letters):
                if letter == target_letter:
                    rank = idx + 1
                    break
                else:
                    guessed_before.append(letter)
            
            score = np.log2(rank)
            scores.append(score)
            letters_before_correct.append(guessed_before)
            
            # Print example outputs periodically
            if i % 100 == 0 and i > 0:
                print(f"\nExample {i}: Target='{target_letter}', Rank={rank}")
                print(f"  Guessed before correct: {' '.join(guessed_before[:10])}" + 
                      (" ..." if len(guessed_before) > 10 else ""))
            
            # Clear cache periodically
            if device == "cuda" and i % 50 == 0:
                torch.cuda.empty_cache()
                
        except Exception as e:
            print(f"\nError on snapshot {i}: {e}")
            failed_count += 1
            continue
    
    # Clean up model
    del model
    if device == "cuda":
        torch.cuda.empty_cache()
    gc.collect()
    
    # Calculate statistics
    if scores:
        scores = np.array(scores)
        
        # Calculate letter frequency statistics
        all_guessed_letters = []
        for letters_list in letters_before_correct:
            all_guessed_letters.extend(letters_list[:5])  # Top 5 wrong guesses
        
        from collections import Counter
        letter_freq = Counter(all_guessed_letters)
        most_common_wrong = letter_freq.most_common(10)
        
        # Calculate average number of guesses before correct
        avg_guesses_before = np.mean([len(letters) for letters in letters_before_correct])
        
        return {
            'model': model_name,
            'num_samples': len(scores),
            'failed_samples': failed_count,
            'avg_optimistic': float(np.mean(scores)),
            'median_optimistic': float(np.median(scores)),
            'std_optimistic': float(np.std(scores)),
            'min_optimistic': float(np.min(scores)),
            'max_optimistic': float(np.max(scores)),
            'percentile_25': float(np.percentile(scores, 25)),
            'percentile_75': float(np.percentile(scores, 75)),
            'avg_guesses_before_correct': float(avg_guesses_before),
            'most_common_wrong_guesses': [{'letter': l, 'count': c} for l, c in most_common_wrong]
        }
    else:
        return {
            'model': model_name,
            'error': 'No valid scores computed'
        }

def main():
    parser = argparse.ArgumentParser(description='Evaluate language models on letter prediction')
    parser.add_argument('--models', type=str, default='small', 
                       choices=['small', 'medium', 'large', 'all', 'custom'],
                       help='Which model set to evaluate')
    parser.add_argument('--custom-models', type=str, nargs='+',
                       help='Custom model names to evaluate')
    parser.add_argument('--snapshots', type=str, default='prediction_snapshots.json',
                       help='Path to snapshots JSON file')
    parser.add_argument('--output', type=str, default='llm_prediction_scores_runpod.json',
                       help='Output file path')
    parser.add_argument('--num-samples', type=int, default=None,
                       help='Number of samples to evaluate (default: all)')
    parser.add_argument('--load-8bit', action='store_true',
                       help='Load models in 8-bit precision')
    parser.add_argument('--load-4bit', action='store_true',
                       help='Load models in 4-bit precision')
    
    args = parser.parse_args()
    
    # Get system info
    device = get_system_info()
    
    # Load snapshots
    print(f"\nLoading snapshots from {args.snapshots}...")
    with open(args.snapshots, 'r') as f:
        data = json.load(f)
    
    snapshots = data['snapshots']
    if args.num_samples:
        snapshots = snapshots[:args.num_samples]
    print(f"Loaded {len(snapshots)} snapshots")
    
    # Determine which models to evaluate
    if args.models == 'custom' and args.custom_models:
        models_to_eval = args.custom_models
    elif args.models == 'all':
        models_to_eval = MODEL_CONFIGS['small'] + MODEL_CONFIGS['medium'] + MODEL_CONFIGS['large']
    else:
        models_to_eval = MODEL_CONFIGS[args.models]
    
    print(f"\nWill evaluate {len(models_to_eval)} models")
    
    # Evaluate each model
    results = []
    timestamp = datetime.now().isoformat()
    
    for model_name in models_to_eval:
        print(f"\n{'='*60}")
        print(f"Evaluating: {model_name}")
        print(f"{'='*60}")
        
        result = evaluate_model(model_name, snapshots, device, args)
        results.append(result)
        
        # Save intermediate results
        output_data = {
            'metadata': {
                'timestamp': timestamp,
                'device': device,
                'num_snapshots': len(snapshots),
                'load_8bit': args.load_8bit,
                'load_4bit': args.load_4bit
            },
            'summary': {r['model']: r for r in results if 'error' not in r},
            'all_results': results
        }
        
        with open(args.output, 'w') as f:
            json.dump(output_data, f, indent=2)
        
        print(f"\nSaved results for {len(results)} models to {args.output}")
        
        # Print summary for this model
        if 'error' not in result:
            print(f"Summary for {model_name}:")
            print(f"  Average score: {result['avg_optimistic']:.3f} bits")
            print(f"  Median score: {result['median_optimistic']:.3f} bits")
            print(f"  Avg guesses before correct: {result['avg_guesses_before_correct']:.1f}")
            print(f"  Most common wrong guesses: {', '.join([f\"{g['letter']}({g['count']})\" for g in result['most_common_wrong_guesses'][:5]])}")
    
    # Final summary
    print(f"\n{'='*60}")
    print("FINAL RESULTS SUMMARY")
    print(f"{'='*60}")
    
    for result in results:
        if 'error' not in result:
            print(f"{result['model']:40s} | Avg: {result['avg_optimistic']:6.3f} | Med: {result['median_optimistic']:6.3f}")
        else:
            print(f"{result['model']:40s} | ERROR: {result.get('error', 'Unknown error')}")

if __name__ == "__main__":
    # Set HuggingFace cache directory if needed
    os.environ['HF_HOME'] = os.environ.get('HF_HOME', './hf_cache')
    
    # For gated models like Llama, set your HF token:
    # export HF_TOKEN=your_huggingface_token
    
    main()