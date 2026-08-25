'use client';

import { ORANGE } from '../lib/theme';
import { useColors } from './WidgetShell';
import type { CSSProperties, ReactNode } from 'react';

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
    const { c } = useColors();
    return (
        <div
            style={{
                background: c.card,
                border: `1px solid ${c.border}`,
                borderRadius: 14,
                padding: 14,
                ...style,
            }}
        >
            {children}
        </div>
    );
}

export function SectionLabel({ children, hint }: { children: ReactNode; hint?: string }) {
    const { c } = useColors();
    return (
        <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{children}</h2>
            {hint ? <span style={{ fontSize: 12, color: c.muted }}>{hint}</span> : null}
        </div>
    );
}

export function Pill({
    children,
    active,
    onClick,
}: {
    children: ReactNode;
    active?: boolean;
    onClick?: () => void;
}) {
    const { c } = useColors();
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                border: `1px solid ${active ? c.orange : c.border}`,
                background: active ? c.orangeSoft : 'transparent',
                color: active ? c.orange : c.ink,
                borderRadius: 999,
                padding: '6px 10px',
                fontSize: 12,
                fontWeight: 650,
                cursor: onClick ? 'pointer' : 'default',
            }}
        >
            {children}
        </button>
    );
}

export function PrimaryButton({
    children,
    onClick,
    disabled,
}: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            style={{
                background: ORANGE,
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
            }}
        >
            {children}
        </button>
    );
}

export function GhostButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
    const { c } = useColors();
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                background: 'transparent',
                color: c.ink,
                border: `1px solid ${c.border}`,
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 650,
                cursor: 'pointer',
            }}
        >
            {children}
        </button>
    );
}

export function StatusDot({ tone }: { tone: 'good' | 'watch' | 'gap' | 'neutral' }) {
    const { c } = useColors();
    const color =
        tone === 'good' ? c.good : tone === 'watch' ? c.warn : tone === 'gap' ? c.bad : c.muted;
    return (
        <span
            style={{
                width: 8,
                height: 8,
                borderRadius: 99,
                background: color,
                display: 'inline-block',
            }}
        />
    );
}

export function Bar({ value, max = 100, color }: { value?: number; max?: number; color?: string }) {
    const { c } = useColors();
    const safeValue = typeof value === 'number' ? value : 0;
    const safeMax = max || 100;
    const width = Math.max(4, Math.min(100, (safeValue / safeMax) * 100));
    return (
        <div style={{ height: 8, background: c.track, borderRadius: 99, overflow: 'hidden' }}>
            <div
                style={{
                    width: `${width}%`,
                    height: '100%',
                    background: color || c.orange,
                    borderRadius: 99,
                }}
            />
        </div>
    );
}

export function Sparkline({
    values,
    color,
    height = 72,
}: {
    values?: number[];
    color?: string;
    height?: number;
}) {
    const { c } = useColors();
    const points = Array.isArray(values) ? values.filter((v) => typeof v === 'number') : [];
    if (!points.length) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = max - min || 1;
    const pts = points
        .map((v, i) => {
            const x = (i / (points.length - 1 || 1)) * 100;
            const y = 100 - ((v - min) / span) * 100;
            return `${x},${y}`;
        })
        .join(' ');

    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }}>
            <polyline
                fill="none"
                stroke={color || c.orange}
                strokeWidth="2.4"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={pts}
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}

export function RadarChart({
    labels,
    series,
}: {
    labels?: string[];
    series?: Array<{ name?: string; color: string; values?: number[] }>;
}) {
    const { c, isDark } = useColors();
    const safeLabels = Array.isArray(labels) ? labels : [];
    const safeSeries = Array.isArray(series) ? series : [];
    const size = 220;
    const cx = size / 2;
    const cy = size / 2;
    const r = 82;
    const n = safeLabels.length || 1;
    const toXY = (i: number, value: number) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const rr = (value / 100) * r;
        return [cx + Math.cos(angle) * rr, cy + Math.sin(angle) * rr];
    };
    const rings = [25, 50, 75, 100];

    return (
        <svg width="100%" viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: 280 }}>
            {rings.map((ring) => (
                <polygon
                    key={ring}
                    fill="none"
                    stroke={c.border}
                    strokeWidth="1"
                    points={safeLabels
                        .map((_, i) => toXY(i, ring).join(','))
                        .join(' ')}
                />
            ))}
            {safeLabels.map((label, i) => {
                const [x, y] = toXY(i, 100);
                const [tx, ty] = toXY(i, 118);
                return (
                    <g key={label}>
                        <line x1={cx} y1={cy} x2={x} y2={y} stroke={c.border} />
                        <text
                            x={tx}
                            y={ty}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill={c.muted}
                            fontSize="9"
                            fontWeight="600"
                        >
                            {label}
                        </text>
                    </g>
                );
            })}
            {safeSeries.map((s) => (
                <polygon
                    key={s.name}
                    points={(s.values ?? []).map((v, i) => toXY(i, v ?? 0).join(',')).join(' ')}
                    fill={s.color}
                    fillOpacity={isDark ? 0.22 : 0.16}
                    stroke={s.color}
                    strokeWidth="2"
                />
            ))}
        </svg>
    );
}
