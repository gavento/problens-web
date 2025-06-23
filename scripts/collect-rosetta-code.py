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
            'Scala': 'scala',
            'Clojure': 'clojure',
            'OCaml': 'ocaml',
            'TypeScript': 'typescript',
            'Dart': 'dart',
            'Julia': 'julia',
            'C#': 'csharp',
            'R': 'r',
            'MATLAB': 'matlab',
            'Lua': 'lua',
            'Brainfuck': 'brainfuck',
            'Brainf***': 'brainfuck',
            'Chef': 'chef',
            'Prolog': 'prolog',
            'Assembly': 'assembly',
            'Fortran': 'fortran'
        }
        
        os.makedirs(output_dir, exist_ok=True)
    
    def clean_code_sample(self, code_text, language):
        """Remove metadata and outputs from code samples"""
        lines = code_text.split('\n')
        cleaned_lines = []
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            # Skip our metadata headers
            if (line.startswith('# Task:') or 
                line.startswith('# Language:') or 
                line.startswith('# Source:')):
                i += 1
                continue
            
            # Skip likely output/prompt lines
            if self.is_likely_output(line, language):
                i += 1
                continue
            
            # Only keep non-empty lines
            if line:
                cleaned_lines.append(line)
            
            i += 1
        
        return '\n'.join(cleaned_lines)
    
    def is_likely_output(self, line, language):
        """Detect lines that are likely program output rather than code"""
        line = line.strip()
        
        # Empty lines
        if not line:
            return False
        
        # Language-specific REPL prompts and outputs
        language_specific_patterns = {
            'julia': ['julia>', 'help?>', 'ERROR:', 'search:', '[...]'],
            'python': ['>>>', '...', 'Traceback', 'File "<stdin>"'],
            'haskell': ['ghci>', 'Prelude>', '*Main>'],
            'prolog': ['?-', 'true.', 'false.'],
            'r': ['>', '+', '[1]', 'Error in'],
            'matlab': ['>>', 'ans =', 'Error using'],
            'scala': ['scala>', 'res0:', 'warning:'],
            'clojure': ['user=>', 'CompilerException'],
        }
        
        if language in language_specific_patterns:
            for pattern in language_specific_patterns[language]:
                if line.startswith(pattern) or pattern in line:
                    return True
        
        # Generic interactive prompts
        if (line.startswith('?-') or line.startswith('>>>') or line.startswith('> ') or
            line.startswith('ghci>') or line == '?-' or line == '>' or line == '>>>'):
            return True
            
        # Separator lines (mostly dashes, equals, etc.)
        if len(line) >= 5 and len(set(line)) <= 2 and any(c in line for c in '-=_*'):
            return True
            
        # Lines that are mostly numbers and spaces (like multiplication tables)
        alphanum_chars = sum(1 for c in line if c.isalnum())
        space_punct_chars = sum(1 for c in line if c in ' .,:-')
        total_chars = len(line)
        
        if (total_chars > 10 and 
            space_punct_chars > alphanum_chars and
            alphanum_chars / total_chars < 0.3):
            return True
            
        # Common interpreter responses
        if line in ['true.', 'false.', 'True', 'False', 'nil', 'None', '()', 'ans =']:
            return True
            
        # Lines that look like pure output (mostly digits and basic punctuation)
        if (len(line) > 5 and 
            sum(1 for c in line if c.isdigit() or c in ' .,:-()[]') / len(line) > 0.8):
            return True
            
        return False
    
    def remove_comments_from_code(self, code_text, language):
        """Remove comments from code based on language-specific rules"""
        lines = code_text.split('\n')
        cleaned_lines = []
        
        in_multiline_comment = False
        multiline_start = None
        multiline_end = None
        
        # Define multiline comment delimiters for languages that use them
        multiline_comments = {
            'c': ('/*', '*/'),
            'cpp': ('/*', '*/'),
            'java': ('/*', '*/'),
            'javascript': ('/*', '*/'),
            'typescript': ('/*', '*/'),
            'go': ('/*', '*/'),
            'rust': ('/*', '*/'),
            'kotlin': ('/*', '*/'),
            'scala': ('/*', '*/'),
            'dart': ('/*', '*/'),
            'swift': ('/*', '*/'),
            'haskell': ('{-', '-}'),
            'ocaml': ('(*', '*)'),
        }
        
        if language in multiline_comments:
            multiline_start, multiline_end = multiline_comments[language]
        
        for line in lines:
            original_line = line
            
            # Handle multiline comments first
            if multiline_start and multiline_end:
                # Check if we're starting a multiline comment
                if not in_multiline_comment and multiline_start in line:
                    start_pos = line.find(multiline_start)
                    if not self.likely_in_string(line, multiline_start, start_pos):
                        in_multiline_comment = True
                        # Check if comment ends on same line
                        end_pos = line.find(multiline_end, start_pos + len(multiline_start))
                        if end_pos != -1 and not self.likely_in_string(line[start_pos:], multiline_end):
                            # Single-line multiline comment
                            line = line[:start_pos] + line[end_pos + len(multiline_end):]
                            in_multiline_comment = False
                        else:
                            # Start of multiline comment
                            line = line[:start_pos]
                
                # Check if we're ending a multiline comment
                elif in_multiline_comment and multiline_end in line:
                    end_pos = line.find(multiline_end)
                    if not self.likely_in_string(line, multiline_end, end_pos):
                        line = line[end_pos + len(multiline_end):]
                        in_multiline_comment = False
                
                # If we're in a multiline comment, skip the entire line
                elif in_multiline_comment:
                    continue
            
            # Remove single-line comments based on language
            line = self.remove_single_line_comments(line, language)
            
            # Only keep lines that have substantial content after cleaning
            if line.strip():
                cleaned_lines.append(line.rstrip())
        
        return '\n'.join(cleaned_lines)
    
    def remove_single_line_comments(self, line, language):
        """Aggressively remove single-line comments from a line"""
        
        # Be aggressive - remove everything after comment markers
        # Don't worry about strings, focus on getting clean code structure
        
        comment_patterns = {
            'python': '#',
            'ruby': '#', 
            'perl': '#',
            'r': '#',
            'julia': '#',
            'shell': '#',
            
            'c': '//',
            'cpp': '//',
            'java': '//',
            'javascript': '//',
            'typescript': '//',
            'go': '//',
            'rust': '//',
            'kotlin': '//',
            'scala': '//',
            'dart': '//',
            'swift': '//',
            'php': '//',  # Prefer // over # for PHP
            
            'haskell': '--',
            'lua': '--',
            
            'erlang': '%',
            'prolog': '%',
            'matlab': '%',
            
            'lisp': ';',
            'scheme': ';',
            'clojure': ';',
            
            'fortran': '!',
            
            'apl': '⍝',
        }
        
        # Special handling for esoteric languages
        if language == 'brainfuck':
            # Only keep the 8 Brainfuck commands: > < + - . , [ ]
            brainfuck_chars = set('><+-.,[]')
            return ''.join(c for c in line if c in brainfuck_chars)
        
        if language not in comment_patterns:
            return line  # For other esoteric languages, don't remove anything
        
        pattern = comment_patterns[language]
        
        # Special handling for Fortran C/c comments (old style)
        if language == 'fortran':
            stripped = line.strip()
            if stripped.startswith('C ') or stripped.startswith('c ') or stripped == 'C' or stripped == 'c':
                return ''
        
        # Aggressively remove everything after comment marker
        pos = line.find(pattern)
        if pos != -1:
            line = line[:pos].rstrip()
        
        return line
    
    def likely_in_string(self, line, pattern, pos=None):
        """Enhanced heuristic to check if pattern is likely inside a string literal"""
        if pos is None:
            pos = line.find(pattern)
        if pos == -1:
            return False
            
        before_pattern = line[:pos]
        
        # Count unescaped quotes
        single_quotes = 0
        double_quotes = 0
        i = 0
        
        while i < len(before_pattern):
            if before_pattern[i] == "'" and (i == 0 or before_pattern[i-1] != '\\'):
                single_quotes += 1
            elif before_pattern[i] == '"' and (i == 0 or before_pattern[i-1] != '\\'):
                double_quotes += 1
            i += 1
        
        # If odd number of quotes, we're inside a string
        return (single_quotes % 2 == 1) or (double_quotes % 2 == 1)
    
    def get_curated_task_list(self):
        """Get curated list of programming tasks"""
        # Curated list of high-quality programming tasks
        tasks = [
            "Factorial",
            "Fibonacci_sequence", 
            "FizzBuzz",
            "99_Bottles_of_Beer",
            "Towers_of_Hanoi",
            "Quicksort",
            "Binary_search",
            "Greatest_common_divisor",
            "Prime_decomposition",
            "Array_concatenation",
            "Associative_array/Creation",
            "Loops/For",
            "Loops/While", 
            "Conditional_structures",
            "Function_definition",
            "String_concatenation",
            "Reverse_a_string",
            "Palindrome_detection",
            "Count_in_octal",
            "Sum_and_product_of_an_array",
            "Find_largest_number_in_array",
            "Arithmetic/Integer",
            "Generic_swap",
            "Multiplication_tables",
            "Caesar_cipher",
            "Huffman_coding",
            "Dijkstra's_algorithm",
            "Merge_sort",
            "Binary_tree_traversal",
            "Regular_expression_matching",
            "Hash_table"
        ]
        
        task_list = []
        for task in tasks:
            task_list.append({
                'title': task.replace('_', ' '),
                'url': f"{self.base_url}/wiki/{task}"
            })
        
        print(f"Using {len(task_list)} curated tasks")
        return task_list
    
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
                # Only take the first code block to avoid collecting output sections
                language_codes[standard_name].append(code_blocks[0])
        
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
                    
                    # Clean the code sample
                    cleaned_code = self.clean_code_sample(code, lang)
                    
                    # Only save if there's substantial cleaned code
                    if len(cleaned_code.strip()) > 10:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(cleaned_code)
            
            return language_codes
            
        except Exception as e:
            print(f"Error collecting task {task['title']}: {e}")
            return {}
    
    def collect_all(self, max_tasks=100):
        """Collect code samples from multiple tasks"""
        tasks = self.get_curated_task_list()
        
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
            
            # Save consolidated file with comment removal
            if consolidated_code:
                # Join all code for this language
                all_code = '\n\n'.join(consolidated_code)
                
                # Apply language-specific comment removal
                cleaned_code = self.remove_comments_from_code(all_code, lang)
                
                consolidated_path = os.path.join(self.output_dir, f"{lang}_consolidated.txt")
                with open(consolidated_path, 'w', encoding='utf-8') as f:
                    f.write(cleaned_code)
                
                # Also save to public directory for web access
                public_dir = "public/data/programming_languages"
                os.makedirs(public_dir, exist_ok=True)
                public_path = os.path.join(public_dir, f"{lang}_consolidated.txt")
                with open(public_path, 'w', encoding='utf-8') as f:
                    f.write(cleaned_code)
                
                # Show before/after sizes
                original_size = total_size / (1024*1024)
                cleaned_size = len(cleaned_code.encode('utf-8')) / (1024*1024)
                print(f"  {lang}: {original_size:.2f} MB → {cleaned_size:.2f} MB (comments removed)")

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