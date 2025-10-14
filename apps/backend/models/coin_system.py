"""
Coin System Models
Models for virtual currency, wallets, transactions, and daily bonuses
"""

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class TransactionType(str, Enum):
    """Transaction types"""
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    BET_PLACED = "bet_placed"
    BET_WON = "bet_won"
    BET_LOST = "bet_lost"
    DAILY_BONUS = "daily_bonus"
    SIGNUP_BONUS = "signup_bonus"


class UserWallet(BaseModel):
    """User wallet model"""
    user_id: str = Field(..., description="Firebase user ID")
    balance: int = Field(default=1000, ge=0, description="Current coin balance")
    total_earned: int = Field(default=1000, ge=0, description="Total coins earned")
    total_spent: int = Field(default=0, ge=0, description="Total coins spent")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CoinTransaction(BaseModel):
    """Coin transaction model"""
    user_id: str = Field(..., description="Firebase user ID")
    transaction_type: TransactionType
    amount: int = Field(..., description="Transaction amount (positive or negative)")
    balance_after: int = Field(..., ge=0, description="Balance after transaction")
    description: str = Field(..., description="Transaction description")
    metadata: Optional[dict] = Field(default=None, description="Additional metadata")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DailyBonus(BaseModel):
    """Daily bonus claim record"""
    user_id: str = Field(..., description="Firebase user ID")
    claimed_at: datetime = Field(default_factory=datetime.utcnow)
    bonus_amount: int = Field(default=100, description="Bonus coins received")
    streak_days: int = Field(default=1, ge=1, description="Consecutive claim days")


class BetRecord(BaseModel):
    """Betting record for rap battles"""
    user_id: str = Field(..., description="Firebase user ID")
    battle_id: str = Field(..., description="Rap battle identifier")
    bet_on: str = Field(..., description="Who user bet on (AI name or 'player')")
    bet_amount: int = Field(..., gt=0, description="Amount wagered")
    odds: float = Field(..., gt=0, description="Odds at time of bet")
    status: str = Field(default="pending", description="Status: pending, won, lost, cancelled")
    result_amount: Optional[int] = Field(default=None, description="Payout if won, negative if lost")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = Field(default=None)


# Request/Response Models

class WalletResponse(BaseModel):
    """Wallet API response"""
    user_id: str
    balance: int
    total_earned: int
    total_spent: int
    last_daily_bonus: Optional[datetime] = None
    can_claim_bonus: bool
    next_bonus_in: Optional[int] = None  # seconds until next bonus


class ClaimDailyBonusRequest(BaseModel):
    """Request to claim daily bonus"""
    user_id: str = Field(..., description="Firebase user ID")


class ClaimDailyBonusResponse(BaseModel):
    """Daily bonus claim response"""
    success: bool
    bonus_amount: int
    new_balance: int
    streak_days: int
    next_bonus_at: datetime


class PlaceBetRequest(BaseModel):
    """Request to place a bet"""
    user_id: str = Field(..., description="Firebase user ID")
    battle_id: str = Field(..., description="Battle identifier")
    bet_on: str = Field(..., description="Contestant to bet on")
    bet_amount: int = Field(..., gt=0, le=10000, description="Amount to wager (max 10k)")


class PlaceBetResponse(BaseModel):
    """Bet placement response"""
    success: bool
    bet_id: str
    new_balance: int
    odds: float


class TransactionHistoryResponse(BaseModel):
    """Transaction history response"""
    transactions: list[CoinTransaction]
    total_count: int
    page: int
    page_size: int


class LeaderboardEntry(BaseModel):
    """Leaderboard entry"""
    rank: int
    user_id: str
    display_name: str
    balance: int
    total_earned: int


class LeaderboardResponse(BaseModel):
    """Leaderboard response"""
    entries: list[LeaderboardEntry]
    user_rank: Optional[int] = None
    total_users: int
