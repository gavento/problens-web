"use client";

import React, { useState, useEffect } from "react";
import { InlineMath } from "react-katex";

type Row = {
  snippet: string;
  trueNext: string;
  q: Record<string, number>;
};

// A tiny subset of the Intelligence-test snippets so the example stays light.
const SAMPLE_ROWS: Row[] = [
  {
    snippet:
      "The Abraham Lincoln Presidential Library and Museum is also in Springfield. The Abraham Lincoln National Cemetery is located in \_",
    trueNext: "e",
    // toy model distribution from an imagined LLM
    q: {
      e: 0.91,
      n: 0.06,
      t: 0.01,
    },
  },
  {
    snippet: "For this reason, the two gods withdrew their pursuit, and had her wed to Peleus. When _",
    trueNext: "a",
    q: {
      t: 0.6,
      s: 0.34,
      p: 0.03,
      h: 0.01,
      a: 0.001,
    },
  },
  {
    snippet:
      "Morality requires that we do not sanction our own victimhood, Rand claims. In adhering to this concept, Rand assigns vi_",
    trueNext: "r",
    q: {
      c: 0.88,
      r: 0.11,
    },
  },
];

// Helper to format a single character key for LaTeX – letters are rendered using \textsf, space becomes a visible space symbol
function latexKey(k: string) {
  if (k === " ") return "\\textsf{\\textvisiblespace}"; // render space visibly
  return `\\textsf{${k}}`;
}

// Utility to render distribution nicely
function renderDistribution(dist: Record<string, number>) {
  const entries = Object.entries(dist);
  const formattedEntries = entries.map(([key, value]) => {
    const displayValue = value < 0.01 ? value.toFixed(3) : value.toFixed(2);
    return `${latexKey(key)}: ${displayValue}`;
  });
  return <InlineMath math={`\\{ ${formattedEntries.join(", ")} \\}`} />;
}

// Auto-scroll effect inside component
export default function SnippetDistributionTableWidget() {
  const [view, setView] = useState<"p" | "q">("p");

  useEffect(() => {
    const elems = document.querySelectorAll<HTMLDivElement>(".snippet-scroll");
    elems.forEach((el) => {
      el.scrollLeft = 0;
    });
  }, []);

  return (
    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
      {/* Toggle */}
      <div className="flex justify-center space-x-2">
        <button
          className={`px-3 py-1 rounded   ${view === "p" ? "bg-blue-600 text-white" : "bg-white border"}`}
          onClick={() => setView("p")}
        >
          truth p
        </button>
        <button
          className={`px-3 py-1 rounded   ${view === "q" ? "bg-red-600 text-white" : "bg-white border"}`}
          onClick={() => setView("q")}
        >
          model q
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm table-fixed">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-2 py-1 text-left w-1/2">snippet</th>
              <th className="px-2 py-1 text-left w-1/2">
                {view === "p" ? (
                  <InlineMath math="p_{emp}(\text{letter}\mid\text{snippet})" />
                ) : (
                  <InlineMath math="q_{LLM}(\text{letter}\mid\text{snippet})" />
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_ROWS.map((row, idx) => {
              return (
                <tr key={idx} className="border-b last:border-0">
                  <td className="px-2 py-1 align-top w-1/2">
                    <div className="overflow-x-auto whitespace-nowrap snippet-scroll">{row.snippet}</div>
                  </td>
                  <td className="px-2 py-1 align-top w-1/2">
                    <div className="overflow-x-auto whitespace-nowrap">
                      {view === "p" ? (
                        <InlineMath math={`\\{ ${latexKey(row.trueNext)}: 1.00 \\}`} />
                      ) : (
                        renderDistribution(row.q as Record<string, number>)
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Brief footnote on notation */}
      <p className="text-xs text-gray-600 space-x-1">
        <span>The distribution</span>
        <InlineMath math="p" />
        <span>corresponds to the actual next letter,</span>
        <InlineMath math="q" />
        <span>is the guess of an LLM (here, Llama 4).</span>
      </p>
    </div>
  );
}
