'use client';

import { useWidgetSDK } from '@nitrostack/widgets';
import { WidgetShell, useColors } from '../../components/WidgetShell';
import { MetricCard, MetricGrid } from '../../components/MetricCard';
import { Card, GhostButton, PrimaryButton, SectionLabel } from '../../components/ui';
import { useCognerdData } from '../../lib/useCognerdData';

export const dynamic = 'force-dynamic';

interface AllowanceDetail {
    enabled?: boolean;
    used?: number;
    limit?: number | null;
    remaining?: number | null;
    periodStart?: string;
    periodEnd?: string;
}

interface RunSystemData {
    plan?: {
        code: string;
        name: string;
    };
    allowances?: {
        'runs.monthly'?: AllowanceDetail;
        'briefs.blog.monthly'?: AllowanceDetail;
        'briefs.linkedin.monthly'?: AllowanceDetail;
        'briefs.x.monthly'?: AllowanceDetail;
        'tools.aeo_audit.daily'?: AllowanceDetail;
        'tools.geo_assets.daily'?: AllowanceDetail;
        'tools.llm_generation.daily'?: AllowanceDetail;
        'tools.carousel.daily'?: AllowanceDetail;
        'brands.max'?: AllowanceDetail;
        [key: string]: AllowanceDetail | undefined;
    };
    runs?: {
        used?: number;
        limit?: number | null;
        remaining?: number | null;
    };
}

export default function RunAllowanceWidget() {
    const { callTool } = useWidgetSDK();
    const { isReady, data } = useCognerdData<RunSystemData>('/run-allowance', '/credit-balance');
    const { c, isDark } = useColors();

    const planName = data?.plan?.name ?? 'Partner Plan';
    const runs = data?.allowances?.['runs.monthly'] ?? data?.runs ?? {
        used: 0,
        limit: 15,
        remaining: 15,
    };
    const maxBrands = data?.allowances?.['brands.max'] ?? { used: 1, limit: 10, remaining: 9 };
    const aeoDaily = data?.allowances?.['tools.aeo_audit.daily'] ?? { used: 0, limit: 5, remaining: 5 };
    const geoDaily = data?.allowances?.['tools.geo_assets.daily'] ?? { used: 0, limit: 5, remaining: 5 };
    const briefsLi = data?.allowances?.['briefs.linkedin.monthly'] ?? { used: 0, limit: 50, remaining: 50 };

    const runsLimit = runs.limit ?? 15;
    const runsRemaining = runs.remaining ?? 15;
    const runsUsed = runs.used ?? 0;
    const runsPct = Math.min(100, Math.max(0, Math.round((runsRemaining / runsLimit) * 100)));

    return (
        <WidgetShell
            category="Workspace Quota"
            title="Run System"
            accent="Allowances"
            subtitle="Meters usage in runs, briefs, and daily tool calls per the CogNerd Run System specification."
            isReady={isReady}
            hasData={!!data}
            actions={
                <>
                    <GhostButton onClick={() => callTool('whoami', {})}>
                        Identity Profile
                    </GhostButton>
                    <PrimaryButton onClick={() => callTool('get_run_allowance', {})}>
                        Refresh Quotas
                    </PrimaryButton>
                </>
            }
        >
            {data ? (
                <>
                    {/* Hero Run Allowance Card */}
                    <Card
                        style={{
                            marginBottom: 14,
                            padding: '20px 18px',
                            background: isDark
                                ? 'linear-gradient(135deg, rgba(245, 130, 31, 0.12) 0%, rgba(22, 20, 18, 0.96) 100%)'
                                : 'linear-gradient(135deg, rgba(255, 241, 228, 0.85) 0%, #FFFFFF 100%)',
                            border: `1px solid ${isDark ? 'rgba(245, 130, 31, 0.35)' : '#F0DFD1'}`,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        letterSpacing: 1.2,
                                        textTransform: 'uppercase',
                                        color: c.muted,
                                        fontWeight: 700,
                                    }}
                                >
                                    Monthly End-to-End Runs
                                </div>
                                <div
                                    style={{
                                        fontSize: 42,
                                        fontWeight: 800,
                                        letterSpacing: '-0.04em',
                                        lineHeight: 1.1,
                                        marginTop: 4,
                                        color: c.orange,
                                    }}
                                >
                                    {runsRemaining}{' '}
                                    <span style={{ fontSize: 18, fontWeight: 650, color: c.ink }}>runs left</span>
                                </div>
                                <div style={{ marginTop: 6, fontSize: 13, color: c.muted }}>
                                    {runsUsed} consumed of {runsLimit} allocated runs this monthly period (resets 1st of month UTC)
                                </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        padding: '4px 10px',
                                        borderRadius: 999,
                                        background: c.orangeSoft,
                                        color: c.orange,
                                        border: `1px solid ${c.orange}`,
                                        letterSpacing: '0.03em',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Tier: {planName}
                                </span>
                                <div style={{ fontSize: 11, color: c.muted, marginTop: 8 }}>
                                    Brands: {maxBrands.used ?? 1} / {maxBrands.limit ?? 10}
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar Gauge */}
                        <div style={{ marginTop: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, color: c.muted }}>
                                <span>Run Capacity Gauge</span>
                                <span style={{ fontWeight: 650, color: c.ink }}>
                                    {runsRemaining} / {runsLimit} ({runsPct}% remaining)
                                </span>
                            </div>
                            <div
                                style={{
                                    height: 8,
                                    width: '100%',
                                    borderRadius: 999,
                                    background: isDark ? '#2A2622' : '#EDE6E0',
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    style={{
                                        height: '100%',
                                        width: `${runsPct}%`,
                                        background: c.orange,
                                        borderRadius: 999,
                                        transition: 'width 0.4s ease',
                                    }}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Breakdown Metric Grid */}
                    <MetricGrid>
                        <MetricCard
                            label="Daily AEO Audits"
                            value={`${aeoDaily.remaining ?? 5} / ${aeoDaily.limit ?? 5}`}
                            hint="Resets daily at 00:00 UTC"
                        />
                        <MetricCard
                            label="Daily GEO Assets"
                            value={`${geoDaily.remaining ?? 5} / ${geoDaily.limit ?? 5}`}
                            hint="Resets daily at 00:00 UTC"
                        />
                        <MetricCard
                            label="Monthly Briefs (LI)"
                            value={`${briefsLi.remaining ?? 50} / ${briefsLi.limit ?? 50}`}
                            hint="Resets on 1st of month"
                        />
                        <MetricCard
                            label="Brand Capacity"
                            value={`${maxBrands.used ?? 1} / ${maxBrands.limit ?? 10}`}
                            hint="Maximum brands on account"
                        />
                    </MetricGrid>

                    {/* Metering Unit Specifications */}
                    <Card style={{ marginTop: 14 }}>
                        <SectionLabel hint="CogNerd Run System v1.0">Metering Units Reference</SectionLabel>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 10 }}>
                            <div style={{ padding: 12, borderRadius: 8, background: isDark ? '#1C1917' : '#FAF6F2', border: `1px solid ${c.border}` }}>
                                <div style={{ fontWeight: 700, fontSize: 13, color: c.orange }}>End-to-End Run</div>
                                <div style={{ fontSize: 12, color: c.muted, marginTop: 4 }}>
                                    Full brand analysis (first scan, rescan, or weekly schedule). Consumes 1 from <code>runs.monthly</code>.
                                </div>
                            </div>
                            <div style={{ padding: 12, borderRadius: 8, background: isDark ? '#1C1917' : '#FAF6F2', border: `1px solid ${c.border}` }}>
                                <div style={{ fontWeight: 700, fontSize: 13, color: c.orange }}>Content Brief</div>
                                <div style={{ fontSize: 12, color: c.muted, marginTop: 4 }}>
                                    1 content brief per channel (Blog, LinkedIn, X). First draft included; up to 3 regenerations free.
                                </div>
                            </div>
                            <div style={{ padding: 12, borderRadius: 8, background: isDark ? '#1C1917' : '#FAF6F2', border: `1px solid ${c.border}` }}>
                                <div style={{ fontWeight: 700, fontSize: 13, color: c.orange }}>Paid AI Tools</div>
                                <div style={{ fontSize: 12, color: c.muted, marginTop: 4 }}>
                                    AEO audit, GEO assets, and carousel generation. Metered as 5 calls each per day, resetting at 00:00 UTC.
                                </div>
                            </div>
                        </div>
                    </Card>
                </>
            ) : null}
        </WidgetShell>
    );
}
