# OAuth 2.1 Setup Guide — CogNerd MCP Server

This guide shows you **exactly** how to set up OAuth 2.1 authentication for the CogNerd MCP server from scratch — Auth0 configuration, environment setup, and end-to-end testing in NitroStudio.

## What You'll Learn

- How to configure Auth0 correctly (avoiding common pitfalls)
- How to set up the CogNerd MCP server environment
- How to test the complete OAuth flow in NitroStudio (Auth → OAuth 2.1 tab)
- How to troubleshoot common issues

---

## Quick Start with Auth0 (10 Minutes)

### Why Auth0?
- Free tier (7,000 active users, no credit card)
- Fastest setup (10 minutes)
- Production-ready when you need it

---

## Step 1: Create Auth0 Account

1. Go to **[auth0.com/signup](https://auth0.com/signup)**
2. Sign up for free (choose "Personal" plan)
3. Complete email verification

---

## Step 2: Create Auth0 API (Protected Resource)

**Do this first.** The API represents the CogNerd MCP server as a protected resource.

1. Go to **Applications** → **APIs** in the Auth0 Dashboard
2. Click **"Create API"**
3. Settings:
   ```
   Name: CogNerd MCP API
   Identifier: https://mcplocal
   Signing Algorithm: RS256
   ```

   **Critical notes:**
   - The **Identifier** can be any unique URI (doesn't need to be a real, resolvable URL)
   - For development, use `https://mcplocal` (simple and clear)
   - For production, use your actual deployed MCP URL
   - This **MUST** match `RESOURCE_URI` in your `.env` **EXACTLY**
   - **JWT Profile**: Select **RFC 9068** (OAuth 2.0 Access Token JWT Profile)
   - **RBAC**: Leave **disabled** for basic OAuth

4. Click **"Create"**
5. Go to the **Permissions** tab and add the CogNerd scopes:
   ```
   Scope             Description
   -----             -----------
   read:visibility   Read AI visibility data (insights, citations, scans)
   write:visibility  Write / trigger visibility operations
   admin             Administrative operations
   ```
6. Click **"Add"** for each scope, then **Save**

These three scopes must match `COGNERD_SCOPE` in your `.env` (`read:visibility write:visibility admin`).

---

## Step 3: Create Auth0 Application (OAuth Client)

**Application type matters** — this is where most setups go wrong.

1. Go to **Applications** → **Applications**
2. Click **"Create Application"**
3. Settings:
   ```
   Name: CogNerd MCP OAuth
   Application Type: Regular Web Application  ← CRITICAL!
   ```

   **Why "Regular Web Application"?**
   - NOT "Single Page Application" (SPA) — won't show in API authorization
   - NOT "Machine to Machine" — different flow, not compatible with Studio's OAuth tab
   - YES "Regular Web Application" — supports confidential clients with a client secret

4. Click **"Create"**
5. Go to **Settings** and configure:

   **Allowed Callback URLs** (both dev and prod transports):
   ```
   http://localhost:3005/auth/callback,http://localhost:3000/auth/callback
   ```
   - `3005`: dev mode (discovery HTTP server handles OAuth callbacks)
   - `3000`: prod mode (HTTP transport handles OAuth callbacks)

   **Allowed Logout URLs**:
   ```
   http://localhost:3005,http://localhost:3000
   ```

   **Allowed Web Origins**:
   ```
   http://localhost:3005,http://localhost:3000
   ```

6. Scroll to **Advanced Settings** → **Grant Types**:
   ```
   ✅ Authorization Code
   ✅ Refresh Token
   ❌ Implicit (deprecated in OAuth 2.1)
   ❌ Client Credentials (not needed here)
   ```

7. **Save Changes**
8. Copy the **Client ID** and **Client Secret** from the top of Settings — you'll need them for `.env`

---

## Step 4: Link Application to API

1. Go back to **Applications** → **APIs** → **CogNerd MCP API**
2. Open the **Machine to Machine Applications** (or **Authorized Applications**) tab
3. Find **CogNerd MCP OAuth** and toggle it **Authorized**
4. Select the scopes (`read:visibility`, `write:visibility`, `admin`) and save

---

## Step 5: Configure the CogNerd MCP Server

Copy `.env.example` to `.env` and fill in your Auth0 values:

```env
# Permissive dev mode — requests pass without a token; valid tokens still populate context.auth
OAUTH_REQUIRED=false

# MUST match the Auth0 API Identifier from Step 2 EXACTLY
RESOURCE_URI=https://mcplocal

# Your Auth0 tenant domain (from Step 3, with https://)
AUTH_SERVER_URL=https://dev-yourtenant.us.auth0.com

# JWKS signature verification (RFC 7517) — standard Auth0 path
JWKS_URI=https://dev-yourtenant.us.auth0.com/.well-known/jwks.json

# Must match RESOURCE_URI
TOKEN_AUDIENCE=https://mcplocal

# Auth0 domain WITH trailing slash
TOKEN_ISSUER=https://dev-yourtenant.us.auth0.com/

# From Step 3 (Application Settings)
OAUTH_ENABLE_CLIENT_REGISTRATION=true
OAUTH_CLIENT_ID=your_auth0_client_id
OAUTH_CLIENT_SECRET=your_auth0_client_secret

# CogNerd settings
COGNERD_API_BASE_URL=https://api.cognerd.ai
COGNERD_SCOPE=read:visibility write:visibility admin
COGNERD_CLIENT_ID=your_auth0_client_id
COGNERD_MOCK_MODE=true
```

The server validates this file at boot (fail-fast). If anything is missing or malformed, you'll get a clear `❌ FATAL` error listing exactly which variable failed.

---

## Step 6: Start the Server

```bash
npm run build
npm run dev
```

Expected startup diagnostics:

```
🚀 Starting CogNerd MCP Server (NitroStack)...
   Resource URI: https://mcplocal
   Auth Server:  https://dev-yourtenant.us.auth0.com
   Client ID:    your_auth0_client_id
   Scope:        read:visibility write:visibility admin
   PKCE Method:  S256
   Mock Mode:    ENABLED (Offline/Sandbox)
   OAuth Guard:  PERMISSIVE (Dev Mode)
```

---

## Step 7: Test the OAuth Flow in NitroStudio

### 7.1 Open Studio and Discover the OAuth Server

1. Open NitroStudio and connect to your CogNerd MCP server
2. Go to the **Auth → OAuth 2.1** tab
3. Click **Discover** — Studio fetches the protected-resource metadata from the server
4. Confirm the discovery shows:
   - **Resource**: `https://mcplocal`
   - **Authorization server**: your Auth0 domain
   - **Scopes supported**: `read:visibility`, `write:visibility`, `admin` (three separate entries — a single space-joined entry means the `COGNERD_SCOPE` split was missed)

### 7.2 Enter Client Credentials

- **Client ID**: your Auth0 Application Client ID
- **Client Secret**: your Auth0 Application Client Secret
- **Scopes**: `read:visibility write:visibility admin`

### 7.3 Start the OAuth Flow

1. Click **Authenticate** / **Start OAuth Flow**
2. A browser window opens to the Auth0 login page
3. Log in (or create a test user under **User Management** → **Users**)
4. Authorize the application
5. The browser redirects to `http://localhost:3005/auth/callback` (dev) and Studio receives the token

### 7.4 Verify the Token

In the Auth tab, confirm you have a **JWT** (three base64url segments separated by dots), not an opaque or JWE (encrypted, five-segment) token. If you see a JWE, see Troubleshooting below.

### 7.5 Test Protected Tools

1. Run any CogNerd tool (e.g. `get_ai_insights`) — it should execute and render its widget
2. Now set `OAUTH_REQUIRED=true` in `.env`, restart, and run a tool **without** authenticating — it must be rejected with:
   ```
   OAuth token required. Please authenticate in Studio (Auth → OAuth 2.1 tab) ...
   ```
3. Authenticate again and re-run — the tool succeeds and `context.auth` carries `sub`, `scopes`, and `client_id`

---

## How It Works

```
Client (Studio)                    CogNerd MCP Server                 Auth0
      │                                    │                            │
      │  1. Tool call + Bearer token       │                            │
      │ ───────────────────────────────►   │                            │
      │                            OAuthGuard.canActivate               │
      │                                    │  2. Fetch JWKS (cached)    │
      │                                    │ ────────────────────────►  │
      │                                    │  3. Verify signature,      │
      │                                    │     audience (RFC 8707),   │
      │                                    │     issuer, expiry, scopes │
      │                                    │  4. Populate context.auth  │
      │  5. Tool result + widget           │                            │
      │ ◄───────────────────────────────   │                            │
```

- `OAUTH_REQUIRED=false` (default): permissive — unauthenticated requests pass; valid tokens still populate `context.auth`
- `OAUTH_REQUIRED=true`: fail-closed — every tool call without a valid token is rejected
- PKCE: S256 only (RFC 7636); the `plain` method is hard-rejected
- Dynamic Client Registration (RFC 7591): served when `OAUTH_ENABLE_CLIENT_REGISTRATION=true`

---

## Troubleshooting

### "Token audience mismatch"
- `TOKEN_AUDIENCE` must equal `RESOURCE_URI`, and both must match the Auth0 **API Identifier** exactly (`https://mcplocal` in dev)
- Check for trailing slashes — Auth0 treats `https://mcplocal` and `https://mcplocal/` as different audiences

### "Token expired" / "Token validation failed"
- Auth0 access tokens default to 24h — re-authenticate in Studio
- Ensure your machine clock is accurate (JWT `exp`/`iat` checks are time-sensitive)
- If using a JWKS URI, confirm it is reachable: `curl $JWKS_URI` should return JSON with a `keys` array

### CORS / Callback URI mismatch
- The redirect URI Studio uses must appear **exactly** in the Auth0 Application's **Allowed Callback URLs** (`http://localhost:3005/auth/callback` for dev, `http://localhost:3000/auth/callback` for prod)
- Also add the bare origins to **Allowed Web Origins** and **Allowed Logout URLs**
- After changing Auth0 settings, wait ~30 seconds and retry

### "Received JWE (encrypted) token instead of JWT"
- You authenticated without an **audience** parameter. Always initiate the flow from Studio's OAuth 2.1 tab (it sends `audience=https://mcplocal`), so Auth0 returns a JWT for your API instead of an opaque/JWE token for `/userinfo`

### "Invalid token issuer"
- `TOKEN_ISSUER` must be your Auth0 domain **with a trailing slash**: `https://dev-yourtenant.us.auth0.com/`

### "Insufficient scope"
- The token lacks a scope required by a scope guard. Re-authenticate requesting `read:visibility write:visibility admin`, and confirm the scopes exist on the Auth0 API's **Permissions** tab

### "Port 3005 already in use"
```bash
lsof -ti:3005 | xargs kill -9
npm run dev
```

---

## Other OAuth Providers

Any RFC-compliant OAuth 2.1 provider works — point `AUTH_SERVER_URL`, `JWKS_URI`, `TOKEN_ISSUER`, and `TOKEN_AUDIENCE` at it:

- **Okta**: `https://<domain>.okta.com/oauth2/default` (JWKS at `/v1/keys`)
- **Keycloak**: `https://<host>/realms/<realm>` (JWKS at `/protocol/openid-connect/certs`)
- **Azure AD / Entra ID**: `https://login.microsoftonline.com/<tenant>/v2.0` (JWKS at `/discovery/v2.0/keys`)

---

## Pre-Flight Checklist

- [ ] Auth0 API created with Identifier `https://mcplocal` and RS256
- [ ] API Permissions include `read:visibility`, `write:visibility`, `admin`
- [ ] Auth0 Application is a **Regular Web Application**
- [ ] Callback URLs include both `localhost:3005` and `localhost:3000` variants
- [ ] Application authorized on the API with the three scopes
- [ ] `.env` `RESOURCE_URI` matches the API Identifier exactly
- [ ] `TOKEN_ISSUER` has a trailing slash
- [ ] `npm run build` exits cleanly
- [ ] Server starts with `OAuth Guard: PERMISSIVE (Dev Mode)`
- [ ] Studio discovery shows three separate `scopes_supported` entries
- [ ] With `OAUTH_REQUIRED=true`, unauthenticated tool calls are rejected
