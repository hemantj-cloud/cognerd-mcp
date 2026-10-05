# Category 5: Content Studio, Carousels & Guided Article Wizard

These prompts test the Content Studio creation engine: LinkedIn carousel generation, slide re-rendering, 4-step guided article wizard (outline -> research -> draft -> firewall), social repurposing, and entity-dense paragraph rewriting.

---

## 24. `get_content_studio`
Retrieves content briefs, published articles, and in-flight wizard projects from Content Studio.

* **Widget Returned**: `ui://widget/next-content-studio.html`
* **Required Parameters**: None
* **Optional Parameters**: `brandId` (string), `status` (string: "draft" | "published" | "all")

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
Open our Content Studio dashboard to see our recent content briefs and article projects.
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Execute get_content_studio with status="all" to inspect our full library of drafts, published articles, and carousel decks.
```

---

## 25. `generate_linkedin_carousel`
Generates a multi-slide LinkedIn carousel deck addressing a specific topic or buyer claim (consumes 1 `tools.carousel.daily` allowance).

* **Widget Returned**: `ui://widget/next-content-studio.html`
* **Required Parameters**: `topic` (string)
* **Optional Parameters**: `brandId` (string), `targetAudience` (string), `slideCount` (number), `theme` (string: "dark" | "light" | "brand" | "midnight")

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
Create a 5-slide dark-mode LinkedIn carousel deck explaining why enterprise MCP servers need cryptographic audit trails.
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Call generate_linkedin_carousel with topic="Why Enterprise MCP Servers Need Cryptographic Audit Trails", slideCount=5, and theme="dark".
```

---

## 26. `get_carousel_deck`
Retrieves slide copy, visual layout, and theme configuration for an existing carousel deck by ID.

* **Widget Returned**: `ui://widget/next-content-studio.html`
* **Required Parameters**: `deckId` (string)
* **Optional Parameters**: None

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
Fetch the slides and layout for carousel deck deck-1.
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Run get_carousel_deck with deckId="deck-1" to view the slide headlines, body copy, and theme settings.
```

---

## 27. `rerender_carousel`
Re-renders carousel slide designs after text or theme edits (free operation).

* **Widget Returned**: `ui://widget/next-content-studio.html`
* **Required Parameters**: `deckId` (string)
* **Optional Parameters**: `theme` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
Re-render carousel deck-1 with the brand color theme.
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Execute rerender_carousel with deckId="deck-1" and theme="brand" to update the slide styling.
```

---

## 28. `start_guided_article_wizard`
Initializes an AI-guided, research-grounded article project targeting a buyer prompt gap where competitors are cited (consumes 1 `briefs.blog.monthly` allowance).

* **Widget Returned**: `ui://widget/next-content-studio.html`
* **Required Parameters**: `targetPrompt` (string)
* **Optional Parameters**: `brandId` (string), `title` (string), `persona` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
Start a new guided article project targeting the buyer prompt "Best Enterprise Model Context Protocol Framework".
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Use start_guided_article_wizard with targetPrompt="Best Enterprise Model Context Protocol Framework", title="The Definitive Guide to Production MCP", and persona="Enterprise Platform Engineer".
```

---

## 29. `run_article_wizard_step`
Executes a specific step of the guided article wizard: `outline`, `research`, `draft`, or `firewall`.

* **Widget Returned**: `ui://widget/next-content-studio.html`
* **Required Parameters**: `projectId` (string), `step` (string: "outline" | "research" | "draft" | "firewall")
* **Optional Parameters**: None

### Ready-to-Execute Prompts

**Prompt Option A — Research Step (Explicit Tool Invocation):**
```text
Execute run_article_wizard_step with projectId="proj-1" and step="research" to pull verified citations and technical evidence.
```

**Prompt Option B — Draft Step (Explicit Tool Invocation):**
```text
Execute run_article_wizard_step with projectId="proj-1" and step="draft" to generate the complete article body.
```

**Prompt Option C — Firewall Check Step (Explicit Tool Invocation):**
```text
Execute run_article_wizard_step with projectId="proj-1" and step="firewall" to run citation grounding and fact validation.
```

---

## 30. `finalize_article_to_blog`
Finalizes an article project and publishes it to the brand blog document library.

* **Widget Returned**: `ui://widget/next-content-studio.html`
* **Required Parameters**: `projectId` (string)
* **Optional Parameters**: None

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
Finalize article project proj-1 and publish it to our blog.
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Call finalize_article_to_blog with projectId="proj-1" to complete the article workflow and save to the published library.
```

---

## 31. `repurpose_article_to_social`
Generates high-engagement LinkedIn posts and Twitter/X threads from an existing article or content project.

* **Widget Returned**: `ui://widget/next-content-studio.html`
* **Required Parameters**: `projectIdOrTopic` (string)
* **Optional Parameters**: None

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
Repurpose our latest article proj-1 into a LinkedIn post and a 5-tweet Twitter thread.
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Use repurpose_article_to_social with projectIdOrTopic="proj-1" to generate channel-optimized social copy.
```

---

## 32. `rewrite_content_paragraph`
AI rewrites a text section or paragraph for maximum answer-engine citation grounding, clarity, and entity density.

* **Widget Returned**: `ui://widget/next-content-studio.html`
* **Required Parameters**: `text` (string)
* **Optional Parameters**: `intent` (string), `brandContext` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
Rewrite this paragraph so that AI models like ChatGPT and Claude cite it as an authoritative definition:
"NitroStack makes building MCP servers fast with CLI and built-in security features."
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Call rewrite_content_paragraph with text="NitroStack is a framework for Model Context Protocol servers with OAuth and Docker deployment." and intent="answer_engine_grounding".
```

---

## 33. `generate_standalone_social`
Generates standalone social post copy (LinkedIn or X) on a given topic without creating a full project.

* **Widget Returned**: `ui://widget/next-content-studio.html`
* **Required Parameters**: `topic` (string)
* **Optional Parameters**: `platform` (string: "linkedin" | "twitter" | "x"), `tone` (string)

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational):**
```text
Write an authoritative LinkedIn thought leadership post about why AI agents require standardized MCP protocols instead of ad-hoc APIs.
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Execute generate_standalone_social with topic="Standardizing Agentic AI Infrastructure with MCP", platform="linkedin", and tone="thought_leadership".
```
