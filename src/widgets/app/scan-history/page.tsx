'use client';

import { useWidgetSDK } from '@nitrostack/widgets';
import { WidgetShell, useColors } from '../../components/WidgetShell';
import { MetricCard, MetricGrid } from '../../components/MetricCard';
import { Card, PrimaryButton, StatusDot } from '../../components/ui';
import { asArray, formatDate } from '../../lib/theme';
import { useCognerdData } from '../../lib/useCognerdData';

export const dynamic = 'force-dynamic';

interface ScanHistoryData {
    brand?: { name?: string };
    runs?: Array<{
        id: string;
        label: string;
        status: 'completed' | 'running' | 'failed' | 'queued';
        startedAt: string;
        completedAt: string | null;
        promptsRun: number;
        mentions: number;
        citations: number;
        visibilityScore: number;
        engines?: string[];
        delta?: number;
    }>;
    totalRuns?: number;
    completedRuns?: number;
    latestScore?: number | null;
}

const toneFor = (status: string): 'good' | 'watch' | 'gap' | 'neutral' => {
    if (status === 'completed') return 'good';
    if (status === 'running' || status === 'queued') return 'watch';
    if (status === 'failed') return 'gap';
    return 'neutral';
};

export default function ScanHistoryWidget() {
    const { callTool } = useWidgetSDK();
    const { isReady, data } = useCognerdData<ScanHistoryData>('/scan-history');
    const { c } = useColors();

    return (
        <WidgetShell
            category="Brand observability"
            title="Scan"
            accent="History"
            subtitle="How your brand’s AI visibility moves from one analysis to the next."
            isReady={isReady}
            hasData={!!data}
            actions={<PrimaryButton onClick={() => callTool('get_ai_insights', {})}>Open latest insights</PrimaryButton>}
        >
            {data ? (
                <>
                    <MetricGrid>
                        <MetricCard label="Completed runs" value={data.completedRuns} />
                        <MetricCard label="Total runs" value={data.totalRuns} />
                        <MetricCard
                            label="Latest score"
                            value={data.latestScore?.toFixed?.(1) ?? '—'}
                            hint={data.brand?.name}
                        />
                    </MetricGrid>

                    {data.completedRuns === 0 ? (
                        <Card>
                            <p style={{ margin: 0, color: c.muted }}>
                                No completed runs yet. Run an analysis to start building your history.
                            </p>
                        </Card>
                    ) : (
                        <div style={{ display: 'grid', gap: 8 }}>
                            {asArray(data.runs).map((run) => (
                                <Card key={run.id}>
                                    <button
                                        type="button"
                                        onClick={() => callTool('get_ai_insights', {})}
                                        style={{ all: 'unset', display: 'block', width: '100%', cursor: 'pointer' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                            <div>
                                                <div style={{ fontWeight: 750 }}>{run.label}</div>
                                                <div style={{ fontSize: 12, color: c.muted, marginTop: 3 }}>
                                                    {formatDate(run.startedAt)}
                                                    {run.completedAt ? ` → ${formatDate(run.completedAt)}` : ''}
                                                </div>
                                            </div>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                                <StatusDot tone={toneFor(run.status)} />
                                                {run.status}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(4, 1fr)',
                                                gap: 8,
                                                marginTop: 12,
                                                fontSize: 12,
                                            }}
                                        >
                                            <div>
                                                <div style={{ color: c.muted, fontSize: 10 }}>Score</div>
                                                <div style={{ fontWeight: 700 }}>
                                                    {run.status === 'completed' ? run.visibilityScore?.toFixed?.(1) ?? '—' : '—'}
                                                    {run.delta ? (
                                                        <span style={{ color: c.good, marginLeft: 6 }}>+{run.delta}</span>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ color: c.muted, fontSize: 10 }}>Prompts</div>
                                                <div style={{ fontWeight: 700 }}>{run.promptsRun || '—'}</div>
                                            </div>
                                            <div>
                                                <div style={{ color: c.muted, fontSize: 10 }}>Mentions</div>
                                                <div style={{ fontWeight: 700 }}>{run.mentions || '—'}</div>
                                            </div>
                                            <div>
                                                <div style={{ color: c.muted, fontSize: 10 }}>Citations</div>
                                                <div style={{ fontWeight: 700 }}>{run.citations || '—'}</div>
                                            </div>
                                        </div>
                                        <div style={{ marginTop: 8, fontSize: 11, color: c.muted }}>
                                            {asArray(run.engines).join(' · ')}
                                        </div>
                                    </button>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            ) : null}
        </WidgetShell>
    );
}
