"""
Script to compute letter prediction scores using the HF Space API.
This automates the batch evaluation process.
"""

import json
import requests
from gradio_client import Client
import time

# Your HF Space URL
SPACE_URL = "vaclavrozhon/probabilistic-lenses-widgets"

# Models to evaluate
MODELS_TO_EVALUATE = [
    "gpt2",
    "distilgpt2",
    "gpt2-medium",
    "microsoft/DialoGPT-small",
    "EleutherAI/gpt-neo-125M",
]

def compute_scores_via_space():
    """Use the HF Space to compute scores for all models."""
    
    # Load snapshots
    with open('public/data/prediction_snapshots.json', 'r') as f:
        data = json.load(f)
    
    print(f"Loaded {len(data['snapshots'])} snapshots")
    
    # Connect to the HF Space
    try:
        client = Client(SPACE_URL)
        
        # For each model, evaluate on snapshots
        all_results = {}
        
        for model_name in MODELS_TO_EVALUATE:
            print(f"\nEvaluating {model_name}...")
            scores = []
            
            # Process in batches to avoid timeout
            batch_size = 10
            for i in range(0, len(data['snapshots']), batch_size):
                batch = data['snapshots'][i:i+batch_size]
                
                for snapshot in batch:
                    context = snapshot['first_sentence'] + " " + snapshot['context']
                    target = snapshot['target_letter']
                    
                    try:
                        # Call the space API
                        result = client.predict(
                            model_name,
                            context,
                            target,
                            api_name="/predict"
                        )
                        
                        if 'score' in result:
                            # Extract numeric score from "X.XX bits" format
                            score_str = result['score'].replace(' bits', '')
                            scores.append(float(score_str))
                    
                    except Exception as e:
                        print(f"Error processing snapshot: {e}")
                        continue
                    
                    # Small delay to avoid rate limiting
                    time.sleep(0.1)
                
                print(f"Processed {len(scores)} samples so far...")
            
            # Calculate statistics
            if scores:
                import numpy as np
                all_results[model_name] = {
                    'model': model_name,
                    'num_samples': len(scores),
                    'avg_optimistic': float(np.mean(scores)),
                    'median_optimistic': float(np.median(scores)),
                    'std_optimistic': float(np.std(scores)),
                    'min_optimistic': float(np.min(scores)),
                    'max_optimistic': float(np.max(scores))
                }
                
                print(f"{model_name}: avg={all_results[model_name]['avg_optimistic']:.2f} bits")
        
        # Save results
        output_data = {
            'summary': all_results,
            'models_evaluated': list(all_results.keys()),
            'total_snapshots': len(data['snapshots'])
        }
        
        with open('public/data/llm_prediction_scores.json', 'w') as f:
            json.dump(output_data, f, indent=2)
        
        print("\nResults saved to llm_prediction_scores.json")
        
    except Exception as e:
        print(f"Error connecting to HF Space: {e}")
        print("\nAlternative: You can manually use the space at:")
        print(f"https://huggingface.co/spaces/{SPACE_URL}")

if __name__ == "__main__":
    compute_scores_via_space()