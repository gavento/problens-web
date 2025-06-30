#!/usr/bin/env python3
"""
Improved letter prediction evaluation for language models.
Uses proper tokenization that respects token boundaries.
"""

import json
import time
import argparse
import os
from collections import defaultdict, Counter
import string
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from tqdm import tqdm
import numpy as np
from typing import Dict, List, Tuple
import warnings
warnings.filterwarnings('ignore')

# Model groups for easy selection
MODEL_GROUPS = {
    'small': [
        'gpt2',
        # 'distilgpt2', 
        # 'gpt2-medium',
        # 'gpt2-large',
        # 'gpt2-xl',
        # 'EleutherAI/gpt-neo-125M',
        # 'EleutherAI/gpt-neo-1.3B',
        # 'EleutherAI/gpt-neo-2.7B',
        # 'microsoft/DialoGPT-small',
        # 'microsoft/DialoGPT-medium',
        # 'microsoft/DialoGPT-large',
    ],
    'medium': [
        'EleutherAI/gpt-j-6B',
        # 'facebook/opt-6.7b',
        # 'facebook/opt-13b',
    ],
    'large': [
        # 'meta-llama/Llama-2-7b-hf',
        # 'meta-llama/Llama-2-13b-hf', 
        # 'meta-llama/Meta-Llama-3-8B',
        'meta-llama/Meta-Llama-3.1-8B',
        # 'mistralai/Mistral-7B-v0.1',
        # 'tiiuae/falcon-7b',
    ]
}

def get_device_info():
    """Get GPU/CPU info."""
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        gpu_memory = torch.cuda.get_device_properties(0).total_memory / (1024**3)
        print(f"GPU: {gpu_name} ({gpu_memory:.1f} GB)")
    else:
        print("GPU: Not available")
    
    try:
        import psutil
        cpu_memory = psutil.virtual_memory().total / (1024**3)
        print(f"CPU Memory: {cpu_memory:.1f} GB")
    except:
        pass

def load_model_with_config(model_name, device, load_in_8bit=False, load_in_4bit=False):
    """Load model with appropriate configuration."""
    try:
        # Get HF token from environment
        token = os.environ.get('HF_TOKEN', None)
        
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(model_name, token=token)
        
        # Configure quantization if requested
        bnb_config = None
        if load_in_8bit:
            bnb_config = BitsAndBytesConfig(load_in_8bit=True)
        elif load_in_4bit:
            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type="nf4"
            )
        
        # Load model
        if bnb_config:
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                quantization_config=bnb_config,
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

def find_token_cut_position(tokenizer, text: str, char_cut_position: int) -> Tuple[List[int], str, int]:
    """
    Find where the cut falls in the token sequence.
    
    Returns:
        - tokens_before: List of token IDs before the cut
        - prefix: The prefix of the cut token that comes before the cut
        - prefix_length: Length of the prefix
    """
    # Tokenize the full text
    full_tokens = tokenizer.encode(text, add_special_tokens=False)
    
    # Reconstruct text token by token to find cut position
    current_pos = 0
    
    for i, token_id in enumerate(full_tokens):
        token_text = tokenizer.decode([token_id], skip_special_tokens=True)
        token_start = current_pos
        token_end = current_pos + len(token_text)
        
        if token_start <= char_cut_position < token_end:
            # Cut falls within this token
            tokens_before = full_tokens[:i]
            
            # How many characters of this token come before the cut?
            chars_in_token_before_cut = char_cut_position - token_start
            prefix = token_text[:chars_in_token_before_cut]
            
            return tokens_before, prefix, chars_in_token_before_cut
        
        current_pos = token_end
    
    # Cut is at the very end
    return full_tokens, "", 0

def get_letter_probabilities_proper(model, tokenizer, snapshot, device, top_k=1000):
    """
    Get letter probabilities using proper tokenization.
    """
    # Construct the full text
    full_text = snapshot['first_sentence'] + ". " + snapshot['second_sentence']
    
    # Find cut position in characters
    first_sentence_length = len(snapshot['first_sentence']) + 2  # +2 for ". "
    cut_char_position = first_sentence_length + snapshot['cut_position']
    
    # Find where this falls in the token sequence
    tokens_before, prefix, prefix_length = find_token_cut_position(
        tokenizer, full_text, cut_char_position
    )
    
    if not tokens_before:
        # Handle edge case where cut is at the very beginning
        tokens_before = [tokenizer.bos_token_id] if tokenizer.bos_token_id else []
    
    # Get model predictions
    input_ids = torch.tensor([tokens_before], dtype=torch.long).to(device)
    
    with torch.no_grad():
        outputs = model(input_ids)
        logits = outputs.logits[0, -1, :]
        probs = torch.softmax(logits, dim=-1)
    
    # Get top-k most likely tokens
    top_k_probs, top_k_indices = torch.topk(probs, min(top_k, len(probs)))
    
    # Aggregate probabilities by next letter
    letter_probs = defaultdict(float)
    
    for prob, token_id in zip(top_k_probs, top_k_indices):
        token_text = tokenizer.decode([token_id], skip_special_tokens=True)
        
        # Check if this token could follow our prefix
        if token_text.startswith(prefix):
            # Get the next character after the prefix
            if len(token_text) > prefix_length:
                next_char = token_text[prefix_length].lower()
                if next_char in string.ascii_lowercase:
                    letter_probs[next_char] += prob.item()
        elif prefix == "":
            # No prefix, so we're at a token boundary
            if token_text and token_text[0].lower() in string.ascii_lowercase:
                letter_probs[token_text[0].lower()] += prob.item()
    
    return dict(letter_probs)

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
    letters_before_correct = []
    all_ranks = []
    
    # Limit number of samples if specified
    eval_snapshots = snapshots[:args.num_samples] if args.num_samples else snapshots
    
    # Process snapshots
    for snapshot in tqdm(eval_snapshots, desc=f"Evaluating {model_name}"):
        try:
            target_letter = snapshot['target_letter'].lower()
            
            # Get letter probabilities using proper tokenization
            letter_probs = get_letter_probabilities_proper(
                model, tokenizer, snapshot, device, top_k=args.top_k
            )
            
            # Calculate rank
            sorted_letters = sorted(letter_probs.items(), key=lambda x: x[1], reverse=True)
            rank = 26  # Default worst case
            guessed_before = []
            
            for idx, (letter, prob) in enumerate(sorted_letters):
                if letter == target_letter:
                    rank = idx + 1
                    break
                guessed_before.append(letter)
            
            # Calculate score (optimistic - using rank)
            score = np.log2(rank)
            scores.append(score)
            all_ranks.append(rank)
            letters_before_correct.extend(guessed_before)
            
        except Exception as e:
            print(f"\nError processing snapshot {snapshot.get('id', '?')}: {e}")
            failed_count += 1
            continue
    
    # Clean up model
    del model
    if device == "cuda":
        torch.cuda.empty_cache()
    
    # Calculate statistics
    if scores:
        # Count frequency of wrong guesses
        wrong_guess_counts = Counter(letters_before_correct)
        most_common_wrong = [
            {'letter': letter, 'count': count} 
            for letter, count in wrong_guess_counts.most_common(10)
        ]
        
        result = {
            'model': model_name,
            'num_samples': len(scores),
            'failed_samples': failed_count,
            'avg_optimistic': float(np.mean(scores)),
            'std_optimistic': float(np.std(scores)),
            'median_optimistic': float(np.median(scores)),
            'min_score': float(np.min(scores)),
            'max_score': float(np.max(scores)),
            'avg_rank': float(np.mean(all_ranks)),
            'median_rank': float(np.median(all_ranks)),
            'perfect_predictions': sum(1 for r in all_ranks if r == 1),
            'top5_predictions': sum(1 for r in all_ranks if r <= 5),
            'avg_guesses_before_correct': float(np.mean([r-1 for r in all_ranks])),
            'most_common_wrong_guesses': most_common_wrong
        }
    else:
        result = {
            'model': model_name,
            'error': 'No successful evaluations'
        }
    
    return result

def main():
    parser = argparse.ArgumentParser(description='Evaluate language models on letter prediction task')
    parser.add_argument('--models', choices=['small', 'medium', 'large', 'all', 'custom'], 
                        default='small', help='Which model group to evaluate')
    parser.add_argument('--custom-models', nargs='+', help='Specific models to evaluate')
    parser.add_argument('--snapshots', default='prediction_snapshots.json', 
                        help='Path to snapshots JSON file')
    parser.add_argument('--output', default='llm_scores.json', help='Output file for results')
    parser.add_argument('--num-samples', type=int, help='Limit number of samples to evaluate')
    parser.add_argument('--load-8bit', action='store_true', help='Load models in 8-bit')
    parser.add_argument('--load-4bit', action='store_true', help='Load models in 4-bit')
    parser.add_argument('--top-k', type=int, default=1000, 
                        help='Number of top tokens to consider (default: 1000)')
    args = parser.parse_args()
    
    # Show system info
    get_device_info()
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}\n")
    
    # Load snapshots
    print(f"Loading snapshots from {args.snapshots}...")
    with open(args.snapshots, 'r') as f:
        data = json.load(f)
    snapshots = data['snapshots']
    print(f"Loaded {len(snapshots)} snapshots\n")
    
    # Determine which models to evaluate
    if args.models == 'custom' and args.custom_models:
        models_to_eval = args.custom_models
    elif args.models == 'all':
        models_to_eval = MODEL_GROUPS['small'] + MODEL_GROUPS['medium'] + MODEL_GROUPS['large']
    else:
        models_to_eval = MODEL_GROUPS.get(args.models, [])
    
    print(f"Will evaluate {len(models_to_eval)} models\n")
    
    # Results storage
    results = {
        'metadata': {
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'device': device,
            'num_snapshots': len(snapshots),
            'num_samples_evaluated': args.num_samples or len(snapshots),
            'load_8bit': args.load_8bit,
            'load_4bit': args.load_4bit,
            'top_k': args.top_k,
        },
        'summary': {}
    }
    
    # Evaluate each model
    for model_name in models_to_eval:
        print(f"\n{'='*60}")
        print(f"Evaluating: {model_name}")
        print(f"{'='*60}\n")
        
        result = evaluate_model(model_name, snapshots, device, args)
        results['summary'][model_name] = result
        
        # Save intermediate results
        with open(args.output, 'w') as f:
            json.dump(results, f, indent=2)
        
        # Print summary
        if 'error' not in result:
            print(f"\nSummary for {model_name}:")
            print(f"  Average score: {result['avg_optimistic']:.3f} bits")
            print(f"  Median score: {result['median_optimistic']:.3f} bits")
            print(f"  Avg rank of correct letter: {result['avg_rank']:.1f}")
            print(f"  Perfect predictions: {result['perfect_predictions']}/{result['num_samples']}")
            wrong_guesses_str = ', '.join([f"{g['letter']}({g['count']})" for g in result['most_common_wrong_guesses'][:5]])
            print(f"  Most common wrong guesses: {wrong_guesses_str}")
    
    # Final summary
    print(f"\n{'='*60}")
    print("FINAL RESULTS SUMMARY")
    print(f"{'='*60}")
    
    # Sort by average score
    sorted_models = sorted(
        [(m, r['avg_optimistic']) for m, r in results['summary'].items() if 'avg_optimistic' in r],
        key=lambda x: x[1]
    )
    
    print("\nModels ranked by performance (lower is better):")
    for i, (model, score) in enumerate(sorted_models, 1):
        print(f"{i}. {model}: {score:.3f} bits")
    
    print(f"\nResults saved to: {args.output}")

if __name__ == "__main__":
    main()