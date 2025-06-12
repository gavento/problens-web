#!/usr/bin/env python3
"""
ACTUAL LLM compression experiment with GPT-2.

Experiment steps:
1. Tokenize the text
2. For each token position, get the probability distribution over next token
3. If actual next token is t, add log(1/p(t)) to the sum

NO ESTIMATES. ONLY REAL MEASUREMENTS.
"""

import torch
import math
from transformers import GPT2LMHeadModel, GPT2Tokenizer

# Text samples
SAMPLES = {
    "lorem_ipsum": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    
    "pi_digits": "3.141592653589793238462643383279502884197169399375105820974944592307816406286208998628034825342117067982148086513282306647093844609550582231725359408128481117450284102701938521105559644622948954930381964428810975665933446128475648233786783165271201909145648566923460348610454326648213393607260249141273724587006606315588174881520920962829254091715364367892590360011330530548820466521384146951941511609433057270365759591953092186117381932611793105118548074462379962749567351885752724891227938183011949129833673362440656643086021394946395224737190702179860943702770539217176293176752384674818467669405132000568127145263560827785771342757789609173637178721468440901224953430146549585371050792279689258923542019956112129021960864034418159813629774771309960518707211349999998372978049951059731732816096318595024459455346908302642522308253344685035261931188171010003137838752886587533208381420617177669147303598253490428755468731159562863882353787593751957781857780532171226806613001927876611195909216420198938095257201065485863278865936153381827968230301952035301852968995773622599413891249721775283479131515574857242454150695950829533116861727855889075098381754637464939319255060400927701671139009848824012858361603563707660104710181942955596198946767837449448255379774726847104047534646208046684259069491293313677028989152104752162056966024058038150193511253382430035587640247496473263914199272604269922796782354781636009341721641219924586315030286182974555706749838505494588586926995690927210797509302955321165344987202755960236480665499119881834797753566369807426542527862551818417574672890977772793800081647060016145249192173217214772350141441973568548161361157352552133475741849468438523323907394143334547762416862518983569485562099219222184272550254256887671790494601674609765979812342318805997677194710807585451616635949889928309201964005485481613611573525521334757418494684385233239073941433345477624168625189835694855620992192221842725502542568876717904946016746097659798",
    
    "declaration": "When in the Course of human events, it becomes necessary for one people to dissolve the political bands which have connected them with another, and to assume among the powers of the earth, the separate and equal station to which the Laws of Nature and of Nature's God entitle them, a decent respect to the opinions of mankind requires that they should declare the causes which impel them to the separation. We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty and the pursuit of Happiness.--That to secure these rights, Governments are instituted among Men, deriving their just powers from the consent of the governed, --That whenever any Form of Government becomes destructive of these ends, it is the Right of the People to alter or to abolish it, and to institute new Government, laying its foundation on such principles and organizing its powers in such form, as to them shall seem most likely to effect their Safety and Happiness.",
    
    "dna": "ATGCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCG",
    
    "code": """function calculateFibonacci(n) {
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
    
    "repeated": "ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ"
}

def run_compression_experiment(text, sample_name, model, tokenizer, device):
    """
    Run the ACTUAL compression experiment:
    1. Tokenize text
    2. Get probability of each next token
    3. Sum log(1/p(t))
    """
    
    print(f"\nRunning experiment on: {sample_name}")
    print(f"Text length: {len(text)} characters")
    
    # Step 1: Tokenize
    tokens = tokenizer.encode(text, return_tensors='pt').to(device)
    print(f"Number of tokens: {tokens.shape[1]}")
    
    # Step 2 & 3: Get probabilities and calculate bits
    total_bits = 0
    token_bits = []
    
    with torch.no_grad():
        for i in range(tokens.shape[1] - 1):
            # Get context (all tokens up to position i)
            context = tokens[:, :i+1]
            
            # Get model predictions
            outputs = model(context)
            logits = outputs.logits
            
            # Get probability distribution for next token
            probs = torch.softmax(logits[0, -1, :], dim=0)
            
            # Get actual next token
            actual_next_token = tokens[0, i+1].item()
            
            # Get probability of actual token
            p_actual = probs[actual_next_token].item()
            
            # Calculate bits: log2(1/p) = -log2(p)
            if p_actual > 0:
                bits = -math.log2(p_actual)
            else:
                bits = 50  # Cap at 50 bits for numerical stability
                
            total_bits += bits
            token_bits.append(bits)
            
            # Progress indicator
            if (i + 1) % 100 == 0:
                print(f"  Processed {i+1}/{tokens.shape[1]-1} tokens...", end='\r')
    
    print(f"  Processed {tokens.shape[1]-1}/{tokens.shape[1]-1} tokens...Done!")
    
    # Calculate metrics
    bits_per_token = total_bits / len(token_bits) if token_bits else 0
    compression_ratio = (8 * len(text)) / total_bits if total_bits > 0 else 0
    
    return {
        'text_length': len(text),
        'num_tokens': tokens.shape[1],
        'total_bits': total_bits,
        'bits_per_token': bits_per_token,
        'bits_per_char': total_bits / len(text),
        'compression_ratio': compression_ratio,
        'token_bits': token_bits[:10]  # First 10 for inspection
    }

def main():
    print("GPT-2 Compression Experiment")
    print("="*60)
    print("This is the ACTUAL experiment - no estimates!")
    print("Loading GPT-2...")
    
    # Load model and tokenizer
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
    model = GPT2LMHeadModel.from_pretrained('gpt2').to(device)
    model.eval()
    
    print("Model loaded successfully!")
    
    results = {}
    
    # Run experiment on each sample
    for name, text in SAMPLES.items():
        result = run_compression_experiment(text, name, model, tokenizer, device)
        results[name] = result
        
        print(f"\nResults for {name}:")
        print(f"  Total bits: {result['total_bits']:.0f}")
        print(f"  Bits per token: {result['bits_per_token']:.2f}")
        print(f"  Bits per character: {result['bits_per_char']:.2f}")
        print(f"  Compression ratio: {result['compression_ratio']:.1f}x")
        print(f"  First few token bits: {[f'{b:.1f}' for b in result['token_bits']]}")
    
    print("\n" + "="*60)
    print("\nFinal Results for CompressionWidget:")
    print("(These are ACTUAL MEASUREMENTS from GPT-2)\n")
    
    for name, result in results.items():
        print(f"// {name.replace('_', ' ').title()}")
        print(f"{{ ")
        print(f'  algorithm: "LLM (GPT-2)", ')
        print(f'  bits: {int(result["total_bits"])}, ')
        print(f'  ratio: "{result["compression_ratio"]:.1f}x", ')
        print(f'  generalDescription: "Use language model probabilities for next token prediction", ')
        print(f'  specificDescription: "Actual GPT-2 compression measurement on this text"')
        print(f"}},\n")

if __name__ == "__main__":
    main()