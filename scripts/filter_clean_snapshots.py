#!/usr/bin/env python3
"""
Filter out problematic snapshots and create a clean dataset.
"""

import json
from pathlib import Path

def load_snapshots(file_path: str):
    """Load snapshots from JSON file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data

def load_flagged_ids(file_path: str):
    """Load flagged snapshot IDs."""
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return set(data['flagged_ids'])

def filter_snapshots(snapshots_data, flagged_ids):
    """Filter out flagged snapshots and reassign IDs."""
    original_snapshots = snapshots_data['snapshots']
    clean_snapshots = []
    
    # Filter out flagged snapshots
    for snapshot in original_snapshots:
        if snapshot['id'] not in flagged_ids:
            clean_snapshots.append(snapshot)
    
    # Reassign sequential IDs
    for i, snapshot in enumerate(clean_snapshots):
        snapshot['id'] = i
    
    return clean_snapshots

def main():
    """Main filtering function."""
    print("Filtering problematic snapshots...")
    
    # File paths
    input_file = "/home/vasek/problens-web/public/data/prediction_snapshots_original.json"  # Use original backup
    flagged_file = "/home/vasek/problens-web/scripts/flagged_snapshots.json"
    output_file = "/home/vasek/problens-web/public/data/prediction_snapshots_clean.json"
    final_file = "/home/vasek/problens-web/public/data/prediction_snapshots.json"
    
    # Load data
    print("Loading original snapshots...")
    snapshots_data = load_snapshots(input_file)
    original_count = len(snapshots_data['snapshots'])
    
    print("Loading flagged IDs...")
    flagged_ids = load_flagged_ids(flagged_file)
    
    # Add additional manually identified problematic IDs
    additional_bad_ids = {29, 60, 66, 351, 390, 516, 568, 604}
    print(f"Adding {len(additional_bad_ids)} additional manually identified problematic IDs: {sorted(additional_bad_ids)}")
    
    # Combine all flagged IDs
    all_flagged_ids = flagged_ids.union(additional_bad_ids)
    flagged_count = len(all_flagged_ids)
    
    print(f"Original snapshots: {original_count}")
    print(f"Flagged for removal: {flagged_count}")
    print(f"Expected clean snapshots: {original_count - flagged_count}")
    
    # Filter snapshots using all flagged IDs
    print("Filtering snapshots...")
    clean_snapshots = filter_snapshots(snapshots_data, all_flagged_ids)
    clean_count = len(clean_snapshots)
    
    print(f"Clean snapshots after filtering: {clean_count}")
    
    # Create clean dataset
    clean_data = {
        'metadata': {
            'total_snapshots': clean_count,
            'original_count': original_count,
            'filtered_count': flagged_count,
            'source': 'enwik9 Wikipedia dump (filtered)',
            'created_by': 'filter_clean_snapshots.py',
            'description': 'High-quality sentence pairs for human vs LLM next-letter prediction comparison (problematic snapshots removed)',
            'filter_criteria': [
                'Removed academic abbreviations (vol., pp., etc.)',
                'Removed title abbreviations (Mr., Dr., etc.)', 
                'Removed bibliography/reference formatting',
                'Removed incomplete sentences',
                'Removed mid-word cuts',
                'Removed list items'
            ]
        },
        'snapshots': clean_snapshots
    }
    
    # Save clean dataset
    print(f"Saving clean dataset to: {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(clean_data, f, indent=2, ensure_ascii=False)
    
    # Replace original with clean version
    print(f"Updating main prediction file with clean version...")
    with open(final_file, 'w', encoding='utf-8') as f:
        json.dump(clean_data, f, indent=2, ensure_ascii=False)
    
    print("\nFiltering complete!")
    print(f"✓ Clean dataset saved to: {output_file}")
    print(f"✓ Main prediction file updated with clean data: {final_file}")
    print(f"✓ Removed {flagged_count} problematic snapshots (including {len(additional_bad_ids)} additional manual ones)")
    print(f"✓ Clean dataset contains {clean_count} high-quality snapshots")
    
    # Show some examples of clean snapshots
    print(f"\nExample clean snapshots:")
    for i, snapshot in enumerate(clean_snapshots[:3]):
        print(f"\n{i+1}. ID {snapshot['id']}:")
        print(f"   Full: \"{snapshot['first_sentence']} {snapshot['second_sentence']}\"")
        print(f"   Context: \"{snapshot['context']}\"")
        print(f"   Target: '{snapshot['target_letter']}'")

if __name__ == "__main__":
    main()