# Category 3: Technical AEO, GEO Assets & Site Diagnostics

These prompts test Answer Engine Optimization (AEO), Generative Engine Optimization (GEO) asset generation (llms.txt, robots.txt, schema), and crawler access diagnostics.

> **Execution Note**: Each prompt is strictly scoped with single-tool execution constraints to ensure fast response times and prevent ChatGPT from rendering multiple redundant widgets.

---

## 12. `get_ai_readiness_audit`
Retrieves our overall AI readiness and AEO audit assessment: entity clarity, schema coverage, and crawl readiness.

* **Widget Returned**: `ui://widget/next-ai-readiness-audit.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational with Single-Tool Constraint):**
```text
How ready is our website for AI answer engines? Show our latest AI readiness and AEO audit grade. Call ONLY the get_ai_readiness_audit tool (do not execute any other tools).
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Execute ONLY the get_ai_readiness_audit tool to inspect our overall audit score, entity clarity, and technical remediation findings. Do not call any other tools.
```

---

## 13. `get_geo_assets`
Retrieves the status and contents of our Generative Engine Optimization (GEO) assets (llms.txt, robots.txt, sitemap.xml, Schema.org).

* **Widget Returned**: `ui://widget/next-geo-assets.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string), `jobId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational with Single-Tool Constraint):**
```text
Show the current status of our llms.txt, schema markup, and other GEO assets. Call ONLY the get_geo_assets tool (do not execute any other tools).
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Call ONLY the get_geo_assets tool to view our active llms.txt and machine-readable website manifests. Do not call any other tools.
```

---

## 14. `generate_geo_assets`
Generates a live bundle of GEO assets (llms.txt, robots.txt, sitemap, Schema.org) tailored to maximize AI engine citations (consumes 1 `tools.geo_assets.daily` allowance).

* **Widget Returned**: `ui://widget/next-geo-assets.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational with Single-Tool Constraint):**
```text
Generate a fresh llms.txt file and schema bundle for our website to optimize for AI crawlers. Call ONLY the generate_geo_assets tool (do not execute any other tools).
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Use ONLY the generate_geo_assets tool to trigger generation of an optimized llms.txt and AI bot crawl directives for our domain. Do not call any other tools.
```

---

## 15. `trigger_aeo_audit`
Initiates a live technical Answer Engine Optimization site crawl and audit (consumes 1 `tools.aeo_audit.daily` allowance).

* **Widget Returned**: `ui://widget/next-ai-readiness-audit.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational with Single-Tool Constraint):**
```text
Run a live technical AEO audit on our website to check crawler access, schema, and answer engine readiness. Call ONLY the trigger_aeo_audit tool (do not execute any other tools).
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Execute ONLY the trigger_aeo_audit tool to start a new technical crawl of our site structure and entity readiness. Do not call any other tools.
```

---

## 16. `get_latest_aeo_report`
Fetches technical AEO crawl report, findings, and priority action items by audit job ID or brand.

* **Widget Returned**: `ui://widget/next-ai-readiness-audit.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string), `jobId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational with Single-Tool Constraint):**
```text
What are the priority findings and technical fixes from our latest AEO audit report? Call ONLY the get_latest_aeo_report tool (do not execute any other tools).
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Use ONLY the get_latest_aeo_report tool to fetch the prioritized issue breakdown and schema recommendations from our latest crawl. Do not call any other tools.
```

---

## 17. `get_technical_diagnostics`
Retrieves real-time site technical diagnostics: AI crawler access rules (GPTBot, ClaudeBot), sitemap status, schema presence, and response latency.

* **Widget Returned**: `ui://widget/next-ai-insights.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational with Single-Tool Constraint):**
```text
Are GPTBot and ClaudeBot currently blocked or allowed on our domain? Check our technical diagnostics. Call ONLY the get_technical_diagnostics tool (do not execute any other tools).
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Run ONLY the get_technical_diagnostics tool to inspect our site's live crawlability status, robots.txt bot rules, and sitemap health. Do not call any other tools.
```
