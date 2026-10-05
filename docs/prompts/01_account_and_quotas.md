# Category 1: Account, Auth & Run System Allowances

These prompts test user identity, workspace permissions, and the CogNerd Run System metering (runs, briefs, and daily tools).

> **Execution Note**: Each prompt is strictly scoped with single-tool execution constraints to ensure fast response times and prevent ChatGPT from rendering multiple redundant widgets.

---

## 1. `whoami`
Verifies current authenticated user, visible brands, granted scopes, and workspace run allowances.

* **Widget Returned**: `ui://widget/next-whoami.html`
* **Required Parameters**: None
* **Optional Parameters**: None

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational with Single-Tool Constraint):**
```text
Show my CogNerd account profile, active brands, and monthly run allowances. Call ONLY the whoami tool (do not execute any other tools).
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Using ONLY the whoami tool, verify my current authenticated session, brand workspace details, and active CogNerd Run System limits. Do not call any other tools.
```

---

## 2. `get_run_allowance`
Retrieves current run, brief, and daily tool call allowances and reset windows per the CogNerd Run System specification.

* **Widget Returned**: `ui://widget/next-run-allowance.html`
* **Required Parameters**: None
* **Optional Parameters**: None

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational with Single-Tool Constraint):**
```text
What are my remaining CogNerd monthly runs, content briefs, and daily AI tool quotas? Call ONLY the get_run_allowance tool (do not execute any other tools).
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Execute ONLY the get_run_allowance tool to display our complete CogNerd Run System allowance breakdown across runs.monthly, briefs.*.monthly, and tools.*.daily. Do not call any other tools.
```

---

## 3. `get_credit_balance` (Legacy Compatibility)
Checks active allowance status for the authenticated workspace (kept for backward compatibility with legacy credit callers). Automatically routes to the Run System allowance model.

* **Widget Returned**: `ui://widget/next-run-allowance.html`
* **Required Parameters**: None
* **Optional Parameters**: None

### Ready-to-Execute Prompts

**Prompt Option A (Natural Conversational with Single-Tool Constraint):**
```text
Check my workspace credit balance and quota status. Call ONLY the get_credit_balance tool (do not execute any other tools).
```

**Prompt Option B (Explicit Tool Invocation):**
```text
Call ONLY the get_credit_balance tool to verify backward-compatible quota reporting for our workspace. Do not call any other tools.
```
