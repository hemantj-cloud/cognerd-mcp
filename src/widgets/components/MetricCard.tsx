'use client';

import { formatNumber } from '../lib/theme';
import { useColors } from './WidgetShell';

interface MetricCardProps {
    label: string;
    value?: string | number | null;
    hint?: string;
    delta?: string;
    deltaPositive?: boolean;
}

export function MetricCard({ label, value, hint, delta, deltaPositive }: MetricCardProps) {
    const { c } = useColors();
    const display = typeof value === 'number' ? formatNumber(value) : value ?? '—';

    return (
        <div
            style={{
                background: c.card,
                border: `1px solid ${c.border}`,
                borderRadius: 14,
                padding: '14px 14px 12px',
                minWidth: 0,
            }}
        >
            <div
                style={{
                    fontSize: 10,
                    letterSpacing: 1.1,
                    textTransform: 'uppercase',
                    color: c.muted,
                    fontWeight: 650,
                    marginBottom: 8,
                }}
            >
                {label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <div style={{ fontSize: 28, fontWeight: 750, letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {display}
                </div>
                {delta ? (
                    <span style={{ fontSize: 12, fontWeight: 650, color: deltaPositive === false ? c.bad : c.good }}>
                        {delta}
                    </span>
                ) : null}
            </div>
            {hint ? (
                <div style={{ marginTop: 6, fontSize: 12, color: c.muted }}>{hint}</div>
            ) : null}
        </div>
    );
}

export function MetricGrid({ children }: { children: import('react').ReactNode }) {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 10,
                marginBottom: 14,
            }}
        >
            {children}
        </div>
    );
}
