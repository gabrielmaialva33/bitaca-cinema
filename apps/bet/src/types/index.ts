export interface Wallet {
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  last_daily_bonus: string | null;
  can_claim_bonus: boolean;
  next_bonus_in: number | null;
}

export interface Transaction {
  _id: string;
  user_id: string;
  transaction_type: 'deposit' | 'withdrawal' | 'bet_placed' | 'bet_won' | 'bet_lost' | 'daily_bonus' | 'signup_bonus';
  amount: number;
  balance_after: number;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface DailyBonusResponse {
  success: boolean;
  bonus_amount: number;
  new_balance: number;
  streak_days: number;
  next_bonus_at: string;
}

export interface Bet {
  _id: string;
  user_id: string;
  battle_id: string;
  bet_on: string;
  bet_amount: number;
  odds: number;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  result_amount: number | null;
  created_at: string;
  resolved_at: string | null;
}

export interface PlaceBetRequest {
  user_id: string;
  battle_id: string;
  bet_on: string;
  bet_amount: number;
}

export interface PlaceBetResponse {
  success: boolean;
  bet_id: string;
  new_balance: number;
  odds: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  balance: number;
  total_earned: number;
}
