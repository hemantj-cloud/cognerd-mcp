'use client';

import { useWidgetSDK, useWidgetState } from '@nitrostack/widgets';
import { WidgetShell, useColors } from '../../components/WidgetShell';
import { MetricCard, MetricGrid } from '../../components/MetricCard';
import { Card, GhostButton, Pill, PrimaryButton } from '../../components/ui';
import { asArray, formatDate } from '../../lib/theme';
import { useCognerdData } from '../../lib/useCognerdData';

export const dynamic = 'force-dynamic';

interface GeoData {
    brand?: { name?: string; domain?: string };
    assets?: Array<{
        id: string;
        name: string;
        kind: string;
        status: 'published' | 'draft' | 'needs_refresh';
        path: string;
        updatedAt: string;
        citationLift: string;
        summary: string;
    }>;
    totalAssets?: number;
    published?: number;
    drafts?: number;
    needsRefresh?: number;
}

export default function GeoAssetsWidget() {
    const { openExternal, sendFollowUpMessage } = useWidgetSDK();
    const { isReady, data } = useCognerdData<GeoData>('/geo-assets');
    const { c } = useColors();
    const [state, setState] = useWidgetState(() => ({ filter: 'all' }));

    const rows = asArray(data?.assets).filter((a) =>
        state?.filter === 'all' ? true : a.status === state?.filter,
    );

    return (
        <WidgetShell
            category="AI optimization"
            title="GEO"
            accent="Assets"
            subtitle="llms.txt, structured data, and entity files so models can parse and cite you."
            isReady={isReady}
            hasData={!!data}
            actions={
                <PrimaryButton onClick={() => sendFollowUpMessage('Generate a missing GEO asset for this brand')}>
                    Generate asset
                </PrimaryButton>
            }
        >
            {data ? (
                <>
                    <MetricGrid>
                        <MetricCard label="Published" value={data.published} />
                        <MetricCard label="Drafts" value={data.drafts} />
                        <MetricCard label="Needs refresh" value={data.needsRefresh} />
                        <MetricCard label="Total" value={data.totalAssets} hint={data.brand?.domain} />
                    </MetricGrid>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                        {['all', 'published', 'draft', 'needs_refresh'].map((filter) => (
                            <Pill
                                key={filter}
                                active={(state?.filter ?? 'all') === filter}
                                onClick={() => setState({ ...state, filter })}
                            >
                                {filter.replace('_', ' ')}
                            </Pill>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gap: 8 }}>
                        {rows?.map((asset) => (
                            <Card key={asset.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                    <div>
                                        <div style={{ fontWeight: 750 }}>{asset.name}</div>
                                        <div style={{ fontSize: 12, color: c.muted, marginTop: 3 }}>
                                            {asset.path} · {formatDate(asset.updatedAt)}
                                        </div>
                                    </div>
                                    <Pill active={asset.status === 'published'}>{(asset.status ?? 'draft').replace('_', ' ')}</Pill>
                                </div>
                                <p style={{ fontSize: 13, color: c.muted, margin: '10px 0 8px' }}>{asset.summary}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 12, color: c.good, fontWeight: 700 }}>
                                        Citation lift {asset.citationLift}
                                    </span>
                                    <GhostButton
                                        onClick={() =>
                                            openExternal(`https://${data.brand?.domain ?? 'nitrostack.ai'}${asset.path ?? ''}`)
                                        }
                                    >
                                        Open
                                    </GhostButton>
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            ) : null}
        </WidgetShell>
    );
}
