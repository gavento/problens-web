#!/usr/bin/env python3
"""
Test script to demonstrate the difference between the two approaches.
"""

from transformers import AutoTokenizer
import json

# Load a tokenizer
tokenizer = AutoTokenizer.from_pretrained('gpt2')

# Load a sample snapshot
with open('public/data/prediction_snapshots.json', 'r') as f:
    data = json.load(f)
    snapshot = data['snapshots'][0]

print("Sample snapshot:")
print(f"First sentence: {snapshot['first_sentence']}")
print(f"Second sentence: {snapshot['second_sentence']}")
print(f"Cut position: {snapshot['cut_position']}")
print(f"Context: {snapshot['context']}")
print(f"Target letter: {snapshot['target_letter']}")
print(f"Remaining: {snapshot['remaining']}")

print("\n" + "="*60 + "\n")

# Old approach
print("OLD APPROACH (problematic):")
old_context = snapshot['first_sentence'] + " " + snapshot['context']
print(f"Context given to model: '{old_context}'")
old_tokens = tokenizer.tokenize(old_context)
print(f"Tokens: {old_tokens[-5:]}")  # Last 5 tokens
print("Issue: Ends with unnatural token boundary!")

print("\n" + "="*60 + "\n")

# New approach
print("NEW APPROACH (correct):")
full_text = snapshot['first_sentence'] + ". " + snapshot['second_sentence']
full_tokens = tokenizer.tokenize(full_text)
print(f"Full tokenization: {full_tokens[:30]}...")

# Find where cut falls
first_sentence_length = len(snapshot['first_sentence']) + 2  # +2 for ". "
cut_char_position = first_sentence_length + snapshot['cut_position']
print(f"\nCut position in full text: character {cut_char_position}")

# Demonstrate finding the cut in tokens
current_pos = 0
for i, token in enumerate(full_tokens):
    token_text = token.replace('Ġ', ' ')
    if current_pos <= cut_char_position < current_pos + len(token_text):
        print(f"\nCut falls in token #{i}: '{token}'")
        chars_before = cut_char_position - current_pos
        print(f"Characters before cut in this token: {chars_before}")
        print(f"Prefix: '{token_text[:chars_before]}'")
        print(f"Model sees tokens: {full_tokens[:i]}")
        print(f"Model predicts next token (should start with '{token_text[:chars_before]}')")
        break
    current_pos += len(token_text)

print("\nThis approach:")
print("✓ Respects natural token boundaries")
print("✓ Model sees context exactly as in training")
print("✓ Handles mid-token cuts properly")
print("✓ More efficient (only check relevant tokens)")