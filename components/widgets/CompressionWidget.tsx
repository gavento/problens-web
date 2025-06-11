"use client";

import React, { useState } from "react";

interface CompressionResult {
  algorithm: string;
  bits: number;
  ratio: string;
  generalDescription: string;
  specificDescription: string;
}

interface TextSample {
  name: string;
  description: string;
  text: string;
  results: CompressionResult[];
}

const textSamples: TextSample[] = [
  {
    name: "Lorem Ipsum",
    description: "Classical placeholder text with Latin words",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    results: [
      { 
        algorithm: "Naive", 
        bits: 6680, 
        ratio: "1.00x", 
        generalDescription: "Store each character as 8 bits in memory", 
        specificDescription: "Latin text compresses well due to repeated letter patterns"
      },
      { 
        algorithm: "Letter-wise", 
        bits: 4200, 
        ratio: "1.59x", 
        generalDescription: "Use optimal codes based on individual character frequencies", 
        specificDescription: "Benefits from common English letters (e, t, a, o) being frequent"
      },
      { 
        algorithm: "ZIP", 
        bits: 3840, 
        ratio: "1.74x", 
        generalDescription: "Dictionary-based compression finding repeated substrings", 
        specificDescription: "Finds repeated words and phrases in the Latin text"
      },
      { 
        algorithm: "LLM", 
        bits: 2800, 
        ratio: "2.39x", 
        generalDescription: "Use language model probabilities for next token prediction", 
        specificDescription: "Recognizes Latin word patterns despite not being primarily trained on Latin"
      }
    ]
  },
  {
    name: "Pi Digits",
    description: "First 1000 digits of π (highly random)",
    text: "3.141592653589793238462643383279502884197169399375105820974944592307816406286208998628034825342117067982148086513282306647093844609550582231725359408128481117450284102701938521105559644622948954930381964428810975665933446128475648233786783165271201909145648566923460348610454326648213393607260249141273724587006606315588174881520920962829254091715364367892590360011330530548820466521384146951941511609433057270365759591953092186117381932611793105118548074462379962749567351885752724891227938183011949129833673362440656643086021394946395224737190702179860943702770539217176293176752384674818467669405132000568127145263560827785771342757789609173637178721468440901224953430146549585371050792279689258923542019956112129021960864034418159813629774771309960518707211349999998372978049951059731732816096318595024459455346908302642522308253344685035261931188171010003137838752886587533208381420617177669147303598253490428755468731159562863882353787593751957781857780532171226806613001927876611195909216420198938095257201065485863278865936153381827968230301952035301852968995773622599413891249721775283479131515574857242454150695950829533116861727855889075098381754637464939319255060400927701671139009848824012858361603563707660104710181942955596198946767837449448255379774726847104047534646208046684259069491293313677028989152104752162056966024058038150193511253382430035587640247496473263914199272604269922796782354781636009341721641219924586315030286182974555706749838505494588586926995690927210797509302955321165344987202755960236480665499119881834797753566369807426542527862551818417574672890977772793800081647060016145249192173217214772350141441973568548161361157352552133475741849468438523323907394143334547762416862518983569485562099219222184272550254256887671790494601674609765979812342318805997677194710807585451616635949889928309201964005485481613611573525521334757418494684385233239073941433345477624168625189835694855620992192221842725502542568876717904946016746097659798".substring(0, 1001),
    results: [
      { 
        algorithm: "Naive", 
        bits: 8008, 
        ratio: "1.00x", 
        generalDescription: "Store each character as 8 bits in memory", 
        specificDescription: "No compression possible - each digit needs full storage"
      },
      { 
        algorithm: "Letter-wise", 
        bits: 3320, 
        ratio: "2.41x", 
        generalDescription: "Use optimal codes based on individual character frequencies", 
        specificDescription: "Excellent compression - only 10 digits plus decimal point to encode"
      },
      { 
        algorithm: "ZIP", 
        bits: 7200, 
        ratio: "1.11x", 
        generalDescription: "Dictionary-based compression finding repeated substrings", 
        specificDescription: "Poor compression - π digits appear random with few repeated patterns"
      },
      { 
        algorithm: "LLM", 
        bits: 6800, 
        ratio: "1.18x", 
        generalDescription: "Use language model probabilities for next token prediction", 
        specificDescription: "Struggles with mathematical sequences - not trained to predict π digits"
      }
    ]
  },
  {
    name: "Declaration of Independence",
    description: "Natural English prose with historical vocabulary",
    text: "When in the Course of human events, it becomes necessary for one people to dissolve the political bands which have connected them with another, and to assume among the powers of the earth, the separate and equal station to which the Laws of Nature and of Nature's God entitle them, a decent respect to the opinions of mankind requires that they should declare the causes which impel them to the separation. We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty and the pursuit of Happiness.--That to secure these rights, Governments are instituted among Men, deriving their just powers from the consent of the governed, --That whenever any Form of Government becomes destructive of these ends, it is the Right of the People to alter or to abolish it, and to institute new Government, laying its foundation on such principles and organizing its powers in such form, as to them shall seem most likely to effect their Safety and Happiness.",
    results: [
      { 
        algorithm: "Naive", 
        bits: 9920, 
        ratio: "1.00x", 
        generalDescription: "Store each character as 8 bits in memory", 
        specificDescription: "Historical English prose with varied vocabulary and punctuation"
      },
      { 
        algorithm: "Letter-wise", 
        bits: 5840, 
        ratio: "1.70x", 
        generalDescription: "Use optimal codes based on individual character frequencies", 
        specificDescription: "Good compression using standard English letter frequency patterns"
      },
      { 
        algorithm: "ZIP", 
        bits: 4320, 
        ratio: "2.30x", 
        generalDescription: "Dictionary-based compression finding repeated substrings", 
        specificDescription: "Finds common words like 'the', 'and', 'that' repeated throughout"
      },
      { 
        algorithm: "LLM", 
        bits: 3200, 
        ratio: "3.10x", 
        generalDescription: "Use language model probabilities for next token prediction", 
        specificDescription: "Excellent performance - trained extensively on similar historical texts"
      }
    ]
  },
  {
    name: "DNA Sequence",
    description: "Biological sequence with 4 nucleotides",
    text: "ATGCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCG",
    results: [
      { 
        algorithm: "Naive", 
        bits: 8000, 
        ratio: "1.00x", 
        generalDescription: "Store each character as 8 bits in memory", 
        specificDescription: "Biological sequence using only 4 nucleotide letters (A, T, G, C)"
      },
      { 
        algorithm: "Letter-wise", 
        bits: 2000, 
        ratio: "4.00x", 
        generalDescription: "Use optimal codes based on individual character frequencies", 
        specificDescription: "Perfect compression - only 4 symbols means 2 bits per nucleotide"
      },
      { 
        algorithm: "ZIP", 
        bits: 480, 
        ratio: "16.67x", 
        generalDescription: "Dictionary-based compression finding repeated substrings", 
        specificDescription: "Exceptional compression - highly repetitive ATGC pattern detected"
      },
      { 
        algorithm: "LLM", 
        bits: 1200, 
        ratio: "6.67x", 
        generalDescription: "Use language model probabilities for next token prediction", 
        specificDescription: "Recognizes biological sequence patterns from training data"
      }
    ]
  },
  {
    name: "Code Snippet",
    description: "JavaScript function with typical programming patterns",
    text: "function calculateFibonacci(n) {\n  if (n <= 1) {\n    return n;\n  }\n  \n  let a = 0;\n  let b = 1;\n  let temp;\n  \n  for (let i = 2; i <= n; i++) {\n    temp = a + b;\n    a = b;\n    b = temp;\n  }\n  \n  return b;\n}\n\nfunction isPrime(num) {\n  if (num <= 1) {\n    return false;\n  }\n  \n  if (num <= 3) {\n    return true;\n  }\n  \n  if (num % 2 === 0 || num % 3 === 0) {\n    return false;\n  }\n  \n  for (let i = 5; i * i <= num; i += 6) {\n    if (num % i === 0 || num % (i + 2) === 0) {\n      return false;\n    }\n  }\n  \n  return true;\n}\n\nconst numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];\nconst primes = numbers.filter(isPrime);\nconst fibonacci = numbers.map(calculateFibonacci);\n\nconsole.log('Prime numbers:', primes);\nconsole.log('Fibonacci sequence:', fibonacci);\n\nfor (let i = 0; i < 10; i++) {\n  console.log(`Fibonacci(${i}) = ${calculateFibonacci(i)}`);\n}\n\nmodule.exports = {\n  calculateFibonacci,\n  isPrime\n};",
    results: [
      { 
        algorithm: "Naive", 
        bits: 8984, 
        ratio: "1.00x", 
        generalDescription: "Store each character as 8 bits in memory", 
        specificDescription: "JavaScript code with typical programming syntax and structure"
      },
      { 
        algorithm: "Letter-wise", 
        bits: 5520, 
        ratio: "1.63x", 
        generalDescription: "Use optimal codes based on individual character frequencies", 
        specificDescription: "Moderate compression - mixed letters, numbers, and special characters"
      },
      { 
        algorithm: "ZIP", 
        bits: 3680, 
        ratio: "2.44x", 
        generalDescription: "Dictionary-based compression finding repeated substrings", 
        specificDescription: "Good compression from repeated keywords: function, return, console.log"
      },
      { 
        algorithm: "LLM", 
        bits: 2400, 
        ratio: "3.74x", 
        generalDescription: "Use language model probabilities for next token prediction", 
        specificDescription: "Excellent performance - extensively trained on programming code"
      }
    ]
  },
  {
    name: "Repeated Pattern",
    description: "Highly structured repetitive text",
    text: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".repeat(40).substring(0, 1000),
    results: [
      { 
        algorithm: "Naive", 
        bits: 8000, 
        ratio: "1.00x", 
        generalDescription: "Store each character as 8 bits in memory", 
        specificDescription: "Simple alphabet pattern repeated many times"
      },
      { 
        algorithm: "Letter-wise", 
        bits: 4680, 
        ratio: "1.71x", 
        generalDescription: "Use optimal codes based on individual character frequencies", 
        specificDescription: "Limited compression - all 26 letters appear equally often"
      },
      { 
        algorithm: "ZIP", 
        bits: 120, 
        ratio: "66.67x", 
        generalDescription: "Dictionary-based compression finding repeated substrings", 
        specificDescription: "Perfect compression - detects simple ABCDEFGH...XYZ repeating pattern"
      },
      { 
        algorithm: "LLM", 
        bits: 280, 
        ratio: "28.57x", 
        generalDescription: "Use language model probabilities for next token prediction", 
        specificDescription: "Excellent compression - easily predicts A→B→C→D alphabet sequence"
      }
    ]
  }
];

export default function CompressionWidget() {
  const [selectedSample, setSelectedSample] = useState<TextSample | null>(null);
  const [hoveredResult, setHoveredResult] = useState<CompressionResult | null>(null);

  const formatBits = (bits: number): string => {
    if (bits >= 8000) return `${(bits / 8000).toFixed(1)}KB`;
    return `${bits} bits`;
  };

  const getBarWidth = (bits: number, maxBits: number): number => {
    // Use log scale for better visualization
    const logBits = Math.log10(bits);
    const logMax = Math.log10(maxBits);
    return (logBits / logMax) * 100;
  };

  const getBarColor = (bits: number, maxBits: number): string => {
    const ratio = bits / maxBits;
    if (ratio > 0.8) return "bg-red-500";
    if (ratio > 0.6) return "bg-orange-500";
    if (ratio > 0.4) return "bg-yellow-500";
    if (ratio > 0.2) return "bg-lime-500";
    return "bg-green-500";
  };

  return (
    <div className="compression-widget bg-white border border-gray-200 rounded-lg p-6 my-6">
      <h3 className="text-lg font-semibold mb-4">Text Compression Explorer</h3>
      <p className="text-gray-600 mb-6">
        Explore how different compression algorithms perform on various types of text. 
        Click a sample to see compression results as logarithmically-scaled bars.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {textSamples.map((sample, index) => (
          <button
            key={index}
            onClick={() => setSelectedSample(sample)}
            className={`p-4 text-left border rounded-lg transition-all ${
              selectedSample?.name === sample.name
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="font-medium">{sample.name}</div>
            <div className="text-sm text-gray-600 mt-1">{sample.description}</div>
            <div className="text-xs text-gray-500 mt-1">
              {sample.text.length} characters
            </div>
          </button>
        ))}
      </div>

      {selectedSample && (
        <div className="mt-6">
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-medium mb-2">Sample Text: {selectedSample.name}</h4>
            <div className="text-sm font-mono bg-white p-3 rounded border max-h-32 overflow-y-auto">
              {selectedSample.text.substring(0, 200)}
              {selectedSample.text.length > 200 && "..."}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Total length: {selectedSample.text.length} characters
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium mb-4">Compression Results (log scale):</h4>
            {(() => {
              const maxBits = Math.max(...selectedSample.results.map(r => r.bits));
              return selectedSample.results.map((result, index) => (
                <div key={index} className="relative">
                  <div 
                    className={`relative h-12 rounded transition-all cursor-pointer ${getBarColor(result.bits, maxBits)}`}
                    style={{ width: `${getBarWidth(result.bits, maxBits)}%` }}
                    onMouseEnter={() => setHoveredResult(result)}
                    onMouseLeave={() => setHoveredResult(null)}
                  >
                    <div className="absolute inset-0 flex items-center px-3">
                      <span className="text-white font-medium text-sm">
                        {result.algorithm}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatBits(result.bits)} ({result.ratio})
                  </div>
                </div>
              ));
            })()}
          </div>

          {hoveredResult && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <div className="text-sm text-blue-900">
                <div className="font-medium mb-2">{hoveredResult.algorithm} Algorithm</div>
                <div className="mb-2">
                  <strong>How it works:</strong> {hoveredResult.generalDescription}
                </div>
                <div>
                  <strong>For this text:</strong> {hoveredResult.specificDescription}
                </div>
              </div>
            </div>
          )}

          {!hoveredResult && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-700">
                <strong>Hover over bars</strong> to see how each algorithm works. 
                Bar length shows compressed size on a logarithmic scale - shorter bars mean better compression.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}