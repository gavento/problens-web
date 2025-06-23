// Test script for HF Space API
const testUrl = "https://en.wikipedia.org/wiki/France";
const testReference = {
  "test1": "France is a country in Europe with a rich history and culture.",
  "test2": "Football is a popular sport played worldwide."
};

async function testAPI() {
  try {
    console.log('Testing HF Space API...');
    
    // Try the Gradio API endpoint
    const response = await fetch('https://vaclavrozhon-zip-compression-clustering.hf.space/run/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [testUrl, JSON.stringify(testReference)]
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('Success! Result:', result);
    
  } catch (error) {
    console.error('Request failed:', error);
  }
}

testAPI();