# GPT-4 Letter Prediction Evaluation Guide

## Setup

1. **Install requirements**:
   ```bash
   pip install -r requirements_gpt4.txt
   ```

2. **Set your OpenAI API key**:
   ```bash
   export OPENAI_API_KEY="sk-..."
   ```

## Usage

### Basic evaluation (100 samples)
```bash
python gpt4_letter_prediction.py --api-key YOUR_API_KEY
```

### Evaluate different models
```bash
# GPT-4 Turbo (recommended - faster and cheaper)
python gpt4_letter_prediction.py --model gpt-4-turbo-preview

# GPT-3.5 Turbo (cheapest, but less accurate)
python gpt4_letter_prediction.py --model gpt-3.5-turbo

# Original GPT-4 (most expensive)
python gpt4_letter_prediction.py --model gpt-4
```

### Custom settings
```bash
# Evaluate 50 samples with 2 second delay between calls
python gpt4_letter_prediction.py \
  --max-samples 50 \
  --rate-limit 2.0 \
  --output gpt4_results.json
```

## How it works

The script:
1. Sends each text snippet to GPT-4 with instructions to predict the next letter
2. Asks GPT-4 to rank all 26 letters by confidence
3. Calculates the rank of the correct letter
4. Computes the optimistic cross-entropy score (log₂ of rank)
5. Tracks which letters GPT-4 guessed before the correct one

## Prompt strategy

The prompt explicitly tells GPT-4:
- NOT to use internet or external knowledge
- To base predictions only on the given context
- To consider English patterns and grammar
- To respond in a structured JSON format with confidence rankings

## Output format

```json
{
  "metadata": {
    "model": "gpt-4-turbo-preview",
    "timestamp": "2024-...",
    "samples_evaluated": 100
  },
  "results": {
    "model": "gpt-4-turbo-preview",
    "num_samples": 100,
    "avg_optimistic": 1.234,
    "median_optimistic": 1.000,
    "avg_guesses_before_correct": 1.5,
    "most_common_wrong_guesses": [
      {"letter": "e", "count": 45},
      {"letter": "a", "count": 38},
      ...
    ]
  }
}
```

## Cost estimation

Approximate costs per 100 samples:
- GPT-4: ~$2-3
- GPT-4 Turbo: ~$0.50-1
- GPT-3.5 Turbo: ~$0.05-0.10

## Tips

1. **Start small**: Test with 10-20 samples first
2. **Rate limiting**: Use at least 1 second delay to avoid rate limits
3. **Model choice**: GPT-4 Turbo is recommended for best balance of cost/performance
4. **Monitoring**: The script shows progress and examples during evaluation

## Comparing with local models

After running both the RunPod script and this GPT-4 script, you can compare:
- Which models are better at predicting the next letter
- Common patterns in wrong guesses
- Cost vs performance trade-offs