'use client';

import { useWidgetSDK, useWidgetState } from '@nitrostack/widgets';
import { WidgetShell, useColors } from '../../components/WidgetShell';
import { MetricCard, MetricGrid } from '../../components/MetricCard';
import { Card, GhostButton, Pill, PrimaryButton, SectionLabel } from '../../components/ui';
import { asArray, formatNumber } from '../../lib/theme';
import { useCognerdData } from '../../lib/useCognerdData';

export const dynamic = 'force-dynamic';

interface OperationCost {
    name: string;
    cost: number;
    unit: string;
    description: string;
    isFree?: boolean;
}

interface CreditBalanceData {
    balance?: number;
    reserved?: number;
    draftArticleCost?: number;
    tier?: string;
    totalAllocated?: number;
    periodEnd?: string;
    autoRecharge?: boolean;
    operations?: OperationCost[];
}

const DEFAULT_OPERATIONS: OperationCost[] = [
    {
        name: 'Draft Article from Brief',
        cost: 30,
        unit: '30 credits / article',
        description: 'Research-grounded, fact-checked AI article with source citations. Charged only on success.',
        isFree: false,
    },
    {
        name: 'Baseline Brand Scan',
        cost: 50,
        unit: '50 credits / scan',
        description: 'Full multi-engine discovery across ChatGPT, Perplexity, Gemini, and Claude.',
        isFree: false,
    },
    {
        name: 'AEO Readiness Audit',
        cost: 0,
        unit: 'Free',
        description: 'Audit entity clarity, schema, chunking, and citation surface readiness.',
        isFree: true,
    },
    {
        name: 'Weak Prompts & Gap Discovery',
        cost: 0,
        unit: 'Free',
        description: 'Discover buyer queries where your brand is losing to competitors.',
        isFree: true,
    },
    {
        name: 'GEO Assets Generation',
        cost: 0,
        unit: 'Free',
        description: 'Generate llms.txt, JSON-LD, and entity files for AI crawlers.',
        isFree: true,
    },
    {
        name: 'Brand Memory & Context Recall',
        cost: 0,
        unit: 'Free',
        description: 'Durable brand preferences and history recall across conversations.',
        isFree: true,
    },
];

export default function CreditBalanceWidget() {
    const { callTool, sendFollowUpMessage } = useWidgetSDK();
    const { isReady, data } = useCognerdData<CreditBalanceData>('/credit-balance');
    const { c, isDark } = useColors();
    const [state, setState] = useWidgetState(() => ({ filter: 'all' }));

    const balance = data?.balance ?? 0;
    const reserved = data?.reserved ?? 0;
    const draftCost = data?.draftArticleCost ?? 0;
    const totalAllocated = data?.totalAllocated ?? (balance > 0 ? balance : 100);
    const tier = data?.tier ?? 'Standard';

    const pctRemaining = Math.min(100, Math.max(0, Math.round((balance / totalAllocated) * 100)));
    const operations = data?.operations?.length ? data.operations : DEFAULT_OPERATIONS;

    const filteredOperations = operations.filter((op) => {
        if (state?.filter === 'paid') return !op.isFree;
        if (state?.filter === 'free') return !!op.isFree;
        return true;
    });

    return (
        <WidgetShell
            category="Workspace Wallet"
            title="Credit"
            accent="Balance"
            subtitle="Compute tokens for AEO intelligence, content drafting, and baseline scans."
            isReady={isReady}
            hasData={!!data}
            actions={
                <>
                    <GhostButton onClick={() => callTool('whoami', {})}>
                        Account profile
                    </GhostButton>
                    <PrimaryButton onClick={() => callTool('get_credit_balance', {})}>
                        Refresh
                    </PrimaryButton>
                </>
            }
        >
            {data ? (
                <>
                    {/* Hero Balance Card */}
                    <Card
                        style={{
                            marginBottom: 14,
                            padding: '20px 18px',
                            background: isDark
                                ? 'linear-gradient(135deg, rgba(245, 130, 31, 0.12) 0%, rgba(22, 20, 18, 0.96) 100%)'
                                : 'linear-gradient(135deg, rgba(255, 241, 228, 0.85) 0%, #FFFFFF 100%)',
                            border: `1px solid ${isDark ? 'rgba(245, 130, 31, 0.35)' : '#F0DFD1'}`,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        letterSpacing: 1.2,
                                        textTransform: 'uppercase',
                                        color: c.muted,
                                        fontWeight: 700,
                                    }}
                                >
                                    Spendable balance
                                </div>
                                <div
                                    style={{
                                        fontSize: 42,
                                        fontWeight: 800,
                                        letterSpacing: '-0.04em',
                                        lineHeight: 1.1,
                                        marginTop: 4,
                                        color: c.orange,
                                    }}
                                >
                                    {formatNumber(balance)}{' '}
                                    <span style={{ fontSize: 18, fontWeight: 650, color: c.ink }}>credits</span>
                                </div>
                                <div style={{ marginTop: 6, fontSize: 13, color: c.muted }}>
                                    Equivalent to ~{Math.floor(balance / draftCost)} research-grounded AI draft articles
                                </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        padding: '4px 10px',
                                        borderRadius: 999,
                                        background: c.orangeSoft,
                                        color: c.orange,
                                        border: `1px solid ${c.orange}`,
                                        letterSpacing: '0.03em',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Tier: {tier}
                                </span>
                                <div style={{ fontSize: 11, color: c.muted, marginTop: 8 }}>
                                    Auto-recharge: {data.autoRecharge !== false ? 'Enabled' : 'Disabled'}
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar / Fuel Gauge */}
                        <div style={{ marginTop: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, color: c.muted }}>
                                <span>Monthly cycle allocation</span>
                                <span style={{ fontWeight: 650, color: c.ink }}>
                                    {balance} / {totalAllocated} ({pctRemaining}% remaining)
                                </span>
                            </div>
                            <div
                                style={{
                                    height: 8,
                                    width: '100%',
                                    borderRadius: 999,
                                    background: isDark ? '#2A2622' : '#EDE6E0',
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    style={{
                                        height: '100%',
                                        width: `${pctRemaining}%`,
                                        background: c.orange,
                                        borderRadius: 999,
                                        transition: 'width 0.4s ease',
                                    }}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Breakdown Metric Grid */}
                    <MetricGrid>
                        <MetricCard
                            label="Reserved compute"
                            value={`${reserved} cr`}
                            hint="Active in-flight tasks"
                        />
                        <MetricCard
                            label="Draft article cost"
                            value={`${draftCost} cr`}
                            hint="Charged only on success"
                        />
                        <MetricCard
                            label="Audits & telemetry"
                            value="0 cr"
                            hint="Always 100% free"
                        />
                        <MetricCard
                            label="Monthly cycle"
                            value={`${totalAllocated} cr`}
                            hint="Renews automatically"
                        />
                    </MetricGrid>

                    {/* Operation Catalog Filter */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                        <Pill
                            active={state?.filter === 'all'}
                            onClick={() => setState({ filter: 'all' })}
                        >
                            All operations ({operations.length})
                        </Pill>
                        <Pill
                            active={state?.filter === 'paid'}
                            onClick={() => setState({ filter: 'paid' })}
                        >
                            Credit-based
                        </Pill>
                        <Pill
                            active={state?.filter === 'free'}
                            onClick={() => setState({ filter: 'free' })}
                        >
                            Free tools
                        </Pill>
                    </div>

                    {/* Operations Pricing Catalog */}
                    <Card>
                        <SectionLabel hint="Standard pricing model">Operation pricing catalog</SectionLabel>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                            {filteredOperations.map((op, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: 10,
                                        padding: '10px 12px',
                                        borderRadius: 10,
                                        background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                                        border: `1px solid ${c.border}`,
                                    }}
                                >
                                    <div style={{ minWidth: 0, flex: '1 1 240px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 14, fontWeight: 700 }}>{op.name}</span>
                                            {op.isFree ? (
                                                <span
                                                    style={{
                                                        fontSize: 10,
                                                        padding: '1px 6px',
                                                        borderRadius: 4,
                                                        background: isDark ? 'rgba(52, 211, 153, 0.15)' : '#D1FAE5',
                                                        color: c.good,
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    FREE
                                                </span>
                                            ) : (
                                                <span
                                                    style={{
                                                        fontSize: 10,
                                                        padding: '1px 6px',
                                                        borderRadius: 4,
                                                        background: c.orangeSoft,
                                                        color: c.orange,
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {op.cost} CREDITS
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 12, color: c.muted, marginTop: 3 }}>
                                            {op.description}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: op.isFree ? c.good : c.orange }}>
                                            {op.unit}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Quick Action Footer */}
                    <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <PrimaryButton onClick={() => sendFollowUpMessage('Draft an article from my content brief')}>
                            Draft article (30 cr)
                        </PrimaryButton>
                        <GhostButton onClick={() => callTool('get_audit_report', {})}>
                            Run free AEO audit
                        </GhostButton>
                        <GhostButton onClick={() => sendFollowUpMessage('Show weak prompts for my brand')}>
                            Find weak prompts
                        </GhostButton>
                    </div>
                </>
            ) : null}
        </WidgetShell>
    );
}
