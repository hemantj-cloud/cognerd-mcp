'use client';

export default function HomePage() {
    return (
        <div style={{ padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
            <h1 style={{ margin: '0 0 8px' }}>CogNerd widgets</h1>
            <p style={{ margin: '0 0 16px', color: '#78716C' }}>
                Open a widget route to preview it locally.
            </p>
            <ul>
                <li><a href="/ai-insights">AI Insights</a></li>
                <li><a href="/audience-personas">Audience Personas</a></li>
                <li><a href="/prompt-intelligence">Prompt Intelligence</a></li>
                <li><a href="/ai-visibility">AI Visibility</a></li>
                <li><a href="/citations">Citations</a></li>
                <li><a href="/competitive-intelligence">Competitive Intelligence</a></li>
                <li><a href="/scan-history">Scan History</a></li>
                <li><a href="/ai-readiness-audit">AI Readiness Audit</a></li>
                <li><a href="/geo-assets">GEO Assets</a></li>
                <li><a href="/agxp">AGXP</a></li>
                <li><a href="/whoami">User Identity & Workspace (/whoami)</a></li>
                <li><a href="/credit-balance">Credit Balance & Wallet (/credit-balance)</a></li>
                <li><a href="/content-studio">Content Studio</a></li>
            </ul>
        </div>
    );
}
