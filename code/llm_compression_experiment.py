#!/usr/bin/env python3
"""
LLM Compression Experiment

This script measures how well an LLM can compress text by calculating
the bits needed to encode each character based on the model's predicted
probabilities.

Since Claude API doesn't provide logprobs, we'll use OpenAI's API.
You'll need to install: pip install openai tiktoken
"""

import math
import json
from typing import List, Dict, Tuple
import openai
import tiktoken

# Text samples from the CompressionWidget
TEXT_SAMPLES = {
    "lorem_ipsum": """Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.""",
    
    "pi_digits": "3.141592653589793238462643383279502884197169399375105820974944592307816406286208998628034825342117067982148086513282306647093844609550582231725359408128481117450284102701938521105559644622948954930381964428810975665933446128475648233786783165271201909145648566923460348610454326648213393607260249141273724587006606315588174881520920962829254091715364367892590360011330530548820466521384146951941511609433057270365759591953092186117381932611793105118548074462379962749567351885752724891227938183011949129833673362440656643086021394946395224737190702179860943702770539217176293176752384674818467669405132000568127145263560827785771342757789609173637178721468440901224953430146549585371050792279689258923542019956112129021960864034418159813629774771309960518707211349999998372978049951059731732816096318595024459455346908302642522308253344685035261931188171010003137838752886587533208381420617177669147303598253490428755468731159562863882353787593751957781857780532171226806613001927876611195909216420198938095257201065485863278865936153381827968230301952035301852968995773622599413891249721775283479131515574857242454150695950829533116861727855889075098381754637464939319255060400927701671139009848824012858361603563707660104710181942955596198946767837449448255379774726847104047534646208046684259069491293313677028989152104752162056966024058038150193511253382430035587640247496473263914199272604269922796782354781636009341721641219924586315030286182974555706749838505494588586926995690927210797509302955321165344987202755960236480665499119881834797753566369807426542527862551818417574672890977772793800081647060016145249192173217214772350141441973568548161361157352552133475741849468438523323907394143334547762416862518983569485562099219222184272550254256887671790494601674609765979812342318805997677194710807585451616635949889928309201964005485481613611573525521334757418494684385233239073941433345477624168625189835694855620992192221842725502542568876717904946016746097659798",
    
    "declaration": """When in the Course of human events, it becomes necessary for one people to dissolve the political bands which have connected them with another, and to assume among the powers of the earth, the separate and equal station to which the Laws of Nature and of Nature's God entitle them, a decent respect to the opinions of mankind requires that they should declare the causes which impel them to the separation. We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty and the pursuit of Happiness.--That to secure these rights, Governments are instituted among Men, deriving their just powers from the consent of the governed, --That whenever any Form of Government becomes destructive of these ends, it is the Right of the People to alter or to abolish it, and to institute new Government, laying its foundation on such principles and organizing its powers in such form, as to them shall seem most likely to effect their Safety and Happiness.""",
    
    "dna_sequence": "ATGCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCG",
    
    "code_snippet": """function calculateFibonacci(n) {
  if (n <= 1) {
    return n;
  }
  
  let a = 0;
  let b = 1;
  let temp;
  
  for (let i = 2; i <= n; i++) {
    temp = a + b;
    a = b;
    b = temp;
  }
  
  return b;
}

function isPrime(num) {
  if (num <= 1) {
    return false;
  }
  
  if (num <= 3) {
    return true;
  }
  
  if (num % 2 === 0 || num % 3 === 0) {
    return false;
  }
  
  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) {
      return false;
    }
  }
  
  return true;
}

const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const primes = numbers.filter(isPrime);
const fibonacci = numbers.map(calculateFibonacci);

console.log('Prime numbers:', primes);
console.log('Fibonacci sequence:', fibonacci);

for (let i = 0; i < 10; i++) {
  console.log(`Fibonacci(${i}) = ${calculateFibonacci(i)}`);
}

module.exports = {
  calculateFibonacci,
  isPrime
};""",
    
    "repeated_pattern": "ABCDEFGHIJKLMNOPQRSTUVWXYZ" * 40
}


def measure_llm_compression(text: str, model: str = "gpt-3.5-turbo-instruct") -> Tuple[float, List[float]]:
    """
    Measure how many bits an LLM needs to encode the given text.
    
    Returns:
        Total bits needed and a list of bits per character
    """
    # Initialize tokenizer
    encoding = tiktoken.encoding_for_model(model)
    
    total_bits = 0
    bits_per_char = []
    
    # Process text in chunks to avoid token limits
    chunk_size = 100  # Process 100 characters at a time
    
    for i in range(len(text)):
        # Get context (up to chunk_size characters before current position)
        start = max(0, i - chunk_size)
        context = text[start:i]
        
        if i == 0:
            # No context for first character
            # Assume uniform distribution over ASCII printable characters (~95 chars)
            bits = math.log2(95)
            bits_per_char.append(bits)
            total_bits += bits
            continue
        
        try:
            # Get next character
            next_char = text[i]
            
            # Create prompt to get probability of next character
            # We'll ask for top 5 logprobs to see if our character is there
            response = openai.Completion.create(
                model=model,
                prompt=context,
                max_tokens=1,
                temperature=0,
                logprobs=5,
                echo=False
            )
            
            # Extract logprobs
            if response.choices[0].logprobs and response.choices[0].logprobs.top_logprobs:
                logprobs = response.choices[0].logprobs.top_logprobs[0]
                
                # Find if next_char appears in the predictions
                char_logprob = None
                for token, lp in logprobs.items():
                    if token.startswith(next_char):
                        char_logprob = lp
                        break
                
                if char_logprob is not None:
                    # Convert logprob (base e) to bits (base 2)
                    bits = -char_logprob / math.log(2)
                else:
                    # Character not in top predictions, estimate as very unlikely
                    bits = 10  # ~1/1024 probability
            else:
                # Fallback to uniform distribution
                bits = math.log2(95)
            
            bits_per_char.append(bits)
            total_bits += bits
            
        except Exception as e:
            print(f"Error at position {i}: {e}")
            # Fallback to uniform distribution
            bits = math.log2(95)
            bits_per_char.append(bits)
            total_bits += bits
    
    return total_bits, bits_per_char


def main():
    """Run compression experiments on all text samples."""
    
    # You'll need to set your OpenAI API key
    # openai.api_key = "your-api-key-here"
    
    print("LLM Compression Experiment")
    print("=" * 50)
    print("\nNOTE: To run this experiment, you need to:")
    print("1. Install required packages: pip install openai tiktoken")
    print("2. Set your OpenAI API key in the script")
    print("3. Be aware this will use API credits (roughly $0.01-0.05 per text)")
    print("\nThe script will measure actual LLM compression performance")
    print("by getting character-by-character probability predictions.")
    print("\n" + "=" * 50)
    
    results = {}
    
    for name, text in TEXT_SAMPLES.items():
        print(f"\nProcessing: {name}")
        print(f"Text length: {len(text)} characters")
        
        try:
            total_bits, bits_per_char = measure_llm_compression(text[:500])  # Limit to 500 chars for testing
            avg_bits_per_char = total_bits / len(text[:500])
            compression_ratio = 8 / avg_bits_per_char
            
            results[name] = {
                "total_bits": total_bits,
                "avg_bits_per_char": avg_bits_per_char,
                "compression_ratio": compression_ratio
            }
            
            print(f"Total bits: {total_bits:.0f}")
            print(f"Average bits/char: {avg_bits_per_char:.2f}")
            print(f"Compression ratio: {compression_ratio:.2f}x")
            
        except Exception as e:
            print(f"Error processing {name}: {e}")
    
    # Save results
    with open("llm_compression_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print("\n" + "=" * 50)
    print("Results saved to llm_compression_results.json")


if __name__ == "__main__":
    main()