const fs = require('fs');
const path = require('path');

// Input and output paths
const inputDir = path.join(__dirname, '../public/compression_experiments/llm_compression_data');
const outputPath = path.join(__dirname, '../public/compression_experiments/llm_compression_summary.json');

function processExperimentData(data, modelName) {
  const results = {};
  
  Object.entries(data).forEach(([key, experiment]) => {
    const tokens = experiment.detailed_tokens;
    if (!tokens || tokens.length === 0) return;
    
    // Calculate 100 evenly spaced data points
    const numPoints = 100;
    const dataPoints = [];
    
    for (let i = 0; i < numPoints; i++) {
      const progressPercent = (i / (numPoints - 1)) * 100;
      const tokenIndex = Math.floor((i / (numPoints - 1)) * (tokens.length - 1));
      
      // Calculate rolling average around this point (5% window)
      const windowSize = Math.max(1, Math.floor(tokens.length * 0.05));
      const startIdx = Math.max(0, tokenIndex - Math.floor(windowSize / 2));
      const endIdx = Math.min(tokens.length - 1, tokenIndex + Math.floor(windowSize / 2));
      
      let windowBits = 0;
      let windowChars = 0;
      
      for (let j = startIdx; j <= endIdx; j++) {
        windowBits += tokens[j].log2_prob;
        windowChars += tokens[j].token.length;
      }
      
      const bitsPerChar = windowChars > 0 ? windowBits / windowChars : 0;
      
      dataPoints.push({
        progressPercent: progressPercent,
        bitsPerChar: bitsPerChar
      });
    }
    
    // Calculate character position for the end of experiment
    let totalChars = 0;
    tokens.forEach(token => {
      totalChars += token.token.length;
    });
    
    results[key] = {
      name: experiment.name,
      filename: experiment.filename,
      description: experiment.description,
      totalChars: totalChars,
      totalBits: experiment.bits,
      averageBitsPerChar: experiment.bits / totalChars,
      modelName: modelName,
      dataPoints: dataPoints
    };
  });
  
  return results;
}

function main() {
  try {
    // Read both model files
    const gpt2Path = path.join(inputDir, 'results_20250614_074618_gpt-2.json');
    const llamaPath = path.join(inputDir, 'results_20250614_074947_llama-4-scout-17b.json');
    
    console.log('Reading GPT-2 data...');
    const gpt2Data = JSON.parse(fs.readFileSync(gpt2Path, 'utf-8'));
    
    console.log('Reading Llama data...');
    const llamaData = JSON.parse(fs.readFileSync(llamaPath, 'utf-8'));
    
    console.log('Processing data...');
    
    const processedData = {
      "gpt-2": processExperimentData(gpt2Data, "GPT-2"),
      "llama-4": processExperimentData(llamaData, "Llama 4"),
      metadata: {
        generatedAt: new Date().toISOString(),
        description: "Preprocessed LLM compression progression data with 100 points per experiment",
        dataPointsPerExperiment: 100,
        smoothingWindow: "5% rolling average"
      }
    };
    
    console.log('Writing processed data...');
    fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2));
    
    console.log(`Successfully processed data for ${Object.keys(processedData["gpt-2"]).length} experiments per model`);
    console.log(`Output written to: ${outputPath}`);
    
    // Print summary statistics
    Object.entries(processedData).forEach(([modelName, experiments]) => {
      if (modelName === 'metadata') return;
      
      console.log(`\n${modelName.toUpperCase()} Summary:`);
      Object.entries(experiments).forEach(([key, exp]) => {
        console.log(`  ${exp.name}: ${exp.totalChars} chars, avg ${exp.averageBitsPerChar.toFixed(3)} bits/char`);
      });
    });
    
  } catch (error) {
    console.error('Error processing data:', error);
    process.exit(1);
  }
}

main();