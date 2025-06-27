# RunPod Letter Prediction Evaluation Guide

## Setup on RunPod

1. **Start a RunPod instance** with at least:
   - For small models: Any GPU with 8GB+ VRAM
   - For medium models: GPU with 16GB+ VRAM (e.g., A5000, A6000)
   - For large models: GPU with 24GB+ VRAM (e.g., A100, H100)

2. **Upload files** to your RunPod instance:
   ```bash
   # Upload the scripts
   scp runpod_letter_prediction.py runpod_requirements.txt runpod_setup.sh root@[runpod-ip]:/workspace/
   
   # Upload your snapshots data
   scp ../public/data/prediction_snapshots.json root@[runpod-ip]:/workspace/
   ```

3. **SSH into RunPod** and run setup:
   ```bash
   cd /workspace
   bash runpod_setup.sh
   ```

4. **Set your HuggingFace token** (required for Llama models):
   ```bash
   export HF_TOKEN="hf_xxxxxxxxxxxxxxxxxxxxx"
   ```

## Running Evaluations

### Small Models (GPT-2 family)
```bash
python runpod_letter_prediction.py --models small --output small_models_scores.json
```

### Medium Models (GPT-J-6B, OPT)
```bash
python runpod_letter_prediction.py --models medium --output medium_models_scores.json
```

### Large Models (Llama 3.1, Mistral)
With 8-bit quantization to fit in memory:
```bash
python runpod_letter_prediction.py --models large --load-8bit --output large_models_scores.json
```

Or with 4-bit for even larger models:
```bash
python runpod_letter_prediction.py --models large --load-4bit --output large_models_4bit_scores.json
```

### Custom Model Selection
```bash
python runpod_letter_prediction.py --models custom \
  --custom-models "meta-llama/Meta-Llama-3.1-8B" "mistralai/Mistral-7B-v0.1" \
  --load-8bit \
  --output custom_models_scores.json
```

### Test Run (100 samples only)
```bash
python runpod_letter_prediction.py --models small --num-samples 100 --output test_scores.json
```

## Model List

**Small Models** (will run on most GPUs):
- gpt2, distilgpt2, gpt2-medium, gpt2-large, gpt2-xl
- EleutherAI/gpt-neo-125M, gpt-neo-1.3B, gpt-neo-2.7B
- microsoft/DialoGPT-small, medium, large

**Medium Models** (need 16GB+ VRAM):
- EleutherAI/gpt-j-6B
- facebook/opt-6.7b, opt-13b

**Large Models** (need 24GB+ VRAM or quantization):
- meta-llama/Llama-2-7b-hf, Llama-2-13b-hf
- meta-llama/Meta-Llama-3-8B
- meta-llama/Meta-Llama-3.1-8B
- mistralai/Mistral-7B-v0.1
- tiiuae/falcon-7b

## Output Format

The script creates a JSON file with:
```json
{
  "metadata": {
    "timestamp": "2024-...",
    "device": "cuda",
    "num_snapshots": 893,
    "load_8bit": false,
    "load_4bit": false
  },
  "summary": {
    "gpt2": {
      "model": "gpt2",
      "num_samples": 893,
      "avg_optimistic": 2.543,
      "median_optimistic": 2.321,
      ...
    }
  }
}
```

## Tips

1. **Memory Management**: The script automatically clears GPU cache between models
2. **Quantization**: Use `--load-8bit` or `--load-4bit` for large models
3. **Partial Results**: Results are saved after each model, so you can stop and resume
4. **Error Handling**: Failed models are logged but don't stop the evaluation

## Downloading Results

After running:
```bash
# From your local machine
scp root@[runpod-ip]:/workspace/*_scores.json ./
```