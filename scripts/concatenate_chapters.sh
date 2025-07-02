#!/bin/bash

# Output file
OUTPUT="all_chapters_concatenated.md"

# Clear the output file
> "$OUTPUT"

# Function to add a chapter
add_chapter() {
    local title="$1"
    local filename="$2"
    
    if [ -z "$filename" ]; then
        return
    fi
    
    echo "" >> "$OUTPUT"
    echo "=================================================================================" >> "$OUTPUT"
    echo "=================================================================================" >> "$OUTPUT"
    echo "CHAPTER: $title" >> "$OUTPUT"
    echo "FILE: $filename.mdx" >> "$OUTPUT"
    echo "=================================================================================" >> "$OUTPUT"
    echo "=================================================================================" >> "$OUTPUT"
    echo "" >> "$OUTPUT"
    
    if [ -f "public/$filename.mdx" ]; then
        cat "public/$filename.mdx" >> "$OUTPUT"
    else
        echo "[ERROR: File public/$filename.mdx not found]" >> "$OUTPUT"
    fi
    
    echo "" >> "$OUTPUT"
    echo "" >> "$OUTPUT"
}

# Add header
echo "BAYES, BITS & BRAINS - ALL CHAPTERS CONCATENATED" > "$OUTPUT"
echo "Generated on: $(date)" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# Part: Intro
echo "################################################################################" >> "$OUTPUT"
echo "PART: INTRO" >> "$OUTPUT"
echo "################################################################################" >> "$OUTPUT"
add_chapter "Riddles" "00-introduction"

# Part I: Foundations
echo "################################################################################" >> "$OUTPUT"
echo "PART I: FOUNDATIONS" >> "$OUTPUT"
echo "################################################################################" >> "$OUTPUT"
add_chapter "Bayes & KL divergence" "01-kl_intro"
add_chapter "Crossentropy & Entropy" "02-crossentropy"
add_chapter "Entropy properties" "03-entropy_properties"

# Part II: Optimization
echo "################################################################################" >> "$OUTPUT"
echo "PART II: OPTIMIZATION" >> "$OUTPUT"
echo "################################################################################" >> "$OUTPUT"
add_chapter "Minimizing KL" "04-minimizing"
add_chapter "Maximizing entropy" "05-max_entropy"
add_chapter "Loss functions" "06-machine_learning"

# Part III: Compression (Bonus)
echo "################################################################################" >> "$OUTPUT"
echo "PART III: COMPRESSION (BONUS CHAPTERS)" >> "$OUTPUT"
echo "################################################################################" >> "$OUTPUT"
add_chapter "Coding theory" "09-coding_theory"
add_chapter "Kolmogorov complexity" "08-kolmogorov"

# Additional Bonus Chapters
echo "################################################################################" >> "$OUTPUT"
echo "ADDITIONAL BONUS CHAPTERS" >> "$OUTPUT"
echo "################################################################################" >> "$OUTPUT"
add_chapter "Multiplicative Weights Update" "07-algorithms"
add_chapter "Fisher Information" "fisher-info"

# Meta pages
echo "################################################################################" >> "$OUTPUT"
echo "META PAGES" >> "$OUTPUT"
echo "################################################################################" >> "$OUTPUT"
add_chapter "Resources" "resources"
add_chapter "About" "about"
add_chapter "Bonus" "bonus"

echo "Concatenation complete! Output saved to: $OUTPUT"
echo "Total size: $(wc -c < "$OUTPUT") bytes"
echo "Total lines: $(wc -l < "$OUTPUT") lines"