# Category 2: AI Visibility, Citations & Prompt Intelligence

These prompts query AI engine answer shares (ChatGPT, Claude, Perplexity, Gemini), citation sources, weak prompt opportunities, and the AGXP flywheel score.

> **Execution Note**: Each prompt is strictly scoped with single-tool execution constraints to ensure fast response times and prevent ChatGPT from rendering multiple redundant widgets.

---

## 4. `get_weak_prompts`
Identifies underperforming or high-risk prompts where the brand has low or declining visibility in AI answers.

* **Widget Returned**: `ui://widget/next-prompt-intelligence.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational with Single-Tool Constraint):**
```text
Show only our underperforming buyer prompts and visibility gaps across AI engines. Call ONLY the get_weak_prompts tool (do not execute any other tools).
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Execute ONLY the get_weak_prompts tool to identify our high-priority prompt gaps and underperforming AI search queries. Do not call any other tools.
```

---

## 5. `get_ai_insights`
Retrieves AI search performance trends, mention rates across major models, and visibility trajectory.

* **Widget Returned**: `ui://widget/next-ai-insights.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational with Single-Tool Constraint):**
```text
Give me an AI engine visibility overview: overall score, mention trajectory, and model breakdown. Call ONLY the get_ai_insights tool (do not execute any other tools).
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Execute ONLY the get_ai_insights tool to view our brand's latest AI search intelligence metrics, visibility deltas, and model distribution. Do not call any other tools.
```

---

## 6. `get_prompt_intelligence`
Retrieves the comprehensive tracked prompt database with status, volume, and engine coverage.

* **Widget Returned**: `ui://widget/next-prompt-intelligence.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string), `status` (string: "new" | "active" | "all")

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational with Single-Tool Constraint):**
```text
Show our full prompt intelligence catalog and search volume rankings across AI engines. Call ONLY the get_prompt_intelligence tool (do not execute any other tools).
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Run ONLY the get_prompt_intelligence tool with status="active" to review all active buyer prompts and their engine coverage. Do not call any other tools.
```

---

## 7. `get_ai_visibility`
Pulls multi-engine AI visibility analytics with mention breakdown, position tracking, and filtered rows.

* **Widget Returned**: `ui://widget/next-ai-visibility.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string), `engine` (string: "ChatGPT" | "Claude" | "Perplexity" | "Gemini" | "all"), `mentioned` (string: "true" | "false" | "all")

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational with Single-Tool Constraint):**
```text
Show our detailed AI search visibility matrix and citation table across engines. Call ONLY the get_ai_visibility tool (do not execute any other tools).
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Call ONLY the get_ai_visibility tool with engine="ChatGPT" and mentioned="true" to see all prompts where ChatGPT actively cites our brand. Do not call any other tools.
```

---

## 8. `get_citations`
Inspects brand citation references, referring authority domains, and owned citation shares.

* **Widget Returned**: `ui://widget/next-citations.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string), `engine` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational with Single-Tool Constraint):**
```text
Which websites and domains are being cited by AI models when they talk about our brand? Call ONLY the get_citations tool (do not execute any other tools).
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Use ONLY the get_citations tool to analyze our AI citation sources, domain coverage ratio, and owned vs earned citation split. Do not call any other tools.
```

---

## 9. `get_competitive_intelligence`
Retrieves share-of-voice comparisons and citation overlaps against tracked industry competitors.

* **Widget Returned**: `ui://widget/next-competitive-intelligence.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational with Single-Tool Constraint):**
```text
How does our AI share-of-voice and citation presence compare against our main competitors? Call ONLY the get_competitive_intelligence tool (do not execute any other tools).
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Run ONLY the get_competitive_intelligence tool to display competitor overlap, AI mention shares, and positioning benchmarks. Do not call any other tools.
```

---

## 10. `get_scan_history`
Returns past AI crawler scan executions, engine coverage timelines, and audit logs.

* **Widget Returned**: `ui://widget/next-scan-history.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational with Single-Tool Constraint):**
```text
Show the history of our recent AI search scans and audit crawl runs. Call ONLY the get_scan_history tool (do not execute any other tools).
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Call ONLY the get_scan_history tool to inspect recent scan batches, run timestamps, and completed crawler passes. Do not call any other tools.
```

---

## 11. `get_agxp`
Fetches the Autonomous Generative Experience Platform (AGXP) flywheel loop score and 6-stage maturity breakdown.

* **Widget Returned**: `ui://widget/next-agxp.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational with Single-Tool Constraint):**
```text
What is our AGXP loop score and how are we progressing through the 6 generative engine optimization stages? Call ONLY the get_agxp tool (do not execute any other tools).
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Execute ONLY the get_agxp tool to review our flywheel loop score, 30-day lift, and stage-by-stage maturity metrics. Do not call any other tools.
```
