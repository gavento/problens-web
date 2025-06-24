#!/usr/bin/env python3
"""
Extract sentence pairs from Wikipedia enwik9 for next-letter prediction experiment.

This script processes the 1GB enwik9 Wikipedia dump to extract clean sentence pairs
for human vs LLM comparison experiments.
"""

import re
import json
import random
from pathlib import Path
from typing import List, Tuple, Optional

def clean_wikipedia_text(text: str) -> str:
    """Clean Wikipedia markup and return plain text."""
    # Remove XML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Remove Wikipedia markup
    text = re.sub(r'\[\[([^\|\]]+\|)?([^\]]+)\]\]', r'\2', text)  # [[link|text]] -> text
    text = re.sub(r'\[([^\]]+)\]', '', text)  # Remove [references]
    text = re.sub(r'\{\{[^}]*\}\}', '', text)  # Remove {{templates}}
    text = re.sub(r'\'{2,5}', '', text)  # Remove wiki bold/italic markup
    
    # Remove special characters and normalize whitespace
    text = re.sub(r'[&]([a-zA-Z]+|#\d+);', '', text)  # Remove HTML entities
    text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
    text = text.strip()
    
    return text

def extract_sentences(text: str) -> List[str]:
    """Extract well-formed sentences from text."""
    # Split on sentence boundaries
    sentences = re.split(r'[.!?]+\s+', text)
    
    clean_sentences = []
    for sentence in sentences:
        sentence = sentence.strip()
        
        # Filter out sentences that are too short, too long, or malformed
        if (20 <= len(sentence) <= 200 and  # Reasonable length
            re.search(r'[a-zA-Z]', sentence) and  # Contains letters
            not re.search(r'^[A-Z\s]*$', sentence) and  # Not all caps
            not re.search(r'^\d+', sentence) and  # Doesn't start with numbers
            sentence.count('(') == sentence.count(')') and  # Balanced parens
            not re.search(r'[<>{}[\]|]', sentence)):  # No remaining markup
            
            clean_sentences.append(sentence)
    
    return clean_sentences

def find_sentence_pairs(sentences: List[str]) -> List[Tuple[str, str]]:
    """Find pairs of consecutive sentences that work well together."""
    pairs = []
    
    for i in range(len(sentences) - 1):
        sent1, sent2 = sentences[i], sentences[i + 1]
        
        # Ensure both sentences are good quality
        if (all(20 <= len(s) <= 150 for s in [sent1, sent2]) and
            all(re.search(r'^[A-Z]', s) for s in [sent1, sent2]) and  # Start with capital
            all(not re.search(r'\b(http|www|\.com|\.org)', s) for s in [sent1, sent2])):  # No URLs
            
            pairs.append((sent1, sent2))
    
    return pairs

def process_enwik9_file(file_path: str, target_pairs: int = 1000) -> List[Tuple[str, str]]:
    """Process the enwik9 file and extract sentence pairs."""
    print(f"Processing {file_path}...")
    
    sentence_pairs = []
    processed_chars = 0
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            current_text = ""
            chunk_size = 50000  # Process in chunks
            
            while len(sentence_pairs) < target_pairs:
                chunk = f.read(chunk_size)
                if not chunk:
                    break
                
                processed_chars += len(chunk)
                current_text += chunk
                
                # Process accumulated text when we have enough
                if len(current_text) > 100000:
                    # Clean and extract sentences
                    clean_text = clean_wikipedia_text(current_text)
                    sentences = extract_sentences(clean_text)
                    pairs = find_sentence_pairs(sentences)
                    
                    # Add good pairs
                    sentence_pairs.extend(pairs)
                    
                    print(f"Processed {processed_chars:,} chars, found {len(sentence_pairs)} pairs")
                    
                    # Keep some overlap for sentence boundaries
                    current_text = current_text[-10000:]
                
                # Stop if we have enough pairs
                if len(sentence_pairs) >= target_pairs * 2:  # Get extra for filtering
                    break
    
    except FileNotFoundError:
        print(f"Error: Could not find enwik9 file at {file_path}")
        print("Make sure the file exists and path is correct.")
        return []
    
    # Shuffle and select best pairs
    random.shuffle(sentence_pairs)
    
    # Filter for highest quality pairs
    final_pairs = []
    for sent1, sent2 in sentence_pairs:
        if len(final_pairs) >= target_pairs:
            break
            
        # Additional quality checks
        if (not any(word in sent1.lower() + sent2.lower() 
                   for word in ['wikipedia', 'article', 'category', 'template', 'redirect']) and
            all(len(s.split()) >= 4 for s in [sent1, sent2])):  # At least 4 words each
            
            final_pairs.append((sent1, sent2))
    
    return final_pairs

def create_prediction_snapshots(sentence_pairs: List[Tuple[str, str]]) -> List[dict]:
    """Create prediction snapshots with metadata."""
    snapshots = []
    
    for i, (sent1, sent2) in enumerate(sentence_pairs):
        # Find valid cut positions in second sentence (must have character after)
        valid_positions = []
        for pos in range(1, len(sent2) - 1):  # Leave at least one char at end
            if sent2[pos].isalpha():  # Only cut at letters
                valid_positions.append(pos)
        
        if not valid_positions:
            continue
            
        # Choose random cut position
        cut_position = random.choice(valid_positions)
        
        snapshot = {
            'id': i,
            'first_sentence': sent1,
            'second_sentence': sent2,
            'cut_position': cut_position,
            'context': sent2[:cut_position],
            'target_letter': sent2[cut_position].lower(),  # Case insensitive
            'remaining': sent2[cut_position + 1:]
        }
        
        snapshots.append(snapshot)
    
    return snapshots

def main():
    """Main function to extract Wikipedia snapshots."""
    print("Wikipedia Snapshot Extractor")
    print("=" * 40)
    
    # Set random seed for reproducibility
    random.seed(42)
    
    # File paths
    enwik9_path = "/home/vasek/wiki/enwik9"
    output_dir = Path("/home/vasek/problens-web/public/data")
    output_file = output_dir / "prediction_snapshots.json"
    
    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Extract sentence pairs
    print("Extracting sentence pairs from enwik9...")
    sentence_pairs = process_enwik9_file(enwik9_path, target_pairs=1000)
    
    if not sentence_pairs:
        print("Failed to extract sentence pairs!")
        return
    
    print(f"Extracted {len(sentence_pairs)} sentence pairs")
    
    # Create prediction snapshots
    print("Creating prediction snapshots...")
    snapshots = create_prediction_snapshots(sentence_pairs)
    
    print(f"Created {len(snapshots)} prediction snapshots")
    
    # Save to JSON
    output_data = {
        'metadata': {
            'total_snapshots': len(snapshots),
            'source': 'enwik9 Wikipedia dump',
            'created_by': 'scrape_wikipedia_snapshots.py',
            'description': 'Sentence pairs for human vs LLM next-letter prediction comparison'
        },
        'snapshots': snapshots
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"Saved snapshots to: {output_file}")
    
    # Show some examples
    print("\nExample snapshots:")
    for i, snapshot in enumerate(snapshots[:3]):
        print(f"\n{i+1}. Context: \"{snapshot['context']}\"")
        print(f"   Target: '{snapshot['target_letter']}'")
        print(f"   Full: \"{snapshot['first_sentence']} {snapshot['second_sentence']}\"")

if __name__ == "__main__":
    main()