#!/usr/bin/env python3
"""
Improved letter prediction evaluation for language models.
Addresses the main efficiency and correctness issues identified.
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
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

# Model groups for easy selection (reduced for testing)
MODEL_GROUPS = {
    'small': [
        'gpt2',
    ],
    'medium': [
        'EleutherAI/gpt-j-6B',
    ],
    'large': [
        'meta-llama/Meta-Llama-3.1-8B',
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
        token = os.environ.get('HF_TOKEN', None)
        
        tokenizer = AutoTokenizer.from_pretrained(model_name, token=token)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        
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
        
        if bnb_config:
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                quantization_config=bnb_config,
                device_map="auto",
                token=token
            )
        else:
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

def find_token_cut_position_efficient(tokenizer, text: str, char_cut_position: int) -> Tuple[List[int], str, int]:
    """
    More efficient version using offset mapping when available.
    """
    try:
        # Try to use offset mapping for efficiency
        encoding = tokenizer(text, return_offsets_mapping=True, add_special_tokens=False)
        tokens = encoding['input_ids']
        offset_mapping = encoding['offset_mapping']
        
        for i, (start, end) in enumerate(offset_mapping):
            if start <= char_cut_position < end:
                # Cut falls within this token
                tokens_before = tokens[:i]
                token_text = text[start:end]
                chars_before_cut = char_cut_position - start
                prefix = token_text[:chars_before_cut]
                return tokens_before, prefix, chars_before_cut
        
        # Cut is at the very end
        return tokens, "", 0
        
    except Exception:
        # Fallback to slower method if offset mapping not available
        return find_token_cut_position_fallback(tokenizer, text, char_cut_position)

def find_token_cut_position_fallback(tokenizer, text: str, char_cut_position: int) -> Tuple[List[int], str, int]:
    """
    Fallback method when offset mapping is not available.
    """
    full_tokens = tokenizer.encode(text, add_special_tokens=False)
    current_pos = 0
    
    for i, token_id in enumerate(full_tokens):
        token_text = tokenizer.decode([token_id], skip_special_tokens=True)
        token_start = current_pos
        token_end = current_pos + len(token_text)
        
        if token_start <= char_cut_position < token_end:
            tokens_before = full_tokens[:i]
            chars_in_token_before_cut = char_cut_position - token_start
            prefix = token_text[:chars_in_token_before_cut]
            return tokens_before, prefix, chars_in_token_before_cut
        
        current_pos = token_end
    
    return full_tokens, "", 0

def get_letter_probabilities_improved(model, tokenizer, snapshot, device, top_k=2000, min_prob_threshold=0.001):
    """
    Improved version with better efficiency and error handling.
    """
    try:
        # Construct full text
        full_text = snapshot['first_sentence'] + ". " + snapshot['second_sentence']
        
        # Find cut position
        first_sentence_length = len(snapshot['first_sentence']) + 2
        cut_char_position = first_sentence_length + snapshot['cut_position']
        
        # Get tokens before cut and prefix
        tokens_before, prefix, prefix_length = find_token_cut_position_efficient(
            tokenizer, full_text, cut_char_position
        )
        
        if not tokens_before:
            tokens_before = [tokenizer.bos_token_id] if tokenizer.bos_token_id else []
        
        # Get model predictions
        input_ids = torch.tensor([tokens_before], dtype=torch.long).to(device)
        
        with torch.no_grad():
            outputs = model(input_ids)
            logits = outputs.logits[0, -1, :]
            probs = torch.softmax(logits, dim=-1)
        
        # Get top-k tokens but ensure we have enough probability mass
        actual_k = min(top_k, len(probs))
        top_k_probs, top_k_indices = torch.topk(probs, actual_k)
        
        # Only consider tokens above threshold to avoid noise
        significant_mask = top_k_probs >= min_prob_threshold
        top_k_probs = top_k_probs[significant_mask]
        top_k_indices = top_k_indices[significant_mask]
        
        # Aggregate by next letter
        letter_probs = defaultdict(float)
        processed_tokens = 0
        
        for prob, token_id in zip(top_k_probs, top_k_indices):
            try:
                token_text = tokenizer.decode([token_id], skip_special_tokens=True)
                processed_tokens += 1
                
                if prefix:
                    # We need tokens that continue our prefix
                    if token_text.startswith(prefix) and len(token_text) > prefix_length:
                        next_char = token_text[prefix_length].lower()
                        if next_char.isalpha():  # More robust than checking ascii_lowercase
                            letter_probs[next_char] += prob.item()
                else:
                    # No prefix, token boundary cut
                    if token_text and token_text[0].isalpha():
                        letter_probs[token_text[0].lower()] += prob.item()
                        
            except Exception as e:
                # Skip problematic tokens rather than failing completely
                continue
        
        # Convert to regular dict and normalize if needed
        result = dict(letter_probs)
        
        # Ensure we have some probability mass
        total_mass = sum(result.values())
        if total_mass < 0.01:  # Very low mass, might indicate a problem
            print(f"Warning: Low probability mass ({total_mass:.4f}) for cut position {cut_char_position}")
        
        return result
        
    except Exception as e:
        print(f"Error in get_letter_probabilities_improved: {e}")
        return {}

def evaluate_model(model_name, snapshots, device, args):
    """Evaluate a single model on all snapshots."""
    tokenizer, model = load_model_with_config(
        model_name, device, 
        load_in_8bit=args.load_8bit,
        load_in_4bit=args.load_4bit
    )
    
    if model is None:
        return {'model': model_name, 'error': 'Failed to load model'}
    
    scores = []
    cross_entropy_scores = []
    failed_count = 0
    all_ranks = []
    letters_before_correct = []
    
    eval_snapshots = snapshots[:args.num_samples] if args.num_samples else snapshots
    
    for snapshot in tqdm(eval_snapshots, desc=f"Evaluating {model_name}"):
        try:
            target_letter = snapshot['target_letter'].lower()
            
            letter_probs = get_letter_probabilities_improved(
                model, tokenizer, snapshot, device, 
                top_k=args.top_k, min_prob_threshold=args.min_prob
            )
            
            if not letter_probs:
                failed_count += 1
                continue
            
            # Calculate rank-based score
            sorted_letters = sorted(letter_probs.items(), key=lambda x: x[1], reverse=True)
            rank = 26  # Default worst case
            guessed_before = []
            
            for idx, (letter, prob) in enumerate(sorted_letters):
                if letter == target_letter:
                    rank = idx + 1
                    break
                guessed_before.append(letter)
            
            # Rank-based score (bits needed to identify correct letter)
            rank_score = np.log2(rank)
            scores.append(rank_score)
            all_ranks.append(rank)
            letters_before_correct.extend(guessed_before)
            
            # Cross-entropy score (more principled)
            target_prob = letter_probs.get(target_letter, 1e-10)  # Avoid log(0)
            ce_score = -np.log2(target_prob)
            cross_entropy_scores.append(ce_score)
            
        except Exception as e:
            print(f"\nError processing snapshot {snapshot.get('id', '?')}: {e}")
            failed_count += 1
            continue
    
    # Clean up
    del model
    if device == "cuda":
        torch.cuda.empty_cache()
    
    if not scores:
        return {'model': model_name, 'error': 'No successful evaluations'}
    
    # Calculate statistics
    wrong_guess_counts = Counter(letters_before_correct)
    most_common_wrong = [
        {'letter': letter, 'count': count} 
        for letter, count in wrong_guess_counts.most_common(10)
    ]
    
    return {
        'model': model_name,
        'num_samples': len(scores),
        'failed_samples': failed_count,
        'avg_rank_score': float(np.mean(scores)),
        'avg_cross_entropy': float(np.mean(cross_entropy_scores)),
        'median_rank_score': float(np.median(scores)),
        'median_cross_entropy': float(np.median(cross_entropy_scores)),
        'std_rank_score': float(np.std(scores)),
        'avg_rank': float(np.mean(all_ranks)),
        'median_rank': float(np.median(all_ranks)),
        'perfect_predictions': sum(1 for r in all_ranks if r == 1),
        'top5_predictions': sum(1 for r in all_ranks if r <= 5),
        'most_common_wrong_guesses': most_common_wrong
    }

def main():
    parser = argparse.ArgumentParser(description='Evaluate language models on letter prediction task')
    parser.add_argument('--models', choices=['small', 'medium', 'large', 'all', 'custom'], 
                        default='small', help='Which model group to evaluate')
    parser.add_argument('--custom-models', nargs='+', help='Specific models to evaluate')
    parser.add_argument('--snapshots', default='prediction_snapshots.json', 
                        help='Path to snapshots JSON file')
    parser.add_argument('--output', default='llm_scores_v3.json', help='Output file for results')
    parser.add_argument('--num-samples', type=int, help='Limit number of samples to evaluate')
    parser.add_argument('--load-8bit', action='store_true', help='Load models in 8-bit')
    parser.add_argument('--load-4bit', action='store_true', help='Load models in 4-bit')
    parser.add_argument('--top-k', type=int, default=2000, 
                        help='Number of top tokens to consider (default: 2000)')
    parser.add_argument('--min-prob', type=float, default=0.001,
                        help='Minimum probability threshold for tokens (default: 0.001)')
    args = parser.parse_args()
    
    get_device_info()
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}\n")
    
    print(f"Loading snapshots from {args.snapshots}...")
    with open(args.snapshots, 'r') as f:
        data = json.load(f)
    snapshots = data['snapshots']
    print(f"Loaded {len(snapshots)} snapshots\n")
    
    if args.models == 'custom' and args.custom_models:
        models_to_eval = args.custom_models
    elif args.models == 'all':
        models_to_eval = MODEL_GROUPS['small'] + MODEL_GROUPS['medium'] + MODEL_GROUPS['large']
    else:
        models_to_eval = MODEL_GROUPS.get(args.models, [])
    
    print(f"Will evaluate {len(models_to_eval)} models\n")
    
    results = {
        'metadata': {
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'device': device,
            'num_snapshots': len(snapshots),
            'num_samples_evaluated': args.num_samples or len(snapshots),
            'load_8bit': args.load_8bit,
            'load_4bit': args.load_4bit,
            'top_k': args.top_k,
            'min_prob_threshold': args.min_prob,
        },
        'summary': {}
    }
    
    for model_name in models_to_eval:
        print(f"\n{'='*60}")
        print(f"Evaluating: {model_name}")
        print(f"{'='*60}\n")
        
        result = evaluate_model(model_name, snapshots, device, args)
        results['summary'][model_name] = result
        
        with open(args.output, 'w') as f:
            json.dump(results, f, indent=2)
        
        if 'error' not in result:
            print(f"\nSummary for {model_name}:")
            print(f"  Rank-based score: {result['avg_rank_score']:.3f} bits")
            print(f"  Cross-entropy score: {result['avg_cross_entropy']:.3f} bits")
            print(f"  Average rank: {result['avg_rank']:.1f}")
            print(f"  Perfect predictions: {result['perfect_predictions']}/{result['num_samples']}")
            print(f"  Top-5 predictions: {result['top5_predictions']}/{result['num_samples']}")
    
    print(f"\n{'='*60}")
    print("FINAL RESULTS SUMMARY")
    print(f"{'='*60}")
    
    valid_results = [(m, r) for m, r in results['summary'].items() if 'avg_rank_score' in r]
    sorted_by_rank = sorted(valid_results, key=lambda x: x[1]['avg_rank_score'])
    sorted_by_ce = sorted(valid_results, key=lambda x: x[1]['avg_cross_entropy'])
    
    print("\nRanked by rank-based score (lower is better):")
    for i, (model, result) in enumerate(sorted_by_rank, 1):
        print(f"{i}. {model}: {result['avg_rank_score']:.3f} bits")
    
    print("\nRanked by cross-entropy (lower is better):")
    for i, (model, result) in enumerate(sorted_by_ce, 1):
        print(f"{i}. {model}: {result['avg_cross_entropy']:.3f} bits")
    
    print(f"\nResults saved to: {args.output}")

if __name__ == "__main__":
    main()