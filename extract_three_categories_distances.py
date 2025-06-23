#!/usr/bin/env python3
"""
Extract and format distance matrices for three categories content
"""

import json
from pathlib import Path

def load_data():
    """Load the three categories analysis data"""
    data_path = Path("public/data/three_categories_analysis.json")
    with open(data_path, 'r') as f:
        return json.load(f)

def get_items_by_category(data):
    """Get items organized by category"""
    kl_data = data['kl_analysis']['baseline']
    
    countries = [item for item in kl_data['languages'] if item.startswith('country_')]
    fruits = [item for item in kl_data['languages'] if item.startswith('fruit_')]
    animals = [item for item in kl_data['languages'] if item.startswith('animal_')]
    
    return countries, fruits, animals

def format_matrix(matrix_data, items, title, description, value_suffix=""):
    """Format a distance matrix for display"""
    # Clean names for display
    clean_names = {
        # Countries
        'country_france': 'France',
        'country_japan': 'Japan',
        'country_brazil': 'Brazil',
        'country_germany': 'Germany',
        'country_australia': 'Australia',
        # Fruits
        'fruit_apple': 'Apple',
        'fruit_banana': 'Banana',
        'fruit_strawberry': 'Strawberry',
        # Animals
        'animal_lion': 'Lion',
        'animal_elephant': 'Elephant',
        'animal_dolphin': 'Dolphin',
        'animal_tiger': 'Tiger',
        'animal_penguin': 'Penguin',
        'animal_giraffe': 'Giraffe'
    }
    
    print(f"\n## {title}")
    print(f"{description}\n")
    
    # Print header
    print("| " + " " * 10, end="")
    for item in items:
        print(f"| {clean_names[item][:9]:>9}", end="")
    print(" |")
    
    # Print separator
    print("|" + "-" * 11, end="")
    for _ in items:
        print("|" + "-" * 10, end="")
    print("|")
    
    # Print rows
    for i, item1 in enumerate(items):
        print(f"| {clean_names[item1][:9]:9}", end="")
        for j, item2 in enumerate(items):
            if i == j:
                print(f"| {'--':>9}", end="")
            else:
                distance = matrix_data[item1][item2]
                print(f"| {distance:>9.3f}", end="")
        print(" |")

def format_full_matrix(matrix_data, countries, fruits, animals, title, description, value_suffix=""):
    """Format the complete cross-category matrix"""
    clean_names = {
        # Countries
        'country_france': 'France',
        'country_japan': 'Japan',
        'country_brazil': 'Brazil',
        'country_germany': 'Germany',
        'country_australia': 'Australia',
        # Fruits
        'fruit_apple': 'Apple',
        'fruit_banana': 'Banana',
        'fruit_strawberry': 'Strawberry',
        # Animals
        'animal_lion': 'Lion',
        'animal_elephant': 'Elephant',
        'animal_dolphin': 'Dolphin',
        'animal_tiger': 'Tiger',
        'animal_penguin': 'Penguin',
        'animal_giraffe': 'Giraffe'
    }
    
    all_items = countries + fruits + animals
    
    print(f"\n## {title}")
    print(f"{description}\n")
    
    # Print header with category labels
    print("| " + " " * 10, end="")
    for item in all_items:
        emoji = "🏛️" if item.startswith('country_') else "🍎" if item.startswith('fruit_') else "🐱"
        name = clean_names[item][:7]
        print(f"| {emoji}{name:>7}", end="")
    print(" |")
    
    # Print separator
    print("|" + "-" * 11, end="")
    for _ in all_items:
        print("|" + "-" * 9, end="")
    print("|")
    
    # Print rows with category emojis
    for item1 in all_items:
        emoji1 = "🏛️" if item1.startswith('country_') else "🍎" if item1.startswith('fruit_') else "🐱"
        name1 = clean_names[item1][:7]
        print(f"| {emoji1}{name1:>7}", end="")
        
        for item2 in all_items:
            if item1 == item2:
                print(f"| {'--':>8}", end="")
            else:
                distance = matrix_data[item1][item2]
                if value_suffix:
                    print(f"| {distance:>7.2f}", end="")
                else:
                    print(f"| {distance:>8.3f}", end="")
        print(" |")

def main():
    data = load_data()
    countries, fruits, animals = get_items_by_category(data)
    
    print("# Three Categories Similarity Distance Matrices")
    print(f"\nAnalyzed {len(countries)} countries, {len(fruits)} fruits, and {len(animals)} animals:")
    
    clean_names = {
        # Countries
        'country_france': 'France',
        'country_japan': 'Japan',
        'country_brazil': 'Brazil',
        'country_germany': 'Germany',
        'country_australia': 'Australia',
        # Fruits
        'fruit_apple': 'Apple',
        'fruit_banana': 'Banana',
        'fruit_strawberry': 'Strawberry',
        # Animals
        'animal_lion': 'Lion',
        'animal_elephant': 'Elephant',
        'animal_dolphin': 'Dolphin',
        'animal_tiger': 'Tiger',
        'animal_penguin': 'Penguin',
        'animal_giraffe': 'Giraffe'
    }
    
    print("\n**🏛️ Countries:**")
    for item in countries:
        print(f"- {clean_names[item]}")
    
    print("\n**🍎 Fruits:**")
    for item in fruits:
        print(f"- {clean_names[item]}")
    
    print("\n**🐱 Animals:**")
    for item in animals:
        print(f"- {clean_names[item]}")
    
    # KL divergence matrices
    kl_matrix = data['kl_analysis']['baseline']['distance_matrix']
    
    format_full_matrix(
        kl_matrix,
        countries, fruits, animals,
        "KL Divergence - Complete Matrix",
        "Character frequency similarity across all three categories. Lower values = more similar character usage patterns."
    )
    
    # Generalized divergence matrices  
    gen_div_matrix = data['generalized_divergence_analysis']['distance_matrix']
    
    format_full_matrix(
        gen_div_matrix,
        countries, fruits, animals,
        "Generalized Divergence - Complete Matrix",
        "Compression-based similarity across all three categories. Values in bits per character difference.",
        "bits/char"
    )
    
    print("\n## Key Observations")
    
    # Find most similar pairs within and across categories
    print("\n### Within-Category Similarities (KL Divergence):")
    
    # Countries
    min_dist = float('inf')
    min_pair = None
    for i, item1 in enumerate(countries):
        for j, item2 in enumerate(countries):
            if i < j:
                dist = kl_matrix[item1][item2]
                if dist < min_dist:
                    min_dist = dist
                    min_pair = (item1, item2)
    
    if min_pair:
        print(f"- Most similar countries: {clean_names[min_pair[0]]} ↔ {clean_names[min_pair[1]]} (distance: {min_dist:.3f})")
    
    # Fruits
    min_dist = float('inf')
    min_pair = None
    for i, item1 in enumerate(fruits):
        for j, item2 in enumerate(fruits):
            if i < j:
                dist = kl_matrix[item1][item2]
                if dist < min_dist:
                    min_dist = dist
                    min_pair = (item1, item2)
    
    if min_pair:
        print(f"- Most similar fruits: {clean_names[min_pair[0]]} ↔ {clean_names[min_pair[1]]} (distance: {min_dist:.3f})")
    
    # Animals
    min_dist = float('inf')
    min_pair = None
    for i, item1 in enumerate(animals):
        for j, item2 in enumerate(animals):
            if i < j:
                dist = kl_matrix[item1][item2]
                if dist < min_dist:
                    min_dist = dist
                    min_pair = (item1, item2)
    
    if min_pair:
        print(f"- Most similar animals: {clean_names[min_pair[0]]} ↔ {clean_names[min_pair[1]]} (distance: {min_dist:.3f})")
    
    print("\n### Cross-Category Similarity (KL Divergence):")
    
    # Find best cross-category pairs
    all_items = countries + fruits + animals
    cross_pairs = []
    
    for item1 in all_items:
        for item2 in all_items:
            cat1 = data['kl_analysis']['baseline']['categories'][item1]
            cat2 = data['kl_analysis']['baseline']['categories'][item2]
            if cat1 != cat2:  # Different categories
                dist = kl_matrix[item1][item2]
                cross_pairs.append((item1, item2, dist, f"{cat1}-{cat2}"))
    
    # Sort and show top 3
    cross_pairs.sort(key=lambda x: x[2])
    for i, (item1, item2, dist, cat_pair) in enumerate(cross_pairs[:3]):
        print(f"- #{i+1} cross-category: {clean_names[item1]} ↔ {clean_names[item2]} ({cat_pair}: {dist:.3f})")
    
    print("\n### Generalized Divergence Analysis:")
    
    # Countries compression
    min_dist = float('inf')
    min_pair = None
    for i, item1 in enumerate(countries):
        for j, item2 in enumerate(countries):
            if i < j:
                dist = gen_div_matrix[item1][item2]
                if dist < min_dist:
                    min_dist = dist
                    min_pair = (item1, item2)
    
    if min_pair:
        print(f"- Best compressing countries: {clean_names[min_pair[0]]} ↔ {clean_names[min_pair[1]]} ({min_dist:.3f} bits/char)")
    
    # Animals compression  
    min_dist = float('inf')
    min_pair = None
    for i, item1 in enumerate(animals):
        for j, item2 in enumerate(animals):
            if i < j:
                dist = gen_div_matrix[item1][item2]
                if dist < min_dist:
                    min_dist = dist
                    min_pair = (item1, item2)
    
    if min_pair:
        print(f"- Best compressing animals: {clean_names[min_pair[0]]} ↔ {clean_names[min_pair[1]]} ({min_dist:.3f} bits/char)")
    
    # Cross-category compression
    cross_pairs_gen = []
    for item1 in all_items:
        for item2 in all_items:
            cat1 = data['generalized_divergence_analysis']['categories'][item1]
            cat2 = data['generalized_divergence_analysis']['categories'][item2]
            if cat1 != cat2:
                dist = gen_div_matrix[item1][item2]
                cross_pairs_gen.append((item1, item2, dist, f"{cat1}-{cat2}"))
    
    cross_pairs_gen.sort(key=lambda x: x[2])
    best_cross = cross_pairs_gen[0]
    print(f"- Best cross-category compression: {clean_names[best_cross[0]]} ↔ {clean_names[best_cross[1]]} ({best_cross[3]}: {best_cross[2]:.3f} bits/char)")

if __name__ == "__main__":
    main()