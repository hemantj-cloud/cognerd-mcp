'use client';

import { useWidgetSDK, useWidgetState } from '@nitrostack/widgets';
import { WidgetShell, useColors } from '../../components/WidgetShell';
import { MetricCard, MetricGrid } from '../../components/MetricCard';
import { GhostButton, Pill, PrimaryButton, StatusDot } from '../../components/ui';
import { asArray, formatPct } from '../../lib/theme';
import { useCognerdData } from '../../lib/useCognerdData';

export const dynamic = 'force-dynamic';

interface VisibilityData {
    brand?: { name?: string };
    metrics?: {
        trackedPrompts?: number;
        mentionedIn?: number;
        mentionRate?: number;
        trendingUp?: number;
        avgPosition?: number | null;
    };
    filters?: { engine?: string; mentioned?: string };
    rows?: Array<{
        id: string;
        prompt: string;
        engine: string;
        mentioned: boolean;
        cited: boolean;
        position: number | null;
        mentions: number;
        sources: string[];
        createdAt: string;
    }>;
}

export default function AiVisibilityWidget() {
    const { callTool, sendFollowUpMessage } = useWidgetSDK();
    const { isReady, data } = useCognerdData<VisibilityData>('/ai-visibility');
    const { c } = useColors();
    const [state, setState] = useWidgetState(() => ({
        engine: 'all',
        mentioned: 'all',
    }));

    const apply = (next: { engine?: string; mentioned?: string }) => {
        const engine = next.engine ?? state?.engine ?? 'all';
        const mentioned = next.mentioned ?? state?.mentioned ?? 'all';
        setState({ ...state, engine, mentioned });
        callTool('get_ai_visibility', { engine, mentioned });
    };

    return (
        <WidgetShell
            category="Brand observability"
            title="AI"
            accent="Visibility"
            subtitle="Every prompt your brand competes in, ranked by impact."
            isReady={isReady}
            hasData={!!data}
            actions={
                <>
                    <GhostButton onClick={() => sendFollowUpMessage('Export the current AI visibility table as CSV')}>
                        Export CSV
                    </GhostButton>
                    <PrimaryButton onClick={() => callTool('get_prompt_intelligence', { status: 'active' })}>
                        Run prompts
                    </PrimaryButton>
                </>
            }
        >
            {data ? (
                <>
                    <MetricGrid>
                        <MetricCard label="Tracked prompts" value={data.metrics?.trackedPrompts} />
                        <MetricCard
                            label="Mentioned in"
                            value={data.metrics?.mentionedIn}
                            hint={`${formatPct(data.metrics?.mentionRate)} mention rate`}
                        />
                        <MetricCard label="Trending up" value={data.metrics?.trendingUp} />
                        <MetricCard label="Avg position" value={data.metrics?.avgPosition ?? '—'} />
                    </MetricGrid>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                        {['all', 'ChatGPT', 'Perplexity', 'Gemini', 'Claude'].map((engine) => (
                            <Pill key={engine} active={(state?.engine ?? 'all') === engine} onClick={() => apply({ engine })}>
                                {engine === 'all' ? 'All platforms' : engine}
                            </Pill>
                        ))}
                        {['all', 'mentioned', 'cited', 'not_mentioned'].map((mentioned) => (
                            <Pill
                                key={mentioned}
                                active={(state?.mentioned ?? 'all') === mentioned}
                                onClick={() => apply({ mentioned })}
                            >
                                {mentioned.replace('_', ' ')}
                            </Pill>
                        ))}
                    </div>

                    <div
                        style={{
                            background: c.card,
                            border: `1px solid ${c.border}`,
                            borderRadius: 14,
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1.6fr 0.6fr 0.5fr 0.5fr 0.5fr 1fr',
                                gap: 8,
                                padding: '10px 12px',
                                fontSize: 10,
                                letterSpacing: 0.8,
                                textTransform: 'uppercase',
                                color: c.muted,
                                fontWeight: 700,
                                borderBottom: `1px solid ${c.border}`,
                            }}
                        >
                            <span>AI response</span>
                            <span>Mentioned?</span>
                            <span>Cited?</span>
                            <span>Position</span>
                            <span>Mentions</span>
                            <span>Sources</span>
                        </div>
                        {asArray(data.rows).length === 0 ? (
                            <div style={{ padding: '32px 16px', textAlign: 'center', color: c.muted, fontSize: 13 }}>
                                No tracked prompts match the selected filter. Select &quot;All platforms&quot; or click &quot;Run prompts&quot; above to initiate a scan.
                            </div>
                        ) : (
                            asArray(data.rows).map((row) => (
                                <div
                                    key={row.id}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1.6fr 0.6fr 0.5fr 0.5fr 0.5fr 1fr',
                                        gap: 8,
                                        padding: '12px',
                                        fontSize: 12,
                                        borderBottom: `1px solid ${c.border}`,
                                        alignItems: 'center',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 650 }}>{row.prompt}</div>
                                        <div style={{ color: c.muted, marginTop: 2 }}>{row.engine}</div>
                                    </div>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <StatusDot tone={row.mentioned ? 'good' : 'gap'} />
                                        {row.mentioned ? 'Yes' : 'No'}
                                    </span>
                                    <span>{row.cited ? 'Yes' : 'No'}</span>
                                    <span>{row.position ?? '—'}</span>
                                    <span>{row.mentions}</span>
                                    <span style={{ color: c.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {asArray(row.sources).join(', ') || '—'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </>
            ) : null}
        </WidgetShell>
    );
}
