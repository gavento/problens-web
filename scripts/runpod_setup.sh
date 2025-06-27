#!/bin/bash
# Setup script for RunPod to evaluate letter prediction models

echo "Setting up environment for letter prediction evaluation..."

# Install requirements
pip install -r runpod_requirements.txt

# Set up HuggingFace token (you need to set this)
# export HF_TOKEN="your_huggingface_token_here"

# Create cache directory
mkdir -p hf_cache

echo "Setup complete!"
echo ""
echo "Usage examples:"
echo "1. Evaluate small models (GPT-2 family):"
echo "   python runpod_letter_prediction.py --models small"
echo ""
echo "2. Evaluate medium models (GPT-J, OPT):"
echo "   python runpod_letter_prediction.py --models medium"
echo ""
echo "3. Evaluate large models (Llama) with 8-bit quantization:"
echo "   python runpod_letter_prediction.py --models large --load-8bit"
echo ""
echo "4. Evaluate specific models:"
echo "   python runpod_letter_prediction.py --models custom --custom-models meta-llama/Meta-Llama-3.1-8B mistralai/Mistral-7B-v0.1"
echo ""
echo "5. Evaluate on subset of data:"
echo "   python runpod_letter_prediction.py --models small --num-samples 100"
echo ""
echo "Remember to set HF_TOKEN for gated models like Llama!"