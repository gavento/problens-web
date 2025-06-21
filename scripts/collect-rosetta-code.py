#!/usr/bin/env python3
"""
Script to collect programming language samples from Rosetta Code
for compression-based similarity analysis.
"""

import requests
import re
import os
import json
import time
from urllib.parse import urljoin, quote
from bs4 import BeautifulSoup
import argparse

class RosettaCodeCollector:
    def __init__(self, output_dir="data/programming_languages"):
        self.base_url = "http://rosettacode.org"
        self.output_dir = output_dir
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (compatible; RosettaCodeCollector/1.0)'
        })
        
        # Language mappings from Rosetta Code names to standard names
        self.language_mapping = {
            'Python': 'python',
            'Java': 'java',
            'C++': 'cpp',
            'C': 'c',
            'JavaScript': 'javascript',
            'Go': 'go',
            'Rust': 'rust',
            'Haskell': 'haskell',
            'Common Lisp': 'lisp',
            'Scheme': 'scheme',
            'Ruby': 'ruby',
            'Perl': 'perl',
            'PHP': 'php',
            'Swift': 'swift',
            'Kotlin': 'kotlin',
            'Scala': 'scala',
            'Clojure': 'clojure',
            'Erlang': 'erlang',
            'Elixir': 'elixir',
            'OCaml': 'ocaml',
            'F#': 'fsharp',
            'TypeScript': 'typescript',
            'Dart': 'dart',
            'Julia': 'julia',
            'R': 'r',
            'MATLAB': 'matlab',
            'Lua': 'lua'
        }
        
        os.makedirs(output_dir, exist_ok=True)
    
    def get_task_list(self, limit=None):
        """Get list of programming tasks from Rosetta Code"""
        print("Fetching task list...")
        url = f"{self.base_url}/wiki/Category:Programming_Tasks"
        
        try:
            response = self.session.get(url)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find all task links
            task_links = []
            for link in soup.find_all('a', href=True):
                href = link.get('href')
                if href and href.startswith('/wiki/') and link.text:
                    # Skip meta pages
                    if any(skip in href.lower() for skip in ['category:', 'template:', 'user:', 'talk:']):
                        continue
                    task_links.append({
                        'title': link.text.strip(),
                        'url': urljoin(self.base_url, href)
                    })
            
            if limit:
                task_links = task_links[:limit]
            
            print(f"Found {len(task_links)} tasks")
            return task_links
            
        except Exception as e:
            print(f"Error fetching task list: {e}")
            return []
    
    def extract_code_sections(self, soup, task_title):
        """Extract code sections by language from a task page"""
        language_codes = {}
        
        # Look for language headers (usually h2 or h3 with span.mw-headline)
        headers = soup.find_all(['h2', 'h3', 'h4'])
        
        for header in headers:
            headline = header.find('span', class_='mw-headline')
            if not headline:
                continue
            
            lang_name = headline.get_text().strip()
            
            # Map to our standard language names
            standard_name = self.language_mapping.get(lang_name)
            if not standard_name:
                continue
            
            # Find code blocks after this header
            current = header.next_sibling
            code_blocks = []
            
            # Look for pre tags or code blocks until next header
            while current:
                if current.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                    break
                
                if current.name == 'pre':
                    code_text = current.get_text().strip()
                    if code_text and len(code_text) > 20:  # Minimum code length
                        code_blocks.append(code_text)
                elif current.name == 'div' and 'mw-highlight' in current.get('class', []):
                    # Syntax highlighted code
                    code_text = current.get_text().strip()
                    if code_text and len(code_text) > 20:
                        code_blocks.append(code_text)
                
                current = current.next_sibling
            
            if code_blocks:
                if standard_name not in language_codes:
                    language_codes[standard_name] = []
                language_codes[standard_name].extend(code_blocks)
        
        return language_codes
    
    def collect_task(self, task):
        """Collect code samples from a single task"""
        print(f"Collecting: {task['title']}")
        
        try:
            response = self.session.get(task['url'])
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            language_codes = self.extract_code_sections(soup, task['title'])
            
            # Save code samples
            for lang, codes in language_codes.items():
                lang_dir = os.path.join(self.output_dir, lang)
                os.makedirs(lang_dir, exist_ok=True)
                
                for i, code in enumerate(codes):
                    # Clean task title for filename
                    clean_title = re.sub(r'[^\w\-_]', '_', task['title'])
                    filename = f"{clean_title}_{i}.txt"
                    filepath = os.path.join(lang_dir, filename)
                    
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(f"# Task: {task['title']}\n")
                        f.write(f"# Language: {lang}\n")
                        f.write(f"# Source: {task['url']}\n\n")
                        f.write(code)
            
            return language_codes
            
        except Exception as e:
            print(f"Error collecting task {task['title']}: {e}")
            return {}
    
    def collect_all(self, max_tasks=100):
        """Collect code samples from multiple tasks"""
        tasks = self.get_task_list(limit=max_tasks)
        
        stats = {}
        
        for i, task in enumerate(tasks):
            if i > 0 and i % 10 == 0:
                print(f"Progress: {i}/{len(tasks)} tasks processed")
            
            language_codes = self.collect_task(task)
            
            # Update statistics
            for lang, codes in language_codes.items():
                if lang not in stats:
                    stats[lang] = {'files': 0, 'total_chars': 0}
                stats[lang]['files'] += len(codes)
                stats[lang]['total_chars'] += sum(len(code) for code in codes)
            
            # Be nice to the server
            time.sleep(1)
        
        # Save statistics
        with open(os.path.join(self.output_dir, 'collection_stats.json'), 'w') as f:
            json.dump(stats, f, indent=2)
        
        print("\nCollection complete!")
        print("Statistics:")
        for lang, stat in sorted(stats.items()):
            size_mb = stat['total_chars'] / (1024 * 1024)
            print(f"  {lang}: {stat['files']} files, {size_mb:.2f} MB")
    
    def consolidate_languages(self, target_size_mb=1.0):
        """Consolidate code samples into single files per language"""
        print("Consolidating language files...")
        
        target_size = target_size_mb * 1024 * 1024  # Convert to bytes
        
        for lang in os.listdir(self.output_dir):
            lang_dir = os.path.join(self.output_dir, lang)
            if not os.path.isdir(lang_dir):
                continue
            
            consolidated_code = []
            total_size = 0
            
            # Read all files for this language
            for filename in sorted(os.listdir(lang_dir)):
                if not filename.endswith('.txt'):
                    continue
                
                filepath = os.path.join(lang_dir, filename)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                if total_size + len(content) > target_size:
                    break
                
                consolidated_code.append(content)
                total_size += len(content)
            
            # Save consolidated file
            if consolidated_code:
                consolidated_path = os.path.join(self.output_dir, f"{lang}_consolidated.txt")
                with open(consolidated_path, 'w', encoding='utf-8') as f:
                    f.write('\n\n'.join(consolidated_code))
                
                print(f"  {lang}: {total_size / (1024*1024):.2f} MB")

def main():
    parser = argparse.ArgumentParser(description='Collect programming language samples from Rosetta Code')
    parser.add_argument('--max-tasks', type=int, default=100, help='Maximum number of tasks to collect')
    parser.add_argument('--output-dir', default='data/programming_languages', help='Output directory')
    parser.add_argument('--target-size', type=float, default=1.0, help='Target size per language in MB')
    
    args = parser.parse_args()
    
    collector = RosettaCodeCollector(args.output_dir)
    collector.collect_all(args.max_tasks)
    collector.consolidate_languages(args.target_size)

if __name__ == "__main__":
    main()