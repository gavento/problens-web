#!/bin/bash
# Setup script for RunPod environment

echo "Setting up LLM evaluation environment on RunPod..."

# Update system
apt-get update && apt-get install -y git wget

# Install Python packages
pip install -r requirements_runpod.txt

# Download snapshot data (you'll need to upload this file)
echo "Make sure to upload prediction_snapshots.json to the RunPod instance"

# Create output directory
mkdir -p results

echo "Setup complete!"
echo ""
echo "To run evaluation:"
echo "python evaluate_llms_runpod.py --max-snapshots 100 --output results/llm_scores.json"
echo ""
echo "For specific models:"
echo "python evaluate_llms_runpod.py --models gpt2 distilgpt2 --output results/test_scores.json"