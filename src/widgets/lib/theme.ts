export const COGNERD_LOGO = '/cognerd-logo.png';
export const COGNERD_LOGO_REMOTE =
    'https://cognerd.ai/_next/image?url=%2Fcompany-logo.png&w=96&q=75';

export const ORANGE = '#F5821F';
export const ORANGE_SOFT = '#FFF1E4';
export const ORANGE_DEEP = '#C45E0C';

export function palette(isDark: boolean) {
    return {
        orange: ORANGE,
        orangeSoft: isDark ? 'rgba(245, 130, 31, 0.16)' : ORANGE_SOFT,
        orangeDeep: ORANGE_DEEP,
        bg: isDark ? '#0B0B0B' : '#FCF8F5',
        card: isDark ? '#161412' : '#FFFFFF',
        ink: isDark ? '#F5F0EA' : '#1C1917',
        muted: isDark ? '#A8A29A' : '#78716C',
        border: isDark ? '#2A2622' : '#E7E0D8',
        good: isDark ? '#34D399' : '#059669',
        warn: isDark ? '#FBBF24' : '#D97706',
        bad: isDark ? '#F87171' : '#DC2626',
        track: isDark ? '#2A2622' : '#EDE6E0',
    };
}

export function asArray<T>(value: T[] | null | undefined): T[] {
    return Array.isArray(value) ? value : [];
}

export function formatNumber(value: number | null | undefined): string {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return new Intl.NumberFormat('en-US').format(value);
}

export function formatPct(value: number | null | undefined, alreadyPercent = false): string {
    if (value == null || Number.isNaN(Number(value))) return '—';
    const pct = alreadyPercent ? value : value * 100;
    return `${pct.toFixed(pct >= 10 ? 0 : 1)}%`;
}

export function formatDate(iso?: string | null): string {
    if (!iso) return '—';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}
