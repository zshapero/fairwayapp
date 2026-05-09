import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      refetchOnWindowFocus: false,
    },
  },
});

export const queryKeys = {
  rounds: (playerId: number) => ['rounds', playerId] as const,
  round: (id: number) => ['round', id] as const,
  holeScores: (roundId: number) => ['hole-scores', roundId] as const,
  course: (id: number) => ['course', id] as const,
  tee: (id: number) => ['tee', id] as const,
  teeHoles: (teeId: number) => ['tee-holes', teeId] as const,
  snapshots: (playerId: number) => ['snapshots', playerId] as const,
  defaultPlayerId: ['default-player-id'] as const,
};
