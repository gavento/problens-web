# Current Text Files for Compression Widget

## Widget Uses These 6 Samples:

### 1. **KL Intro Text** (`kl_intro_10kb.txt`)
- **Size**: 9,371 characters (~9KB)
- **Content**: KL divergence explanatory text from chapter 01
- **Status**: ✅ Has zlib results, ❌ Needs GPT-2 experiment

### 2. **Pi Digits** (`pi_digits_10kb.txt`) 
- **Size**: 10,000 characters (10KB)
- **Content**: First 10,000 actual digits of π
- **Status**: ✅ Has zlib results, ❌ Needs GPT-2 experiment

### 3. **Declaration of Independence** (`declaration.txt`)
- **Size**: 1,062 characters (~1KB) 
- **Content**: Declaration of Independence text
- **Status**: ✅ Has zlib results, ✅ Has GPT-2 results

### 4. **Human Mitochondrial DNA** (`human_mitochondrial_dna.txt`)
- **Size**: 16,569 characters (~16KB)
- **Content**: Real human mitochondrial genome sequence
- **Status**: ✅ Has zlib results, ❌ Needs GPT-2 experiment

### 5. **Python Code** (`huffman_code_10kb.txt`)
- **Size**: 12,021 characters (~12KB)
- **Content**: Complete Huffman coding implementation in Python
- **Status**: ✅ Has zlib results, ❌ Needs GPT-2 experiment

### 6. **Repeated Pattern** (`repeated_10kb.txt`)
- **Size**: 11,114 characters (~11KB)
- **Content**: "The quick brown fox..." repeated many times
- **Status**: ✅ Has zlib results, ❌ Needs GPT-2 experiment

---

## Files Needing LLM Experiments (6 total):
1. `kl_intro_10kb.txt`
2. `pi_digits_10kb.txt` 
3. `human_mitochondrial_dna.txt`
4. `huffman_code_10kb.txt`
5. `repeated_10kb.txt`
6. `declaration.txt` (re-run with new models for comparison)

---

## Old Files (No Longer Used):
- `lorem_ipsum.txt` - replaced with `kl_intro_10kb.txt`
- `pi_digits.txt` - replaced with `pi_digits_10kb.txt`
- `dna.txt` - replaced with `human_mitochondrial_dna.txt`
- `code.txt` - replaced with `huffman_code_10kb.txt`
- `repeated.txt` - replaced with `repeated_10kb.txt`