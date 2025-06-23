#!/usr/bin/env python3
"""
Show distance matrices for the three categories analysis
"""

import json
import pandas as pd
from pathlib import Path

def load_analysis_data():
    """Load the analysis results"""
    data_path = Path("public/data/three_categories_analysis.json")
    with open(data_path, 'r') as f:
        return json.load(f)

def create_distance_table(distance_matrix, title):
    """Create a formatted distance table grouped by category"""
    # Create display names and sort by category
    def get_display_name(item_id):
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
    
    # Group items by category for better organization
    countries = [item for item in distance_matrix.keys() if item.startswith('country_')]
    fruits = [item for item in distance_matrix.keys() if item.startswith('fruit_')]
    animals = [item for item in distance_matrix.keys() if item.startswith('animal_')]
    
    # Sort within each category
    countries.sort()
    fruits.sort()
    animals.sort()
    
    # Create ordered list: countries, fruits, animals
    ordered_items = countries + fruits + animals
    
    # Create DataFrame with ordered rows and columns
    df = pd.DataFrame(distance_matrix)
    df = df.reindex(index=ordered_items, columns=ordered_items)
    
    # Rename columns and index with display names
    df.columns = [get_display_name(col) for col in df.columns]
    df.index = [get_display_name(idx) for idx in df.index]
    
    print(f"\n{title}")
    print("=" * len(title))
    
    # Format the DataFrame for display
    pd.set_option('display.max_columns', None)
    pd.set_option('display.max_rows', None)
    pd.set_option('display.width', None)
    pd.set_option('display.float_format', '{:.3f}'.format)
    
    print(df.to_string())
    print()

def save_tables_to_file(data, output_file):
    """Save the tables to a text file"""
    import sys
    from io import StringIO
    
    # Capture print output
    old_stdout = sys.stdout
    sys.stdout = captured_output = StringIO()
    
    print("THREE CATEGORIES ANALYSIS - DISTANCE MATRICES")
    print("============================================")
    
    # KL Divergence Matrix
    kl_matrix = data['kl_analysis']['baseline']['distance_matrix']
    create_distance_table(kl_matrix, "KL DIVERGENCE MATRIX")
    
    # Generalized Divergence Matrix  
    gen_div_matrix = data['generalized_divergence_analysis']['distance_matrix']
    create_distance_table(gen_div_matrix, "GENERALIZED DIVERGENCE MATRIX (bits/char)")
    
    # Summary statistics
    print("\nSUMMARY STATISTICS")
    print("==================")
    
    # Calculate some basic stats
    kl_values = []
    gen_div_values = []
    
    items = list(kl_matrix.keys())
    for i, item1 in enumerate(items):
        for j, item2 in enumerate(items):
            if i < j:  # Only upper triangle to avoid duplicates
                kl_values.append(kl_matrix[item1][item2])
                gen_div_values.append(gen_div_matrix[item1][item2])
    
    print(f"Total items analyzed: {data['metadata']['total_items']}")
    print(f"Countries: {data['metadata']['countries']}")
    print(f"Fruits: {data['metadata']['fruits']}")
    print(f"Animals: {data['metadata']['animals']}")
    print()
    
    print("KL Divergence:")
    print(f"  Range: {min(kl_values):.3f} - {max(kl_values):.3f}")
    print(f"  Mean: {sum(kl_values)/len(kl_values):.3f}")
    print()
    
    print("Generalized Divergence:")
    print(f"  Range: {min(gen_div_values):.3f} - {max(gen_div_values):.3f} bits/char")
    print(f"  Mean: {sum(gen_div_values)/len(gen_div_values):.3f} bits/char")
    print()
    
    # Show most similar and most different pairs
    kl_with_pairs = []
    gen_div_with_pairs = []
    
    for i, item1 in enumerate(items):
        for j, item2 in enumerate(items):
            if i < j:  # Only upper triangle to avoid duplicates
                kl_with_pairs.append((kl_matrix[item1][item2], item1, item2))
                gen_div_with_pairs.append((gen_div_matrix[item1][item2], item1, item2))
    
    kl_with_pairs.sort()
    gen_div_with_pairs.sort()
    
    def format_pair_name(item_id):
        if item_id.startswith('country_'):
            return item_id.replace('country_', '').replace('newzealand', 'New Zealand').title()
        elif item_id.startswith('fruit_'):
            name = item_id.replace('fruit_', '').title()
            return f"{name} (fruit)" if name == 'Kiwi' else name
        elif item_id.startswith('animal_'):
            name = item_id.replace('animal_', '').title()
            return f"{name} (bird)" if name == 'Kiwi' else name
        return item_id
    
    print("Most similar pairs (KL Divergence):")
    for i in range(min(20, len(kl_with_pairs))):
        dist, item1, item2 = kl_with_pairs[i]
        if dist > 0:  # Skip self-comparisons
            name1 = format_pair_name(item1)
            name2 = format_pair_name(item2)
            print(f"  {name1} ↔ {name2}: {dist:.3f}")
    print()
    
    print("Most similar pairs (Generalized Divergence):")
    for i in range(min(20, len(gen_div_with_pairs))):
        dist, item1, item2 = gen_div_with_pairs[i]
        if dist >= 0:  # Include zero and positive values
            name1 = format_pair_name(item1)
            name2 = format_pair_name(item2)
            print(f"  {name1} ↔ {name2}: {dist:.3f} bits/char")
    
    # Restore stdout and save to file
    sys.stdout = old_stdout
    output_content = captured_output.getvalue()
    
    with open(output_file, 'w') as f:
        f.write(output_content)
    
    return output_content

def main():
    data = load_analysis_data()
    
    # Save to file
    output_file = "three_categories_distance_tables.txt"
    content = save_tables_to_file(data, output_file)
    
    # Also print to console
    print(content)
    print(f"\nTables saved to: {output_file}")

if __name__ == "__main__":
    main()