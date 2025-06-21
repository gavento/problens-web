# Programming Language Similarity via Compression

This experiment measures programming language similarity using compression algorithms, demonstrating the connection between information theory and programming language design.

## Overview

The idea is simple yet powerful: if two programming languages have similar syntax, keywords, and structure, then a compression algorithm trained on one should compress the other efficiently. By measuring cross-compression ratios, we can quantify language similarity.

## Components

### 1. Data Collection (`collect-rosetta-code.py`)

Scrapes programming solutions from [Rosetta Code](http://rosettacode.org/) to build datasets for each programming language.

**Usage:**
```bash
pip install -r requirements.txt
python collect-rosetta-code.py --max-tasks 100 --target-size 1.0
```

**Features:**
- Collects code samples from multiple programming tasks
- Supports 25+ programming languages
- Consolidates samples into ~1MB files per language
- Handles parsing and cleaning of code blocks

### 2. Compression Analysis (`compression_analysis.py`)

Implements three compression-based similarity metrics:

**Usage:**
```bash
python compression_analysis.py --method all --output results.json
```

**Methods:**

1. **Baseline (Character Frequency + KL Divergence)**
   - Calculates character frequency distributions for each language
   - Computes KL divergence between language pairs
   - Fast and interpretable baseline metric

2. **Zstandard Dictionary Compression**
   - Trains Zstd dictionary on one language's code
   - Compresses another language using that dictionary
   - Measures compression ratio as similarity metric

3. **Gzip Pseudo-dictionary Compression**
   - Uses gzip with concatenated language data as "dictionary"
   - Simpler alternative to Zstd approach

### 3. Visualization Widget

Interactive spring-force graph showing language similarity networks:

- **Nodes**: Programming languages (sized by entropy)
- **Edges**: Compression similarity (thickness = similarity)
- **Colors**: Language families (C-family, functional, scripting, etc.)
- **Interaction**: Hover to highlight connections, click for details

## Theory

This experiment demonstrates several key concepts:

1. **Cross-entropy in Practice**: Training on distribution P, compressing distribution Q
2. **Kolmogorov Complexity**: Languages with similar "complexity" compress each other better
3. **Dictionary Learning**: Zstd learns optimal dictionaries for specific language patterns
4. **Information-theoretic Distance**: Compression ratios as pseudo-metrics

## Expected Results

Languages should cluster by:
- **Syntax Family**: C/C++/Java/Go should be similar
- **Paradigm**: Haskell/Lisp/Scheme (functional) should cluster
- **Domain**: MATLAB/R (numerical) might be similar

## Files Generated

- `data/programming_languages/`: Raw collected code samples
- `data/programming_languages/*_consolidated.txt`: Consolidated language files
- `compression_analysis_results.json`: Distance matrices and metrics
- `collection_stats.json`: Collection statistics

## Future Extensions

1. **Token-level Analysis**: Use language-specific tokenizers
2. **AST-based Similarity**: Compare abstract syntax trees
3. **LLM Compression**: Use language models as compressors
4. **Temporal Analysis**: How language similarity evolves over time
5. **Feature Attribution**: Which language features drive similarity

## Installation

```bash
# Python dependencies
pip install -r requirements.txt

# For the web widget (from project root)
pnpm install
```

## Running the Full Pipeline

```bash
# 1. Collect data (takes ~30 minutes)
python collect-rosetta-code.py --max-tasks 50

# 2. Run compression analysis (takes ~10 minutes)
python compression_analysis.py --method all

# 3. View results in the web interface
# Navigate to /09-coding_theory/ in the running application
```

This experiment beautifully connects abstract information theory with practical programming language design, showing how compression can reveal hidden structure in code!