# Category 6: Third-Party Telemetry & Integration Reports

These prompts test deep telemetry connectors: Google Search Console (clicks, impressions, queries), Google Analytics 4 (channels, AI referral shares), Microsoft Clarity (heatmaps, rage clicks, dead clicks), Google Ads, and third-party integration health.

> **Execution Note**: Each prompt is strictly scoped with single-tool execution constraints to ensure fast response times and prevent ChatGPT from rendering multiple redundant widgets.

---

## 34. `get_search_console_report`
Pulls live Google Search Console telemetry: organic clicks, impressions, CTR, and ranking queries for the brand domain.

* **Widget Returned**: `ui://widget/next-ai-insights.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string), `days` (number: default 30)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational with Single-Tool Constraint):**
```text
Show our Google Search Console performance for the last 30 days: total clicks, impressions, and top ranking queries. Call ONLY the get_search_console_report tool (do not execute any other tools).
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Execute ONLY the get_search_console_report tool with days=30 to inspect organic search telemetry and click-through rates. Do not call any other tools.
```

---

## 35. `list_search_console_sites`
Lists verified Google Search Console site properties connected to the workspace.

* **Widget Returned**: `ui://widget/next-ai-insights.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational with Single-Tool Constraint):**
```text
Which website domains and subdomains are verified in our connected Google Search Console account? Call ONLY the list_search_console_sites tool (do not execute any other tools).
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Call ONLY the list_search_console_sites tool to display all verified search console site URLs linked to our workspace. Do not call any other tools.
```

---

## 36. `get_ga4_traffic_report`
Retrieves Google Analytics 4 traffic channels, session lengths, user engagement, and AI assistant referral shares.

* **Widget Returned**: `ui://widget/next-ai-insights.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational with Single-Tool Constraint):**
```text
What is our web traffic breakdown from Google Analytics 4, and how much traffic is arriving from AI assistants? Call ONLY the get_ga4_traffic_report tool (do not execute any other tools).
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Run ONLY the get_ga4_traffic_report tool to inspect total users, session counts, channel attribution, and AI assistant referral percentages. Do not call any other tools.
```

---

## 37. `get_clarity_heatmaps`
Retrieves Microsoft Clarity user experience telemetry: scroll depth, rage clicks, dead clicks, and quick backs.

* **Widget Returned**: `ui://widget/next-ai-insights.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational with Single-Tool Constraint):**
```text
Show our Microsoft Clarity user experience stats: average scroll depth, rage clicks, and dead click rates. Call ONLY the get_clarity_heatmaps tool (do not execute any other tools).
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Use ONLY the get_clarity_heatmaps tool to pull behavioral UX telemetry and identify landing page friction points. Do not call any other tools.
```

---

## 38. `get_google_ads_report`
Retrieves paid search campaign performance, impressions, ad spend, and conversion cost metrics.

* **Widget Returned**: `ui://widget/next-ai-insights.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational with Single-Tool Constraint):**
```text
How are our Google Ads campaigns performing? Show total ad spend, impressions, and conversions. Call ONLY the get_google_ads_report tool (do not execute any other tools).
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Execute ONLY the get_google_ads_report tool to review active search campaign spend and conversion metrics. Do not call any other tools.
```

---

## 39. `get_integrations_status`
Checks connection and authentication status for all third-party toolkits (GSC, GA4, Clarity, Google Ads, LinkedIn, Slack, WordPress).

* **Widget Returned**: `ui://widget/next-ai-insights.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational with Single-Tool Constraint):**
```text
Check the connection and sync status of all our marketing and analytics integrations. Call ONLY the get_integrations_status tool (do not execute any other tools).
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Run ONLY the get_integrations_status tool to verify which toolkits (Google Search Console, GA4, Clarity, Ads, Slack) are active and authenticated. Do not call any other tools.
```
