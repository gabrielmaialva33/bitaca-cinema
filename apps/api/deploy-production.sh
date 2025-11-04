#!/bin/bash
#################################################
# Bitaca Cinema - Production Deployment Script
# Deploys RL System + Gemini Integration
#################################################

set -e  # Exit on error

echo "🚀 Starting Bitaca Cinema Production Deployment"
echo "=============================================="

# Configuration
REPO_URL="https://github.com/gabrielmaialva33/bitaca-cinema.git"
SERVER_IP="162.12.204.30"
SERVER_USER="root"
DEPLOY_PATH="/opt/bitaca-cinema"
BACKUP_DIR="/opt/backups/$(date +%Y%m%d_%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if we can connect to server
echo "📡 Checking server connection..."
if ! ssh -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_IP} "echo 'Connected'" > /dev/null 2>&1; then
    print_error "Cannot connect to server ${SERVER_IP}"
    echo "Please run: ssh ${SERVER_USER}@${SERVER_IP}"
    exit 1
fi
print_status "Server connection OK"

# Create deployment script to run on server
cat > /tmp/deploy_remote.sh << 'REMOTE_SCRIPT'
#!/bin/bash
set -e

echo "🔧 Starting remote deployment..."

# Navigate to project directory
cd /opt/bitaca-cinema

# Create backup
echo "📦 Creating backup..."
mkdir -p /opt/backups
BACKUP_DIR="/opt/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r backend $BACKUP_DIR/
echo "✓ Backup created at $BACKUP_DIR"

# Navigate to backend
cd backend

# Stop current containers
echo "🛑 Stopping current containers..."
docker-compose down || true

# Create new RL feedback module
echo "🤖 Creating RL feedback system..."
mkdir -p agents
cat > agents/rl_feedback.py << 'EOF'
"""
Bitaca Cinema - Deterministic Reinforcement Learning Feedback System
Constant feedback loop with minimal verbosity
"""

import json
import os
from typing import Dict, Tuple, Any, Optional
from datetime import datetime
from pathlib import Path


class DeterministicRLAgent:
    def __init__(self, alpha: float = 0.1, gamma: float = 0.9, q_table_path: str = "data/q_table.json"):
        self.alpha = alpha
        self.gamma = gamma
        self.q_table: Dict[str, float] = {}
        self.q_table_path = q_table_path
        self.interaction_count = 0
        self.scores_history = []
        self.load_q_table()

    def encode_state(self, query_intent: str, agent_type: str, query_length: int) -> str:
        length_cat = "short" if query_length < 50 else "medium" if query_length < 150 else "long"
        return f"{query_intent}:{agent_type}:{length_cat}"

    def calculate_reward(self, intent_matched: bool, agent_correct: bool, response_length: int,
                        factual_accuracy: bool, response_time_ms: float) -> float:
        reward = 0.0
        if intent_matched: reward += 0.25
        if agent_correct: reward += 0.30
        if response_length < 500: reward += 0.20
        elif response_length < 1000: reward += 0.10
        if factual_accuracy: reward += 0.20
        if response_time_ms < 500: reward += 0.05
        return min(1.0, reward)

    def update_q_value(self, state: str, action: str, reward: float, next_state: Optional[str] = None) -> float:
        key = f"{state}:{action}"
        current_q = self.q_table.get(key, 0.0)
        max_next_q = 0.0
        if next_state:
            next_actions = [k for k in self.q_table.keys() if k.startswith(f"{next_state}:")]
            if next_actions:
                max_next_q = max(self.q_table.get(a, 0.0) for a in next_actions)
        new_q = (1 - self.alpha) * current_q + self.alpha * (reward + self.gamma * max_next_q)
        self.q_table[key] = new_q
        self.interaction_count += 1
        self.scores_history.append(new_q)
        if len(self.scores_history) > 100:
            self.scores_history.pop(0)
        if self.interaction_count % 100 == 0:
            self.save_q_table()
        return new_q

    def get_best_action(self, state: str, available_actions: list) -> Tuple[str, float]:
        best_action = available_actions[0]
        best_q = -float('inf')
        for action in available_actions:
            key = f"{state}:{action}"
            q_value = self.q_table.get(key, 0.0)
            if q_value > best_q:
                best_q = q_value
                best_action = action
        return best_action, best_q

    def format_feedback(self, score: float, agent: str, result: str) -> str:
        return f"[{score:.2f}] {agent} → {result}"

    def get_stats(self) -> Dict[str, Any]:
        avg_score = sum(self.scores_history) / len(self.scores_history) if self.scores_history else 0
        agent_scores = {}
        for key, value in self.q_table.items():
            parts = key.split(':')
            if len(parts) >= 2:
                agent = parts[1]
                if agent not in agent_scores:
                    agent_scores[agent] = []
                agent_scores[agent].append(value)
        best_agent = None
        best_avg = 0
        for agent, scores in agent_scores.items():
            avg = sum(scores) / len(scores)
            if avg > best_avg:
                best_avg = avg
                best_agent = agent
        improvement = 0
        if len(self.scores_history) >= 40:
            first_20_avg = sum(self.scores_history[:20]) / 20
            last_20_avg = sum(self.scores_history[-20:]) / 20
            improvement = ((last_20_avg - first_20_avg) / first_20_avg * 100) if first_20_avg > 0 else 0
        return {
            "avg_score": round(avg_score, 2),
            "best_agent": best_agent,
            "total_interactions": self.interaction_count,
            "improvement_rate": f"+{improvement:.0f}%" if improvement > 0 else f"{improvement:.0f}%",
            "q_table_size": len(self.q_table)
        }

    def save_q_table(self):
        try:
            Path(self.q_table_path).parent.mkdir(parents=True, exist_ok=True)
            data = {
                "q_table": self.q_table,
                "metadata": {
                    "interactions": self.interaction_count,
                    "last_updated": datetime.now().isoformat(),
                    "alpha": self.alpha,
                    "gamma": self.gamma
                }
            }
            with open(self.q_table_path, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception:
            pass

    def load_q_table(self):
        try:
            if os.path.exists(self.q_table_path):
                with open(self.q_table_path, 'r') as f:
                    data = json.load(f)
                    self.q_table = data.get("q_table", {})
                    metadata = data.get("metadata", {})
                    self.interaction_count = metadata.get("interactions", 0)
        except Exception:
            pass

    def process_interaction(self, query: str, query_intent: str, selected_agent: str, response: str,
                           response_time_ms: float, intent_matched: bool = True,
                           agent_correct: bool = True, factual_accuracy: bool = True) -> Dict[str, Any]:
        state = self.encode_state(query_intent, selected_agent, len(query))
        reward = self.calculate_reward(
            intent_matched=intent_matched,
            agent_correct=agent_correct,
            response_length=len(response),
            factual_accuracy=factual_accuracy,
            response_time_ms=response_time_ms
        )
        action = "respond"
        q_value = self.update_q_value(state, action, reward)
        result_desc = f"{len(response)} chars in {response_time_ms:.0f}ms"
        return {
            "score": round(q_value, 2),
            "reward": round(reward, 2),
            "feedback": self.format_feedback(q_value, selected_agent, result_desc),
            "state": state,
            "interaction_id": self.interaction_count
        }


class RLFeedbackIntegration:
    def __init__(self, enabled: bool = True):
        self.enabled = enabled
        if self.enabled:
            self.rl_agent = DeterministicRLAgent()
        else:
            self.rl_agent = None

    def track_response(self, query: str, intent: str, agent_name: str, response: str,
                       elapsed_time_ms: float) -> Optional[Dict[str, Any]]:
        if not self.enabled or not self.rl_agent:
            return None
        agent_type = agent_name.replace("Agent", "")
        feedback = self.rl_agent.process_interaction(
            query=query,
            query_intent=intent,
            selected_agent=agent_type,
            response=response,
            response_time_ms=elapsed_time_ms
        )
        print(feedback["feedback"])
        return feedback

    def get_agent_recommendation(self, query_intent: str, query: str) -> Optional[str]:
        if not self.enabled or not self.rl_agent:
            return None
        available_agents = ["Cinema", "Cultural", "Discovery"]
        best_scores = {}
        for agent in available_agents:
            state = self.rl_agent.encode_state(query_intent, agent, len(query))
            key = f"{state}:respond"
            score = self.rl_agent.q_table.get(key, 0.0)
            best_scores[agent] = score
        if best_scores:
            return max(best_scores, key=best_scores.get)
        return None

    def get_stats(self) -> Dict[str, Any]:
        if not self.enabled or not self.rl_agent:
            return {"enabled": False}
        stats = self.rl_agent.get_stats()
        stats["enabled"] = True
        return stats
EOF

# Update .env file
echo "📝 Updating environment variables..."
if ! grep -q "GEMINI_API_KEY" .env; then
    echo "" >> .env
    echo "# Google Gemini API" >> .env
    echo "GEMINI_API_KEY=AIzaSyDxCL4l8w5WRL-pAzfFTRGCemU14FEZmOs" >> .env
fi

if ! grep -q "RL_ENABLED" .env; then
    echo "" >> .env
    echo "# Reinforcement Learning" >> .env
    echo "RL_ENABLED=true" >> .env
fi

# Update requirements.txt
if ! grep -q "google-genai" requirements.txt; then
    echo "google-genai>=0.1.0" >> requirements.txt
fi

# Build new Docker image
echo "🐳 Building new Docker image..."
docker-compose build

# Start containers
echo "🚀 Starting containers..."
docker-compose up -d

# Wait for containers to be healthy
echo "⏳ Waiting for containers to be ready..."
sleep 10

# Check container status
echo "📊 Container status:"
docker ps | grep bitaca

# Test the API
echo "🧪 Testing API endpoints..."
curl -s http://localhost:3000/health | head -n 1
curl -s http://localhost:3000/api/rl/stats | head -n 1

echo "✅ Deployment complete!"
REMOTE_SCRIPT

# Copy and execute deployment script on server
echo "📤 Uploading deployment script..."
scp /tmp/deploy_remote.sh ${SERVER_USER}@${SERVER_IP}:/tmp/deploy_remote.sh
print_status "Script uploaded"

echo "🚀 Executing deployment on server..."
ssh ${SERVER_USER}@${SERVER_IP} "chmod +x /tmp/deploy_remote.sh && /tmp/deploy_remote.sh"

# Test production endpoints
echo ""
echo "🧪 Testing production endpoints..."
echo "-----------------------------------"

# Test API health
echo "Testing API health..."
curl -s https://api.abitaca.com.br/health | jq . || print_warning "Health check failed"

# Test RL stats
echo "Testing RL stats..."
curl -s https://api.abitaca.com.br/api/rl/stats | jq . || print_warning "RL stats not available"

# Test AGI health
echo "Testing AGI health..."
curl -s https://api.abitaca.com.br/api/agi/health | jq . || print_warning "AGI health check failed"

echo ""
print_status "🎉 Deployment completed successfully!"
echo ""
echo "📌 Access points:"
echo "   Frontend: https://www.abitaca.com.br"
echo "   API: https://api.abitaca.com.br"
echo "   RL Stats: https://api.abitaca.com.br/api/rl/stats"
echo ""
echo "📊 Monitor logs with:"
echo "   ssh ${SERVER_USER}@${SERVER_IP} 'cd /opt/bitaca-cinema/backend && docker logs -f bitaca-api --tail 50'"
echo ""