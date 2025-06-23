---
title: Text Divergence Calculator
emoji: 📊
colorFrom: blue
colorTo: green
sdk: gradio
sdk_version: 4.19.2
app_file: app.py
pinned: false
---

# Text Divergence Calculator

This Space calculates two types of divergence between texts:

1. **KL Divergence**: Based on character frequency distributions
2. **ZIP Divergence**: Based on compression efficiency using custom dictionaries

## How it works

### KL Divergence
- Computes character frequencies for both texts
- Calculates symmetrized Kullback-Leibler divergence
- Measures how different the character distributions are

### ZIP Divergence
- Creates a dictionary from the first 50% of each text
- Tests compression on the last 50% using both dictionaries
- Measures the bits/character difference when using the "wrong" dictionary
- Symmetrizes by averaging both directions

## API Usage

This Space can be used as an API endpoint for the problens-web three categories widget.

```python
import requests
import json

response = requests.post(
    "https://YOUR-USERNAME-text-divergence.hf.space/run/predict",
    json={
        "data": [
            "https://en.wikipedia.org/wiki/France",
            json.dumps({"ref1": "Reference text 1", "ref2": "Reference text 2"})
        ]
    }
)
result = response.json()
```