#!/usr/bin/env python3
"""
Analyze the quality of Wikipedia snapshots and flag problematic ones.
"""

import json
import re
from typing import List, Dict, Tuple

def load_snapshots(file_path: str) -> List[dict]:
    """Load snapshots from JSON file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data['snapshots']

def check_sentence_continuity(snapshot: dict) -> List[str]:
    """Check if the two sentences flow naturally together."""
    issues = []
    
    first_sent = snapshot['first_sentence'].strip()
    second_sent = snapshot['second_sentence'].strip()
    
    # Check if first sentence ends abruptly (incomplete)
    if not first_sent.endswith(('.', '!', '?', '"', "'", ')')):
        if first_sent.endswith(('Mr', 'Mrs', 'Dr', 'Prof', 'St')):
            issues.append("First sentence ends with title abbreviation")
        elif first_sent.endswith(('vol', 'p', 'pp', 'ch', 'ed')):
            issues.append("First sentence ends with academic abbreviation")
        elif len(first_sent) > 0 and first_sent[-1].isupper():
            issues.append("First sentence ends with capital letter (likely incomplete)")
        elif re.search(r'\*+\s*\w*$', first_sent):
            issues.append("First sentence ends with asterisks/markup")
    
    # Check for weird formatting/markup
    if re.search(r'\*{2,}', first_sent + ' ' + second_sent):
        issues.append("Contains multiple asterisks (likely markdown)")
    
    if re.search(r'#{2,}', first_sent + ' ' + second_sent):
        issues.append("Contains multiple hashes (likely markdown)")
        
    if re.search(r'\[\[|\]\]', first_sent + ' ' + second_sent):
        issues.append("Contains wiki markup brackets")
    
    # Check for academic/reference formatting
    if re.search(r'\(\d+\s+vol\.|\(vol\.|\d{4}–\d{2}', first_sent + ' ' + second_sent):
        issues.append("Contains academic volume/date references")
    
    return issues

def check_context_quality(snapshot: dict) -> List[str]:
    """Check if the context makes sense for prediction."""
    issues = []
    
    context = snapshot['context']
    target_letter = snapshot['target_letter']
    
    # Check if context ends mid-word
    if len(context) > 0 and context[-1].isalpha():
        # This might be cutting in the middle of a word
        words = context.split()
        if len(words) > 0:
            last_word = words[-1]
            # Check if it's clearly an incomplete word
            if len(last_word) < 3 and last_word.islower():
                issues.append("Context ends with very short incomplete word")
    
    # Check if target letter makes sense
    full_text = snapshot['first_sentence'] + ' ' + snapshot['second_sentence']
    cut_pos = len(snapshot['first_sentence']) + 1 + snapshot['cut_position']
    
    if cut_pos < len(full_text):
        actual_char = full_text[cut_pos].lower()
        if actual_char != target_letter.lower():
            issues.append(f"Target letter mismatch: expected '{target_letter}', got '{actual_char}'")
    
    # Check for numbers/punctuation as target
    if target_letter.isdigit():
        issues.append("Target letter is a digit")
    
    if target_letter in '.,;:!?()[]{}':
        issues.append("Target letter is punctuation")
    
    return issues

def check_text_quality(snapshot: dict) -> List[str]:
    """Check overall text quality."""
    issues = []
    
    full_text = snapshot['first_sentence'] + ' ' + snapshot['second_sentence']
    
    # Check for very short sentences
    if len(snapshot['first_sentence']) < 20:
        issues.append("First sentence very short")
    
    if len(snapshot['second_sentence']) < 20:
        issues.append("Second sentence very short")
    
    # Check for repetitive content
    words = full_text.lower().split()
    if len(set(words)) < len(words) * 0.5:  # More than 50% repeated words
        issues.append("High word repetition")
    
    # Check for list-like content
    if re.search(r'^\d+\.|\*\s+|\-\s+', snapshot['second_sentence']):
        issues.append("Second sentence appears to be list item")
    
    # Check for bibliography/reference style
    if re.search(r'\(\d{4}\)|\d{4}–\d{2,4}|pp\.\s+\d+', full_text):
        issues.append("Contains bibliography/reference formatting")
    
    return issues

def analyze_snapshot(snapshot: dict) -> Tuple[List[str], bool]:
    """Analyze a single snapshot and return issues and whether it's flagged."""
    all_issues = []
    
    # Check different aspects
    all_issues.extend(check_sentence_continuity(snapshot))
    all_issues.extend(check_context_quality(snapshot))
    all_issues.extend(check_text_quality(snapshot))
    
    # Flag if has any serious issues
    serious_keywords = [
        "Target letter mismatch",
        "First sentence ends with title abbreviation",
        "First sentence ends with academic abbreviation", 
        "Contains multiple asterisks",
        "Contains wiki markup",
        "bibliography/reference formatting",
        "Target letter is punctuation",
        "Target letter is digit"
    ]
    
    is_flagged = any(any(keyword in issue for keyword in serious_keywords) for issue in all_issues)
    
    return all_issues, is_flagged

def main():
    """Main analysis function."""
    print("Analyzing snapshot quality...")
    
    # Load snapshots
    snapshots_file = "/home/vasek/problens-web/public/data/prediction_snapshots.json"
    snapshots = load_snapshots(snapshots_file)
    
    flagged_snapshots = []
    all_issues_count = {}
    
    print(f"Analyzing {len(snapshots)} snapshots...\n")
    
    for i, snapshot in enumerate(snapshots):
        issues, is_flagged = analyze_snapshot(snapshot)
        
        # Count issue types
        for issue in issues:
            if issue in all_issues_count:
                all_issues_count[issue] += 1
            else:
                all_issues_count[issue] = 1
        
        if is_flagged:
            flagged_snapshots.append({
                'id': snapshot['id'],
                'index': i,
                'issues': issues,
                'first_sentence': snapshot['first_sentence'][:100] + "..." if len(snapshot['first_sentence']) > 100 else snapshot['first_sentence'],
                'context': snapshot['context'][-50:] if len(snapshot['context']) > 50 else snapshot['context'],
                'target_letter': snapshot['target_letter']
            })
    
    # Print results
    print("FLAGGED SNAPSHOTS:")
    print("=" * 60)
    
    flagged_ids = []
    for item in flagged_snapshots:
        flagged_ids.append(item['id'])
        print(f"\nID {item['id']} (index {item['index']}):")
        print(f"  Issues: {', '.join(item['issues'])}")
        print(f"  First: {item['first_sentence']}")
        print(f"  Context: ...{item['context']}")
        print(f"  Target: '{item['target_letter']}'")
    
    print(f"\n\nSUMMARY:")
    print(f"Total snapshots: {len(snapshots)}")
    print(f"Flagged snapshots: {len(flagged_snapshots)} ({len(flagged_snapshots)/len(snapshots)*100:.1f}%)")
    print(f"\nFlagged IDs: {sorted(flagged_ids)}")
    
    print(f"\nISSUE FREQUENCY:")
    print("-" * 40)
    for issue, count in sorted(all_issues_count.items(), key=lambda x: x[1], reverse=True):
        print(f"{count:3d}: {issue}")
    
    # Save flagged snapshots to file
    output_file = "/home/vasek/problens-web/scripts/flagged_snapshots.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'summary': {
                'total_snapshots': len(snapshots),
                'flagged_count': len(flagged_snapshots),
                'flagged_percentage': len(flagged_snapshots)/len(snapshots)*100
            },
            'flagged_ids': sorted(flagged_ids),
            'flagged_snapshots': flagged_snapshots,
            'issue_frequency': all_issues_count
        }, f, indent=2)
    
    print(f"\nDetailed results saved to: {output_file}")

if __name__ == "__main__":
    main()