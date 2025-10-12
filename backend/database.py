"""
MongoDB Database Configuration
Handles connection and collections for Bitaca Cinema
"""

import os
from datetime import datetime
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
    "embeddings_cache": "embeddings_cache"
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

        print("✅ Database indexes created")
    except Exception as e:
        print(f"⚠️  Index creation warning: {e}")
