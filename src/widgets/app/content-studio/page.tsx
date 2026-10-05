'use client';

import { useWidgetSDK, useWidgetState } from '@nitrostack/widgets';
import { WidgetShell, useColors } from '../../components/WidgetShell';
import { MetricCard, MetricGrid } from '../../components/MetricCard';
import { Card, GhostButton, Pill, PrimaryButton } from '../../components/ui';
import { asArray, formatDate } from '../../lib/theme';
import { useCognerdData } from '../../lib/useCognerdData';

export const dynamic = 'force-dynamic';

interface Brief {
    id: string;
    title: string;
    status: 'ready' | 'in_progress' | 'published' | 'gap';
    targetPrompt: string;
    gapScore: number;
    estimatedCitationLift: string;
    wordCount: number;
    persona: string;
    outline: string[];
    updatedAt: string;
}

interface StudioData {
    brand?: { name?: string };
    status?: string;
    counts?: { ready?: number; in_progress?: number; published?: number; gap?: number };
    briefs?: Array<Partial<Brief>>;
}

export default function ContentStudioWidget() {
    const { callTool, sendFollowUpMessage } = useWidgetSDK();
    const { isReady, data } = useCognerdData<StudioData>('/content-studio');
    const { c } = useColors();
    const [state, setState] = useWidgetState(() => ({ openId: '', filter: 'all' }));

    const filter = state?.filter ?? 'all';
    const rows = asArray(data?.briefs).filter((b) => (filter === 'all' ? true : b.status === filter));

    return (
        <WidgetShell
            category="AI optimization"
            title="Content"
            accent="Studio"
            subtitle="Turn visibility gaps into briefs and publish-ready articles built to be quoted in AI answers."
            isReady={isReady}
            hasData={!!data}
            actions={
                <PrimaryButton onClick={() => sendFollowUpMessage('Draft a new content brief from the largest visibility gap')}>
                    New brief
                </PrimaryButton>
            }
        >
            {data ? (
                <>
                    <MetricGrid>
                        <MetricCard label="Ready" value={data.counts?.ready} />
                        <MetricCard label="In progress" value={data.counts?.in_progress} />
                        <MetricCard label="Published" value={data.counts?.published} />
                        <MetricCard label="Gaps" value={data.counts?.gap} hint={data.brand?.name} />
                    </MetricGrid>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                        {['all', 'ready', 'in_progress', 'published', 'gap'].map((status) => (
                            <Pill
                                key={status}
                                active={filter === status}
                                onClick={() => {
                                    setState({ ...state, filter: status });
                                    if (status !== 'all') {
                                        callTool('get_content_studio', { status });
                                    } else {
                                        callTool('get_content_studio', {});
                                    }
                                }}
                            >
                                {status.replace('_', ' ')}
                            </Pill>
                        ))}
                    </div>

                    {rows.length === 0 ? (
                        <Card>
                            <p style={{ margin: 0, color: c.muted, fontSize: 13 }}>
                                No content briefs found matching the selected filter. Click &quot;New brief&quot; to generate a brief from your visibility gaps.
                            </p>
                        </Card>
                    ) : (
                        <div style={{ display: 'grid', gap: 8 }}>
                            {rows.map((brief) => {
                                const open = state?.openId === brief.id;
                                return (
                                    <Card key={brief.id}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                            <button
                                                type="button"
                                                onClick={() => setState({ ...state, openId: open ? '' : brief.id ?? '' })}
                                                style={{ all: 'unset', cursor: 'pointer', flex: 1 }}
                                            >
                                                <div style={{ fontWeight: 750 }}>{brief.title}</div>
                                                <div style={{ fontSize: 12, color: c.muted, marginTop: 4 }}>
                                                    {brief.targetPrompt}
                                                </div>
                                            </button>
                                            <Pill active={brief.status === 'ready' || brief.status === 'gap'}>
                                                {(brief.status ?? 'gap').replace('_', ' ')}
                                            </Pill>
                                        </div>
                                        <div
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(4, 1fr)',
                                                gap: 8,
                                                marginTop: 10,
                                                fontSize: 12,
                                            }}
                                        >
                                            <div>
                                                <div style={{ color: c.muted, fontSize: 10 }}>Gap</div>
                                                <div style={{ fontWeight: 700 }}>{brief.gapScore}</div>
                                            </div>
                                            <div>
                                                <div style={{ color: c.muted, fontSize: 10 }}>Lift</div>
                                                <div style={{ fontWeight: 700 }}>{brief.estimatedCitationLift}</div>
                                            </div>
                                            <div>
                                                <div style={{ color: c.muted, fontSize: 10 }}>Words</div>
                                                <div style={{ fontWeight: 700 }}>{brief.wordCount}</div>
                                            </div>
                                            <div>
                                                <div style={{ color: c.muted, fontSize: 10 }}>Persona</div>
                                                <div style={{ fontWeight: 700 }}>{brief.persona}</div>
                                            </div>
                                        </div>
                                        {open ? (
                                            <ol style={{ margin: '12px 0 0', paddingLeft: 18, fontSize: 13, color: c.muted }}>
                                                {asArray(brief.outline).map((item) => (
                                                    <li key={item}>{item}</li>
                                                ))}
                                            </ol>
                                        ) : null}
                                        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                                            <GhostButton onClick={() => callTool('get_ai_visibility', {})}>
                                                Related prompts
                                            </GhostButton>
                                            <span style={{ fontSize: 11, color: c.muted, alignSelf: 'center' }}>
                                                {formatDate(brief.updatedAt)}
                                            </span>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </>
            ) : null}
        </WidgetShell>
    );
}
