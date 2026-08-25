'use client';

import { useWidgetSDK, useWidgetState } from '@nitrostack/widgets';
import { WidgetShell, useColors } from '../../components/WidgetShell';
import { Card, GhostButton, Pill, PrimaryButton, SectionLabel } from '../../components/ui';
import { asArray, formatPct } from '../../lib/theme';
import { useCognerdData } from '../../lib/useCognerdData';

export const dynamic = 'force-dynamic';

interface PromptRecord {
    id: string;
    text: string;
    status: 'new' | 'active' | 'archived';
    personaName: string;
    intent: string;
    engines: string[];
    mentionRate: number;
    createdAt: string;
}

interface PromptData {
    brand?: { name?: string };
    status?: string;
    counts?: { new?: number; active?: number; archived?: number };
    prompts?: Array<Partial<PromptRecord>>;
    totalPrompts?: number;
}

export default function PromptIntelligenceWidget() {
    const { callTool, sendFollowUpMessage } = useWidgetSDK();
    const { isReady, data } = useCognerdData<PromptData>('/prompt-intelligence');
    const { c } = useColors();
    const [state, setState] = useWidgetState(() => ({ tab: 'active' as 'new' | 'active' }));

    const tab = state?.tab || 'active';
    const visible = asArray(data?.prompts).filter((p) => (data?.status === 'all' ? p.status === tab : true));

    return (
        <WidgetShell
            category="Brand observability"
            title="Prompt"
            accent="Intelligence"
            subtitle="Generate prompts in New, then move the ones you want into Active to monitor them."
            isReady={isReady}
            hasData={!!data}
            actions={
                <>
                    <GhostButton onClick={() => callTool('get_prompt_intelligence', { status: tab })}>
                        Refresh data
                    </GhostButton>
                    <PrimaryButton onClick={() => sendFollowUpMessage('Generate a new set of buyer prompts from saved brand data')}>
                        Generate prompts
                    </PrimaryButton>
                </>
            }
        >
            {data ? (
                <>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        {(['new', 'active'] as const).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => {
                                    setState({ ...state, tab: t });
                                    callTool('get_prompt_intelligence', { status: t });
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: `2px solid ${tab === t ? c.orange : 'transparent'}`,
                                    color: tab === t ? c.ink : c.muted,
                                    padding: '6px 4px',
                                    fontWeight: 750,
                                    cursor: 'pointer',
                                    textTransform: 'capitalize',
                                }}
                            >
                                {t} ({t === 'new' ? data.counts?.new ?? 0 : data.counts?.active ?? 0})
                            </button>
                        ))}
                    </div>

                    {visible && visible.length === 0 ? (
                        <Card>
                            <p style={{ margin: 0, color: c.muted, fontSize: 13 }}>
                                No {tab} prompts. Click Generate Prompts to build a set from your saved brand data.
                            </p>
                        </Card>
                    ) : (
                        <div style={{ display: 'grid', gap: 8 }}>
                            {visible?.map((p) => (
                                <Card key={p.id}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 14 }}>{p.text}</div>
                                            <div style={{ fontSize: 12, color: c.muted, marginTop: 4 }}>
                                                {p.personaName} · {p.intent}
                                            </div>
                                        </div>
                                        <PrimaryButton onClick={() => callTool('get_ai_visibility', {})}>
                                            View responses
                                        </PrimaryButton>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                                        {asArray(p.engines).map((e) => (
                                            <Pill key={e}>{e}</Pill>
                                        ))}
                                        {p.status === 'active' ? (
                                            <Pill active>{formatPct(p.mentionRate)} mention rate</Pill>
                                        ) : null}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    <Card style={{ marginTop: 12 }}>
                        <SectionLabel hint="Write a question your audience would ask an AI engine, then move it to Active.">
                            Add your own prompt
                        </SectionLabel>
                        <GhostButton onClick={() => sendFollowUpMessage('Add a custom prompt: What is the best tool for...')}>
                            + Add prompt
                        </GhostButton>
                    </Card>
                </>
            ) : null}
        </WidgetShell>
    );
}
