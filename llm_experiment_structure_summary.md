# LLM Compression Experiment Data Structure Summary

## Overview
The LLM compression experiment data consists of two JSON files containing compression performance data for different language models:
- **Llama-4-Scout-17B**: `/home/vasek/problens-web/code/compression_experiments/llm_compression_data/results_20250614_074947_llama-4-scout-17b.json`
- **GPT-2**: `/home/vasek/problens-web/code/compression_experiments/llm_compression_data/results_20250614_074618_gpt-2.json`

## File Structure

Each JSON file contains **6 experiments** with identical text files but different model predictions:

### Experiments Included:
1. **kl_intro_10kb** - Academic text about information theory and KL divergence
2. **pi_digits_10kb** - First 10,000 digits of π (mathematically random)
3. **declaration_full** - Declaration of Independence (natural English prose)
4. **human_mitochondrial_dna** - Complete human mitochondrial genome (16,569 bases)
5. **huffman_code_10kb** - JavaScript function with typical programming patterns
6. **repeated_phrase** - Highly structured repetitive text

### Individual Experiment Structure:
```json
{
  "experiment_name": {
    "name": "Human-readable name",
    "filename": "source_file.txt",
    "description": "Description of the text type",
    "bits": 8125.26,           // Total compression bits
    "tokens": 2221,            // Total number of tokens
    "bits_per_token": 3.6584,  // Average bits per token
    "detailed_tokens": [       // Array of token-level data
      {
        "token": "KL",           // The actual token text
        "log2_prob": 32.8213,    // Negative log2 probability (bits for this token)
        "top10": [               // Top 10 alternative predictions with their log probs
          ["alternative_token", -log2_prob],
          // ... 9 more alternatives
        ]
      }
      // ... more tokens
    ]
  }
}
```

## Key Data Characteristics

### Character Position Calculation
- **No explicit character positions**: Character positions must be calculated by cumulative sum of token lengths
- **Token-to-character mapping**: 
  ```python
  char_pos = 0
  for token_data in detailed_tokens:
      token_length = len(token_data['token'])
      # token spans from char_pos to char_pos + token_length
      char_pos += token_length
  ```

### Bits per Character Calculation
- **Formula**: `bits_per_character = log2_prob / len(token)`
- **Cumulative calculation**: Sum all token bits, divide by total characters

### Data Statistics by Model and Experiment:

#### Llama-4-Scout-17B Performance:
| Experiment | Tokens | Characters | Bits/Char | Description |
|------------|--------|------------|-----------|-------------|
| kl_intro_10kb | 2,221 | 9,371 | 0.8658 | Academic text |
| pi_digits_10kb | 3,419 | 10,000 | 0.0929 | Random digits |
| declaration_full | 1,920 | 9,262 | 0.0217 | English prose |
| human_mitochondrial_dna | 6,583 | 16,569 | 2.2147 | DNA sequence |
| huffman_code_10kb | 2,855 | 11,943 | 0.2156 | Code |
| repeated_phrase | 1,800 | 8,799 | 0.0049 | Repetitive text |

#### GPT-2 Performance:
| Experiment | Tokens | Characters | Bits/Char | Description |
|------------|--------|------------|-----------|-------------|
| kl_intro_10kb | 2,402 | 9,413 | 1.1812 | Academic text |
| pi_digits_10kb | 4,313 | 9,999 | 3.4293 | Random digits |
| declaration_full | 2,048 | 9,259 | 0.9498 | English prose |
| human_mitochondrial_dna | 8,410 | 16,568 | 2.1732 | DNA sequence |
| huffman_code_10kb | 5,471 | 11,937 | 1.1365 | Code |
| repeated_phrase | 1,799 | 8,796 | 0.0223 | Repetitive text |

## Visualization Considerations

### For Building Interactive Visualizations:

1. **Token-level heatmap**: 
   - Map each token to its character span
   - Color-code by `log2_prob` value (compression difficulty)
   - Show token boundaries and text

2. **Character-level compression rate**:
   - Calculate bits per character for each token
   - Smooth over character positions for continuous visualization

3. **Comparative analysis**:
   - Side-by-side model comparison
   - Different text types show different compression patterns
   - Repetitive text compresses much better than random/DNA data

4. **Alternative predictions**:
   - Use `top10` data to show model uncertainty
   - Higher uncertainty correlates with higher compression cost

### Technical Implementation Notes:

- **Memory considerations**: Files are large (13-17MB each)
- **Character encoding**: All text appears to be standard UTF-8
- **Token boundaries**: Tokens can be multi-character (e.g., " divergence", "141")
- **Probability interpretation**: `log2_prob` is the negative log2 probability (higher = more surprising = more bits needed)

## Source Text Files
Located in `/home/vasek/problens-web/code/compression_experiments/texts/`:
- kl_intro_10kb.txt (9,455 chars)
- pi_digits_10kb.txt (10,000 chars)  
- declaration_full.txt (~9,262 chars)
- human_mitochondrial_dna.txt (16,569 chars)
- huffman_code_10kb.txt (~11,943 chars)
- repeated_phrase.txt (~8,799 chars)