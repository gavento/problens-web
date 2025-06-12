# Compression Experiments

This is a clean pipeline for running compression experiments on text files.

## Directory Structure

```
compression_experiments/
├── texts/              # Put your .txt files here
├── results/            # Results will be saved here
├── run_llm_compression.py   # Main experiment script
└── requirements.txt    # Python dependencies
```

## Setup

1. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running LLM Compression Experiments

1. Place your text files in the `texts/` directory
2. Run the experiment:
```bash
python run_llm_compression.py
```

3. Results will be saved to `results/llm_compression_results.json`

## How It Works

For each text file, the script:
1. Tokenizes the text using GPT-2 tokenizer
2. For each token position, gets the model's probability distribution
3. Calculates bits = -log2(p) where p is probability of actual next token
4. Sums up total bits needed to encode the text

## Adding New Texts

Simply add new `.txt` files to the `texts/` directory and rerun the script.

## Future Experiments

This pipeline can be extended for:
- Different LLM models (GPT-3, Llama, etc.)
- Non-LLM compression algorithms
- Comparative analysis