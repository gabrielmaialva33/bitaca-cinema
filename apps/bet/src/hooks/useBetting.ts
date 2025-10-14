import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { placeBet, getUserBets, getLeaderboard } from '../services/api';
import type { PlaceBetRequest } from '../types';

export const usePlaceBet = (userId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: PlaceBetRequest) => placeBet(request),
    onSuccess: () => {
      // Invalidate wallet and bets queries
      queryClient.invalidateQueries({ queryKey: ['wallet', userId] });
      queryClient.invalidateQueries({ queryKey: ['bets', userId] });
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
    },
  });
};

export const useUserBets = (userId: string | null, limit: number = 50) => {
  return useQuery({
    queryKey: ['bets', userId, limit],
    queryFn: () => getUserBets(userId!, limit),
    enabled: !!userId,
    refetchInterval: 10000, // Refetch every 10 seconds for live updates
  });
};

export const useLeaderboard = (limit: number = 100) => {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: () => getLeaderboard(limit),
    refetchInterval: 60000, // Refetch every minute
  });
};
