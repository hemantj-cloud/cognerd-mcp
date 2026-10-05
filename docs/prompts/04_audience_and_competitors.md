# Category 4: Audience Intelligence & Competitor Tracking

These prompts test buyer persona generation, Ideal Customer Profile (ICP) extraction, competitor management, and backlink authority tracking.

---

## 18. `get_audience_personas`
Displays our brand's ICP (Ideal Customer Profile) and active buyer personas with their pain points and prompt triggers.

* **Widget Returned**: `ui://widget/next-audience-personas.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
Show our target audience buyer personas and their key pain points.
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Use get_audience_personas to display our current ICP definition, persona job titles, and buying triggers.
```

---

## 19. `generate_icp`
Auto-generates an Ideal Customer Profile (ICP) and buyer personas based on scraped website positioning (consumes 1 `tools.llm_generation.daily` allowance).

* **Widget Returned**: `ui://widget/next-audience-personas.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
Analyze our brand website positioning and generate a new Ideal Customer Profile (ICP) with buyer personas.
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Execute generate_icp to analyze our site and construct tailored buyer personas with enterprise pain points.
```

---

## 20. `suggest_personas`
Suggests buyer persona profiles from free-text company descriptions or industry context without needing an existing brand.

* **Widget Returned**: `ui://widget/next-audience-personas.html`
* **Required Parameters**: None
* **Optional Parameters**: `name` (string), `description` (string), `industry` (string), `audience` (string), `location` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
Suggest 3 buyer personas for an enterprise AI infrastructure product targeting engineering leadership in North America.
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Call suggest_personas with name="NitroStack", industry="Developer Tools / MCP Platform", and audience="Enterprise CTOs & Heads of AI".
```

---

## 21. `manage_competitors`
Adds, removes, or lists tracked competitor domains for the active brand to monitor in AI answer share-of-voice benchmarks.

* **Widget Returned**: `ui://widget/next-competitive-intelligence.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string), `action` (string: "list" | "add" | "remove"), `name` (string), `url` (string), `aliases` (array of strings)

### Ready-to-Execute Prompts

**Prompt Option A — Listing Competitors (Natural Conversational):**
```text
List all tracked competitors currently monitored in our AI visibility benchmark.
```

**Prompt Option B — Listing Competitors (Explicit Tool Invocation):**
```text
Execute manage_competitors with action="list" to view our tracked competitor domains.
```

**Prompt Option C — Adding a Competitor (Explicit Tool Invocation):**
```text
Use manage_competitors to add LangChain to our tracked competitor list with action="add", name="LangChain", and url="https://langchain.com".
```

---

## 22. `get_backlinks_snapshot`
Retrieves DataForSEO backlink profile, referring domains, domain rank, and competitor backlink comparisons for the brand.

* **Widget Returned**: `ui://widget/next-competitive-intelligence.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
What does our backlink profile look like compared to our competitors? Show our referring domains and authority score.
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Execute get_backlinks_snapshot to view our referring domain count, total backlinks, and competitive link gap analysis.
```

---

## 23. `refresh_competitor_backlinks`
Triggers a live DataForSEO backlink refresh crawl for the brand and tracked competitors.

* **Widget Returned**: `ui://widget/next-competitive-intelligence.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
Refresh our competitor backlink data to check for newly acquired referring domains.
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Run refresh_competitor_backlinks to trigger a live backlink recalculation across our domain and tracked competitors.
```
