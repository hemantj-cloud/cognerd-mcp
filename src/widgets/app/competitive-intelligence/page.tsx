'use client';

import { useWidgetSDK, useWidgetState } from '@nitrostack/widgets';
import { WidgetShell, useColors } from '../../components/WidgetShell';
import { Card, GhostButton, PrimaryButton, RadarChart, SectionLabel, Sparkline } from '../../components/ui';
import { asArray, ORANGE } from '../../lib/theme';
import { useCognerdData } from '../../lib/useCognerdData';

export const dynamic = 'force-dynamic';

interface Competitor {
    id: string;
    name: string;
    domain: string;
    visibility: number;
    sentiment: number;
    shareOfVoice: number;
    velocity: number;
    authority: number;
    mentions30d: number;
}

interface CompetitiveData {
    brand?: { name?: string };
    you?: Partial<Competitor>;
    competitors?: Array<Partial<Competitor>>;
    dimensions?: string[];
    shareOfVoiceTrend?: Array<Record<string, string | number>>;
    trackedBrands?: number;
}

const COLORS = [ORANGE, '#2563EB', '#7C3AED', '#059669'];

export default function CompetitiveIntelligenceWidget() {
    const { sendFollowUpMessage } = useWidgetSDK();
    const { isReady, data } = useCognerdData<CompetitiveData>('/competitive-intelligence');
    const { c } = useColors();
    const [state, setState] = useWidgetState(() => ({ focus: 'comp-nitrostack' }));

    return (
        <WidgetShell
            category="AI visibility intelligence"
            title="Competitive"
            accent="Intelligence"
            subtitle="Share-of-voice, sentiment, and mention velocity across competitors."
            isReady={isReady}
            hasData={!!data}
            actions={
                <PrimaryButton onClick={() => sendFollowUpMessage('Add a competitor to the CogNerd tracking set')}>
                    + Add competitor
                </PrimaryButton>
            }
        >
            {data ? (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginBottom: 12 }}>
                        <Card>
                            <SectionLabel hint="Across visibility · sentiment · share · velocity · authority">
                                Competitive position
                            </SectionLabel>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <RadarChart
                                    labels={['Vis', 'Sent', 'Share', 'Vel', 'Auth']}
                                    series={asArray(data.competitors).map((comp, i) => ({
                                        name: comp.name,
                                        color: COLORS[i % COLORS.length],
                                        values: [
                                            comp.visibility ?? 0,
                                            comp.sentiment ?? 0,
                                            (comp.shareOfVoice ?? 0) * 2,
                                            comp.velocity ?? 0,
                                            comp.authority ?? 0,
                                        ],
                                    }))}
                                />
                            </div>
                        </Card>
                        <Card>
                            <SectionLabel hint="Last 30 days">Share of voice trend</SectionLabel>
                            <Sparkline
                                values={asArray(data.shareOfVoiceTrend).map((p) => Number(p.NitroStack ?? 0))}
                                height={88}
                            />
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8, fontSize: 11, color: c.muted }}>
                                {asArray(data.competitors).map((comp, i) => (
                                    <span key={comp.id} style={{ color: COLORS[i] }}>
                                        ● {comp.name} {comp.shareOfVoice}%
                                    </span>
                                ))}
                            </div>
                        </Card>
                    </div>

                    <SectionLabel hint={`${data.trackedBrands ?? 0} brands`}>Tracked brands</SectionLabel>
                    <div style={{ display: 'grid', gap: 8 }}>
                        {asArray(data.competitors).map((comp, i) => {
                            const selected = state?.focus === comp.id;
                            return (
                                <Card
                                    key={comp.id}
                                    style={{
                                        borderColor: selected ? COLORS[i] : c.border,
                                        cursor: 'pointer',
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setState({ ...state, focus: comp.id ?? '' })}
                                        style={{
                                            all: 'unset',
                                            display: 'block',
                                            width: '100%',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                            <div>
                                                <div style={{ fontWeight: 750 }}>{comp.name}</div>
                                                <div style={{ fontSize: 12, color: c.muted }}>{comp.domain}</div>
                                            </div>
                                            <div style={{ fontSize: 12, color: c.muted }}>
                                                {(comp.mentions30d ?? 0).toLocaleString()} mentions / 30d
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(5, 1fr)',
                                                gap: 8,
                                                marginTop: 10,
                                                fontSize: 12,
                                            }}
                                        >
                                            {[
                                                ['Visibility', comp.visibility],
                                                ['Sentiment', comp.sentiment],
                                                ['Share', comp.shareOfVoice],
                                                ['Velocity', comp.velocity],
                                                ['Authority', comp.authority],
                                            ].map(([label, value]) => (
                                                <div key={String(label)}>
                                                    <div style={{ color: c.muted, fontSize: 10 }}>{label}</div>
                                                    <div style={{ fontWeight: 700 }}>{value}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </button>
                                </Card>
                            );
                        })}
                    </div>
                    <div style={{ marginTop: 12 }}>
                        <GhostButton onClick={() => sendFollowUpMessage('Draft a conquest brief for the weakest comparison prompt')}>
                            Draft conquest brief
                        </GhostButton>
                    </div>
                </>
            ) : null}
        </WidgetShell>
    );
}
