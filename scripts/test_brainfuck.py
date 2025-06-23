#!/usr/bin/env python3

import sys
sys.path.append('/home/vasek/problens-web/scripts')

# Import our collector class directly
import requests
from bs4 import BeautifulSoup
import os
import json
import time
import re
from urllib.parse import urljoin

class RosettaCodeCollector:
    def __init__(self, output_dir="data/programming_languages"):
        self.output_dir = output_dir
        self.base_url = "http://rosettacode.org"
        
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
            'Lua': 'lua',
            'Brainfuck': 'brainfuck',
            'Brainf***': 'brainfuck',
            'Chef': 'chef',
            'APL': 'apl',
            'Prolog': 'prolog',
            'Assembly': 'assembly',
            'Fortran': 'fortran'
        }
        
        os.makedirs(output_dir, exist_ok=True)
    
    def extract_code_sections(self, soup, task_title):
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
        print(f"Collecting: {task['title']}")
        
        try:
            response = self.session.get(task['url'])
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            language_codes = self.extract_code_sections(soup, task['title'])
            return language_codes
            
        except Exception as e:
            print(f"Error collecting task {task['title']}: {e}")
            return {}

collector = RosettaCodeCollector('/tmp/test_data')
task = {'title': 'Factorial', 'url': 'https://rosettacode.org/wiki/Factorial'}
language_codes = collector.collect_task(task)

print('Languages found:', list(language_codes.keys()))
if 'brainfuck' in language_codes:
    print('✓ Brainfuck successfully extracted!')
    print(f'Number of Brainfuck code samples: {len(language_codes["brainfuck"])}')
    print('First Brainfuck sample:')
    print(language_codes["brainfuck"][0][:200])
else:
    print('✗ Brainfuck still not found')
    # Check if we found anything with 'brain' in it
    for lang in language_codes.keys():
        if 'brain' in lang.lower():
            print(f'Found similar: {lang}')