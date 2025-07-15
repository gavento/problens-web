#!/usr/bin/env python3
"""Get all GPT-2 tokens and save them to a file."""

from transformers import GPT2Tokenizer
import json

# Load the tokenizer
print("Loading GPT-2 tokenizer...")
tokenizer = GPT2Tokenizer.from_pretrained('gpt2')

# Get the vocabulary
vocab = tokenizer.get_vocab()
print(f"Total tokens: {len(vocab)}")

# Save to different formats
# 1. Simple text file with token and ID
with open('gpt2_tokens.txt', 'w', encoding='utf-8') as f:
    f.write("ID\tToken\tRepr\n")
    for token, token_id in sorted(vocab.items(), key=lambda x: x[1]):
        # Write both the raw token and its repr for clarity
        f.write(f"{token_id}\t{token}\t{repr(token)}\n")

# 2. JSON file for easy programmatic access
with open('gpt2_tokens.json', 'w', encoding='utf-8') as f:
    json.dump(vocab, f, ensure_ascii=False, indent=2)

# 3. Show some examples
print("\nFirst 20 tokens:")
for i in range(20):
    token = tokenizer.convert_ids_to_tokens(i)
    print(f"ID {i}: '{token}' -> {repr(token)}")

print("\nSome interesting tokens:")
interesting = ["hello", "Hello", " hello", " Hello", "Ġhello", "the", " the", "Ġthe"]
for t in interesting:
    if t in vocab:
        print(f"'{t}' -> ID {vocab[t]}")

print("\nFiles saved:")
print("- gpt2_tokens.txt: Tab-separated list of all tokens")
print("- gpt2_tokens.json: JSON dictionary of token->id mappings")