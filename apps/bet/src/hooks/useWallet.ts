import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWallet, claimDailyBonus, getTransactions } from '../services/api';

export const useWallet = (userId: string | null) => {
  return useQuery({
    queryKey: ['wallet', userId],
    queryFn: () => getWallet(userId!),
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useDailyBonus = (userId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => claimDailyBonus(userId!),
    onSuccess: () => {
      // Invalidate wallet query to refresh balance
      queryClient.invalidateQueries({ queryKey: ['wallet', userId] });
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
    },
  });
};

export const useTransactions = (userId: string | null, page: number = 1) => {
  return useQuery({
    queryKey: ['transactions', userId, page],
    queryFn: () => getTransactions(userId!, page),
    enabled: !!userId,
  });
};
