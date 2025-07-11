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

# Extract and add MLProblemExplorer content
echo "" >> "$OUTPUT"
echo "=================================================================================" >> "$OUTPUT"
echo "=================================================================================" >> "$OUTPUT"
echo "CHAPTER: Machine Learning Problems (from MLProblemExplorer widget)" >> "$OUTPUT"
echo "SOURCE: components/widgets/MLProblemExplorer.tsx" >> "$OUTPUT"
echo "=================================================================================" >> "$OUTPUT"
echo "=================================================================================" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# Extract text content from MLProblemExplorer
if [ -f "components/widgets/MLProblemExplorer.tsx" ]; then
    # Create a temporary Node.js script for better extraction
    cat > /tmp/extract_ml_explorer.js << 'EOF'
const fs = require("fs");
const content = fs.readFileSync("components/widgets/MLProblemExplorer.tsx", "utf8");

// Extract the content object
const contentStart = content.indexOf("const content = {");
const contentEnd = content.indexOf("} as const;", contentStart) + 11;
if (contentStart === -1 || contentEnd === -1) {
    console.error("Could not find content object");
    process.exit(1);
}

const contentSection = content.substring(contentStart, contentEnd);

// Function to extract text from a section
function extractSection(sectionName, title) {
    const sectionStart = contentSection.indexOf(`${sectionName}: {`);
    if (sectionStart === -1) return;
    
    // Find the end of this section
    let braceCount = 0;
    let i = sectionStart + sectionName.length + 3;
    let sectionEnd = i;
    let inString = false;
    let stringChar = null;
    
    while (i < contentSection.length) {
        const char = contentSection[i];
        const prevChar = i > 0 ? contentSection[i-1] : '';
        
        if (!inString) {
            if ((char === '"' || char === '`' || char === "'") && prevChar !== '\\') {
                inString = true;
                stringChar = char;
            } else if (char === '{') {
                braceCount++;
            } else if (char === '}') {
                if (braceCount === 0) {
                    sectionEnd = i;
                    break;
                }
                braceCount--;
            }
        } else {
            if (char === stringChar && prevChar !== '\\') {
                inString = false;
            }
        }
        i++;
    }
    
    const section = contentSection.substring(sectionStart, sectionEnd + 1);
    
    console.log(`\n### ${title}\n`);
    
    // Extract model
    const modelMatch = section.match(/model:\s*`([^`]+)`/);
    if (modelMatch) {
        console.log("**Probabilistic model:**");
        console.log(`$$${modelMatch[1]}$$\n`);
    }
    
    // Extract loss
    const lossMatch = section.match(/loss:\s*`([^`]+)`/);
    if (lossMatch) {
        console.log("**Loss function:**");
        console.log(`$$${lossMatch[1]}$$\n`);
    }
    
    // Extract explanation
    const explanationStart = section.indexOf("explanation: () => (");
    if (explanationStart !== -1) {
        const explStart = section.indexOf("<div>", explanationStart) + 5;
        const explEnd = section.lastIndexOf("</div>");
        if (explStart > 4 && explEnd > explStart) {
            let text = section.substring(explStart, explEnd);
            
            // Process the text
            text = text.replace(/<p>\s*/g, "\n\n");
            text = text.replace(/\s*<\/p>/g, "");
            text = text.replace(/<KatexMath[^>]*math="([^"]*)"[^>]*\/>/g, (match, math) => {
                return "$" + math + "$";
            });
            text = text.replace(/<KatexMath[^>]*displayMode={true}[^>]*math="([^"]*)"[^>]*\/>/g, (match, math) => {
                return "\n\n$$" + math + "$$\n\n";
            });
            text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g, "[$2]($1)");
            text = text.replace(/<strong>([^<]*)<\/strong>/g, "**$1**");
            text = text.replace(/<div[^>]*className="[^"]*text-center[^"]*"[^>]*>\s*/g, "\n\n");
            text = text.replace(/\s*<\/div>/g, "\n");
            text = text.replace(/\{" "\}/g, " ");
            text = text.replace(/\{"\s*"\}/g, " ");
            text = text.replace(/\\"/g, '"');
            text = text.replace(/\\n/g, '\n');
            text = text.replace(/\n\s*\n\s*\n+/g, "\n\n");
            
            console.log(text.trim());
        }
    }
    
    console.log("\n---");
}

// Process each section
extractSection("meanVariance", "Mean & Variance Estimation");
extractSection("linearRegression", "Linear Regression");
extractSection("kMeans", "k-Means Clustering");
extractSection("logisticRegression", "Logistic Regression");
EOF

    # Run the extraction script
    node /tmp/extract_ml_explorer.js >> "$OUTPUT" 2>/dev/null || echo "[ERROR: Could not extract MLProblemExplorer content]" >> "$OUTPUT"
    
    # Clean up
    rm -f /tmp/extract_ml_explorer.js
else
    echo "[ERROR: File components/widgets/MLProblemExplorer.tsx not found]" >> "$OUTPUT"
fi

echo "" >> "$OUTPUT"
echo "" >> "$OUTPUT"

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