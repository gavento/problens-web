#!/usr/bin/env python3
"""
Fetch full Wikipedia content for new three categories items
"""

import requests
import json
from pathlib import Path

def fetch_wikipedia_content(title):
    """Fetch full Wikipedia content using the API"""
    url = "https://en.wikipedia.org/w/api.php"
    params = {
        'action': 'query',
        'format': 'json',
        'prop': 'extracts',
        'explaintext': 1,
        'titles': title,
        'exlimit': 1
    }
    
    response = requests.get(url, params=params)
    data = response.json()
    
    # Extract the page content
    pages = data['query']['pages']
    page_id = list(pages.keys())[0]
    
    if page_id == '-1':
        print(f"Error: Page '{title}' not found")
        return None
    
    return pages[page_id].get('extract', '')

def main():
    # Define the items to fetch (updated list)
    items = [
        # Countries
        ('France', 'country_france.txt'),
        ('Japan', 'country_japan.txt'),
        ('Brazil', 'country_brazil.txt'),
        ('Germany', 'country_germany.txt'),
        ('Australia', 'country_australia.txt'),
        
        # Sports
        ('Football', 'sport_football.txt'),
        ('Basketball', 'sport_basketball.txt'),
        ('Tennis', 'sport_tennis.txt'),
        ('Golf', 'sport_golf.txt'),
        ('Ice_hockey', 'sport_hockey.txt'),
        
        # Animals
        ('Lion', 'animal_lion.txt'),
        ('Elephant', 'animal_elephant.txt'),
        ('Dolphin', 'animal_dolphin.txt'),
        ('Zebra', 'animal_zebra.txt'),
        ('Giraffe', 'animal_giraffe.txt')
    ]
    
    # Create output directory (relative to project root, not script location)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    output_dir = project_root / 'public/data/three_categories'
    output_dir.mkdir(parents=True, exist_ok=True)
    
    for wikipedia_title, filename in items:
        print(f"Fetching {wikipedia_title}...")
        content = fetch_wikipedia_content(wikipedia_title)
        
        if content:
            file_path = output_dir / filename
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  Saved to {file_path} ({len(content)} characters)")
        else:
            print(f"  Failed to fetch {wikipedia_title}")
    
    print("\nDone!")

if __name__ == "__main__":
    main()