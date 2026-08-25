'use client';

import { useWidgetSDK, useWidgetState } from '@nitrostack/widgets';
import { WidgetShell, useColors } from '../../components/WidgetShell';
import { MetricCard, MetricGrid } from '../../components/MetricCard';
import { Bar, Card, PrimaryButton, StatusDot } from '../../components/ui';
import { useCognerdData } from '../../lib/useCognerdData';
import { asArray } from '../../lib/theme';

export const dynamic = 'force-dynamic';

interface AgxpData {
    brand?: { name?: string };
    loopScore?: number;
    lift30d?: string;
    stages?: Array<{
        id?: string;
        name?: string;
        description?: string;
        score?: number;
        status?: 'healthy' | 'watch' | 'gap';
        signals?: string[];
    }>;
}

const toolForStage: Record<string, { tool: string; args?: Record<string, unknown> }> = {
    's-connect': { tool: 'get_audience_personas' },
    's-presence': { tool: 'get_ai_insights' },
    's-prompts': { tool: 'get_prompt_intelligence', args: { status: 'active' } },
    's-gaps': { tool: 'get_competitive_intelligence' },
    's-publish': { tool: 'get_content_studio' },
    's-lift': { tool: 'get_scan_history' },
};

export default function AgxpWidget() {
    const { callTool } = useWidgetSDK();
    const { isReady, data } = useCognerdData<AgxpData>('/agxp');
    const { c } = useColors();
    const [state, setState] = useWidgetState(() => ({ openId: 's-presence' }));

    return (
        <WidgetShell
            category="AI optimization"
            title="AGXP"
            subtitle="The AI Growth Experience Platform layer — every signal in one measurable growth loop."
            isReady={isReady}
            hasData={!!data}
            actions={
                <PrimaryButton onClick={() => callTool('get_content_studio', { status: 'gap' })}>
                    Close the next gap
                </PrimaryButton>
            }
        >
            {data ? (
                <>
                    <MetricGrid>
                        <MetricCard label="Loop score" value={data.loopScore} hint={data.brand?.name} />
                        <MetricCard label="30-day lift" value="↑" hint={data.lift30d} />
                    </MetricGrid>

                    <div style={{ display: 'grid', gap: 8 }}>
                        {asArray(data.stages).map((stage, index) => {
                            const open = state?.openId === stage.id;
                            return (
                                <Card key={stage.id ?? `stage-${index}`}>
                                    <button
                                        type="button"
                                        onClick={() => setState({ ...state, openId: open ? '' : stage.id ?? '' })}
                                        style={{ all: 'unset', display: 'block', width: '100%', cursor: 'pointer' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                <div
                                                    style={{
                                                        width: 28,
                                                        height: 28,
                                                        borderRadius: 99,
                                                        background: c.orangeSoft,
                                                        color: c.orange,
                                                        display: 'grid',
                                                        placeItems: 'center',
                                                        fontWeight: 800,
                                                        fontSize: 12,
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 750 }}>{stage.name}</div>
                                                    <div style={{ fontSize: 12, color: c.muted }}>{stage.description}</div>
                                                </div>
                                            </div>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                                <StatusDot
                                                    tone={
                                                        stage.status === 'healthy'
                                                            ? 'good'
                                                            : stage.status === 'watch'
                                                              ? 'watch'
                                                              : 'gap'
                                                    }
                                                />
                                                {stage.score}
                                            </span>
                                        </div>
                                        <div style={{ marginTop: 10 }}>
                                            <Bar value={stage.score} />
                                        </div>
                                        {open ? (
                                            <ul style={{ margin: '10px 0 0', paddingLeft: 18, color: c.muted, fontSize: 12 }}>
                                                {asArray(stage.signals).map((s) => (
                                                    <li key={s}>{s}</li>
                                                ))}
                                            </ul>
                                        ) : null}
                                    </button>
                                    {open && stage.id && toolForStage[stage.id] ? (
                                        <div style={{ marginTop: 10 }}>
                                            <PrimaryButton
                                                onClick={() => {
                                                    const next = stage.id ? toolForStage[stage.id] : undefined;
                                                    if (!next) return;
                                                    callTool(next.tool, next.args ?? {});
                                                }}
                                            >
                                                Open this stage
                                            </PrimaryButton>
                                        </div>
                                    ) : null}
                                </Card>
                            );
                        })}
                    </div>
                </>
            ) : null}
        </WidgetShell>
    );
}
