#!/usr/bin/env python3
"""
Extract and format distance matrices for Wikipedia content
"""

import json
from pathlib import Path

def load_data():
    """Load the Wikipedia analysis data"""
    data_path = Path("public/data/wikipedia_analysis.json")
    with open(data_path, 'r') as f:
        return json.load(f)

def get_items_by_category(data):
    """Get items organized by category"""
    kl_data = data['kl_analysis']['baseline']
    
    presidents = [item for item in kl_data['languages'] if item.startswith('president_')]
    countries = [item for item in kl_data['languages'] if item.startswith('country_')]
    
    return presidents, countries

def format_matrix(matrix_data, items, title, description):
    """Format a distance matrix for display"""
    # Clean names for display
    clean_names = {
        'president_washington': 'Washington',
        'president_jefferson': 'Jefferson',
        'president_lincoln': 'Lincoln',
        'president_roosevelt': 'Roosevelt',
        'president_kennedy': 'Kennedy',
        'country_france': 'France',
        'country_japan': 'Japan',
        'country_brazil': 'Brazil',
        'country_germany': 'Germany',
        'country_australia': 'Australia'
    }
    
    print(f"\n## {title}")
    print(f"{description}\n")
    
    # Print header
    print("| " + " " * 12, end="")
    for item in items:
        print(f"| {clean_names[item][:10]:>10}", end="")
    print(" |")
    
    # Print separator
    print("|" + "-" * 13, end="")
    for _ in items:
        print("|" + "-" * 11, end="")
    print("|")
    
    # Print rows
    for i, item1 in enumerate(items):
        print(f"| {clean_names[item1][:11]:11}", end="")
        for j, item2 in enumerate(items):
            if i == j:
                print(f"| {'--':>10}", end="")
            else:
                distance = matrix_data[item1][item2]
                print(f"| {distance:>10.3f}", end="")
        print(" |")

def format_cross_category_matrix(matrix_data, presidents, countries, title, description):
    """Format a cross-category distance matrix"""
    clean_names = {
        'president_washington': 'Washington',
        'president_jefferson': 'Jefferson',
        'president_lincoln': 'Lincoln',
        'president_roosevelt': 'Roosevelt',
        'president_kennedy': 'Kennedy',
        'country_france': 'France',
        'country_japan': 'Japan',
        'country_brazil': 'Brazil',
        'country_germany': 'Germany',
        'country_australia': 'Australia'
    }
    
    print(f"\n## {title}")
    print(f"{description}\n")
    
    # Print header
    print("| " + " " * 12, end="")
    for country in countries:
        print(f"| {clean_names[country][:10]:>10}", end="")
    print(" |")
    
    # Print separator
    print("|" + "-" * 13, end="")
    for _ in countries:
        print("|" + "-" * 11, end="")
    print("|")
    
    # Print rows
    for president in presidents:
        print(f"| {clean_names[president][:11]:11}", end="")
        for country in countries:
            distance = matrix_data[president][country]
            print(f"| {distance:>10.3f}", end="")
        print(" |")

def main():
    data = load_data()
    presidents, countries = get_items_by_category(data)
    
    print("# Wikipedia Content Similarity Distance Matrices")
    print(f"\nAnalyzed {len(presidents)} US presidents and {len(countries)} countries:")
    
    clean_names = {
        'president_washington': 'George Washington',
        'president_jefferson': 'Thomas Jefferson',
        'president_lincoln': 'Abraham Lincoln',
        'president_roosevelt': 'Franklin D. Roosevelt',
        'president_kennedy': 'John F. Kennedy',
        'country_france': 'France',
        'country_japan': 'Japan',
        'country_brazil': 'Brazil',
        'country_germany': 'Germany',
        'country_australia': 'Australia'
    }
    
    print("\n**US Presidents:**")
    for item in presidents:
        print(f"- {clean_names[item]}")
    
    print("\n**Countries:**")
    for item in countries:
        print(f"- {clean_names[item]}")
    
    # KL divergence matrices
    kl_matrix = data['kl_analysis']['baseline']['distance_matrix']
    
    format_matrix(
        kl_matrix, 
        presidents,
        "KL Divergence - US Presidents",
        "Character frequency similarity between US presidential Wikipedia pages."
    )
    
    format_matrix(
        kl_matrix, 
        countries,
        "KL Divergence - Countries", 
        "Character frequency similarity between country Wikipedia pages."
    )
    
    format_cross_category_matrix(
        kl_matrix,
        presidents,
        countries,
        "KL Divergence - Presidents vs Countries",
        "Cross-category character frequency comparison."
    )
    
    # DEFLATE compression matrices  
    deflate_matrix = data['deflate_analysis']['distance_matrix']
    
    format_matrix(
        deflate_matrix,
        presidents,
        "DEFLATE Compression - US Presidents",
        "Compression-based similarity between US presidential Wikipedia pages."
    )
    
    format_matrix(
        deflate_matrix,
        countries, 
        "DEFLATE Compression - Countries",
        "Compression-based similarity between country Wikipedia pages."
    )
    
    format_cross_category_matrix(
        deflate_matrix,
        presidents,
        countries,
        "DEFLATE Compression - Presidents vs Countries", 
        "Cross-category compression effectiveness comparison."
    )
    
    print("\n## Key Observations")
    
    # Find most similar pairs within categories
    print("\n### Within-Category Similarities (KL Divergence):")
    
    # Presidents
    min_dist = float('inf')
    min_pair = None
    for i, item1 in enumerate(presidents):
        for j, item2 in enumerate(presidents):
            if i < j:
                dist = kl_matrix[item1][item2]
                if dist < min_dist:
                    min_dist = dist
                    min_pair = (item1, item2)
    
    if min_pair:
        print(f"- Most similar presidents: {clean_names[min_pair[0]]} ↔ {clean_names[min_pair[1]]} (distance: {min_dist:.3f})")
    
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
    
    print("\n### Cross-Category Similarity (KL Divergence):")
    
    # Cross-category
    min_dist = float('inf')
    min_pair = None
    for president in presidents:
        for country in countries:
            dist = kl_matrix[president][country]
            if dist < min_dist:
                min_dist = dist
                min_pair = (president, country)
    
    if min_pair:
        print(f"- Most similar president-country pair: {clean_names[min_pair[0]]} ↔ {clean_names[min_pair[1]]} (distance: {min_dist:.3f})")
    
    print("\n### DEFLATE Compression Analysis:")
    
    # Presidents compression
    min_dist = float('inf')
    min_pair = None
    for i, item1 in enumerate(presidents):
        for j, item2 in enumerate(presidents):
            if i < j:
                dist = deflate_matrix[item1][item2]
                if dist < min_dist:
                    min_dist = dist
                    min_pair = (item1, item2)
    
    if min_pair:
        print(f"- Best compressing presidents: {clean_names[min_pair[0]]} ↔ {clean_names[min_pair[1]]} (distance: {min_dist:.3f})")
    
    # Countries compression  
    min_dist = float('inf')
    min_pair = None
    for i, item1 in enumerate(countries):
        for j, item2 in enumerate(countries):
            if i < j:
                dist = deflate_matrix[item1][item2]
                if dist < min_dist:
                    min_dist = dist
                    min_pair = (item1, item2)
    
    if min_pair:
        print(f"- Best compressing countries: {clean_names[min_pair[0]]} ↔ {clean_names[min_pair[1]]} (distance: {min_dist:.3f})")

if __name__ == "__main__":
    main()