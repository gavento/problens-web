#!/usr/bin/env python3
"""
Filter out specific problematic snapshot indices.
"""

import json

def main():
    """Filter specific indices from snapshots."""
    # Specific indices to remove
    bad_indices = [29, 60, 66, 351, 390, 516, 568, 604]
    
    print(f"Filtering out specific indices: {bad_indices}")
    
    # Load current snapshots
    input_file = "/home/vasek/problens-web/public/data/prediction_snapshots.json"
    print(f"Loading snapshots from: {input_file}")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    original_count = len(data['snapshots'])
    print(f"Original snapshot count: {original_count}")
    
    # Filter out bad indices
    clean_snapshots = []
    for i, snapshot in enumerate(data['snapshots']):
        if i not in bad_indices:
            clean_snapshots.append(snapshot)
    
    # Reassign IDs sequentially
    for i, snapshot in enumerate(clean_snapshots):
        snapshot['id'] = i
    
    filtered_count = original_count - len(clean_snapshots)
    print(f"Filtered out {filtered_count} snapshots")
    print(f"Remaining snapshots: {len(clean_snapshots)}")
    
    # Update data
    data['snapshots'] = clean_snapshots
    data['metadata']['total_snapshots'] = len(clean_snapshots)
    data['metadata']['filtered_indices'] = bad_indices
    
    # Save back to file
    with open(input_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Successfully filtered {filtered_count} snapshots")
    print(f"✓ File updated: {input_file}")
    print(f"✓ New total: {len(clean_snapshots)} snapshots")

if __name__ == "__main__":
    main()