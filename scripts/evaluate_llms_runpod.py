#!/usr/bin/env python3
"""
Evaluate multiple LLMs on next-letter prediction task for human comparison experiment.

This script loads various LLMs and evaluates them on Wikipedia snapshots,
computing both cross-entropy and optimistic scores for each prediction.
"""

import json
import math
import torch
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from transformers import (
    AutoTokenizer, AutoModelForCausalLM, 
    GPT2LMHeadModel, GPT2Tokenizer,
    LlamaForCausalLM, LlamaTokenizer,
    pipeline
)
import argparse
from tqdm import tqdm

class LLMEvaluator:
    """Evaluates LLMs on next-letter prediction task."""
    
    def __init__(self, model_name: str, device: str = "auto"):
        self.model_name = model_name
        self.device = device
        print(f"Loading {model_name}...")
        
        try:
            # Load tokenizer and model
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                device_map=device if device != "auto" else "auto",
                low_cpu_mem_usage=True
            )
            
            # Set pad token if needed
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
                
            self.model.eval()
            print(f"Successfully loaded {model_name}")
            
        except Exception as e:
            print(f"Error loading {model_name}: {e}")
            raise
    
    def get_next_token_probabilities(self, context: str) -> Dict[str, float]:
        """Get probability distribution over next tokens."""
        try:
            # Tokenize input
            inputs = self.tokenizer.encode(context, return_tensors="pt")
            
            # Move to device
            if hasattr(self.model, 'device'):
                inputs = inputs.to(self.model.device)
            
            # Get model predictions
            with torch.no_grad():
                outputs = self.model(inputs)
                logits = outputs.logits[0, -1, :]  # Last token predictions
            
            # Convert to probabilities
            probs = torch.softmax(logits, dim=-1)
            
            # Get top tokens (limit to manageable number)
            top_k = min(1000, len(probs))  # Top 1000 tokens
            top_probs, top_indices = torch.topk(probs, top_k)
            
            # Create token -> probability mapping
            token_probs = {}
            for prob, idx in zip(top_probs, top_indices):
                token = self.tokenizer.decode([idx.item()], skip_special_tokens=True)
                token_probs[token] = prob.item()
            
            return token_probs
            
        except Exception as e:
            print(f"Error getting probabilities for '{context}': {e}")
            return {}
    
    def calculate_letter_probability(self, context: str, target_letter: str) -> Tuple[float, int]:
        """
        Calculate probability of target letter given context.
        Returns (cross_entropy_score, optimistic_rank).
        """
        target_letter = target_letter.lower()
        
        # Get next token probabilities
        token_probs = self.get_next_token_probabilities(context)
        
        if not token_probs:
            return float('inf'), 10000  # High penalty for failure
        
        # Filter tokens that could start with our context ending
        # We need tokens that when appended to context would have target_letter as next char
        
        # Find tokens that start with target_letter (case insensitive)
        letter_tokens = []
        all_tokens_with_probs = []
        
        for token, prob in token_probs.items():
            if token and len(token) > 0:
                # Clean token (remove leading spaces for comparison)
                clean_token = token.lstrip()
                if clean_token:
                    first_char = clean_token[0].lower()
                    all_tokens_with_probs.append((first_char, prob))
                    
                    if first_char == target_letter:
                        letter_tokens.append((token, prob))
        
        # Calculate total probability for target letter
        target_prob = sum(prob for _, prob in letter_tokens)
        
        # Calculate cross-entropy score
        if target_prob > 0:
            cross_entropy_score = -math.log2(target_prob)
        else:
            cross_entropy_score = 20.0  # High penalty if letter not predicted
        
        # Calculate optimistic rank (how many letters rank higher)
        letter_probs = {}
        for char, prob in all_tokens_with_probs:
            if char in letter_probs:
                letter_probs[char] += prob
            else:
                letter_probs[char] = prob
        
        # Sort letters by probability
        sorted_letters = sorted(letter_probs.items(), key=lambda x: x[1], reverse=True)
        
        # Find rank of target letter
        optimistic_rank = len(sorted_letters) + 1  # Default to worst rank
        for rank, (char, _) in enumerate(sorted_letters, 1):
            if char == target_letter:
                optimistic_rank = rank
                break
        
        optimistic_score = math.log2(optimistic_rank)
        
        return cross_entropy_score, optimistic_score
    
    def evaluate_snapshot(self, snapshot: dict) -> dict:
        """Evaluate a single snapshot."""
        context = snapshot['first_sentence'] + ' ' + snapshot['context']
        target_letter = snapshot['target_letter'].lower()
        
        cross_entropy_score, optimistic_score = self.calculate_letter_probability(
            context, target_letter
        )
        
        return {
            'snapshot_id': snapshot['id'],
            'model': self.model_name,
            'context': context,
            'target_letter': target_letter,
            'cross_entropy_score': cross_entropy_score,
            'optimistic_score': optimistic_score
        }

def get_available_models() -> List[str]:
    """Get list of models to evaluate."""
    models = [
        # GPT-2 variants
        "gpt2",
        "gpt2-medium", 
        "gpt2-large",
        
        # Llama models (adjust based on availability)
        "meta-llama/Llama-2-7b-hf",
        "meta-llama/Llama-2-13b-hf",
        
        # Other models
        "microsoft/DialoGPT-medium",
        "EleutherAI/gpt-neo-1.3B",
        "EleutherAI/gpt-neo-2.7B",
        
        # Smaller efficient models
        "distilgpt2",
        "microsoft/DialoGPT-small",
    ]
    
    return models

def load_snapshots(file_path: str) -> List[dict]:
    """Load prediction snapshots from JSON file."""
    print(f"Loading snapshots from {file_path}...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    snapshots = data['snapshots']
    print(f"Loaded {len(snapshots)} snapshots")
    
    return snapshots

def evaluate_all_models(snapshots: List[dict], models: List[str], max_snapshots: int = None) -> List[dict]:
    """Evaluate all models on all snapshots."""
    results = []
    
    # Limit snapshots for testing
    if max_snapshots:
        snapshots = snapshots[:max_snapshots]
        print(f"Evaluating on first {len(snapshots)} snapshots")
    
    for model_name in models:
        try:
            print(f"\n{'='*50}")
            print(f"Evaluating model: {model_name}")
            print(f"{'='*50}")
            
            evaluator = LLMEvaluator(model_name)
            
            model_results = []
            for snapshot in tqdm(snapshots, desc=f"Evaluating {model_name}"):
                try:
                    result = evaluator.evaluate_snapshot(snapshot)
                    model_results.append(result)
                    
                    # Print progress every 100 snapshots
                    if len(model_results) % 100 == 0:
                        avg_ce = np.mean([r['cross_entropy_score'] for r in model_results])
                        avg_opt = np.mean([r['optimistic_score'] for r in model_results])
                        print(f"  {len(model_results)}//{len(snapshots)} - CE: {avg_ce:.2f}, Opt: {avg_opt:.2f}")
                
                except Exception as e:
                    print(f"Error evaluating snapshot {snapshot['id']}: {e}")
                    continue
            
            results.extend(model_results)
            
            # Cleanup GPU memory
            del evaluator
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                
        except Exception as e:
            print(f"Failed to evaluate model {model_name}: {e}")
            continue
    
    return results

def save_results(results: List[dict], output_path: str):
    """Save evaluation results to JSON file."""
    print(f"Saving results to {output_path}...")
    
    # Calculate summary statistics per model
    models = list(set(r['model'] for r in results))
    summary = {}
    
    for model in models:
        model_results = [r for r in results if r['model'] == model]
        if model_results:
            ce_scores = [r['cross_entropy_score'] for r in model_results if r['cross_entropy_score'] != float('inf')]
            opt_scores = [r['optimistic_score'] for r in model_results]
            
            summary[model] = {
                'num_evaluations': len(model_results),
                'avg_cross_entropy': np.mean(ce_scores) if ce_scores else float('inf'),
                'avg_optimistic': np.mean(opt_scores),
                'median_cross_entropy': np.median(ce_scores) if ce_scores else float('inf'),
                'median_optimistic': np.median(opt_scores)
            }
    
    output_data = {
        'metadata': {
            'total_evaluations': len(results),
            'models_evaluated': len(models),
            'description': 'LLM evaluation results for next-letter prediction task'
        },
        'summary': summary,
        'detailed_results': results
    }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2)
    
    print(f"Saved {len(results)} evaluation results")
    
    # Print summary
    print("\nSUMMARY:")
    print("-" * 60)
    for model, stats in summary.items():
        print(f"{model:<30} CE: {stats['avg_cross_entropy']:.2f} Opt: {stats['avg_optimistic']:.2f}")

def main():
    """Main evaluation function."""
    parser = argparse.ArgumentParser(description="Evaluate LLMs on next-letter prediction")
    parser.add_argument("--snapshots", default="public/data/prediction_snapshots.json", 
                       help="Path to snapshots JSON file")
    parser.add_argument("--output", default="public/data/llm_prediction_scores.json",
                       help="Output path for results")
    parser.add_argument("--models", nargs="+", 
                       help="Specific models to evaluate (default: all available)")
    parser.add_argument("--max-snapshots", type=int, 
                       help="Maximum number of snapshots to evaluate (for testing)")
    parser.add_argument("--device", default="auto",
                       help="Device to use (auto, cuda, cpu)")
    
    args = parser.parse_args()
    
    print("LLM Next-Letter Prediction Evaluator")
    print("=" * 50)
    
    # Load snapshots
    snapshots = load_snapshots(args.snapshots)
    
    # Get models to evaluate
    if args.models:
        models = args.models
    else:
        models = get_available_models()
    
    print(f"Will evaluate models: {models}")
    
    # Run evaluation
    results = evaluate_all_models(snapshots, models, args.max_snapshots)
    
    if results:
        # Save results
        save_results(results, args.output)
        print(f"\nEvaluation complete! Results saved to {args.output}")
    else:
        print("No results generated!")

if __name__ == "__main__":
    main()