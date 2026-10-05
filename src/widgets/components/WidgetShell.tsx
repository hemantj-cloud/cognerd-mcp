'use client';

import { useMaxHeight, useTheme } from '@nitrostack/widgets';
import { COGNERD_LOGO, COGNERD_LOGO_REMOTE, palette } from '../lib/theme';
import { useState, type CSSProperties, type ReactNode } from 'react';

interface WidgetShellProps {
    category: string;
    title: string;
    accent?: string;
    subtitle?: string;
    isReady: boolean;
    hasData: boolean;
    actions?: ReactNode;
    children?: ReactNode;
}

export function WidgetShell({
    category,
    title,
    accent,
    subtitle,
    isReady,
    hasData,
    actions,
    children,
}: WidgetShellProps) {
    const theme = useTheme();
    const maxHeight = useMaxHeight();
    const isDark = theme === 'dark';
    const c = palette(isDark);
    const [logoSrc, setLogoSrc] = useState(COGNERD_LOGO);

    const shell: CSSProperties = {
        background: c.bg,
        color: c.ink,
        minHeight: 420,
        maxHeight: maxHeight || 720,
        overflow: 'auto',
        fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    };

    return (
        <div style={shell}>
            <header
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 8,
                    background: isDark ? 'rgba(11,11,11,0.92)' : 'rgba(252,248,245,0.94)',
                    backdropFilter: 'blur(10px)',
                    borderBottom: `1px solid ${c.border}`,
                    padding: '14px 16px 12px',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <img
                            src={logoSrc}
                            alt="CogNerd"
                            width={32}
                            height={28}
                            onError={() => setLogoSrc(COGNERD_LOGO_REMOTE)}
                            style={{
                                width: 32,
                                height: 28,
                                objectFit: 'contain',
                                flexShrink: 0,
                            }}
                        />
                        <div style={{ minWidth: 0 }}>
                            <div
                                style={{
                                    fontSize: 10,
                                    letterSpacing: 1.4,
                                    textTransform: 'uppercase',
                                    color: c.muted,
                                    fontWeight: 600,
                                }}
                            >
                                {category}
                            </div>
                            <h1
                                style={{
                                    margin: '2px 0 0',
                                    fontSize: 20,
                                    fontWeight: 750,
                                    letterSpacing: '-0.03em',
                                    lineHeight: 1.15,
                                }}
                            >
                                {title}{' '}
                                {accent ? <span style={{ color: c.orange }}>{accent}</span> : null}
                            </h1>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {actions}
                    </div>
                </div>
                {subtitle ? (
                    <p style={{ margin: '8px 0 0', fontSize: 13, color: c.muted, lineHeight: 1.45 }}>
                        {subtitle}
                    </p>
                ) : null}
            </header>

            <div style={{ padding: 16 }}>
                {!hasData ? (
                    <div
                        style={{
                            padding: '48px 16px',
                            textAlign: 'center',
                            color: c.muted,
                            background: c.card,
                            border: `1px solid ${c.border}`,
                            borderRadius: 14,
                        }}
                    >
                        {isReady ? 'No data received from the host.' : 'Connecting to CogNerd…'}
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
}

export function useColors() {
    const theme = useTheme();
    const isDark = theme === 'dark';
    return { isDark, c: palette(isDark) };
}
