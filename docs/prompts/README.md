# CogNerd MCP Server: Complete ChatGPT Testing Prompts

This directory contains copy-paste prompts designed to test every one of the **39 tools** and **15 interactive Next.js widgets** exposed by the production CogNerd MCP server.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       COGNENRD MCP ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Production Endpoint: https://cognerd-6ab6bd50-amans-org-43ae3aeb.../mcp   │
│ • Total Tools: 39 Tools registered                                          │
│ • Interactive UI Widgets: 15 Next.js React widgets rendered inside ChatGPT  │
│ • Metering Model: CogNerd Run System (runs.monthly, briefs.*, tools.*)      │
│ • Authentication: Dynamic per-caller OAuth 2.1 (PKCE S256 + DCR + CIMD)    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tool Category Quick Links

| Category | File | Description | Tools |
| :--- | :--- | :--- | :--- |
| **1. Account & Quotas** | [01_account_and_quotas.md](file:///Users/admin/Desktop/sales-clients/cognerd/docs/prompts/01_account_and_quotas.md) | Identity, brand capacity, and CogNerd Run System allowances | 1 – 3 |
| **2. AI Visibility & Citations** | [02_ai_visibility_and_citations.md](file:///Users/admin/Desktop/sales-clients/cognerd/docs/prompts/02_ai_visibility_and_citations.md) | Share-of-voice, AI engine rankings, weak prompts & AGXP loop | 4 – 11 |
| **3. Technical AEO & Diagnostics** | [03_aeo_geo_and_diagnostics.md](file:///Users/admin/Desktop/sales-clients/cognerd/docs/prompts/03_aeo_geo_and_diagnostics.md) | llms.txt generation, AEO crawl audit & GPTBot accessibility | 12 – 17 |
| **4. Audience & Competitors** | [04_audience_and_competitors.md](file:///Users/admin/Desktop/sales-clients/cognerd/docs/prompts/04_audience_and_competitors.md) | ICP generation, buyer personas, competitor tracking & backlinks | 18 – 23 |
| **5. Content Studio & Creation** | [05_content_studio_and_creation.md](file:///Users/admin/Desktop/sales-clients/cognerd/docs/prompts/05_content_studio_and_creation.md) | LinkedIn carousels, 4-step article wizard & social repurposing | 24 – 33 |
| **6. Telemetry & Integrations** | [06_telemetry_and_integrations.md](file:///Users/admin/Desktop/sales-clients/cognerd/docs/prompts/06_telemetry_and_integrations.md) | GSC organic clicks, GA4 traffic, Clarity heatmaps & toolkit sync | 34 – 39 |

---

## Master Prompt List (All 39 Tools)

Each entry provides a natural conversational prompt (which ChatGPT interprets accurately) and an explicit invocation prompt with recommended parameters.

### 1. `whoami`
* **Widget**: `ui://widget/next-whoami.html`
* **Natural Prompt**: `Show my CogNerd account profile, active brands, and monthly run allowances.`
* **Explicit Prompt**: `Using the whoami tool, verify my current authenticated session, brand workspace details, and active CogNerd Run System limits.`

### 2. `get_run_allowance`
* **Widget**: `ui://widget/next-run-allowance.html`
* **Natural Prompt**: `What are my remaining CogNerd monthly runs, content briefs, and daily AI tool quotas?`
* **Explicit Prompt**: `Execute get_run_allowance to display our complete CogNerd Run System allowance breakdown across runs.monthly, briefs.*.monthly, and tools.*.daily.`

### 3. `get_credit_balance` (Legacy Compatibility)
* **Widget**: `ui://widget/next-run-allowance.html`
* **Natural Prompt**: `Check my workspace credit balance and quota status.`
* **Explicit Prompt**: `Call get_credit_balance to verify backward-compatible quota reporting for our workspace.`

### 4. `get_weak_prompts`
* **Widget**: `ui://widget/next-prompt-intelligence.html`
* **Natural Prompt**: `Which buyer prompts or queries are we currently losing or underperforming on across AI answer engines?`
* **Explicit Prompt**: `Use get_weak_prompts to identify our high-priority prompt gaps and underperforming AI search queries.`

### 5. `get_ai_insights`
* **Widget**: `ui://widget/next-ai-insights.html`
* **Natural Prompt**: `Give me an AI engine visibility summary: how often are we mentioned, what is our trend, and how do we split across ChatGPT and Claude?`
* **Explicit Prompt**: `Execute get_ai_insights to view our brand's latest AI search intelligence metrics, visibility deltas, and model distribution.`

### 6. `get_prompt_intelligence`
* **Widget**: `ui://widget/next-prompt-intelligence.html`
* **Natural Prompt**: `Show our full prompt intelligence catalog and search volume rankings across AI engines.`
* **Explicit Prompt**: `Run get_prompt_intelligence with status="active" to review all active buyer prompts and their engine coverage.`

### 7. `get_ai_visibility`
* **Widget**: `ui://widget/next-ai-visibility.html`
* **Natural Prompt**: `Show our AI search visibility report and mention rate across ChatGPT and Claude.`
* **Explicit Prompt**: `Call get_ai_visibility with engine="ChatGPT" and mentioned="true" to see all prompts where ChatGPT actively cites our brand.`

### 8. `get_citations`
* **Widget**: `ui://widget/next-citations.html`
* **Natural Prompt**: `Which websites and domains are being cited by AI models when they talk about our brand?`
* **Explicit Prompt**: `Use get_citations to analyze our AI citation sources, domain coverage ratio, and owned vs earned citation split.`

### 9. `get_competitive_intelligence`
* **Widget**: `ui://widget/next-competitive-intelligence.html`
* **Natural Prompt**: `How does our AI share-of-voice and citation presence compare against our main competitors?`
* **Explicit Prompt**: `Run get_competitive_intelligence to display competitor overlap, AI mention shares, and positioning benchmarks.`

### 10. `get_scan_history`
* **Widget**: `ui://widget/next-scan-history.html`
* **Natural Prompt**: `Show the history of our recent AI search scans and audit crawl runs.`
* **Explicit Prompt**: `Call get_scan_history to inspect recent scan batches, run timestamps, and completed crawler passes.`

### 11. `get_agxp`
* **Widget**: `ui://widget/next-agxp.html`
* **Natural Prompt**: `What is our AGXP loop score and how are we progressing through the 6 generative engine optimization stages?`
* **Explicit Prompt**: `Execute get_agxp to review our flywheel loop score, 30-day lift, and stage-by-stage maturity metrics.`

### 12. `get_ai_readiness_audit`
* **Widget**: `ui://widget/next-ai-readiness-audit.html`
* **Natural Prompt**: `How ready is our website for AI answer engines? Show our latest AI readiness and AEO audit grade.`
* **Explicit Prompt**: `Execute get_ai_readiness_audit to inspect our overall audit score, entity clarity, and technical remediation findings.`

### 13. `get_geo_assets`
* **Widget**: `ui://widget/next-geo-assets.html`
* **Natural Prompt**: `Show the current status of our llms.txt, schema markup, and other GEO assets.`
* **Explicit Prompt**: `Call get_geo_assets to view our active llms.txt and machine-readable website manifests.`

### 14. `generate_geo_assets`
* **Widget**: `ui://widget/next-geo-assets.html`
* **Natural Prompt**: `Generate a fresh llms.txt file and schema bundle for our website to optimize for AI crawlers.`
* **Explicit Prompt**: `Use generate_geo_assets to trigger generation of an optimized llms.txt and AI bot crawl directives for our domain.`

### 15. `trigger_aeo_audit`
* **Widget**: `ui://widget/next-ai-readiness-audit.html`
* **Natural Prompt**: `Run a live technical AEO audit on our website to check crawler access, schema, and answer engine readiness.`
* **Explicit Prompt**: `Execute trigger_aeo_audit to start a new technical crawl of our site structure and entity readiness.`

### 16. `get_latest_aeo_report`
* **Widget**: `ui://widget/next-ai-readiness-audit.html`
* **Natural Prompt**: `What are the priority findings and technical fixes from our latest AEO audit report?`
* **Explicit Prompt**: `Use get_latest_aeo_report to fetch the prioritized issue breakdown and schema recommendations from our latest crawl.`

### 17. `get_technical_diagnostics`
* **Widget**: `ui://widget/next-ai-insights.html`
* **Natural Prompt**: `Are GPTBot and ClaudeBot currently blocked or allowed on our domain? Check our technical diagnostics.`
* **Explicit Prompt**: `Run get_technical_diagnostics to inspect our site's live crawlability status, robots.txt bot rules, and sitemap health.`

### 18. `get_audience_personas`
* **Widget**: `ui://widget/next-audience-personas.html`
* **Natural Prompt**: `Show our target audience buyer personas and their key pain points.`
* **Explicit Prompt**: `Use get_audience_personas to display our current ICP definition, persona job titles, and buying triggers.`

### 19. `generate_icp`
* **Widget**: `ui://widget/next-audience-personas.html`
* **Natural Prompt**: `Analyze our brand website positioning and generate a new Ideal Customer Profile (ICP) with buyer personas.`
* **Explicit Prompt**: `Execute generate_icp to analyze our site and construct tailored buyer personas with enterprise pain points.`

### 20. `suggest_personas`
* **Widget**: `ui://widget/next-audience-personas.html`
* **Natural Prompt**: `Suggest 3 buyer personas for an enterprise AI infrastructure product targeting engineering leadership in North America.`
* **Explicit Prompt**: `Call suggest_personas with name="NitroStack", industry="Developer Tools / MCP Platform", and audience="Enterprise CTOs & Heads of AI".`

### 21. `manage_competitors`
* **Widget**: `ui://widget/next-competitive-intelligence.html`
* **Natural Prompt**: `List all tracked competitors currently monitored in our AI visibility benchmark.`
* **Explicit Prompt**: `Execute manage_competitors with action="list" to view our tracked competitor domains.`

### 22. `get_backlinks_snapshot`
* **Widget**: `ui://widget/next-competitive-intelligence.html`
* **Natural Prompt**: `What does our backlink profile look like compared to our competitors? Show our referring domains and authority score.`
* **Explicit Prompt**: `Execute get_backlinks_snapshot to view our referring domain count, total backlinks, and competitive link gap analysis.`

### 23. `refresh_competitor_backlinks`
* **Widget**: `ui://widget/next-competitive-intelligence.html`
* **Natural Prompt**: `Refresh our competitor backlink data to check for newly acquired referring domains.`
* **Explicit Prompt**: `Run refresh_competitor_backlinks to trigger a live backlink recalculation across our domain and tracked competitors.`

### 24. `get_content_studio`
* **Widget**: `ui://widget/next-content-studio.html`
* **Natural Prompt**: `Open our Content Studio dashboard to see our recent content briefs and article projects.`
* **Explicit Prompt**: `Execute get_content_studio with status="all" to inspect our full library of drafts, published articles, and carousel decks.`

### 25. `generate_linkedin_carousel`
* **Widget**: `ui://widget/next-content-studio.html`
* **Natural Prompt**: `Create a 5-slide dark-mode LinkedIn carousel deck explaining why enterprise MCP servers need cryptographic audit trails.`
* **Explicit Prompt**: `Call generate_linkedin_carousel with topic="Why Enterprise MCP Servers Need Cryptographic Audit Trails", slideCount=5, and theme="dark".`

### 26. `get_carousel_deck`
* **Widget**: `ui://widget/next-content-studio.html`
* **Natural Prompt**: `Fetch the slides and layout for carousel deck deck-1.`
* **Explicit Prompt**: `Run get_carousel_deck with deckId="deck-1" to view the slide headlines, body copy, and theme settings.`

### 27. `rerender_carousel`
* **Widget**: `ui://widget/next-content-studio.html`
* **Natural Prompt**: `Re-render carousel deck-1 with the brand color theme.`
* **Explicit Prompt**: `Execute rerender_carousel with deckId="deck-1" and theme="brand" to update the slide styling.`

### 28. `start_guided_article_wizard`
* **Widget**: `ui://widget/next-content-studio.html`
* **Natural Prompt**: `Start a new guided article project targeting the buyer prompt "Best Enterprise Model Context Protocol Framework".`
* **Explicit Prompt**: `Use start_guided_article_wizard with targetPrompt="Best Enterprise Model Context Protocol Framework", title="The Definitive Guide to Production MCP", and persona="Enterprise Platform Engineer".`

### 29. `run_article_wizard_step`
* **Widget**: `ui://widget/next-content-studio.html`
* **Natural Prompt**: `Run the research step for article project proj-1 to pull verified citations and technical evidence.`
* **Explicit Prompt**: `Execute run_article_wizard_step with projectId="proj-1" and step="research".`

### 30. `finalize_article_to_blog`
* **Widget**: `ui://widget/next-content-studio.html`
* **Natural Prompt**: `Finalize article project proj-1 and publish it to our blog.`
* **Explicit Prompt**: `Call finalize_article_to_blog with projectId="proj-1" to complete the article workflow and save to the published library.`

### 31. `repurpose_article_to_social`
* **Widget**: `ui://widget/next-content-studio.html`
* **Natural Prompt**: `Repurpose our latest article proj-1 into a LinkedIn post and a 5-tweet Twitter thread.`
* **Explicit Prompt**: `Use repurpose_article_to_social with projectIdOrTopic="proj-1" to generate channel-optimized social copy.`

### 32. `rewrite_content_paragraph`
* **Widget**: `ui://widget/next-content-studio.html`
* **Natural Prompt**: `Rewrite this paragraph so that AI models cite it as an authoritative definition: "NitroStack makes building MCP servers fast with CLI and built-in security features."`
* **Explicit Prompt**: `Call rewrite_content_paragraph with text="NitroStack is a framework for Model Context Protocol servers with OAuth and Docker deployment." and intent="answer_engine_grounding".`

### 33. `generate_standalone_social`
* **Widget**: `ui://widget/next-content-studio.html`
* **Natural Prompt**: `Write an authoritative LinkedIn thought leadership post about why AI agents require standardized MCP protocols instead of ad-hoc APIs.`
* **Explicit Prompt**: `Execute generate_standalone_social with topic="Standardizing Agentic AI Infrastructure with MCP", platform="linkedin", and tone="thought_leadership".`

### 34. `get_search_console_report`
* **Widget**: `ui://widget/next-ai-insights.html`
* **Natural Prompt**: `Show our Google Search Console performance for the last 30 days: total clicks, impressions, and top ranking queries.`
* **Explicit Prompt**: `Execute get_search_console_report with days=30 to inspect organic search telemetry and click-through rates.`

### 35. `list_search_console_sites`
* **Widget**: `ui://widget/next-ai-insights.html`
* **Natural Prompt**: `Which website domains and subdomains are verified in our connected Google Search Console account?`
* **Explicit Prompt**: `Call list_search_console_sites to display all verified search console site URLs linked to our workspace.`

### 36. `get_ga4_traffic_report`
* **Widget**: `ui://widget/next-ai-insights.html`
* **Natural Prompt**: `What is our web traffic breakdown from Google Analytics 4, and how much traffic is arriving from AI assistants?`
* **Explicit Prompt**: `Run get_ga4_traffic_report to inspect total users, session counts, channel attribution, and AI assistant referral percentages.`

### 37. `get_clarity_heatmaps`
* **Widget**: `ui://widget/next-ai-insights.html`
* **Natural Prompt**: `Show our Microsoft Clarity user experience stats: average scroll depth, rage clicks, and dead click rates.`
* **Explicit Prompt**: `Use get_clarity_heatmaps to pull behavioral UX telemetry and identify landing page friction points.`

### 38. `get_google_ads_report`
* **Widget**: `ui://widget/next-ai-insights.html`
* **Natural Prompt**: `How are our Google Ads campaigns performing? Show total ad spend, impressions, and conversions.`
* **Explicit Prompt**: `Execute get_google_ads_report to review active search campaign spend and conversion metrics.`

### 39. `get_integrations_status`
* **Widget**: `ui://widget/next-ai-insights.html`
* **Natural Prompt**: `Check the connection and sync status of all our marketing and analytics integrations.`
* **Explicit Prompt**: `Run get_integrations_status to verify which toolkits (Google Search Console, GA4, Clarity, Ads, Slack) are active and authenticated.`
