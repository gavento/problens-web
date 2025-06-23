#!/usr/bin/env python3
"""
Extract and format distance matrices for texts from unified content analysis
"""

import json
from pathlib import Path

def load_data():
    """Load the unified content analysis data"""
    data_path = Path("public/data/unified_content_analysis.json")
    with open(data_path, 'r') as f:
        return json.load(f)

def get_text_items(data):
    """Get list of text items"""
    kl_data = data['kl_analysis']['baseline']
    return [item for item in kl_data['languages'] if item.startswith('text_')]

def format_matrix(matrix_data, text_items, title, description):
    """Format a distance matrix for display"""
    # Clean names for display
    clean_names = {
        'text_harry1': 'Harry Potter 1',
        'text_harry2': 'Harry Potter 2', 
        'text_harry3': 'Harry Potter 3',
        'text_declaration_full': 'US Declaration',
        'text_kl_intro_10kb': 'KL Intro',
        'text_anthems-en': 'Anthems (EN)',
        'text_anthems': 'Anthems (FR)'
    }
    
    print(f"\n## {title}")
    print(f"{description}\n")
    
    # Print header
    print("| " + " " * 16, end="")
    for item in text_items:
        print(f"| {clean_names[item][:12]:>12}", end="")
    print(" |")
    
    # Print separator
    print("|" + "-" * 17, end="")
    for _ in text_items:
        print("|" + "-" * 13, end="")
    print("|")
    
    # Print rows
    for i, item1 in enumerate(text_items):
        print(f"| {clean_names[item1][:15]:15}", end="")
        for j, item2 in enumerate(text_items):
            if i == j:
                print(f"| {'--':>12}", end="")
            else:
                distance = matrix_data[item1][item2]
                print(f"| {distance:>12.3f}", end="")
        print(" |")

def main():
    data = load_data()
    text_items = get_text_items(data)
    
    print("# Text Similarity Distance Matrices")
    print(f"\nAnalyzed {len(text_items)} text documents:")
    clean_names = {
        'text_harry1': 'Harry Potter 1',
        'text_harry2': 'Harry Potter 2', 
        'text_harry3': 'Harry Potter 3',
        'text_declaration_full': 'US Declaration',
        'text_kl_intro_10kb': 'KL Intro',
        'text_anthems-en': 'Anthems (EN)',
        'text_anthems': 'Anthems (FR)'
    }
    
    for item in text_items:
        print(f"- {clean_names[item]}")
    
    # KL divergence matrix
    kl_matrix = data['kl_analysis']['baseline']['distance_matrix']
    format_matrix(
        kl_matrix, 
        text_items,
        "KL Divergence Distance Matrix",
        "Based on character frequency distributions. Lower values = more similar character usage patterns."
    )
    
    # DEFLATE compression matrix  
    deflate_matrix = data['deflate_analysis']['distance_matrix']
    format_matrix(
        deflate_matrix,
        text_items, 
        "DEFLATE Compression Distance Matrix",
        "Based on dictionary compression effectiveness. Lower values = better cross-compression (more structural similarity)."
    )
    
    print("\n## Key Observations")
    print("\n### KL Divergence (Character Frequencies):")
    
    # Find most similar pairs in KL
    min_dist = float('inf')
    min_pair = None
    for i, item1 in enumerate(text_items):
        for j, item2 in enumerate(text_items):
            if i < j:  # Only check upper triangle
                dist = kl_matrix[item1][item2]
                if dist < min_dist:
                    min_dist = dist
                    min_pair = (item1, item2)
    
    if min_pair:
        print(f"- Most similar texts: {clean_names[min_pair[0]]} ↔ {clean_names[min_pair[1]]} (distance: {min_dist:.3f})")
    
    print("\n### DEFLATE Compression:")
    
    # Find most similar pairs in DEFLATE
    min_dist = float('inf')
    min_pair = None
    for i, item1 in enumerate(text_items):
        for j, item2 in enumerate(text_items):
            if i < j:  # Only check upper triangle
                dist = deflate_matrix[item1][item2]
                if dist < min_dist:
                    min_dist = dist
                    min_pair = (item1, item2)
    
    if min_pair:
        print(f"- Most similar texts: {clean_names[min_pair[0]]} ↔ {clean_names[min_pair[1]]} (distance: {min_dist:.3f})")

if __name__ == "__main__":
    main()