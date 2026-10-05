# Category 6: Third-Party Telemetry & Integration Reports

These prompts test deep telemetry connectors: Google Search Console (clicks, impressions, queries), Google Analytics 4 (channels, AI referral shares), Microsoft Clarity (heatmaps, rage clicks, dead clicks), Google Ads, and third-party integration health.

---

## 34. `get_search_console_report`
Pulls live Google Search Console telemetry: organic clicks, impressions, CTR, and ranking queries for the brand domain.

* **Widget Returned**: `ui://widget/next-ai-insights.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string), `days` (number: default 30)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
Show our Google Search Console performance for the last 30 days: total clicks, impressions, and top ranking queries.
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Execute get_search_console_report with days=30 to inspect organic search telemetry and click-through rates.
```

---

## 35. `list_search_console_sites`
Lists verified Google Search Console site properties connected to the workspace.

* **Widget Returned**: `ui://widget/next-ai-insights.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
Which website domains and subdomains are verified in our connected Google Search Console account?
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Call list_search_console_sites to display all verified search console site URLs linked to our workspace.
```

---

## 36. `get_ga4_traffic_report`
Retrieves Google Analytics 4 traffic channels, session lengths, user engagement, and AI assistant referral shares.

* **Widget Returned**: `ui://widget/next-ai-insights.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
What is our web traffic breakdown from Google Analytics 4, and how much traffic is arriving from AI assistants?
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Run get_ga4_traffic_report to inspect total users, session counts, channel attribution, and AI assistant referral percentages.
```

---

## 37. `get_clarity_heatmaps`
Retrieves Microsoft Clarity user experience telemetry: scroll depth, rage clicks, dead clicks, and quick backs.

* **Widget Returned**: `ui://widget/next-ai-insights.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
Show our Microsoft Clarity user experience stats: average scroll depth, rage clicks, and dead click rates.
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Use get_clarity_heatmaps to pull behavioral UX telemetry and identify landing page friction points.
```

---

## 38. `get_google_ads_report`
Retrieves paid search campaign performance, impressions, ad spend, and conversion cost metrics.

* **Widget Returned**: `ui://widget/next-ai-insights.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
How are our Google Ads campaigns performing? Show total ad spend, impressions, and conversions.
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Execute get_google_ads_report to review active search campaign spend and conversion metrics.
```

---

## 39. `get_integrations_status`
Checks connection and authentication status for all third-party toolkits (GSC, GA4, Clarity, Google Ads, LinkedIn, Slack, WordPress).

* **Widget Returned**: `ui://widget/next-ai-insights.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
Check the connection and sync status of all our marketing and analytics integrations.
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Run get_integrations_status to verify which toolkits (Google Search Console, GA4, Clarity, Ads, Slack) are active and authenticated.
```
