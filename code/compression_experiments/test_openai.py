#!/usr/bin/env python3
"""
Test OpenAI API connection.
"""

import os
from openai import OpenAI

def test_connection():
    """Test if OpenAI API is working."""
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ OPENAI_API_KEY not set")
        print("Run: export OPENAI_API_KEY='your-key-here'")
        return False
    
    print("✅ API key found")
    print(f"Key starts with: {api_key[:10]}...")
    
    try:
        client = OpenAI(api_key=api_key)
        
        # Test with a simple request
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": "Say 'API test successful'"}],
            max_tokens=10
        )
        
        result = response.choices[0].message.content
        print(f"✅ API test successful: {result}")
        
        # Check if we can get usage info
        print(f"✅ Tokens used: {response.usage.total_tokens}")
        
        return True
        
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

if __name__ == "__main__":
    test_connection()