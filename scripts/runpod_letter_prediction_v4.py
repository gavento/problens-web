#!/usr/bin/env python3
"""
Production-ready letter prediction evaluation for language models.
Addresses normalization, cumulative mass, and efficiency issues.
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
import unicodedata
from functools import lru_cache
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
        
        # Fix pad token warnings
        if hasattr(model.config, 'pad_token_id') and model.config.pad_token_id is None:
            model.config.pad_token_id = tokenizer.pad_token_id
        
        print(f"Successfully loaded {model_name}")
        return tokenizer, model
        
    except Exception as e:
        print(f"Error loading {model_name}: {e}")
        return None, None

# Cache for decoded tokens to avoid repeated BPE decoding
@lru_cache(maxsize=10000)
def cached_decode_token(tokenizer_name: str, token_id: int) -> str:
    """Cache decoded tokens to avoid repeated decoding."""
    # Note: This is a simplified cache. In practice, you'd need to handle tokenizer objects.
    # For now, we'll implement caching within the evaluation function.
    pass

def normalize_to_ascii(text: str) -> str:
    """Normalize Unicode letters to ASCII equivalents."""
    # Decompose and remove diacritics
    normalized = unicodedata.normalize('NFKD', text)
    ascii_only = ''.join(c for c in normalized if ord(c) < 128)
    return ascii_only

def find_token_cut_position_efficient(tokenizer, text: str, char_cut_position: int) -> Tuple[List[int], str, int]:
    """
    More efficient version using offset mapping when available.
    """
    try:
        # Try to use offset mapping for efficiency
        encoding = tokenizer(text, return_offsets_mapping=True, add_special_tokens=False)
        tokens = encoding.input_ids
        offset_mapping = encoding.offset_mapping
        
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

def get_letter_probabilities_production(model, tokenizer, snapshot, device, 
                                      cumulative_threshold=0.95, max_tokens=5000):
    """
    Production-ready version with proper normalization and cumulative mass guarantees.
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
        
        # Check context length
        max_ctx = getattr(model.config, 'max_position_embeddings', 2048)
        if len(tokens_before) >= max_ctx:
            # Truncate from left to fit context window
            tokens_before = tokens_before[-(max_ctx-1):]
        
        # Get model predictions
        input_ids = torch.as_tensor(tokens_before, device=device).unsqueeze(0)
        
        with torch.no_grad():
            outputs = model(input_ids)
            logits = outputs.logits[0, -1, :]
            probs = torch.softmax(logits, dim=-1)
        
        # Adaptive top-k: keep adding tokens until we have enough cumulative mass
        # or until we've seen all 26 letters
        sorted_probs, sorted_indices = torch.sort(probs, descending=True)
        
        letter_probs = defaultdict(float)
        cumulative_mass = 0.0
        letters_seen = set()
        token_decode_cache = {}  # Simple per-call cache
        
        for i, (prob, token_id) in enumerate(zip(sorted_probs, sorted_indices)):
            if i >= max_tokens:  # Safety break
                break
                
            # Cache token decoding
            token_id_item = token_id.item()
            if token_id_item not in token_decode_cache:
                token_decode_cache[token_id_item] = tokenizer.decode([token_id_item], skip_special_tokens=True)
            token_text = token_decode_cache[token_id_item]
            
            # Strip common BPE markers
            clean_token = token_text.lstrip("Ġ▁")
            
            prob_val = prob.item()
            cumulative_mass += prob_val
            
            # Process token for letter extraction
            if prefix:
                # We need tokens that continue our prefix
                if clean_token.startswith(prefix) and len(clean_token) > prefix_length:
                    next_char = clean_token[prefix_length]
                    # Normalize to ASCII and check if it's a letter
                    normalized_char = normalize_to_ascii(next_char).lower()
                    if normalized_char and normalized_char in string.ascii_lowercase:
                        letter_probs[normalized_char] += prob_val
                        letters_seen.add(normalized_char)
            else:
                # No prefix, token boundary cut
                if clean_token:
                    first_char = clean_token[0]
                    normalized_char = normalize_to_ascii(first_char).lower()
                    if normalized_char and normalized_char in string.ascii_lowercase:
                        letter_probs[normalized_char] += prob_val
                        letters_seen.add(normalized_char)
            
            # Stop if we have enough cumulative mass and reasonable letter coverage
            if cumulative_mass >= cumulative_threshold and len(letters_seen) >= 10:
                break
        
        # Convert to regular dict
        result = dict(letter_probs)
        
        # Check total letter probability mass
        total_letter_mass = sum(result.values())
        
        if total_letter_mass < 0.01:
            print(f"Warning: Very low letter probability mass ({total_letter_mass:.4f}) "
                  f"from {cumulative_mass:.4f} total mass")
        
        # CRITICAL FIX: Renormalize letter probabilities
        # This ensures cross-entropy has proper information-theoretic meaning
        if total_letter_mass > 0:
            result = {letter: prob / total_letter_mass for letter, prob in result.items()}
        
        return result, total_letter_mass, cumulative_mass
        
    except Exception as e:
        print(f"Error in get_letter_probabilities_production: {e}")
        return {}, 0.0, 0.0

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
    total_masses = []
    cumulative_masses = []
    
    eval_snapshots = snapshots[:args.num_samples] if args.num_samples else snapshots
    
    for snapshot in tqdm(eval_snapshots, desc=f"Evaluating {model_name}"):
        try:
            target_letter = snapshot['target_letter'].lower()
            
            letter_probs, total_mass, cumulative_mass = get_letter_probabilities_production(
                model, tokenizer, snapshot, device, 
                cumulative_threshold=args.cumulative_threshold
            )
            
            if not letter_probs:
                failed_count += 1
                continue
            
            total_masses.append(total_mass)
            cumulative_masses.append(cumulative_mass)
            
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
            
            # Cross-entropy score (now properly normalized!)
            target_prob = letter_probs.get(target_letter, 0.0)
            if target_prob > 0:
                ce_score = -np.log2(target_prob)
            else:
                # Target letter not found - this should be rare with cumulative threshold
                ce_score = float('inf')
                print(f"Warning: Target letter '{target_letter}' not found in normalized distribution")
            
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
    
    # Filter out infinite cross-entropy scores for statistics
    finite_ce_scores = [score for score in cross_entropy_scores if np.isfinite(score)]
    infinite_ce_count = len(cross_entropy_scores) - len(finite_ce_scores)
    
    return {
        'model': model_name,
        'num_samples': len(scores),
        'failed_samples': failed_count,
        'avg_rank_score': float(np.mean(scores)),
        'avg_cross_entropy': float(np.mean(finite_ce_scores)) if finite_ce_scores else float('inf'),
        'median_rank_score': float(np.median(scores)),
        'median_cross_entropy': float(np.median(finite_ce_scores)) if finite_ce_scores else float('inf'),
        'std_rank_score': float(np.std(scores)),
        'avg_rank': float(np.mean(all_ranks)),
        'median_rank': float(np.median(all_ranks)),
        'perfect_predictions': sum(1 for r in all_ranks if r == 1),
        'top5_predictions': sum(1 for r in all_ranks if r <= 5),
        'infinite_ce_count': infinite_ce_count,
        'avg_letter_mass': float(np.mean(total_masses)),
        'avg_cumulative_mass': float(np.mean(cumulative_masses)),
        'most_common_wrong_guesses': most_common_wrong
    }

def main():
    parser = argparse.ArgumentParser(description='Production letter prediction evaluator')
    parser.add_argument('--models', choices=['small', 'medium', 'large', 'all', 'custom'], 
                        default='small', help='Which model group to evaluate')
    parser.add_argument('--custom-models', nargs='+', help='Specific models to evaluate')
    parser.add_argument('--snapshots', default='prediction_snapshots.json', 
                        help='Path to snapshots JSON file')
    parser.add_argument('--output', default='llm_scores_v4.json', help='Output file for results')
    parser.add_argument('--num-samples', type=int, help='Limit number of samples to evaluate')
    parser.add_argument('--load-8bit', action='store_true', help='Load models in 8-bit')
    parser.add_argument('--load-4bit', action='store_true', help='Load models in 4-bit')
    parser.add_argument('--cumulative-threshold', type=float, default=0.95,
                        help='Cumulative probability threshold (default: 0.95)')
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
            'cumulative_threshold': args.cumulative_threshold,
            'version': 'v4_production'
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
            ce_str = f"{result['avg_cross_entropy']:.3f}" if np.isfinite(result['avg_cross_entropy']) else "∞"
            print(f"  Cross-entropy score: {ce_str} bits")
            print(f"  Average rank: {result['avg_rank']:.1f}")
            print(f"  Perfect predictions: {result['perfect_predictions']}/{result['num_samples']}")
            print(f"  Top-5 predictions: {result['top5_predictions']}/{result['num_samples']}")
            print(f"  Avg letter mass: {result['avg_letter_mass']:.3f}")
            print(f"  Avg cumulative mass: {result['avg_cumulative_mass']:.3f}")
            if result['infinite_ce_count'] > 0:
                print(f"  Infinite CE cases: {result['infinite_ce_count']}")
    
    print(f"\n{'='*60}")
    print("FINAL RESULTS SUMMARY")
    print(f"{'='*60}")
    
    valid_results = [(m, r) for m, r in results['summary'].items() if 'avg_rank_score' in r]
    sorted_by_rank = sorted(valid_results, key=lambda x: x[1]['avg_rank_score'])
    
    finite_ce_results = [(m, r) for m, r in valid_results if np.isfinite(r['avg_cross_entropy'])]
    sorted_by_ce = sorted(finite_ce_results, key=lambda x: x[1]['avg_cross_entropy'])
    
    print("\nRanked by rank-based score (lower is better):")
    for i, (model, result) in enumerate(sorted_by_rank, 1):
        print(f"{i}. {model}: {result['avg_rank_score']:.3f} bits")
    
    if sorted_by_ce:
        print("\nRanked by cross-entropy (lower is better):")
        for i, (model, result) in enumerate(sorted_by_ce, 1):
            print(f"{i}. {model}: {result['avg_cross_entropy']:.3f} bits")
    
    print(f"\nResults saved to: {args.output}")

if __name__ == "__main__":
    main()