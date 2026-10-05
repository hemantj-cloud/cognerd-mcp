'use client';

import { useWidgetSDK, useWidgetState } from '@nitrostack/widgets';
import { WidgetShell, useColors } from '../../components/WidgetShell';
import { Card, GhostButton, PrimaryButton, SectionLabel } from '../../components/ui';
import { useCognerdData } from '../../lib/useCognerdData';
import { asArray } from '../../lib/theme';

export const dynamic = 'force-dynamic';

interface Persona {
    id: string;
    initials: string;
    name: string;
    title: string;
    location: string;
    summary: string;
    painPoints: string[];
    goals: string[];
    promptsSeeded: number;
}

interface PersonasData {
    brand?: { name?: string };
    icp?: { teamSize?: string; budget?: string; salesCycle?: string; mustHaveTraits?: string };
    personas?: Array<Partial<Persona>>;
    totalPersonas?: number;
}

export default function AudiencePersonasWidget() {
    const { callTool, sendFollowUpMessage } = useWidgetSDK();
    const { isReady, data } = useCognerdData<PersonasData>('/audience-personas');
    const { c } = useColors();
    const [state, setState] = useWidgetState(() => ({ selectedId: '' }));

    return (
        <WidgetShell
            category="AI visibility intelligence"
            title="Audience"
            accent="Personas"
            subtitle={
                data
                    ? `Brand: ${data.brand?.name ?? 'your brand'} · Detected personas and ICP used to seed prompt scenarios.`
                    : 'Detected personas and ICP used to seed prompt scenarios.'
            }
            isReady={isReady}
            hasData={!!data}
            actions={
                <>
                    <GhostButton onClick={() => sendFollowUpMessage('Regenerate audience personas from the latest brand profile')}>
                        Regenerate
                    </GhostButton>
                    <PrimaryButton onClick={() => callTool('get_prompt_intelligence', { status: 'new' })}>
                        Seed prompts
                    </PrimaryButton>
                </>
            }
        >
            {data ? (
                <>
                    <Card style={{ marginBottom: 12 }}>
                        <SectionLabel hint="Add any business specifics to improve ICP quality.">Additional inputs</SectionLabel>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                            {[
                                ['TeamSize', data.icp?.teamSize ?? '—'],
                                ['Budget', data.icp?.budget ?? '—'],
                                ['SalesCycle', data.icp?.salesCycle ?? '—'],
                                ['MustHaveTraits', data.icp?.mustHaveTraits ?? '—'],
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    style={{
                                        border: `1px solid ${c.border}`,
                                        borderRadius: 10,
                                        padding: '8px 10px',
                                        background: c.bg,
                                    }}
                                >
                                    <div style={{ fontSize: 10, color: c.muted, fontWeight: 700, letterSpacing: 0.6 }}>{label}</div>
                                    <div style={{ fontSize: 12, marginTop: 4 }}>{value}</div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {asArray(data.personas).length === 0 ? (
                        <Card>
                            <p style={{ margin: 0, color: c.muted, fontSize: 13 }}>
                                No audience personas configured for this brand yet. Click Regenerate or Seed prompts to build audience personas.
                            </p>
                        </Card>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                            {asArray(data.personas).map((p) => {
                                const selected = state?.selectedId === p.id;
                                return (
                                    <Card
                                        key={p.id}
                                        style={{
                                            borderColor: selected ? c.orange : c.border,
                                            boxShadow: selected ? `0 0 0 1px ${c.orange}` : undefined,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <div
                                            onClick={() => setState({ ...state, selectedId: p.id ?? '' })}
                                            style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}
                                        >
                                            <div
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 99,
                                                    background: c.orangeSoft,
                                                    color: c.orange,
                                                    display: 'grid',
                                                    placeItems: 'center',
                                                    fontWeight: 800,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {p.initials ?? '—'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 750, fontSize: 14 }}>
                                                    The {p.location} {p.title}
                                                </div>
                                                <div style={{ fontSize: 12, color: c.muted, marginTop: 2 }}>
                                                    {p.name} · {p.promptsSeeded} prompts seeded
                                                </div>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: 13, color: c.muted, lineHeight: 1.5, margin: '12px 0' }}>{p.summary}</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                            <div>
                                                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Pain points</div>
                                                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: c.muted, lineHeight: 1.45 }}>
                                                    {asArray(p.painPoints).map((item) => (
                                                        <li key={item}>{item}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Goals</div>
                                                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: c.muted, lineHeight: 1.45 }}>
                                                    {asArray(p.goals).map((item) => (
                                                        <li key={item}>{item}</li>
                                                    ))}
                                                </ul>
                                            </div>
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
