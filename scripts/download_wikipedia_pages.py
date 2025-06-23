#!/usr/bin/env python3
"""
Download Wikipedia pages about US presidents and countries for analysis
"""

import requests
import time
import re
from pathlib import Path

class WikipediaDownloader:
    def __init__(self, output_dir="public/data/wikipedia"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    def clean_text(self, text):
        """Clean Wikipedia text content"""
        # Remove references like [1], [citation needed], etc.
        text = re.sub(r'\[\d+\]', '', text)
        text = re.sub(r'\[citation needed\]', '', text)
        text = re.sub(r'\[edit\]', '', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        
        return text
    
    def download_page(self, title, filename):
        """Download a Wikipedia page using the API"""
        # Use Wikipedia API to get page content
        api_url = "https://en.wikipedia.org/w/api.php"
        params = {
            'action': 'query',
            'format': 'json',
            'titles': title,
            'prop': 'extracts',
            'exintro': False,
            'explaintext': True,
            'exsectionformat': 'plain'
        }
        
        try:
            print(f"Downloading {title}...")
            response = self.session.get(api_url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            # Extract the page content
            pages = data.get('query', {}).get('pages', {})
            if not pages:
                print(f"  No content found for {title}")
                return False
            
            # Get the first (and usually only) page
            page_id = list(pages.keys())[0]
            page_data = pages[page_id]
            
            if 'extract' not in page_data:
                print(f"  No extract found for {title}")
                return False
            
            # Get the text content
            content = page_data['extract']
            clean_content = self.clean_text(content)
            
            # Ensure we have reasonable content length
            if len(clean_content) < 1000:
                print(f"  Content too short for {title} ({len(clean_content)} chars), skipping")
                return False
            
            # Save to file
            output_path = self.output_dir / f"{filename}.txt"
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(clean_content)
            
            print(f"  Saved to {output_path} ({len(clean_content)} characters)")
            return True
            
        except Exception as e:
            print(f"  Error downloading {title}: {e}")
            return False
    
    def download_presidents(self):
        """Download pages about 5 US presidents"""
        presidents = [
            ("George Washington", "washington"),
            ("Thomas Jefferson", "jefferson"), 
            ("Abraham Lincoln", "lincoln"),
            ("Franklin D. Roosevelt", "roosevelt"),
            ("John F. Kennedy", "kennedy")
        ]
        
        print("Downloading US Presidents...")
        for title, filename in presidents:
            success = self.download_page(title, f"president_{filename}")
            if success:
                time.sleep(1)  # Be nice to Wikipedia
    
    def download_countries(self):
        """Download pages about 5 countries"""
        countries = [
            ("France", "france"),
            ("Japan", "japan"),
            ("Brazil", "brazil"),
            ("Germany", "germany"),
            ("Australia", "australia")
        ]
        
        print("\nDownloading Countries...")
        for title, filename in countries:
            success = self.download_page(title, f"country_{filename}")
            if success:
                time.sleep(1)  # Be nice to Wikipedia

def main():
    downloader = WikipediaDownloader()
    
    print("Starting Wikipedia downloads...")
    downloader.download_presidents()
    downloader.download_countries()
    
    print("\nDownload complete!")
    
    # List downloaded files
    wiki_dir = Path("public/data/wikipedia")
    if wiki_dir.exists():
        files = list(wiki_dir.glob("*.txt"))
        print(f"\nDownloaded {len(files)} files:")
        for file in sorted(files):
            size = file.stat().st_size
            print(f"  {file.name}: {size:,} bytes")

if __name__ == "__main__":
    main()