# CogNerd MCP Server

Production [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for [CogNerd](https://cognerd.ai) — AI Engine Optimization (AEO), Generative Engine Optimization (GEO), and Brand Visibility Intelligence.

Integrates directly with CogNerd's production REST API (`https://api.cognerd.in`), providing 39 tools and interactive embedded widgets for Claude, Cursor, ChatGPT, and NitroStudio.

---

## 🚀 Key Features

* **39 Production Tools**: Complete coverage of AI engine visibility, competitive benchmarking, citations, persona intelligence, automated audits, and content creation wizards.
* **Direct REST API Integration**: Calls `https://api.cognerd.in` directly without intermediate MCP hops.
* **Dynamic Per-Caller Authentication**: Zero hardcoded passwords or personal credentials stored on the server. Every request delegates the client's Bearer token directly to the upstream CogNerd API.
* **14 Interactive Next.js UI Widgets**: Rich UI components for visualizing brand visibility scores, competitor radars, prompt trays, and growth loops.
* **Fail-Closed Security**: Protected by `OAuthGuard` with audience and scope enforcement per RFC 8707 / RFC 6749.

---

## 🛠️ Tool Catalog (39 Tools)

### Metering: The CogNerd Run System (Runs, Briefs, Daily Tool Calls)
Per the **CogNerd Run System Specification**, usage is **not metered via an abstract credit pool**. Instead, it uses four concrete, named allowance units queried from `GET /me/usage` (`get_run_allowance`):
* **Runs (`runs.monthly`)**: End-to-end full brand analysis and scans (resets 1st of month 00:00 UTC).
* **Briefs (`briefs.blog.monthly`, `briefs.linkedin.monthly`, `briefs.x.monthly`)**: Content briefs by channel. Includes initial draft and up to 3 regenerations.
* **Daily Tool Calls (`tools.aeo_audit.daily`, `tools.geo_assets.daily`, `tools.llm_generation.daily`, `tools.carousel.daily`)**: Dedicated daily allowances for AI tools (resets 00:00 UTC).
* **Brands (`brands.max`)**: Account brand capacity limit.

---

### Free Intelligence & Telemetry Tools (32 Tools — 0 Allowances Consumed)
| Tool | Widget | Description |
| :--- | :--- | :--- |
| `whoami` | `/whoami` | Authenticated user identity, visible brands, granted scopes, and keyId |
| `get_run_allowance` | `/credit-balance` | **Primary Metering Tool**: Queries active run, brief, and daily tool call allowances |
| `get_credit_balance` | `/credit-balance` | Legacy compatibility tool (superseded by `get_run_allowance`) |
| `get_ai_insights` | `/ai-insights` | **Initial Tool**: Core brand visibility score, engine mix, citation metrics |
| `get_weak_prompts` | `/prompt-intelligence` | High-intent buyer prompts where brand is unranked or losing |
| `get_audience_personas` | `/audience-personas` | Target buyer personas and ICP segments |
| `get_prompt_intelligence`| `/prompt-intelligence` | Categorized search prompt trays (new / active / archived) |
| `get_ai_visibility` | `/ai-visibility` | Engine-by-engine visibility and rank breakdown |
| `get_citations` | `/citations` | Citation domain sources across AI engines |
| `get_competitive_intelligence` | `/competitive-intelligence` | Share-of-voice and competitor radar comparison |
| `get_scan_history` | `/scan-history` | Historical audit movement and visibility score trends |
| `get_ai_readiness_audit` | `/ai-readiness-audit` | AEO crawler readiness grade, technical audit findings |
| `get_geo_assets` | `/geo-assets` | Cached `llms.txt`, JSON-LD schema, and entity files |
| `get_agxp` | `/agxp` | AI Growth Experience loop score and stage recommendations |
| `get_content_studio` | `/content-studio` | Content briefs and optimization opportunities |
| `get_latest_aeo_report` | — | Most recent comprehensive AEO audit summary |
| `get_technical_diagnostics` | — | Crawler health, robots.txt, and latency diagnostics |
| `suggest_personas` | — | AI-generated buyer persona recommendations |
| `manage_competitors` | — | List and inspect tracked competitor domains |
| `get_carousel_deck` | — | Social carousel slide deck structure |
| `rerender_carousel` | — | Preview slide deck visual styles and layouts |
| `finalize_article_to_blog` | — | Blog post deployment pipeline |
| `repurpose_article_to_social` | — | Multi-platform social copy generation |
| `rewrite_content_paragraph` | — | Paragraph rewriter optimized for AI citation |
| `generate_standalone_social` | — | Standalone LinkedIn / X post draft generator |
| `get_backlinks_snapshot` | — | Domain backlink and referring domain telemetry |
| `get_search_console_report` | — | Google Search Console performance data |
| `list_search_console_sites` | — | List of connected Google Search Console sites |
| `get_ga4_traffic_report` | — | Google Analytics 4 traffic & session telemetry |
| `get_clarity_heatmaps` | — | Microsoft Clarity session & scroll depth metrics |
| `get_google_ads_report` | — | Google Ads campaign spend and conversion metrics |
| `get_integrations_status` | — | Connectivity status across all third-party integrations |

### Metered Action Tools (7 Tools)
| Tool | Metering Allowance | Description |
| :--- | :--- | :--- |
| `generate_geo_assets` | 1 daily tool call (`tools.geo_assets.daily`) | Generate production `llms.txt`, entity files, and JSON-LD schema |
| `trigger_aeo_audit` | 1 daily tool call (`tools.aeo_audit.daily`) | Queue a fresh live multi-engine AEO audit scan |
| `generate_icp` | 1 daily tool call (`tools.llm_generation.daily`) | Auto-generate tailored buyer ICP profiles and personas |
| `generate_linkedin_carousel` | 1 daily tool call (`tools.carousel.daily`) | Generate downloadable multi-slide LinkedIn PDF carousel |
| `start_guided_article_wizard` | 1 monthly brief (`briefs.blog.monthly`) | Launch guided long-form research and fact-grounded drafting |
| `run_article_wizard_step` | Included with active brief | Progress wizard through research, draft, and firewall check |
| `refresh_competitor_backlinks` | Competitor intelligence crawl | Refresh live backlink telemetry for brand and competitors |

---

## 📦 Getting Started

### Prerequisites
- Node.js >= 20.0.0
- npm >= 9.0.0

### Installation
```bash
git clone <repo-url>
cd cognerd-mcp
npm install
npm run install:all
```

### Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configuration variables:
```env
# Server Transport
NITRO_LOG_LEVEL=info
NITROSTACK_APP_MODE=universal
PORT=3000

# Security (Set to true in production)
OAUTH_REQUIRED=true

# Public endpoint of this server
RESOURCE_URI=https://your-mcp-server.app.nitrocloud.ai/mcp

# CogNerd Production REST API
COGNERD_API_BASE_URL=https://api.cognerd.in
COGNERD_REST_BASE_URL=https://api.cognerd.in
COGNERD_SCOPE=cognerd

# Dynamic Client Authentication:
# No server-side passwords or email credentials are required in .env.
# Clients provide their Bearer token dynamically on each request.
```

---

## 🏃 Running & Testing

### Development Mode (with hot-reload)
```bash
npm run dev
```

### Production Build & Start
```bash
npm run build
npm start
```

### Run Unit Tests
```bash
npm test
```

### Verify All 39 Live Tools (Zero Credit Consumption)
```bash
node scripts/verify-all-tools.js
```

---

## 🚢 Production Deployment

### Option 1: Deploy to NitroCloud
```bash
npx nitrostack-cli deploy
```

### Option 2: Deploy as a Node.js Service (Docker / VM)
1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Start the server with `NODE_ENV=production`:
   ```bash
   NODE_ENV=production npm run start:prod
   ```

---

## 🔒 Security & Client Authentication

* **No Credential Storage**: The server is stateless and never writes or caches user passwords.
* **Token Delegation**: When Claude, Cursor, or ChatGPT connects, pass your token in the standard HTTP header:
  ```http
  Authorization: Bearer <your_cognerd_token>
  ```
* **Guard Verification**: [OAuthGuard](file:///Users/admin/Desktop/sales-clients/cognerd/cognerd-mcp/src/guards/oauth.guard.ts) validates caller tokens against CogNerd and dynamically scopes all operations to that specific user's brand profile.
