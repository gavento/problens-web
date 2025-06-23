#!/usr/bin/env python3
"""
Extract 20 minimum and maximum distances from the three categories analysis
"""

import json
from pathlib import Path

def load_analysis_data():
    """Load the analysis results"""
    data_path = Path("public/data/three_categories_analysis.json")
    with open(data_path, 'r') as f:
        return json.load(f)

def get_display_name(item_id):
    """Convert item ID to display name"""
    if item_id.startswith('country_'):
        return f"🏛️ {item_id.replace('country_', '').replace('newzealand', 'New Zealand').title()}"
    elif item_id.startswith('fruit_'):
        name = item_id.replace('fruit_', '').title()
        if name == 'Kiwi':
            name = 'Kiwi (fruit)'
        return f"🍎 {name}"
    elif item_id.startswith('animal_'):
        name = item_id.replace('animal_', '').title()
        if name == 'Kiwi':
            name = 'Kiwi (bird)'
        return f"🐱 {name}"
    return item_id

def extract_distances(distance_matrix, name):
    """Extract all pairwise distances from matrix"""
    distances = []
    items = list(distance_matrix.keys())
    
    for i, item1 in enumerate(items):
        for j, item2 in enumerate(items):
            if i < j:  # Only upper triangle to avoid duplicates
                dist = distance_matrix[item1][item2]
                name1 = get_display_name(item1)
                name2 = get_display_name(item2)
                distances.append((dist, name1, name2))
    
    return distances

def main():
    data = load_analysis_data()
    
    print("20 MINIMUM AND MAXIMUM DISTANCES")
    print("=" * 50)
    
    # KL Divergence
    print("\nKL DIVERGENCE")
    print("-" * 20)
    
    kl_distances = extract_distances(data['kl_analysis']['baseline']['distance_matrix'], "KL")
    kl_distances.sort()
    
    print("\n20 MINIMUM distances:")
    for i, (dist, name1, name2) in enumerate(kl_distances[:20]):
        print(f"{i+1:2d}. {name1} ↔ {name2}: {dist:.3f}")
    
    print("\n20 MAXIMUM distances:")
    for i, (dist, name1, name2) in enumerate(kl_distances[-20:]):
        print(f"{i+1:2d}. {name1} ↔ {name2}: {dist:.3f}")
    
    # Generalized Divergence
    print("\n\nGENERALIZED DIVERGENCE")
    print("-" * 30)
    
    gen_distances = extract_distances(data['generalized_divergence_analysis']['distance_matrix'], "Gen")
    gen_distances.sort()
    
    print("\n20 MINIMUM distances (bits/char):")
    for i, (dist, name1, name2) in enumerate(gen_distances[:20]):
        print(f"{i+1:2d}. {name1} ↔ {name2}: {dist:.3f}")
    
    print("\n20 MAXIMUM distances (bits/char):")
    for i, (dist, name1, name2) in enumerate(gen_distances[-20:]):
        print(f"{i+1:2d}. {name1} ↔ {name2}: {dist:.3f}")

if __name__ == "__main__":
    main()