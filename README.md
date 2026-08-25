# CogNerd MCP App (POC)

Mock MCP server for [CogNerd](https://cognerd.ai) — AI visibility intelligence and optimization. Tools return production-shaped mock data for the NitroStack workspace brand. Each tool renders a CogNerd-branded widget.

## Tools

| Tool | Widget | What it shows |
| --- | --- | --- |
| `get_ai_insights` | `/ai-insights` | Visibility score, mentions, citations, engine mix |
| `get_audience_personas` | `/audience-personas` | ICP inputs and buyer personas |
| `get_prompt_intelligence` | `/prompt-intelligence` | New / active buyer prompts |
| `get_ai_visibility` | `/ai-visibility` | Mention, citation, and position table |
| `get_citations` | `/citations` | Owned and third-party citation sources |
| `get_competitive_intelligence` | `/competitive-intelligence` | Share of voice and competitor radar |
| `get_scan_history` | `/scan-history` | Analysis runs and score movement |
| `get_ai_readiness_audit` | `/ai-readiness-audit` | AEO crawl score and findings |
| `get_geo_assets` | `/geo-assets` | llms.txt, schema, entity files |
| `get_agxp` | `/agxp` | AI Growth Experience loop |
| `get_content_studio` | `/content-studio` | Gap-driven content briefs |

`get_ai_insights` is the initial tool.

## Quick start

```bash
npm run dev
```

## Common commands

```bash
npm run build
npm start
npm run widget <command>
```

## NitroStudio

NitroStudio is the fastest way to preview widget output.

- Download: <https://nitrostack.ai/studio>

## Links

- Product: <https://cognerd.ai>
- Docs: <https://docs.nitrostack.ai>
- Widgets: <https://docs.nitrostack.ai/sdk/typescript/ui/widgets>
