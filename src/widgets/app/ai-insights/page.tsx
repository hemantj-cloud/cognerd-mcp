'use client';

import { useWidgetSDK, useWidgetState } from '@nitrostack/widgets';
import { WidgetShell, useColors } from '../../components/WidgetShell';
import { MetricCard, MetricGrid } from '../../components/MetricCard';
import { Bar, Card, GhostButton, Pill, PrimaryButton, SectionLabel, Sparkline } from '../../components/ui';
import { asArray, formatNumber } from '../../lib/theme';
import { useCognerdData } from '../../lib/useCognerdData';

export const dynamic = 'force-dynamic';

interface InsightsData {
    brand?: { name?: string; domain?: string };
    metrics?: {
        visibilityScore?: number;
        visibilityDelta?: number;
        totalMentions?: number;
        organicMentions?: number;
        seededMentions?: number;
        explicitMentions?: number;
        citations?: number;
        dropsDetected?: number;
    };
    trend?: Array<{ date?: string; score?: number; mentions?: number; citations?: number }>;
    byProvider?: Array<{ engine?: string; mentions?: number; citations?: number; share?: number }>;
    recentMentions?: Array<{
        id?: string;
        engine?: string;
        prompt?: string;
        type?: string;
        sentiment?: string;
        when?: string;
    }>;
}

export default function AiInsightsWidget() {
    const { callTool, sendFollowUpMessage, openExternal } = useWidgetSDK();
    const { isReady, data } = useCognerdData<InsightsData>('/ai-insights');
    const { c } = useColors();
    const [state, setState] = useWidgetState(() => ({ engine: 'All engines' }));

    const providers = asArray(data?.byProvider);
    const trend = asArray(data?.trend);
    const mentions = asArray(data?.recentMentions).filter((m) =>
        state?.engine === 'All engines' ? true : m?.engine === state?.engine,
    );

    return (
        <WidgetShell
            category="Brand observability"
            title="AI"
            accent="Insights"
            subtitle={
                data
                    ? `Track every mention, citation, and ranked position across AI engines · ${data.brand?.name ?? 'your brand'}`
                    : 'Track every mention, citation, and ranked position across AI engines.'
            }
            isReady={isReady}
            hasData={!!data}
            actions={
                <>
                    <GhostButton onClick={() => sendFollowUpMessage('Show scan history for this brand')}>
                        History
                    </GhostButton>
                    <PrimaryButton onClick={() => callTool('get_scan_history', {})}>Run analysis</PrimaryButton>
                </>
            }
        >
            {data ? (
                <>
                    <MetricGrid>
                        <MetricCard
                            label="Visibility score"
                            value={data.metrics?.visibilityScore?.toFixed?.(1) ?? '—'}
                            delta={data.metrics?.visibilityDelta != null ? `+${data.metrics.visibilityDelta}%` : undefined}
                            hint="Across 5 engines"
                        />
                        <MetricCard
                            label="Total mentions"
                            value={data.metrics?.totalMentions}
                            hint={`Organic ${formatNumber(data.metrics?.organicMentions)} · Seeded ${formatNumber(data.metrics?.seededMentions)}`}
                        />
                        <MetricCard
                            label="Explicit mentions"
                            value={data.metrics?.explicitMentions}
                            hint="Direct brand references"
                        />
                        <MetricCard
                            label="Citations"
                            value={data.metrics?.citations}
                            hint="Sourced from your domains"
                        />
                    </MetricGrid>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginBottom: 12 }}>
                        <Card>
                            <SectionLabel hint="Score, mentions & citations by day">Mentions over time</SectionLabel>
                            <div style={{ display: 'flex', gap: 12, marginBottom: 8, fontSize: 11, color: c.muted }}>
                                <span>● Score</span>
                                <span style={{ color: '#7C3AED' }}>● Mentions</span>
                                <span style={{ color: c.orange }}>● Citations</span>
                            </div>
                            <Sparkline values={trend.map((p) => p.score ?? 0)} />
                            <Sparkline values={trend.map((p) => p.mentions ?? 0)} color="#7C3AED" height={48} />
                        </Card>
                        <Card>
                            <SectionLabel hint="Explicit + implicit + citations">Mentions by provider</SectionLabel>
                            <div style={{ display: 'grid', gap: 10 }}>
                                {providers.map((p) => (
                                    <button
                                        key={p.engine}
                                        type="button"
                                        onClick={() => callTool('get_citations', { engine: p.engine })}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            padding: 0,
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            color: 'inherit',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                            <span style={{ fontWeight: 650 }}>{p.engine}</span>
                                            <span style={{ color: c.muted }}>{formatNumber(p.mentions)}</span>
                                        </div>
                                        <Bar value={(p.share ?? 0) * 100} />
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </div>

                    <Card>
                        <SectionLabel hint="Live stream from all engines">Recent mentions</SectionLabel>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                            {['All engines', ...providers.map((p) => p.engine ?? '').filter(Boolean)].map((engine) => (
                                <Pill
                                    key={engine}
                                    active={state?.engine === engine}
                                    onClick={() => setState({ ...state, engine })}
                                >
                                    {engine}
                                </Pill>
                            ))}
                        </div>
                        <div style={{ display: 'grid', gap: 8 }}>
                            {mentions.map((m) => (
                                <div
                                    key={m.id ?? `${m.engine}-${m.prompt}`}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '88px 1fr 72px 64px',
                                        gap: 8,
                                        fontSize: 12,
                                        padding: '8px 0',
                                        borderTop: `1px solid ${c.border}`,
                                    }}
                                >
                                    <strong>{m.engine}</strong>
                                    <span style={{ color: c.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {m.prompt}
                                    </span>
                                    <span style={{ textTransform: 'capitalize' }}>{m.type}</span>
                                    <span style={{ color: c.muted }}>{m.when}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 12 }}>
                            <GhostButton onClick={() => openExternal('https://app.cognerd.ai')}>
                                Open in CogNerd
                            </GhostButton>
                        </div>
                    </Card>
                </>
            ) : null}
        </WidgetShell>
    );
}
