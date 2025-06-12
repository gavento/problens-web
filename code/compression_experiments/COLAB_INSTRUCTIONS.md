# LLM Compression Experiments - Google Colab Instructions

## Setup

1. **Upload files to Colab:**
   - Upload `llm_colab_compression.py` 
   - Upload the entire `texts/` folder (with `list.json` and all `.txt` files)

2. **Install dependencies:**
   ```python
   !pip install transformers torch tqdm huggingface-hub
   ```

3. **Add HuggingFace token (for Llama-3.1-8B):**
   - Go to Colab Secrets (🔑 icon in left sidebar)
   - Add secret: `HF_TOKEN` = your HuggingFace token
   - Get token from: https://huggingface.co/settings/tokens

## Running Experiments

```python
!python llm_colab_compression.py
```

**Expected runtime:** 30-90 minutes
**GPU requirement:** T4 or A100 (16GB+ VRAM for Llama-3.1-8B)

## Results

The script will generate: `llm_compression_results_YYYYMMDD_HHMMSS.json`

This contains results for both:
- **GPT-2**: Fast baseline model  
- **Llama-3.1-8B**: More powerful model with larger context

## Copy Results Back

1. Download the JSON file from Colab
2. Copy the results into your project's compression results system
3. Update the CompressionWidget with the new LLM data

## File Structure

```
/content/
├── llm_colab_compression.py
└── texts/
    ├── list.json
    ├── kl_intro_10kb.txt
    ├── pi_digits_10kb.txt
    ├── declaration_full.txt
    ├── human_mitochondrial_dna.txt
    ├── huffman_code_10kb.txt
    └── repeated_phrase.txt
```

## Troubleshooting

- **Out of memory**: Use smaller model or reduce context window
- **HF token error**: Make sure token has access to Llama models
- **Model not found**: Check model name and permissions
- **Slow processing**: Normal - LLMs process token-by-token with sliding window