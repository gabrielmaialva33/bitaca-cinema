import { useState, useEffect } from 'react';

interface BetChoice {
  battleId: string;
  rapper: string;
  amount: number;
  odds: number;
  timestamp: number;
  status: 'pending' | 'won' | 'lost';
}

const STORAGE_KEY = 'bitaca_bet_history';

export function useBettingHistory() {
  const [history, setHistory] = useState<BetChoice[]>([]);

  // Load history on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      }
    }
  }, []);

  // Save to localStorage whenever history changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
  }, [history]);

  const addBet = (bet: Omit<BetChoice, 'timestamp' | 'status'>) => {
    const newBet: BetChoice = {
      ...bet,
      timestamp: Date.now(),
      status: 'pending'
    };
    setHistory(prev => [newBet, ...prev]);
    return newBet;
  };

  const updateBetStatus = (battleId: string, status: 'won' | 'lost') => {
    setHistory(prev =>
      prev.map(bet =>
        bet.battleId === battleId ? { ...bet, status } : bet
      )
    );
  };

  const getPendingBets = () => {
    return history.filter(bet => bet.status === 'pending');
  };

  const getRecentChoices = (battleId: string) => {
    return history.find(bet => bet.battleId === battleId);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const getStats = () => {
    const total = history.length;
    const won = history.filter(b => b.status === 'won').length;
    const lost = history.filter(b => b.status === 'lost').length;
    const pending = history.filter(b => b.status === 'pending').length;

    const totalBet = history.reduce((sum, b) => sum + b.amount, 0);
    const totalWon = history
      .filter(b => b.status === 'won')
      .reduce((sum, b) => sum + (b.amount * b.odds), 0);

    return {
      total,
      won,
      lost,
      pending,
      winRate: total > 0 ? (won / (won + lost)) * 100 : 0,
      totalBet,
      totalWon,
      profit: totalWon - totalBet
    };
  };

  return {
    history,
    addBet,
    updateBetStatus,
    getPendingBets,
    getRecentChoices,
    clearHistory,
    getStats
  };
}
