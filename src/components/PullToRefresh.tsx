import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { MASTERS_GREEN } from '@/theme/colors';

/**
 * Returns a `<RefreshControl/>` props payload that invalidates the given
 * react-query keys (or all queries if none are provided), shows the spinner
 * for a brief beat, and fires a selection haptic on completion. Local
 * SQLite reads are essentially instant — the spinner is mostly for
 * affordance.
 */
export function useRefresh(
  keys?: readonly (readonly unknown[])[],
): {
  refreshing: boolean;
  refreshControl: React.JSX.Element;
} {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    if (keys === undefined) {
      await queryClient.invalidateQueries();
    } else {
      for (const key of keys) {
        await queryClient.invalidateQueries({ queryKey: key });
      }
    }
    // Brief delay so the spinner has a chance to be visible.
    await new Promise((resolve) => setTimeout(resolve, 350));
    Haptics.selectionAsync().catch(() => undefined);
    setRefreshing(false);
  }, [keys, queryClient]);

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={MASTERS_GREEN}
      colors={[MASTERS_GREEN]}
    />
  );
  return { refreshing, refreshControl };
}
