'use client';

import { useWidgetSDK, useWidgetState } from '@nitrostack/widgets';
import { WidgetShell, useColors } from '../../components/WidgetShell';
import { MetricCard, MetricGrid } from '../../components/MetricCard';
import { Bar, Card, GhostButton, PrimaryButton, SectionLabel } from '../../components/ui';
import { asArray, formatDate } from '../../lib/theme';
import { useCognerdData } from '../../lib/useCognerdData';

export const dynamic = 'force-dynamic';

interface AuditData {
    brand?: { name?: string; domain?: string };
    score?: number;
    grade?: string;
    crawledAt?: string;
    pagesCrawled?: number;
    categories?: Array<{ name?: string; score?: number }>;
    findings?: Array<{
        id?: string;
        category?: string;
        severity?: 'critical' | 'high' | 'medium' | 'low';
        title?: string;
        detail?: string;
        recommendation?: string;
        scoreImpact?: number;
    }>;
    critical?: number;
    high?: number;
}

const severityColor = (severity: string, c: ReturnType<typeof useColors>['c']) => {
    if (severity === 'critical') return c.bad;
    if (severity === 'high') return c.orange;
    if (severity === 'medium') return c.warn;
    return c.muted;
};

export default function AiReadinessAuditWidget() {
    const { callTool, sendFollowUpMessage } = useWidgetSDK();
    const { isReady, data } = useCognerdData<AuditData>('/ai-readiness-audit');
    const { c } = useColors();
    const [state, setState] = useWidgetState(() => ({ openId: '' }));

    return (
        <WidgetShell
            category="AI optimization"
            title="AI Readiness"
            accent="Audit"
            subtitle="Answer-readiness crawl: chunk structure, claim clarity, schema, and citation potential."
            isReady={isReady}
            hasData={!!data}
            actions={
                <>
                    <GhostButton onClick={() => sendFollowUpMessage('Re-run the AI readiness audit on the live site')}>
                        Re-crawl
                    </GhostButton>
                    <PrimaryButton onClick={() => callTool('get_geo_assets', {})}>Fix GEO assets</PrimaryButton>
                </>
            }
        >
            {data ? (
                <>
                    <MetricGrid>
                        <MetricCard label="Readiness score" value={data.score} hint={`Grade ${data.grade ?? '—'}`} />
                        <MetricCard label="Pages crawled" value={data.pagesCrawled} hint={formatDate(data.crawledAt)} />
                        <MetricCard label="Critical" value={data.critical} />
                        <MetricCard label="High" value={data.high} />
                    </MetricGrid>

                    <Card style={{ marginBottom: 12 }}>
                        <SectionLabel hint={data.brand?.domain}>Category scores</SectionLabel>
                        <div style={{ display: 'grid', gap: 10 }}>
                            {asArray(data.categories).map((cat) => (
                                <div key={cat.name}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                        <span>{cat.name}</span>
                                        <span style={{ fontWeight: 700 }}>{cat.score}</span>
                                    </div>
                                    <Bar value={cat.score} />
                                </div>
                            ))}
                        </div>
                    </Card>

                    <SectionLabel>Findings</SectionLabel>
                    <div style={{ display: 'grid', gap: 8 }}>
                        {asArray(data.findings).length === 0 ? (
                            <Card>
                                <p style={{ margin: 0, color: c.muted, fontSize: 13 }}>
                                    No audit findings recorded yet. Run an AI readiness audit to crawl and score your pages.
                                </p>
                            </Card>
                        ) : (
                            asArray(data.findings).map((f) => {
                                const open = state?.openId === f.id;
                                return (
                                    <Card key={f.id}>
                                        <button
                                            type="button"
                                            onClick={() => setState({ ...state, openId: open ? '' : f.id ?? '' })}
                                            style={{ all: 'unset', display: 'block', width: '100%', cursor: 'pointer' }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                                <div>
                                                    <div style={{ fontWeight: 750 }}>{f.title}</div>
                                                    <div style={{ fontSize: 12, color: c.muted, marginTop: 3 }}>
                                                        {f.category} · impact {f.scoreImpact}
                                                    </div>
                                                </div>
                                                <span
                                                    style={{
                                                        fontSize: 11,
                                                        fontWeight: 800,
                                                        textTransform: 'uppercase',
                                                        color: severityColor(f.severity ?? 'low', c),
                                                    }}
                                                >
                                                    {f.severity}
                                                </span>
                                            </div>
                                            {open ? (
                                                <div style={{ marginTop: 10, fontSize: 13, color: c.muted, lineHeight: 1.5 }}>
                                                    <p style={{ margin: '0 0 8px' }}>{f.detail}</p>
                                                    <p style={{ margin: 0 }}>
                                                        <strong style={{ color: c.ink }}>Fix: </strong>
                                                        {f.recommendation}
                                                    </p>
                                                </div>
                                            ) : null}
                                        </button>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </>
            ) : null}
        </WidgetShell>
    );
}
