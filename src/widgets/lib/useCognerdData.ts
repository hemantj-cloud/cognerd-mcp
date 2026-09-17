'use client';

import { useWidgetSDK } from '@nitrostack/widgets';

export function useCognerdData<T>(_uri?: string): {
    isReady: boolean;
    data: T | undefined;
    live: boolean;
} {
    const { isReady, getToolOutput } = useWidgetSDK();
    const live = getToolOutput<T>();
    return {
        isReady,
        data: live ?? undefined,
        live: !!live,
    };
}
