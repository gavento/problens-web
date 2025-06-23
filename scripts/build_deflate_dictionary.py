#!/usr/bin/env python3
"""
Build 32KB dictionaries for each programming language for DEFLATE compression.
"""

import os
from pathlib import Path
import json

class DeflateDictionaryBuilder:
    def __init__(self, data_dir="public/data/programming_languages", dict_size=32768):
        self.data_dir = Path(data_dir)
        self.dict_size = dict_size  # 32KB
        self.languages = []
        self.load_languages()
    
    def load_languages(self):
        """Load available programming languages"""
        excluded_languages = {'apl', 'erlang', 'elixir', 'fsharp', 'kotlin', 'swift'}
        
        self.languages = []
        for file_path in self.data_dir.glob("*_consolidated.txt"):
            lang = file_path.stem.replace("_consolidated", "")
            if lang not in excluded_languages:
                self.languages.append(lang)
        
        print(f"Found {len(self.languages)} languages: {', '.join(sorted(self.languages))}")
    
    def build_dictionary(self, language):
        """Build a 32KB dictionary from a language's code samples"""
        file_path = self.data_dir / f"{language}_consolidated.txt"
        
        if not file_path.exists():
            print(f"Warning: No data for {language}")
            return None
        
        # Read the language data
        with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
        
        original_size = len(content.encode('utf-8'))
        print(f"\n{language}: {original_size} bytes ({original_size/1024:.1f} KB)")
        
        # Convert to bytes
        content_bytes = content.encode('utf-8', errors='replace')
        
        # If content is less than 32KB, repeat it
        if len(content_bytes) < self.dict_size:
            repeat_times = (self.dict_size // len(content_bytes)) + 1
            print(f"  - Repeating {repeat_times}x to reach 32KB")
            content_bytes = content_bytes * repeat_times
        
        # Truncate to exactly 32KB
        dictionary = content_bytes[:self.dict_size]
        
        # Save dictionary
        dict_file = self.data_dir / f"{language}_dictionary.bin"
        with open(dict_file, 'wb') as f:
            f.write(dictionary)
        
        print(f"  - Dictionary saved: {dict_file.name} ({len(dictionary)} bytes)")
        
        # Verify it's exactly 32KB
        assert len(dictionary) == self.dict_size, f"Dictionary size mismatch: {len(dictionary)} != {self.dict_size}"
        
        return dict_file
    
    def build_all_dictionaries(self):
        """Build dictionaries for all languages"""
        print(f"Building {self.dict_size}-byte dictionaries for all languages...")
        
        results = {}
        for lang in sorted(self.languages):
            dict_file = self.build_dictionary(lang)
            if dict_file:
                results[lang] = str(dict_file)
        
        # Save metadata
        metadata = {
            'dict_size': self.dict_size,
            'languages': list(results.keys()),
            'dictionary_files': results
        }
        
        metadata_file = self.data_dir / "deflate_dictionaries.json"
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"\nMetadata saved to: {metadata_file}")
        return results

def main():
    builder = DeflateDictionaryBuilder()
    builder.build_all_dictionaries()

if __name__ == "__main__":
    main()