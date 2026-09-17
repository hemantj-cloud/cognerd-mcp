'use client';

import { useWidgetSDK, useWidgetState } from '@nitrostack/widgets';
import { WidgetShell, useColors } from '../../components/WidgetShell';
import { MetricCard, MetricGrid } from '../../components/MetricCard';
import { Card, GhostButton, Pill, PrimaryButton, SectionLabel } from '../../components/ui';
import { asArray, formatNumber } from '../../lib/theme';
import { useCognerdData } from '../../lib/useCognerdData';

export const dynamic = 'force-dynamic';

interface BrandInfo {
    id?: string;
    name?: string;
    url?: string;
    domain?: string;
    status?: string;
}

interface WhoamiData {
    user?: {
        id?: string;
        name?: string;
        email?: string;
        avatarUrl?: string;
    };
    brands?: BrandInfo[];
    scopes?: string[];
    credits?: {
        balance?: number;
        reserved?: number;
        draftArticleCost?: number;
    };
}

export default function WhoamiWidget() {
    const { callTool, sendFollowUpMessage, openExternal } = useWidgetSDK();
    const { isReady, data } = useCognerdData<WhoamiData>('/whoami');
    const { c, isDark } = useColors();
    const [state, setState] = useWidgetState(() => ({ tab: 'profile' }));

    const user = data?.user;
    const brands = asArray(data?.brands);
    const scopes = asArray(data?.scopes);
    const credits = data?.credits;

    const initials = user?.name
        ? user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
        : 'CN';

    return (
        <WidgetShell
            category="Identity & Session"
            title="Account"
            accent="Profile"
            subtitle={
                user?.email
                    ? `Authenticated as ${user.name || user.email} · Connected to CogNerd OAuth 2.1`
                    : 'Authenticated user, active brand workspaces, and token entitlements.'
            }
            isReady={isReady}
            hasData={!!data}
            actions={
                <>
                    <GhostButton onClick={() => callTool('get_credit_balance', {})}>
                        Credit balance
                    </GhostButton>
                    <PrimaryButton onClick={() => callTool('whoami', {})}>
                        Refresh
                    </PrimaryButton>
                </>
            }
        >
            {data ? (
                <>
                    {/* Top Stats Overview */}
                    <MetricGrid>
                        <MetricCard
                            label="Wallet balance"
                            value={credits?.balance != null ? formatNumber(credits.balance) : '410'}
                            hint="Spendable credits"
                        />
                        <MetricCard
                            label="Active brands"
                            value={brands.length || 1}
                            hint="Linked workspaces"
                        />
                        <MetricCard
                            label="Auth method"
                            value="OAuth 2.1"
                            hint="PKCE S256 protected"
                        />
                        <MetricCard
                            label="Draft cost"
                            value={credits?.draftArticleCost ? `${credits.draftArticleCost} cr` : '30 cr'}
                            hint="Per AI article"
                        />
                    </MetricGrid>

                    {/* Navigation Filter Pills */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                        <Pill
                            active={state?.tab === 'profile'}
                            onClick={() => setState({ tab: 'profile' })}
                        >
                            User profile
                        </Pill>
                        <Pill
                            active={state?.tab === 'brands'}
                            onClick={() => setState({ tab: 'brands' })}
                        >
                            Attached brands ({brands.length})
                        </Pill>
                        <Pill
                            active={state?.tab === 'scopes'}
                            onClick={() => setState({ tab: 'scopes' })}
                        >
                            Permissions ({scopes.length || 1})
                        </Pill>
                    </div>

                    {/* Tab 1: Profile View */}
                    {state?.tab === 'profile' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <Card
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: 16,
                                    background: isDark
                                        ? 'linear-gradient(135deg, rgba(245, 130, 31, 0.08) 0%, rgba(22, 20, 18, 0.95) 100%)'
                                        : 'linear-gradient(135deg, rgba(255, 241, 228, 0.7) 0%, #FFFFFF 100%)',
                                    border: `1px solid ${isDark ? 'rgba(245, 130, 31, 0.3)' : '#E7E0D8'}`,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                                    <div
                                        style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: '50%',
                                            background: c.orange,
                                            color: '#fff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 18,
                                            fontWeight: 750,
                                            letterSpacing: '-0.02em',
                                            boxShadow: '0 4px 12px rgba(245, 130, 31, 0.35)',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {initials}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 750 }}>
                                                {user?.name || 'CogNerd Partner'}
                                            </h2>
                                            <span
                                                style={{
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    padding: '2px 8px',
                                                    borderRadius: 999,
                                                    background: c.good,
                                                    color: '#fff',
                                                    letterSpacing: '0.04em',
                                                    textTransform: 'uppercase',
                                                }}
                                            >
                                                Active
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 13, color: c.muted, marginTop: 3 }}>
                                            {user?.email || 'partner@cognerd.ai'}
                                        </div>
                                        <div style={{ fontSize: 11, color: c.muted, marginTop: 2 }}>
                                            User ID: <code style={{ color: c.orange }}>{user?.id || 'usr-144'}</code>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 8 }}>
                                    <GhostButton onClick={() => sendFollowUpMessage('Show my weak prompts for this brand')}>
                                        Check prompts
                                    </GhostButton>
                                    <PrimaryButton onClick={() => callTool('get_ai_insights', {})}>
                                        View insights
                                    </PrimaryButton>
                                </div>
                            </Card>

                            {/* Wallet Summary Card */}
                            <Card>
                                <SectionLabel hint="Neuron tokens">Wallet summary</SectionLabel>
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                                        gap: 12,
                                        padding: '10px 0',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: 11, color: c.muted, textTransform: 'uppercase', fontWeight: 650 }}>
                                            Spendable balance
                                        </div>
                                        <div style={{ fontSize: 22, fontWeight: 750, color: c.orange, marginTop: 4 }}>
                                            {credits?.balance != null ? formatNumber(credits.balance) : '410'} <span style={{ fontSize: 13, fontWeight: 600 }}>credits</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: c.muted, textTransform: 'uppercase', fontWeight: 650 }}>
                                            Reserved in flight
                                        </div>
                                        <div style={{ fontSize: 22, fontWeight: 750, color: c.ink, marginTop: 4 }}>
                                            {credits?.reserved ?? 0} <span style={{ fontSize: 13, fontWeight: 600 }}>credits</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: c.muted, textTransform: 'uppercase', fontWeight: 650 }}>
                                            Draft article rate
                                        </div>
                                        <div style={{ fontSize: 22, fontWeight: 750, color: c.ink, marginTop: 4 }}>
                                            {credits?.draftArticleCost ?? 30} <span style={{ fontSize: 13, fontWeight: 600 }}>credits</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Tab 2: Attached Brands */}
                    {state?.tab === 'brands' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <SectionLabel hint="Workspaces associated with this token">
                                Brands accessible ({brands.length})
                            </SectionLabel>
                            {brands.map((brand, idx) => (
                                <Card
                                    key={brand.id || idx}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: 12,
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                        <div
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 10,
                                                background: isDark ? '#2A2622' : '#EDE6E0',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 750,
                                                color: c.orange,
                                                fontSize: 14,
                                            }}
                                        >
                                            {brand.name?.[0]?.toUpperCase() || 'B'}
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 15, fontWeight: 700 }}>{brand.name || 'Brand Workspace'}</span>
                                                <span
                                                    style={{
                                                        fontSize: 10,
                                                        padding: '1px 6px',
                                                        borderRadius: 4,
                                                        background: c.orangeSoft,
                                                        color: c.orange,
                                                        fontWeight: 650,
                                                    }}
                                                >
                                                    Default
                                                </span>
                                            </div>
                                            <div style={{ fontSize: 12, color: c.muted, marginTop: 2 }}>
                                                {brand.url || brand.domain || 'https://www.cognerd.ai'}
                                            </div>
                                            {brand.id && (
                                                <div style={{ fontSize: 10, color: c.muted, marginTop: 2, fontFamily: 'monospace' }}>
                                                    UUID: {brand.id}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <GhostButton onClick={() => callTool('get_weak_prompts', { brandId: brand.id })}>
                                            Weak prompts
                                        </GhostButton>
                                        <PrimaryButton onClick={() => callTool('get_ai_insights', { brandId: brand.id })}>
                                            Analyze
                                        </PrimaryButton>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Tab 3: Permissions & Scopes */}
                    {state?.tab === 'scopes' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <Card>
                                <SectionLabel hint="OAuth 2.1 Token claims">Granted scopes</SectionLabel>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                                    {scopes.map((scope) => (
                                        <span
                                            key={scope}
                                            style={{
                                                background: c.orangeSoft,
                                                border: `1px solid ${c.orange}`,
                                                color: c.orange,
                                                padding: '6px 12px',
                                                borderRadius: 8,
                                                fontSize: 13,
                                                fontWeight: 650,
                                                fontFamily: 'monospace',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                            }}
                                        >
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.orange }} />
                                            {scope}
                                        </span>
                                    ))}
                                </div>
                                <div style={{ marginTop: 14, fontSize: 12, color: c.muted, lineHeight: 1.5 }}>
                                    This bearer token grants execution rights for CogNerd AI search intelligence tools, brand monitoring, GEO asset generation, and content drafting.
                                </div>
                            </Card>

                            <Card>
                                <SectionLabel hint="Security & Auditing">Token Assurance</SectionLabel>
                                <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: c.muted }}>Protocol</span>
                                        <span style={{ fontWeight: 600 }}>OAuth 2.1 (RFC 6749 / RFC 6750)</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: c.muted }}>Proof Key</span>
                                        <span style={{ fontWeight: 600 }}>PKCE S256</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: c.muted }}>Issuer</span>
                                        <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>https://mcp.cognerd.in</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </>
            ) : null}
        </WidgetShell>
    );
}
