# Human vs LLM Next-Letter Prediction Experiment

This experiment compares human next-letter prediction abilities with various language models using Wikipedia text snippets.

## Setup Overview

### Phase 1: Data Preparation ✅ COMPLETE
1. **Wikipedia Scraping** (`scrape_wikipedia_snapshots.py`)
   - Extracts 1000 clean sentence pairs from enwik9 Wikipedia dump
   - Creates prediction snapshots with random cut positions
   - Saves to `public/data/prediction_snapshots.json`

### Phase 2: LLM Evaluation (RunPod)
2. **LLM Evaluation** (`evaluate_llms_runpod.py`)
   - Evaluates multiple LLMs on letter prediction task
   - Computes cross-entropy and optimistic scores
   - Saves results to `public/data/llm_prediction_scores.json`

### Phase 3: Interactive Widget ✅ COMPLETE
3. **Human Testing Widget** (`LetterPredictionWidget.tsx`)
   - Interactive letter guessing game
   - Tracks user performance vs AI models
   - Shows comparative results after 5+ games

## Files Created

### Scripts
- `scripts/scrape_wikipedia_snapshots.py` - Extract Wikipedia snapshots
- `scripts/evaluate_llms_runpod.py` - LLM evaluation on RunPod
- `scripts/test_evaluation_local.py` - Local testing with small model
- `scripts/setup_runpod.sh` - RunPod environment setup
- `scripts/requirements_runpod.txt` - Python dependencies

### Data Files
- `public/data/prediction_snapshots.json` - 1000 Wikipedia sentence snippets
- `public/data/llm_prediction_scores.json` - LLM evaluation results (to be generated)

### Components
- `components/widgets/LetterPredictionWidget.tsx` - Interactive game widget
- Added to `lib/lib.ts` component registry
- Integrated into `public/09-coding_theory.mdx`

## Algorithm Details

### Token-to-Letter Probability Conversion
For each prediction position:
1. Get LLM's next token probabilities
2. Filter tokens that could start with the current context
3. Sum probabilities for tokens starting with target letter
4. Calculate cross-entropy: -log₂(probability)
5. Calculate optimistic rank: position in sorted letter probabilities

### Scoring Methods
- **Cross-entropy Score**: -log₂(p) where p = LLM's probability for correct letter
- **Optimistic Score**: log₂(k) where k = rank of correct letter in sorted predictions
- **Human Score**: log₂(attempts) where attempts = number of guesses until correct

## RunPod Execution

### Setup
```bash
# Upload files to RunPod instance
scp scripts/* runpod_instance:/workspace/
scp public/data/prediction_snapshots.json runpod_instance:/workspace/

# Setup environment
bash setup_runpod.sh
```

### Evaluation Commands
```bash
# Test with small models
python evaluate_llms_runpod.py --models gpt2 distilgpt2 --max-snapshots 100

# Full evaluation (recommended models)
python evaluate_llms_runpod.py --models \
  gpt2 gpt2-medium gpt2-large \
  meta-llama/Llama-2-7b-hf \
  meta-llama/Llama-2-13b-hf \
  EleutherAI/gpt-neo-1.3B \
  --output results/llm_prediction_scores.json

# Copy results back
scp runpod_instance:/workspace/results/llm_prediction_scores.json public/data/
```

## Recommended LLM Models

### Primary Models
- `gpt2`, `gpt2-medium`, `gpt2-large` - OpenAI GPT-2 variants
- `meta-llama/Llama-2-7b-hf`, `meta-llama/Llama-2-13b-hf` - Meta Llama 2
- `EleutherAI/gpt-neo-1.3B`, `EleutherAI/gpt-neo-2.7B` - EleutherAI models

### Additional Models (if resources allow)
- `microsoft/DialoGPT-medium` - Conversational model
- `distilgpt2` - Lightweight GPT-2
- `microsoft/phi-2` - Microsoft Phi-2 (if available)

## Widget Features

### Game Mechanics
- Shows partial Wikipedia sentences with missing letter
- User guesses letters until correct
- Tracks attempts and calculates log₂(attempts) score
- Reveals full sentence after correct guess

### Results Comparison
- After 5+ completed games, shows comparison with AI models
- Displays user average vs LLM optimistic scores
- Indicates which models user beats/loses to
- Shows difference in bits for each comparison

## Educational Value

This experiment demonstrates:
1. **Prediction = Compression**: Better predictions → better compression
2. **Human Language Understanding**: How well humans predict text
3. **AI Capabilities**: Comparative performance of different language models
4. **Information Theory**: Practical application of Shannon's original experiments
5. **Quantitative Analysis**: Precise measurement of prediction quality in bits

## Next Steps

1. **Run LLM Evaluation**: Execute on RunPod with multiple models
2. **Collect Results**: Transfer LLM scores back to project
3. **User Testing**: Have people play the game and collect data
4. **Analysis**: Compare human vs AI performance across different text types
5. **Optimization**: Potentially tune the algorithm or add more models

The widget is now live and ready for testing at `/09-coding_theory/`!