"""
Compute letter prediction scores for multiple language models on HuggingFace.
This script evaluates how well different models predict the next letter in Wikipedia sentences.
"""

import json
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModelForCausalLM
from tqdm import tqdm
from typing import List, Dict, Tuple
import string

# Models to evaluate
MODELS = [
    "gpt2",
    "distilgpt2", 
    "gpt2-medium",
    "gpt2-large",
    "gpt2-xl",
    "EleutherAI/gpt-neo-125M",
    "EleutherAI/gpt-neo-1.3B",
    "EleutherAI/gpt-neo-2.7B",
    "EleutherAI/gpt-j-6B",
    "microsoft/DialoGPT-small",
    "microsoft/DialoGPT-medium",
    "microsoft/DialoGPT-large",
]

def load_snapshots(file_path: str) -> List[Dict]:
    """Load prediction snapshots from JSON file."""
    with open(file_path, 'r') as f:
        data = json.load(f)
    return data['snapshots']

def get_letter_probabilities(model, tokenizer, context: str, device: str) -> Dict[str, float]:
    """
    Get probability distribution over next letter given context.
    Returns dict mapping each letter to its probability.
    """
    # Tokenize context
    inputs = tokenizer(context, return_tensors="pt").to(device)
    
    # Get model predictions
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits[0, -1, :]  # Get logits for next token
        probs = torch.softmax(logits, dim=-1)
    
    # Get probabilities for each letter
    letter_probs = {}
    for letter in string.ascii_lowercase + string.ascii_uppercase:
        # Find all token IDs that start with this letter
        letter_token_ids = []
        for token_id in range(len(tokenizer)):
            token = tokenizer.decode([token_id])
            # Check if token starts with the letter (handle space prefix)
            if token.strip().lower().startswith(letter.lower()):
                letter_token_ids.append(token_id)
        
        # Sum probabilities for all tokens starting with this letter
        if letter_token_ids:
            letter_prob = probs[letter_token_ids].sum().item()
            letter_probs[letter.lower()] = letter_prob
        else:
            letter_probs[letter.lower()] = 0.0
    
    return letter_probs

def compute_optimistic_score(letter_probs: Dict[str, float], target_letter: str) -> float:
    """
    Compute optimistic score: if target letter is k-th most likely, score = log2(k).
    """
    # Sort letters by probability (descending)
    sorted_letters = sorted(letter_probs.items(), key=lambda x: x[1], reverse=True)
    
    # Find rank of target letter
    target_letter = target_letter.lower()
    rank = None
    for i, (letter, prob) in enumerate(sorted_letters):
        if letter == target_letter:
            rank = i + 1
            break
    
    if rank is None:
        # If letter not found, use worst case (26)
        rank = 26
    
    return np.log2(rank)

def evaluate_model(model_name: str, snapshots: List[Dict], device: str = "cuda" if torch.cuda.is_available() else "cpu") -> Dict:
    """Evaluate a single model on all snapshots."""
    print(f"\nEvaluating {model_name}...")
    
    try:
        # Load model and tokenizer
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForCausalLM.from_pretrained(model_name).to(device)
        model.eval()
        
        scores = []
        
        for snapshot in tqdm(snapshots, desc=f"Processing {model_name}"):
            # Reconstruct context up to the missing letter
            context = snapshot['first_sentence'] + " " + snapshot['context']
            target_letter = snapshot['target_letter']
            
            # Get letter probabilities
            letter_probs = get_letter_probabilities(model, tokenizer, context, device)
            
            # Compute optimistic score
            score = compute_optimistic_score(letter_probs, target_letter)
            scores.append(score)
        
        # Compute statistics
        scores = np.array(scores)
        results = {
            'model': model_name,
            'num_samples': len(scores),
            'avg_optimistic': float(np.mean(scores)),
            'median_optimistic': float(np.median(scores)),
            'std_optimistic': float(np.std(scores)),
            'min_optimistic': float(np.min(scores)),
            'max_optimistic': float(np.max(scores))
        }
        
        # Clean up memory
        del model
        torch.cuda.empty_cache()
        
        return results
        
    except Exception as e:
        print(f"Error evaluating {model_name}: {e}")
        return {
            'model': model_name,
            'error': str(e)
        }

def main():
    # Load snapshots
    snapshots_path = "public/data/prediction_snapshots.json"
    print(f"Loading snapshots from {snapshots_path}...")
    snapshots = load_snapshots(snapshots_path)
    print(f"Loaded {len(snapshots)} snapshots")
    
    # Evaluate each model
    results = []
    for model_name in MODELS:
        result = evaluate_model(model_name, snapshots)
        results.append(result)
        
        # Save intermediate results
        output_data = {
            'summary': {r['model']: r for r in results if 'error' not in r},
            'all_results': results
        }
        
        with open('public/data/llm_prediction_scores.json', 'w') as f:
            json.dump(output_data, f, indent=2)
        
        print(f"Saved results for {len(results)} models so far")
    
    print("\nFinal Results Summary:")
    for result in results:
        if 'error' not in result:
            print(f"{result['model']}: avg={result['avg_optimistic']:.2f} bits, median={result['median_optimistic']:.2f} bits")
        else:
            print(f"{result['model']}: ERROR - {result['error']}")

if __name__ == "__main__":
    main()