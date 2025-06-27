"""
Evaluate GPT-4 on letter prediction task via OpenAI API.
This script prompts GPT-4 to guess the next letter without using the internet.
"""

import json
import os
import numpy as np
from tqdm import tqdm
import string
import time
from typing import List, Dict
import argparse
from openai import OpenAI
from collections import Counter

def get_gpt4_letter_prediction(client, context: str, model: str = "gpt-4-turbo-preview") -> Dict[str, float]:
    """
    Get GPT-4's prediction for the next letter.
    Returns a dictionary of letter probabilities.
    """
    
    prompt = f"""You are playing a letter prediction game. Given a text snippet from Wikipedia where the next letter is missing, you need to predict what that letter is.

IMPORTANT RULES:
1. You must guess ONLY a single letter (a-z, case insensitive)
2. Do NOT use any external knowledge or internet
3. Base your guess ONLY on the context provided
4. Consider common English patterns, grammar, and word frequencies

Context: "{context}_"

What is the most likely next letter? Please also provide your confidence ranking for all 26 letters.

Respond in this exact JSON format:
{{
    "best_guess": "x",
    "ranking": [
        {{"letter": "x", "confidence": 0.95}},
        {{"letter": "y", "confidence": 0.85}},
        ... (all 26 letters ranked by confidence)
    ]
}}"""
    
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are an expert at predicting the next letter in English text. You must respond only in the specified JSON format."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.0,  # Make it deterministic
            max_tokens=500,
            response_format={"type": "json_object"}
        )
        
        # Parse the response
        result = json.loads(response.choices[0].message.content)
        
        # Convert to letter probability dict
        letter_probs = {}
        for item in result.get('ranking', []):
            letter = item.get('letter', '').lower()
            if letter in string.ascii_lowercase:
                letter_probs[letter] = item.get('confidence', 0.0)
        
        # Normalize to ensure all letters are present
        for letter in string.ascii_lowercase:
            if letter not in letter_probs:
                letter_probs[letter] = 0.0
                
        return letter_probs
        
    except Exception as e:
        print(f"Error getting GPT-4 prediction: {e}")
        # Return uniform distribution on error
        return {letter: 1.0/26 for letter in string.ascii_lowercase}

def evaluate_gpt4(snapshots: List[Dict], api_key: str, model: str = "gpt-4-turbo-preview", 
                  max_samples: int = None, rate_limit_delay: float = 1.0):
    """Evaluate GPT-4 on letter prediction task."""
    
    # Initialize OpenAI client
    client = OpenAI(api_key=api_key)
    
    # Test API connection
    print(f"Testing API connection with model: {model}")
    try:
        test_response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "Say 'OK'"}],
            max_tokens=10
        )
        print("API connection successful!")
    except Exception as e:
        print(f"API connection failed: {e}")
        return None
    
    # Limit samples if specified
    if max_samples:
        snapshots = snapshots[:max_samples]
    
    scores = []
    letters_before_correct = []
    failed_count = 0
    
    print(f"\nEvaluating {len(snapshots)} samples...")
    
    for i, snapshot in enumerate(tqdm(snapshots, desc=f"Evaluating {model}")):
        try:
            # Construct context
            context = snapshot['first_sentence'] + " " + snapshot['context']
            target_letter = snapshot['target_letter'].lower()
            
            # Get GPT-4 prediction
            letter_probs = get_gpt4_letter_prediction(client, context, model)
            
            # Calculate rank
            sorted_letters = sorted(letter_probs.items(), key=lambda x: x[1], reverse=True)
            rank = 26  # Default worst case
            guessed_before = []
            
            for idx, (letter, conf) in enumerate(sorted_letters):
                if letter == target_letter:
                    rank = idx + 1
                    break
                else:
                    guessed_before.append(letter)
            
            score = np.log2(rank)
            scores.append(score)
            letters_before_correct.append(guessed_before)
            
            # Print examples periodically
            if i % 20 == 0 and i > 0:
                print(f"\nExample {i}: Target='{target_letter}', Rank={rank}, Score={score:.3f}")
                print(f"  Context: ...{context[-50:]}_")
                print(f"  Guessed before correct: {' '.join(guessed_before[:5])}" + 
                      (" ..." if len(guessed_before) > 5 else ""))
            
            # Rate limiting
            time.sleep(rate_limit_delay)
            
        except Exception as e:
            print(f"\nError on snapshot {i}: {e}")
            failed_count += 1
            continue
    
    # Calculate statistics
    if scores:
        scores = np.array(scores)
        
        # Letter frequency statistics
        all_guessed_letters = []
        for letters_list in letters_before_correct:
            all_guessed_letters.extend(letters_list[:5])
        
        letter_freq = Counter(all_guessed_letters)
        most_common_wrong = letter_freq.most_common(10)
        
        avg_guesses_before = np.mean([len(letters) for letters in letters_before_correct])
        
        results = {
            'model': model,
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
            'most_common_wrong_guesses': [{'letter': l, 'count': c} for l, c in most_common_wrong],
            'total_api_calls': len(scores) + failed_count
        }
        
        return results
    else:
        return {
            'model': model,
            'error': 'No valid scores computed'
        }

def main():
    parser = argparse.ArgumentParser(description='Evaluate GPT-4 on letter prediction via API')
    parser.add_argument('--api-key', type=str, required=True,
                       help='OpenAI API key (or set OPENAI_API_KEY env var)')
    parser.add_argument('--model', type=str, default='gpt-4-turbo-preview',
                       choices=['gpt-4', 'gpt-4-turbo-preview', 'gpt-4-1106-preview', 'gpt-3.5-turbo'],
                       help='Model to evaluate')
    parser.add_argument('--snapshots', type=str, default='prediction_snapshots.json',
                       help='Path to snapshots JSON file')
    parser.add_argument('--output', type=str, default='gpt4_prediction_scores.json',
                       help='Output file path')
    parser.add_argument('--max-samples', type=int, default=100,
                       help='Maximum number of samples to evaluate (default: 100)')
    parser.add_argument('--rate-limit', type=float, default=1.0,
                       help='Delay between API calls in seconds')
    
    args = parser.parse_args()
    
    # Get API key
    api_key = args.api_key or os.environ.get('OPENAI_API_KEY')
    if not api_key:
        print("Error: No API key provided. Use --api-key or set OPENAI_API_KEY environment variable")
        return
    
    # Load snapshots
    print(f"Loading snapshots from {args.snapshots}...")
    with open(args.snapshots, 'r') as f:
        data = json.load(f)
    
    snapshots = data['snapshots']
    print(f"Loaded {len(snapshots)} snapshots")
    
    # Evaluate
    print(f"\nEvaluating {args.model} on up to {args.max_samples} samples...")
    print(f"Rate limit: {args.rate_limit}s between calls")
    print(f"Estimated time: {args.max_samples * args.rate_limit / 60:.1f} minutes")
    
    results = evaluate_gpt4(
        snapshots,
        api_key,
        model=args.model,
        max_samples=args.max_samples,
        rate_limit_delay=args.rate_limit
    )
    
    if results and 'error' not in results:
        # Save results
        output_data = {
            'metadata': {
                'model': args.model,
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
                'total_snapshots_available': len(snapshots),
                'samples_evaluated': results['num_samples']
            },
            'results': results
        }
        
        with open(args.output, 'w') as f:
            json.dump(output_data, f, indent=2)
        
        print(f"\nResults saved to {args.output}")
        
        # Print summary
        print(f"\n{'='*60}")
        print(f"Summary for {args.model}:")
        print(f"  Samples evaluated: {results['num_samples']}")
        print(f"  Failed samples: {results['failed_samples']}")
        print(f"  Average score: {results['avg_optimistic']:.3f} bits")
        print(f"  Median score: {results['median_optimistic']:.3f} bits")
        print(f"  Avg guesses before correct: {results['avg_guesses_before_correct']:.1f}")
        print(f"  Most common wrong guesses: {', '.join([f\"{g['letter']}({g['count']})\" for g in results['most_common_wrong_guesses'][:5]])}")
        print(f"  Total API calls made: {results['total_api_calls']}")
        print(f"{'='*60}")
        
        # Cost estimate (rough)
        if 'gpt-4' in args.model:
            cost_per_1k = 0.03  # Approximate
            total_tokens = results['total_api_calls'] * 600  # Rough estimate
            cost = (total_tokens / 1000) * cost_per_1k
            print(f"\nEstimated API cost: ${cost:.2f}")
    else:
        print("\nEvaluation failed!")

if __name__ == "__main__":
    main()