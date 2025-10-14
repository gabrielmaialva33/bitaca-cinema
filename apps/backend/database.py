"""
MongoDB Database Configuration
Handles connection and collections for Bitaca Cinema
"""

import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

load_dotenv()

# MongoDB Configuration
MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = "bitaca_cinema"

# MongoDB is optional - AGI system can work without it
MONGODB_ENABLED = bool(MONGODB_URI)

# Global MongoDB client
_client: Optional[MongoClient] = None


def get_mongo_client() -> MongoClient:
    """Get or create MongoDB client"""
    global _client

    if not MONGODB_ENABLED:
        raise ValueError("MongoDB is not configured. Set MONGODB_URI environment variable.")

    if _client is None:
        try:
            # Use certifi for SSL certificate verification
            import certifi
            _client = MongoClient(
                MONGODB_URI,
                serverSelectionTimeoutMS=5000,
                tlsCAFile=certifi.where()
            )
            # Test connection
            _client.admin.command('ping')
            print("✅ MongoDB connected successfully")
        except ImportError:
            # Fallback without certifi
            print("⚠️  certifi not found, using default SSL settings")
            try:
                _client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
                _client.admin.command('ping')
                print("✅ MongoDB connected successfully")
            except ConnectionFailure as e:
                print(f"❌ MongoDB connection failed: {e}")
                raise
        except ConnectionFailure as e:
            print(f"❌ MongoDB connection failed: {e}")
            raise

    return _client


def get_database():
    """Get database instance"""
    client = get_mongo_client()
    return client[DATABASE_NAME]


def close_mongo_connection():
    """Close MongoDB connection"""
    global _client
    if _client:
        _client.close()
        _client = None
        print("🔒 MongoDB connection closed")


# Collection names
COLLECTIONS = {
    "conversations": "conversations",
    "messages": "messages",
    "analytics": "analytics",
    "embeddings_cache": "embeddings_cache",
    "wallets": "wallets",
    "coin_transactions": "coin_transactions",
    "daily_bonuses": "daily_bonuses",
    "bet_records": "bet_records",
    "rl_audit_logs": "rl_audit_logs",
    "rl_model_snapshots": "rl_model_snapshots"
}


# Database operations
class ConversationDB:
    """Handle conversation persistence"""

    @staticmethod
    def create_conversation(user_id: str = "anonymous", metadata: Dict[str, Any] = None) -> str:
        """Create a new conversation"""
        db = get_database()
        conversation = {
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "message_count": 0,
            "metadata": metadata or {}
        }
        result = db[COLLECTIONS["conversations"]].insert_one(conversation)
        return str(result.inserted_id)

    @staticmethod
    def add_message(conversation_id: str, role: str, content: str, intent: str = None, rag_results: int = 0):
        """Add message to conversation"""
        db = get_database()

        message = {
            "conversation_id": conversation_id,
            "role": role,
            "content": content,
            "intent": intent,
            "rag_results": rag_results,
            "timestamp": datetime.utcnow()
        }

        # Insert message
        db[COLLECTIONS["messages"]].insert_one(message)

        # Update conversation
        db[COLLECTIONS["conversations"]].update_one(
            {"_id": conversation_id},
            {
                "$set": {"updated_at": datetime.utcnow()},
                "$inc": {"message_count": 1}
            }
        )

    @staticmethod
    def get_conversation_history(conversation_id: str, limit: int = 50):
        """Get conversation messages"""
        db = get_database()
        messages = db[COLLECTIONS["messages"]].find(
            {"conversation_id": conversation_id}
        ).sort("timestamp", -1).limit(limit)
        return list(messages)


class AnalyticsDB:
    """Handle analytics events"""

    @staticmethod
    def log_event(event_name: str, event_data: Dict[str, Any] = None, user_id: str = "anonymous"):
        """Log analytics event"""
        db = get_database()

        event = {
            "event_name": event_name,
            "event_data": event_data or {},
            "user_id": user_id,
            "timestamp": datetime.utcnow()
        }

        db[COLLECTIONS["analytics"]].insert_one(event)

    @staticmethod
    def get_events(event_name: str = None, limit: int = 100):
        """Get analytics events"""
        db = get_database()

        query = {"event_name": event_name} if event_name else {}
        events = db[COLLECTIONS["analytics"]].find(query).sort("timestamp", -1).limit(limit)
        return list(events)

    @staticmethod
    def get_event_count(event_name: str, start_date: datetime = None):
        """Get event count"""
        db = get_database()

        query = {"event_name": event_name}
        if start_date:
            query["timestamp"] = {"$gte": start_date}

        return db[COLLECTIONS["analytics"]].count_documents(query)


class EmbeddingsCacheDB:
    """Cache embeddings to reduce API calls"""

    @staticmethod
    def get_cached_embedding(text: str, model: str):
        """Get cached embedding"""
        db = get_database()

        cache = db[COLLECTIONS["embeddings_cache"]].find_one({
            "text": text,
            "model": model
        })

        return cache["embedding"] if cache else None

    @staticmethod
    def cache_embedding(text: str, model: str, embedding: list):
        """Cache embedding"""
        db = get_database()

        doc = {
            "text": text,
            "model": model,
            "embedding": embedding,
            "created_at": datetime.utcnow()
        }

        db[COLLECTIONS["embeddings_cache"]].update_one(
            {"text": text, "model": model},
            {"$set": doc},
            upsert=True
        )


class WalletDB:
    """Handle wallet operations"""

    @staticmethod
    def get_or_create_wallet(user_id: str) -> dict:
        """Get wallet or create if not exists"""
        db = get_database()

        wallet = db[COLLECTIONS["wallets"]].find_one({"user_id": user_id})

        if not wallet:
            # Create new wallet with signup bonus
            wallet = {
                "user_id": user_id,
                "balance": 1000,
                "total_earned": 1000,
                "total_spent": 0,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            db[COLLECTIONS["wallets"]].insert_one(wallet)

        return wallet

    @staticmethod
    def update_balance(user_id: str, amount: int, transaction_type: str, description: str, metadata: dict = None) -> dict:
        """Update wallet balance and create transaction record"""
        db = get_database()

        # Get current wallet
        wallet = WalletDB.get_or_create_wallet(user_id)
        current_balance = wallet["balance"]

        # Calculate new balance
        new_balance = current_balance + amount

        if new_balance < 0:
            raise ValueError("Insufficient funds")

        # Update wallet
        update_data = {
            "balance": new_balance,
            "updated_at": datetime.utcnow()
        }

        # Track earnings and spending
        if amount > 0:
            update_data["total_earned"] = wallet.get("total_earned", 0) + amount
        else:
            update_data["total_spent"] = wallet.get("total_spent", 0) + abs(amount)

        db[COLLECTIONS["wallets"]].update_one(
            {"user_id": user_id},
            {"$set": update_data}
        )

        # Create transaction record
        transaction = {
            "user_id": user_id,
            "transaction_type": transaction_type,
            "amount": amount,
            "balance_after": new_balance,
            "description": description,
            "metadata": metadata or {},
            "created_at": datetime.utcnow()
        }
        db[COLLECTIONS["coin_transactions"]].insert_one(transaction)

        return {
            "balance": new_balance,
            "transaction_id": str(transaction["_id"]) if "_id" in transaction else None
        }

    @staticmethod
    def get_balance(user_id: str) -> int:
        """Get user balance"""
        wallet = WalletDB.get_or_create_wallet(user_id)
        return wallet["balance"]

    @staticmethod
    def get_transactions(user_id: str, limit: int = 50, skip: int = 0) -> list:
        """Get user transaction history"""
        db = get_database()

        transactions = db[COLLECTIONS["coin_transactions"]].find(
            {"user_id": user_id}
        ).sort("created_at", -1).skip(skip).limit(limit)

        return list(transactions)

    @staticmethod
    def get_transaction_count(user_id: str) -> int:
        """Get total transaction count"""
        db = get_database()
        return db[COLLECTIONS["coin_transactions"]].count_documents({"user_id": user_id})


class DailyBonusDB:
    """Handle daily bonus operations"""

    @staticmethod
    def get_last_claim(user_id: str) -> Optional[dict]:
        """Get user's last daily bonus claim"""
        db = get_database()

        last_claim = db[COLLECTIONS["daily_bonuses"]].find_one(
            {"user_id": user_id},
            sort=[("claimed_at", -1)]
        )

        return last_claim

    @staticmethod
    def can_claim_bonus(user_id: str) -> tuple[bool, Optional[datetime]]:
        """Check if user can claim daily bonus"""
        last_claim = DailyBonusDB.get_last_claim(user_id)

        if not last_claim:
            return True, None

        last_claim_time = last_claim["claimed_at"]
        time_since_claim = datetime.utcnow() - last_claim_time

        # Can claim if 24 hours have passed
        can_claim = time_since_claim.total_seconds() >= 86400  # 24 hours

        if can_claim:
            return True, None
        else:
            next_claim_at = last_claim_time.replace(microsecond=0) + timedelta(days=1)
            return False, next_claim_at

    @staticmethod
    def claim_bonus(user_id: str, bonus_amount: int = 100) -> dict:
        """Claim daily bonus"""
        db = get_database()

        # Check if can claim
        can_claim, next_claim_at = DailyBonusDB.can_claim_bonus(user_id)

        if not can_claim:
            raise ValueError(f"Cannot claim bonus yet. Next claim at: {next_claim_at}")

        # Calculate streak
        last_claim = DailyBonusDB.get_last_claim(user_id)
        streak_days = 1

        if last_claim:
            time_since_last = datetime.utcnow() - last_claim["claimed_at"]
            # If claimed within 48 hours, continue streak
            if time_since_last.total_seconds() <= 172800:  # 48 hours
                streak_days = last_claim.get("streak_days", 1) + 1

        # Update wallet balance
        result = WalletDB.update_balance(
            user_id=user_id,
            amount=bonus_amount,
            transaction_type="daily_bonus",
            description=f"Daily bonus (Day {streak_days})",
            metadata={"streak_days": streak_days}
        )

        # Record bonus claim
        bonus_record = {
            "user_id": user_id,
            "claimed_at": datetime.utcnow(),
            "bonus_amount": bonus_amount,
            "streak_days": streak_days
        }
        db[COLLECTIONS["daily_bonuses"]].insert_one(bonus_record)

        return {
            "success": True,
            "bonus_amount": bonus_amount,
            "new_balance": result["balance"],
            "streak_days": streak_days,
            "next_bonus_at": datetime.utcnow() + timedelta(days=1)
        }


class BettingDB:
    """Handle betting operations"""

    @staticmethod
    def place_bet(user_id: str, battle_id: str, bet_on: str, bet_amount: int, odds: float) -> dict:
        """Place a bet on rap battle"""
        db = get_database()

        # Deduct bet amount from wallet
        result = WalletDB.update_balance(
            user_id=user_id,
            amount=-bet_amount,
            transaction_type="bet_placed",
            description=f"Bet {bet_amount} coins on {bet_on}",
            metadata={"battle_id": battle_id, "bet_on": bet_on, "odds": odds}
        )

        # Create bet record
        bet_record = {
            "user_id": user_id,
            "battle_id": battle_id,
            "bet_on": bet_on,
            "bet_amount": bet_amount,
            "odds": odds,
            "status": "pending",
            "result_amount": None,
            "created_at": datetime.utcnow(),
            "resolved_at": None
        }

        bet_id = db[COLLECTIONS["bet_records"]].insert_one(bet_record).inserted_id

        return {
            "success": True,
            "bet_id": str(bet_id),
            "new_balance": result["balance"],
            "odds": odds
        }

    @staticmethod
    def resolve_bet(bet_id: str, won: bool):
        """Resolve a bet (mark as won/lost and pay out)"""
        from bson import ObjectId
        db = get_database()

        # Get bet record
        bet = db[COLLECTIONS["bet_records"]].find_one({"_id": ObjectId(bet_id)})

        if not bet:
            raise ValueError("Bet not found")

        if bet["status"] != "pending":
            raise ValueError("Bet already resolved")

        # Calculate payout
        if won:
            payout = int(bet["bet_amount"] * bet["odds"])

            # Add winnings to wallet
            WalletDB.update_balance(
                user_id=bet["user_id"],
                amount=payout,
                transaction_type="bet_won",
                description=f"Won bet on {bet['bet_on']}",
                metadata={"battle_id": bet["battle_id"], "bet_id": bet_id, "payout": payout}
            )

            # Update bet record
            db[COLLECTIONS["bet_records"]].update_one(
                {"_id": ObjectId(bet_id)},
                {
                    "$set": {
                        "status": "won",
                        "result_amount": payout,
                        "resolved_at": datetime.utcnow()
                    }
                }
            )
        else:
            # Lost - just update status (amount already deducted)
            db[COLLECTIONS["bet_records"]].update_one(
                {"_id": ObjectId(bet_id)},
                {
                    "$set": {
                        "status": "lost",
                        "result_amount": -bet["bet_amount"],
                        "resolved_at": datetime.utcnow()
                    }
                }
            )

    @staticmethod
    def get_user_bets(user_id: str, limit: int = 50) -> list:
        """Get user's betting history"""
        db = get_database()

        bets = db[COLLECTIONS["bet_records"]].find(
            {"user_id": user_id}
        ).sort("created_at", -1).limit(limit)

        return list(bets)

    @staticmethod
    def get_active_bets(battle_id: str) -> list:
        """Get all active bets for a battle"""
        db = get_database()

        bets = db[COLLECTIONS["bet_records"]].find({
            "battle_id": battle_id,
            "status": "pending"
        })

        return list(bets)


# Initialize indexes
def init_indexes():
    """Create database indexes for performance"""
    try:
        db = get_database()

        # Conversations indexes
        db[COLLECTIONS["conversations"]].create_index("user_id")
        db[COLLECTIONS["conversations"]].create_index("created_at")

        # Messages indexes
        db[COLLECTIONS["messages"]].create_index("conversation_id")
        db[COLLECTIONS["messages"]].create_index("timestamp")

        # Analytics indexes
        db[COLLECTIONS["analytics"]].create_index("event_name")
        db[COLLECTIONS["analytics"]].create_index("timestamp")
        db[COLLECTIONS["analytics"]].create_index("user_id")

        # Embeddings cache indexes
        db[COLLECTIONS["embeddings_cache"]].create_index([("text", 1), ("model", 1)], unique=True)

        # Wallet indexes
        db[COLLECTIONS["wallets"]].create_index("user_id", unique=True)
        db[COLLECTIONS["wallets"]].create_index("balance")
        db[COLLECTIONS["wallets"]].create_index("total_earned")

        # Coin transactions indexes
        db[COLLECTIONS["coin_transactions"]].create_index("user_id")
        db[COLLECTIONS["coin_transactions"]].create_index("transaction_type")
        db[COLLECTIONS["coin_transactions"]].create_index("created_at")

        # Daily bonuses indexes
        db[COLLECTIONS["daily_bonuses"]].create_index("user_id")
        db[COLLECTIONS["daily_bonuses"]].create_index("claimed_at")

        # Bet records indexes
        db[COLLECTIONS["bet_records"]].create_index("user_id")
        db[COLLECTIONS["bet_records"]].create_index("battle_id")
        db[COLLECTIONS["bet_records"]].create_index("status")
        db[COLLECTIONS["bet_records"]].create_index("created_at")

        # RL audit logs indexes
        db[COLLECTIONS["rl_audit_logs"]].create_index("battle_id")
        db[COLLECTIONS["rl_audit_logs"]].create_index("timestamp")
        db[COLLECTIONS["rl_audit_logs"]].create_index([("battle_id", 1), ("timestamp", 1)])

        # RL model snapshots indexes
        db[COLLECTIONS["rl_model_snapshots"]].create_index("version")
        db[COLLECTIONS["rl_model_snapshots"]].create_index("created_at")

        print("✅ Database indexes created")
    except Exception as e:
        print(f"⚠️  Index creation warning: {e}")
