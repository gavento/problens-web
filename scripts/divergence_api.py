#!/usr/bin/env python3
"""
API for calculating KL and ZIP divergences between texts.
This can be deployed as a Hugging Face Space using Gradio.
"""

import gradio as gr
import json
import zlib
import numpy as np
from collections import Counter
import requests
import re
from typing import Dict, List, Tuple

class DivergenceCalculator:
    def __init__(self):
        self.min_freq = 2**-10
        
    def fetch_url_content(self, url: str) -> str:
        """Fetch text content from URL"""
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            # Try to extract text content from HTML if needed
            content = response.text
            
            # Simple HTML stripping if it looks like HTML
            if '<html' in content.lower() or '<!doctype' in content.lower():
                # Remove script and style elements
                content = re.sub(r'<script[^>]*>.*?</script>', '', content, flags=re.DOTALL | re.IGNORECASE)
                content = re.sub(r'<style[^>]*>.*?</style>', '', content, flags=re.DOTALL | re.IGNORECASE)
                # Remove HTML tags
                content = re.sub(r'<[^>]+>', ' ', content)
                # Clean up whitespace
                content = ' '.join(content.split())
            
            return content
        except Exception as e:
            raise Exception(f"Failed to fetch URL: {str(e)}")
    
    def compute_character_frequencies(self, text: str) -> Dict[str, float]:
        """Compute character frequency distribution"""
        total_chars = len(text)
        if total_chars == 0:
            return {}
        
        char_counts = Counter(text)
        frequencies = {}
        
        for char, count in char_counts.items():
            frequencies[char] = count / total_chars
        
        return frequencies
    
    def compute_kl_divergence(self, freq1: Dict[str, float], freq2: Dict[str, float]) -> float:
        """Compute symmetrized KL divergence between two frequency distributions"""
        # Get all characters that appear in either distribution
        all_chars = set(freq1.keys()) | set(freq2.keys())
        
        # Ensure minimum frequency to avoid log(0)
        p = np.array([max(freq1.get(char, 0), self.min_freq) for char in all_chars])
        q = np.array([max(freq2.get(char, 0), self.min_freq) for char in all_chars])
        
        # Normalize to ensure they sum to 1
        p = p / np.sum(p)
        q = q / np.sum(q)
        
        # Compute KL divergences in both directions
        kl_pq = np.sum(p * np.log2(p / q))
        kl_qp = np.sum(q * np.log2(q / p))
        
        # Return symmetrized KL divergence
        return (kl_pq + kl_qp) / 2
    
    def compress_with_deflate(self, text: str, dictionary: bytes = b'') -> bytes:
        """Compress text using DEFLATE with optional dictionary"""
        data_bytes = text.encode('utf-8', errors='replace')
        
        if dictionary:
            comp = zlib.compressobj(
                level=6,
                method=zlib.DEFLATED,
                wbits=-zlib.MAX_WBITS,  # Raw DEFLATE
                memLevel=8,
                strategy=zlib.Z_FIXED,  # Static Huffman
                zdict=dictionary
            )
        else:
            comp = zlib.compressobj(
                level=6,
                method=zlib.DEFLATED,
                wbits=-zlib.MAX_WBITS,  # Raw DEFLATE
                memLevel=8,
                strategy=zlib.Z_FIXED   # Static Huffman
            )
        
        return comp.compress(data_bytes) + comp.flush()
    
    def create_dictionary(self, content: str, dict_size: int = 1024) -> bytes:
        """Create frequency-based dictionary from most common patterns"""
        content_bytes = content.encode('utf-8', errors='replace')
        
        # Use first 50% of content as dictionary source
        dict_source_end = len(content_bytes) // 2
        dict_source_text = content_bytes[:dict_source_end].decode('utf-8', errors='replace')
        
        # Extract words
        words = re.findall(r'\b\w+\b', dict_source_text.lower())
        word_counts = Counter(words)
        
        # Extract bigrams and trigrams
        bigrams = []
        trigrams = []
        for i in range(len(dict_source_text) - 2):
            if dict_source_text[i:i+2].isalnum() or ' ' in dict_source_text[i:i+2]:
                bigrams.append(dict_source_text[i:i+2])
            if dict_source_text[i:i+3].isalnum() or ' ' in dict_source_text[i:i+3]:
                trigrams.append(dict_source_text[i:i+3])
        
        bigram_counts = Counter(bigrams)
        trigram_counts = Counter(trigrams)
        
        # Build dictionary content
        dictionary_content = []
        current_size = 0
        
        # Add most frequent words
        for word, count in word_counts.most_common():
            if count >= 2:
                word_with_space = f" {word} "
                word_bytes = word_with_space.encode('utf-8')
                if current_size + len(word_bytes) <= dict_size:
                    dictionary_content.append(word_with_space)
                    current_size += len(word_bytes)
                else:
                    break
        
        # Add frequent trigrams
        for trigram, count in trigram_counts.most_common():
            if count >= 2 and trigram not in ''.join(dictionary_content):
                trigram_bytes = trigram.encode('utf-8')
                if current_size + len(trigram_bytes) <= dict_size:
                    dictionary_content.append(trigram)
                    current_size += len(trigram_bytes)
                else:
                    break
        
        # Add frequent bigrams
        for bigram, count in bigram_counts.most_common():
            if count >= 3 and bigram not in ''.join(dictionary_content):
                bigram_bytes = bigram.encode('utf-8')
                if current_size + len(bigram_bytes) <= dict_size:
                    dictionary_content.append(bigram)
                    current_size += len(bigram_bytes)
                else:
                    break
        
        # Convert to bytes and pad
        dict_text = ''.join(dictionary_content)
        dict_bytes = dict_text.encode('utf-8', errors='replace')
        
        if len(dict_bytes) < dict_size:
            padding = b'\x00' * (dict_size - len(dict_bytes))
            dict_bytes += padding
        else:
            dict_bytes = dict_bytes[:dict_size]
        
        return dict_bytes
    
    def compute_zip_divergence(self, content_a: str, content_b: str) -> float:
        """
        Compute ZIP divergence between two texts using compression.
        Returns bits per character difference when using each other's dictionaries.
        """
        # Create dictionaries from first 50% of each content
        dict_a = self.create_dictionary(content_a)
        dict_b = self.create_dictionary(content_b)
        
        # Get test content (last 50%)
        test_a = content_a[len(content_a)//2:]
        test_b = content_b[len(content_b)//2:]
        
        test_a_bytes = test_a.encode('utf-8')
        test_b_bytes = test_b.encode('utf-8')
        
        # Compress A with both dictionaries
        a_self_compressed = self.compress_with_deflate(test_a, dictionary=dict_a)
        a_cross_compressed = self.compress_with_deflate(test_a, dictionary=dict_b)
        
        # Compress B with both dictionaries
        b_self_compressed = self.compress_with_deflate(test_b, dictionary=dict_b)
        b_cross_compressed = self.compress_with_deflate(test_b, dictionary=dict_a)
        
        # Calculate bits per character difference
        a_self_bits_per_char = (len(a_self_compressed) * 8) / len(test_a_bytes)
        a_cross_bits_per_char = (len(a_cross_compressed) * 8) / len(test_a_bytes)
        divergence_a_to_b = a_cross_bits_per_char - a_self_bits_per_char
        
        b_self_bits_per_char = (len(b_self_compressed) * 8) / len(test_b_bytes)
        b_cross_bits_per_char = (len(b_cross_compressed) * 8) / len(test_b_bytes)
        divergence_b_to_a = b_cross_bits_per_char - b_self_bits_per_char
        
        # Symmetrize
        return (divergence_a_to_b + divergence_b_to_a) / 2
    
    def compute_zip_similarity(self, content_a: str, content_b: str) -> float:
        """
        Compute Normalized Compression Distance (NCD) between two texts.
        Uses formula: NCD(x,y) ≈ (C(xy) – min{C(x),C(y)}) / max{C(x),C(y)}
        Where C(x) is the compressed size of x.
        """
        # Compress individual texts
        compressed_a = self.compress_with_deflate(content_a)
        compressed_b = self.compress_with_deflate(content_b)
        
        # Compress concatenated text
        compressed_ab = self.compress_with_deflate(content_a + content_b)
        
        # Get compressed sizes
        c_a = len(compressed_a)
        c_b = len(compressed_b)
        c_ab = len(compressed_ab)
        
        # Compute NCD: (C(xy) – min{C(x),C(y)}) / max{C(x),C(y)}
        min_c = min(c_a, c_b)
        max_c = max(c_a, c_b)
        
        if max_c == 0:
            return 0.0  # Both texts are empty
        
        ncd = (c_ab - min_c) / max_c
        
        # Ensure NCD is in [0, 1] range
        return max(0.0, min(1.0, ncd))

def calculate_divergences(url: str, reference_texts_json: str) -> str:
    """
    Calculate KL and ZIP divergences between URL content and reference texts.
    
    Args:
        url: URL to fetch content from
        reference_texts_json: JSON string containing reference texts
        
    Returns:
        JSON string with divergence results
    """
    calc = DivergenceCalculator()
    
    try:
        # Parse reference texts
        reference_data = json.loads(reference_texts_json)
        
        # Fetch URL content
        url_content = calc.fetch_url_content(url)
        
        if len(url_content) < 100:
            return json.dumps({"error": "Content too short (< 100 characters)"})
        
        # Calculate divergences
        results = {
            "url": url,
            "content_length": len(url_content),
            "kl_divergences": {},
            "zip_divergences": {},
            "zip_similarities": {}
        }
        
        # Get character frequencies for URL content
        url_frequencies = calc.compute_character_frequencies(url_content)
        
        # Calculate divergences with each reference text
        for text_id, ref_content in reference_data.items():
            # KL divergence
            ref_frequencies = calc.compute_character_frequencies(ref_content)
            kl_div = calc.compute_kl_divergence(url_frequencies, ref_frequencies)
            results["kl_divergences"][text_id] = round(kl_div, 4)
            
            # ZIP divergence
            zip_div = calc.compute_zip_divergence(url_content, ref_content)
            results["zip_divergences"][text_id] = round(zip_div, 4)
            
            # ZIP similarity
            zip_sim = calc.compute_zip_similarity(url_content, ref_content)
            results["zip_similarities"][text_id] = round(zip_sim, 4)
        
        return json.dumps(results)
        
    except Exception as e:
        return json.dumps({"error": str(e)})

# Gradio interface for deployment as HF Space
def create_gradio_interface():
    iface = gr.Interface(
        fn=calculate_divergences,
        inputs=[
            gr.Textbox(label="URL", placeholder="https://example.com/article"),
            gr.Textbox(label="Reference Texts (JSON)", lines=10, placeholder='{"country_france": "France content...", "sport_football": "Football content..."}')
        ],
        outputs=gr.JSON(label="Divergence Results"),
        title="Text Divergence Calculator",
        description="Calculate KL and ZIP divergences between URL content and reference texts"
    )
    return iface

if __name__ == "__main__":
    # For local testing
    calc = DivergenceCalculator()
    
    # Test with sample data
    test_url = "https://en.wikipedia.org/wiki/Python_(programming_language)"
    test_refs = {
        "test1": "Python is a high-level programming language...",
        "test2": "JavaScript is a programming language..."
    }
    
    result = calculate_divergences(test_url, json.dumps(test_refs))
    print(result)