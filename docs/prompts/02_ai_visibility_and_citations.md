# Category 2: AI Visibility, Citations & Prompt Intelligence

These prompts query AI engine answer shares (ChatGPT, Claude, Perplexity, Gemini), citation sources, weak prompt opportunities, and the AGXP flywheel score.

---

## 4. `get_weak_prompts`
Identifies underperforming or high-risk prompts where the brand has low or declining visibility in AI answers.

* **Widget Returned**: `ui://widget/next-prompt-intelligence.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
Which buyer prompts or queries are we currently losing or underperforming on across AI answer engines?
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Use get_weak_prompts to identify our high-priority prompt gaps and underperforming AI search queries.
```

---

## 5. `get_ai_insights`
Retrieves AI search performance trends, mention rates across major models, and visibility trajectory.

* **Widget Returned**: `ui://widget/next-ai-insights.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
Give me an AI engine visibility summary: how often are we mentioned, what is our trend, and how do we split across ChatGPT and Claude?
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Execute get_ai_insights to view our brand's latest AI search intelligence metrics, visibility deltas, and model distribution.
```

---

## 6. `get_prompt_intelligence`
Retrieves the comprehensive tracked prompt database with status, volume, and engine coverage.

* **Widget Returned**: `ui://widget/next-prompt-intelligence.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string), `status` (string: "new" | "active" | "all")

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
Show our full prompt intelligence catalog and search volume rankings across AI engines.
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Run get_prompt_intelligence with status="active" to review all active buyer prompts and their engine coverage.
```

---

## 7. `get_ai_visibility`
Pulls multi-engine AI visibility analytics with mention breakdown, position tracking, and filtered rows.

* **Widget Returned**: `ui://widget/next-ai-visibility.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string), `engine` (string: "ChatGPT" | "Claude" | "Perplexity" | "Gemini" | "all"), `mentioned` (string: "true" | "false" | "all")

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
Show our AI search visibility report and mention rate across ChatGPT and Claude.
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Call get_ai_visibility with engine="ChatGPT" and mentioned="true" to see all prompts where ChatGPT actively cites our brand.
```

---

## 8. `get_citations`
Inspects brand citation references, referring authority domains, and owned citation shares.

* **Widget Returned**: `ui://widget/next-citations.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string), `engine` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
Which websites and domains are being cited by AI models when they talk about our brand?
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Use get_citations to analyze our AI citation sources, domain coverage ratio, and owned vs earned citation split.
```

---

## 9. `get_competitive_intelligence`
Retrieves share-of-voice comparisons and citation overlaps against tracked industry competitors.

* **Widget Returned**: `ui://widget/next-competitive-intelligence.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
How does our AI share-of-voice and citation presence compare against our main competitors?
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Run get_competitive_intelligence to display competitor overlap, AI mention shares, and positioning benchmarks.
```

---

## 10. `get_scan_history`
Returns past AI crawler scan executions, engine coverage timelines, and audit logs.

* **Widget Returned**: `ui://widget/next-scan-history.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
Show the history of our recent AI search scans and audit crawl runs.
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Call get_scan_history to inspect recent scan batches, run timestamps, and completed crawler passes.
```

---

## 11. `get_agxp`
Fetches the Autonomous Generative Experience Platform (AGXP) flywheel loop score and 6-stage maturity breakdown.

* **Widget Returned**: `ui://widget/next-agxp.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
What is our AGXP loop score and how are we progressing through the 6 generative engine optimization stages?
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Execute get_agxp to review our flywheel loop score, 30-day lift, and stage-by-stage maturity metrics.
```
