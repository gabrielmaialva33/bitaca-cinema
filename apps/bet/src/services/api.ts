import axios from 'axios';
import type { Wallet, Transaction, DailyBonusResponse, Bet, PlaceBetRequest, PlaceBetResponse, LeaderboardEntry } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.abitaca.com.br';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Wallet APIs
export const getWallet = async (userId: string): Promise<Wallet> => {
  const response = await api.get<Wallet>(`/api/coins/wallet?user_id=${userId}`);
  return response.data;
};

export const claimDailyBonus = async (userId: string): Promise<DailyBonusResponse> => {
  const response = await api.post<DailyBonusResponse>(`/api/coins/daily-bonus?user_id=${userId}`);
  return response.data;
};

export const getTransactions = async (
  userId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ transactions: Transaction[]; total_count: number; page: number; page_size: number }> => {
  const response = await api.get(`/api/coins/transactions`, {
    params: { user_id: userId, page, page_size: pageSize },
  });
  return response.data;
};

// Betting APIs
export const placeBet = async (request: PlaceBetRequest): Promise<PlaceBetResponse> => {
  const response = await api.post<PlaceBetResponse>('/api/coins/bet', request);
  return response.data;
};

export const getUserBets = async (userId: string, limit: number = 50): Promise<{ bets: Bet[]; count: number }> => {
  const response = await api.get(`/api/coins/bets`, {
    params: { user_id: userId, limit },
  });
  return response.data;
};

// Leaderboard API
export const getLeaderboard = async (limit: number = 100): Promise<{ entries: LeaderboardEntry[]; total_users: number }> => {
  const response = await api.get(`/api/coins/leaderboard`, {
    params: { limit },
  });
  return response.data;
};

export default api;
