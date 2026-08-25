'use client';

import { useWidgetSDK } from '@nitrostack/widgets';
import manifest from '../widget-manifest.json';

export function previewFor<T>(uri: string): T | undefined {
    const widget = manifest.widgets.find((item) => item.uri === uri);
    return widget?.examples?.[0]?.data as T | undefined;
}

export function useCognerdData<T>(uri: string): {
    isReady: boolean;
    data: T | undefined;
    live: boolean;
} {
    const { isReady, getToolOutput } = useWidgetSDK();
    const live = getToolOutput<T>();
    return {
        isReady,
        data: live ?? previewFor<T>(uri),
        live: !!live,
    };
}
