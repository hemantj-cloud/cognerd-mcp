'use client';

import { useWidgetSDK, useWidgetState } from '@nitrostack/widgets';
import { WidgetShell, useColors } from '../../components/WidgetShell';
import { MetricCard, MetricGrid } from '../../components/MetricCard';
import { Bar, Card, GhostButton, Pill, PrimaryButton, SectionLabel, Sparkline } from '../../components/ui';
import { asArray, formatPct } from '../../lib/theme';
import { useCognerdData } from '../../lib/useCognerdData';

export const dynamic = 'force-dynamic';

interface CitationsData {
    brand?: { name?: string };
    metrics?: {
        totalCitations?: number;
        sourceDomains?: number;
        ownedCitations?: number;
        citationCoverage?: number;
    };
    engine?: string;
    trend?: Array<{ date?: string; citations?: number }>;
    byEngine?: Array<{ engine?: string; citations?: number; mentions?: number }>;
    citations?: Array<{
        id?: string;
        engine?: string;
        sourceDomain?: string;
        sourceUrl?: string;
        owned?: boolean;
        prompt?: string;
        snippet?: string;
        date?: string;
    }>;
}

export default function CitationsWidget() {
    const { callTool, openExternal, sendFollowUpMessage } = useWidgetSDK();
    const { isReady, data } = useCognerdData<CitationsData>('/citations');
    const { c } = useColors();
    const [state, setState] = useWidgetState(() => ({ engine: 'all' }));

    return (
        <WidgetShell
            category="AI visibility intelligence"
            title="Citations"
            subtitle="Every source AI engines cite when they mention your brand, and which of your own pages get picked up."
            isReady={isReady}
            hasData={!!data}
            actions={
                <>
                    <GhostButton onClick={() => sendFollowUpMessage('Export citation sources for this brand')}>
                        Export
                    </GhostButton>
                    <PrimaryButton onClick={() => callTool('get_geo_assets', {})}>Improve coverage</PrimaryButton>
                </>
            }
        >
            {data ? (
                <>
                    <MetricGrid>
                        <MetricCard label="Total citations" value={data.metrics?.totalCitations} hint="Across all AI engines" />
                        <MetricCard label="Source domains" value={data.metrics?.sourceDomains} hint="Unique third-party + owned" />
                        <MetricCard label="Owned citations" value={data.metrics?.ownedCitations} hint="Your pages cited directly" />
                        <MetricCard
                            label="Citation coverage"
                            value={formatPct(data.metrics?.citationCoverage)}
                            hint="Mentions converted to citations"
                        />
                    </MetricGrid>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginBottom: 12 }}>
                        <Card>
                            <SectionLabel hint="Daily volume per analysis run">Citations over time</SectionLabel>
                            <Sparkline values={asArray(data.trend).map((p) => p.citations ?? 0)} />
                        </Card>
                        <Card>
                            <SectionLabel hint="Which engines originate citations">By engine</SectionLabel>
                            <div style={{ display: 'grid', gap: 8 }}>
                                {asArray(data.byEngine).map((e) => (
                                    <div key={e.engine}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                            <span>{e.engine}</span>
                                            <span style={{ color: c.muted }}>{e.citations}</span>
                                        </div>
                                        <Bar value={e.citations} max={120} />
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                        {['all', ...asArray(data.byEngine).map((e) => e.engine ?? '').filter(Boolean)].map((engine) => (
                            <Pill
                                key={engine}
                                active={(state?.engine ?? 'all') === engine}
                                onClick={() => {
                                    setState({ ...state, engine });
                                    callTool('get_citations', { engine });
                                }}
                            >
                                {engine === 'all' ? 'All engines' : engine}
                            </Pill>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gap: 8 }}>
                        {asArray(data.citations).map((cite) => (
                            <Card key={cite.id ?? cite.sourceUrl ?? cite.prompt}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 13 }}>{cite.sourceDomain}</div>
                                        <div style={{ fontSize: 12, color: c.muted, marginTop: 2 }}>
                                            {cite.engine} · {cite.prompt}
                                        </div>
                                    </div>
                                    <Pill active={cite.owned}>{cite.owned ? 'Owned' : 'Third-party'}</Pill>
                                </div>
                                <p style={{ fontSize: 13, color: c.muted, lineHeight: 1.45, margin: '10px 0 0' }}>
                                    “{cite.snippet}”
                                </p>
                                <div style={{ marginTop: 8 }}>
                                    <GhostButton onClick={() => openExternal(cite.sourceUrl ?? 'https://cognerd.ai')}>Open source</GhostButton>
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            ) : null}
        </WidgetShell>
    );
}
