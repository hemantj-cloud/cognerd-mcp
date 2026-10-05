# OAuth 2.1 Integration Guide — CogNerd MCP Server

This guide explains how OAuth 2.1 authentication works with the live CogNerd MCP server and OAuth gateway, based on the **CogNerd MCP Partner Integration Kit**.

---

## 🧭 Overview & Live Endpoints

CogNerd exposes its product surface as a single MCP server with built-in OAuth 2.1. A compliant MCP client discovers everything at runtime without hard-coded secrets.

* **Live API Endpoint**: `https://api.cognerd.in`
* **OAuth Authorization Server**: `https://api.cognerd.in`
* **Transport**: Streamable HTTP MCP (POST /mcp)
* **Auth Method**: OAuth 2.1 with PKCE (S256) & Dynamic Client Registration (RFC 7591)
* **Client Type**: Public Client (`token_endpoint_auth_methods_supported: ["none"]`) — no client secret required.
* **Scope**: `cognerd` (the single supported scope)

> [!NOTE]
> Do not use any `*.ts.net` URL that may appear in internal notes — that is a private Tailscale hostname. The `api.cognerd.in` URL above is the official public one.

---

## 🔍 Discovery Metadata (RFC 8414 & RFC 9728)

The live CogNerd gateway provides runtime discovery:

### 1. Protected Resource Discovery
```http
GET https://api.cognerd.in/.well-known/oauth-protected-resource
```
```json
{
  "resource": "https://api.cognerd.in/mcp",
  "authorization_servers": ["https://api.cognerd.in"],
  "bearer_methods_supported": ["header"]
}
```

### 2. Authorization Server Discovery
```http
GET https://api.cognerd.in/.well-known/oauth-authorization-server
```
```json
{
  "issuer": "https://api.cognerd.in",
  "authorization_endpoint": "https://api.cognerd.in/authorize",
  "token_endpoint": "https://api.cognerd.in/token",
  "registration_endpoint": "https://api.cognerd.in/register",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "code_challenge_methods_supported": ["S256"],
  "token_endpoint_auth_methods_supported": ["none"],
  "scopes_supported": ["cognerd"]
}
```

---

## 🔐 Dynamic Authentication & Token Delegation

The server implements **zero-storage, dynamic per-caller authentication**:
- **Stateless Execution**: The server does not store user passwords or personal credentials in `.env`.
- **Client Token Forwarding**: Every incoming client request provides an `Authorization: Bearer <token>` header.
- **Upstream Delegation**: The MCP server dynamically extracts the caller's token in `extractToken(ctx)` and forwards it directly to `https://api.cognerd.in`.
- **Isolated User Context**: Each user operates strictly within their own workspace, brand profiles, and Run System allowances.

---

## ⚙️ Environment Configuration (`.env`)

```env
# =============================================================================
# NitroStack Server Transport Configuration
# =============================================================================
NITRO_LOG_LEVEL=info
NITROSTACK_APP_MODE=universal
PORT=3000
HOST=localhost

# =============================================================================
# OAuth 2.1 Configuration (CogNerd Native OAuth Gateway)
# =============================================================================
# Set OAUTH_REQUIRED=false for permissive dev mode, true for fail-closed production
OAUTH_REQUIRED=false

# Public identity of the MCP server
RESOURCE_URI=https://api.cognerd.in/mcp

# CogNerd Authorization Server URL
AUTH_SERVER_URL=https://api.cognerd.in

# Token validation audience & issuer
TOKEN_AUDIENCE=https://api.cognerd.in/mcp
TOKEN_ISSUER=https://api.cognerd.in

# Dynamic Client Registration (RFC 7591)
OAUTH_ENABLE_CLIENT_REGISTRATION=true

# =============================================================================
# CogNerd Specific Settings
# =============================================================================
COGNERD_API_BASE_URL=https://api.cognerd.in

# Scope: 'cognerd' is the single supported scope
COGNERD_SCOPE=cognerd

COGNERD_AUTH_URL=https://api.cognerd.in/authorize
COGNERD_TOKEN_URL=https://api.cognerd.in/token
COGNERD_REDIRECT_URI=http://localhost:3005/auth/callback

COGNERD_MOCK_MODE=false
```

---

## 🚀 How to Connect

### 1. Claude Desktop / claude.ai
* Go to **Connectors** → **Add**
* Name: `CogNerd`
* URL: `https://api.cognerd.in/mcp`
* The browser opens the CogNerd login page; sign in with the sandbox account (`nitrostack.sandbox@cognerd.ai` / `VDAPdpRAWFobUhyb`) and approve.

### 2. mcp-remote
```json
{
  "mcpServers": {
    "cognerd": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://api.cognerd.in/mcp"]
    }
  }
}
```

### 3. NitroStudio
1. Start the server: `npm run dev`
2. Open NitroStudio and connect to the local server or live endpoint.
3. Open the **Auth → OAuth 2.1** tab and click **Discover**.
4. Start the OAuth flow: log in with the sandbox credentials to authorize.

---

## 🔄 OAuth 2.1 Dance Details

```
Client                             CogNerd Gateway
  │                                       │
  │  1. GET /.well-known/oauth-protected-resource
  │ ─────────────────────────────────────►│
  │  2. GET /.well-known/oauth-authorization-server
  │ ─────────────────────────────────────►│
  │  3. POST /register (Dynamic Client Reg)
  │ ─────────────────────────────────────►│ ──► Returns client_id
  │  4. GET /authorize (PKCE S256 challenge + scope=cognerd)
  │ ─────────────────────────────────────►│ ──► User signs in (sandbox creds) & approves
  │  ◄── 302 redirect with ?code=... ──── │
  │  5. POST /token (code + code_verifier)
  │ ─────────────────────────────────────►│ ──► Returns { access_token, refresh_token }
  │  6. POST /mcp (Authorization: Bearer <access_token>)
  │ ─────────────────────────────────────►│ ──► MCP JSON-RPC
```
