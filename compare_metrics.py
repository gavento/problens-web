#!/usr/bin/env python3
"""
Compare the correlation between KL divergence and generalized divergence
"""

import json
import numpy as np
from pathlib import Path
from scipy.stats import pearsonr, spearmanr

def load_analysis_data():
    """Load the analysis results"""
    data_path = Path("public/data/three_categories_analysis.json")
    with open(data_path, 'r') as f:
        return json.load(f)

def extract_paired_distances(kl_matrix, gen_matrix):
    """Extract corresponding distances from both matrices"""
    kl_distances = []
    gen_distances = []
    pairs = []
    
    items = list(kl_matrix.keys())
    for i, item1 in enumerate(items):
        for j, item2 in enumerate(items):
            if i < j:  # Only upper triangle
                kl_dist = kl_matrix[item1][item2]
                gen_dist = gen_matrix[item1][item2]
                kl_distances.append(kl_dist)
                gen_distances.append(gen_dist)
                pairs.append((item1, item2))
    
    return kl_distances, gen_distances, pairs

def analyze_differences(kl_distances, gen_distances, pairs):
    """Analyze where the two metrics disagree most"""
    differences = []
    
    # Normalize both to 0-1 scale for comparison
    kl_norm = np.array(kl_distances)
    kl_norm = (kl_norm - kl_norm.min()) / (kl_norm.max() - kl_norm.min())
    
    gen_norm = np.array(gen_distances) 
    gen_norm = (gen_norm - gen_norm.min()) / (gen_norm.max() - gen_norm.min())
    
    for i, (kl, gen) in enumerate(zip(kl_norm, gen_norm)):
        diff = abs(kl - gen)
        differences.append((diff, pairs[i], kl_distances[i], gen_distances[i], kl, gen))
    
    return sorted(differences, key=lambda x: x[0], reverse=True)

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

def main():
    data = load_analysis_data()
    
    kl_matrix = data['kl_analysis']['baseline']['distance_matrix']
    gen_matrix = data['generalized_divergence_analysis']['distance_matrix']
    
    kl_distances, gen_distances, pairs = extract_paired_distances(kl_matrix, gen_matrix)
    
    # Calculate correlations
    pearson_r, pearson_p = pearsonr(kl_distances, gen_distances)
    spearman_r, spearman_p = spearmanr(kl_distances, gen_distances)
    
    print("CORRELATION ANALYSIS BETWEEN METRICS")
    print("=" * 50)
    print(f"Pearson correlation: r = {pearson_r:.4f} (p = {pearson_p:.6f})")
    print(f"Spearman correlation: r = {spearman_r:.4f} (p = {spearman_p:.6f})")
    print()
    
    # Analyze biggest differences
    differences = analyze_differences(kl_distances, gen_distances, pairs)
    
    print("TOP 15 PAIRS WHERE METRICS DISAGREE MOST")
    print("-" * 50)
    print("(Showing normalized difference between 0-1 scaled metrics)")
    print()
    
    for i, (diff, pair, kl_raw, gen_raw, kl_norm, gen_norm) in enumerate(differences[:15]):
        item1, item2 = pair
        name1 = get_display_name(item1)
        name2 = get_display_name(item2)
        
        print(f"{i+1:2d}. {name1} ↔ {name2}")
        print(f"    KL: {kl_raw:.3f} (norm: {kl_norm:.3f}) | Gen: {gen_raw:.3f} (norm: {gen_norm:.3f}) | Diff: {diff:.3f}")
        print()
    
    # Look at category patterns
    print("\nCATEGORY ANALYSIS")
    print("-" * 20)
    
    category_diffs = {'country-country': [], 'fruit-fruit': [], 'animal-animal': [], 
                     'country-fruit': [], 'country-animal': [], 'fruit-animal': []}
    
    for diff, pair, kl_raw, gen_raw, kl_norm, gen_norm in differences:
        item1, item2 = pair
        cat1 = item1.split('_')[0]
        cat2 = item2.split('_')[0]
        
        if cat1 == cat2:
            category_diffs[f'{cat1}-{cat1}'].append(diff)
        else:
            key = f'{cat1}-{cat2}' if f'{cat1}-{cat2}' in category_diffs else f'{cat2}-{cat1}'
            category_diffs[key].append(diff)
    
    for category, diffs in category_diffs.items():
        if diffs:
            print(f"{category}: avg diff = {np.mean(diffs):.3f}, max diff = {np.max(diffs):.3f}")

if __name__ == "__main__":
    main()