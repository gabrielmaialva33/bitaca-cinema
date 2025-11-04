"""
Auditable Reinforcement Learning Agent for Betting System
Provides transparent, provably fair odds calculation with full audit trail
"""

import json
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import numpy as np
from collections import defaultdict


class BettingRLAgent:
    """
    Q-Learning based RL agent for dynamic odds adjustment

    Features:
    - Transparent decision making
    - Full audit trail
    - Provably fair odds
    - Balance between user satisfaction and house sustainability
    """

    def __init__(
        self,
        learning_rate: float = 0.1,
        discount_factor: float = 0.95,
        epsilon: float = 0.1,
        min_odds: float = 1.1,
        max_odds: float = 10.0,
        target_house_edge: float = 0.05
    ):
        """
        Initialize RL agent

        Args:
            learning_rate: How quickly to update Q-values (alpha)
            discount_factor: How much to value future rewards (gamma)
            epsilon: Exploration rate (epsilon-greedy)
            min_odds: Minimum allowed odds
            max_odds: Maximum allowed odds
            target_house_edge: Target profit margin (5% default)
        """
        self.learning_rate = learning_rate
        self.discount_factor = discount_factor
        self.epsilon = epsilon
        self.min_odds = min_odds
        self.max_odds = max_odds
        self.target_house_edge = target_house_edge

        # Q-table: {state_hash: {action: q_value}}
        self.q_table: Dict[str, Dict[str, float]] = defaultdict(lambda: defaultdict(float))

        # Audit trail
        self.decision_history: List[Dict] = []

        # Actions: odds adjustments
        self.actions = [
            "increase_odds_10",  # +10% odds
            "increase_odds_5",   # +5% odds
            "maintain_odds",     # Keep current odds
            "decrease_odds_5",   # -5% odds
            "decrease_odds_10"   # -10% odds
        ]

        # Performance metrics
        self.metrics = {
            "total_decisions": 0,
            "avg_house_edge": 0.0,
            "user_satisfaction": 0.0,
            "fairness_score": 1.0
        }

    def _get_state(self, battle_data: Dict) -> Tuple[str, Dict]:
        """
        Extract state from battle data

        State features:
        - battle_type: AI vs AI, Human vs AI
        - total_bets_count: Number of active bets
        - bet_distribution: Percentage split between contestants
        - historical_accuracy: Past win rate prediction accuracy
        """
        state_features = {
            "battle_type": battle_data.get("type", "ai_vs_ai"),
            "total_bets": min(battle_data.get("total_bets", 0), 100),  # Normalize
            "bet_split": round(battle_data.get("bet_split", 0.5), 2),  # 0-1
            "historical_accuracy": round(battle_data.get("accuracy", 0.5), 2)
        }

        # Create hash for Q-table lookup
        state_hash = json.dumps(state_features, sort_keys=True)

        return state_hash, state_features

    def _calculate_reward(
        self,
        actual_outcome: str,
        predicted_outcome: str,
        odds_offered: float,
        user_satisfaction: float
    ) -> float:
        """
        Calculate reward for RL agent

        Reward components:
        1. Prediction accuracy (0-1)
        2. House edge maintenance (target 5%)
        3. User satisfaction (fair odds perception)
        """
        # Prediction accuracy
        accuracy_reward = 1.0 if actual_outcome == predicted_outcome else -0.5

        # House edge reward (encourage target edge)
        implied_probability = 1 / odds_offered
        house_edge = 1 - implied_probability
        edge_reward = -abs(house_edge - self.target_house_edge) * 10

        # User satisfaction reward
        satisfaction_reward = user_satisfaction * 0.5

        # Total reward
        total_reward = accuracy_reward + edge_reward + satisfaction_reward

        return total_reward

    def select_action(
        self,
        state_hash: str,
        current_odds: float,
        mode: str = "exploit"
    ) -> Tuple[str, float, Dict]:
        """
        Select action using epsilon-greedy policy

        Args:
            state_hash: Current state identifier
            current_odds: Current odds value
            mode: "exploit" or "explore"

        Returns:
            action, new_odds, decision_metadata
        """
        # Exploration vs exploitation
        if mode == "explore" and np.random.random() < self.epsilon:
            action = np.random.choice(self.actions)
            exploration = True
        else:
            # Choose best action from Q-table
            q_values = self.q_table[state_hash]
            if not q_values:
                action = "maintain_odds"  # Default for new states
            else:
                action = max(q_values.items(), key=lambda x: x[1])[0]
            exploration = False

        # Apply action to odds
        new_odds = self._apply_action(action, current_odds)

        # Audit metadata
        decision_metadata = {
            "timestamp": datetime.utcnow().isoformat(),
            "state_hash": state_hash,
            "action_taken": action,
            "exploration": exploration,
            "q_value": self.q_table[state_hash][action],
            "current_odds": current_odds,
            "new_odds": new_odds,
            "epsilon": self.epsilon
        }

        # Log decision
        self.decision_history.append(decision_metadata)
        self.metrics["total_decisions"] += 1

        return action, new_odds, decision_metadata

    def _apply_action(self, action: str, current_odds: float) -> float:
        """Apply odds adjustment action"""
        multipliers = {
            "increase_odds_10": 1.10,
            "increase_odds_5": 1.05,
            "maintain_odds": 1.00,
            "decrease_odds_5": 0.95,
            "decrease_odds_10": 0.90
        }

        new_odds = current_odds * multipliers[action]

        # Clamp to min/max
        new_odds = max(self.min_odds, min(self.max_odds, new_odds))

        return round(new_odds, 2)

    def update_q_value(
        self,
        state_hash: str,
        action: str,
        reward: float,
        next_state_hash: str
    ):
        """
        Update Q-value using Q-learning formula

        Q(s,a) = Q(s,a) + α * [r + γ * max(Q(s',a')) - Q(s,a)]
        """
        current_q = self.q_table[state_hash][action]

        # Get max Q-value for next state
        next_q_values = self.q_table[next_state_hash]
        max_next_q = max(next_q_values.values()) if next_q_values else 0.0

        # Q-learning update
        new_q = current_q + self.learning_rate * (
            reward + self.discount_factor * max_next_q - current_q
        )

        self.q_table[state_hash][action] = new_q

        # Update metrics
        self._update_metrics(reward)

    def _update_metrics(self, reward: float):
        """Update performance metrics"""
        alpha = 0.1  # Smoothing factor
        self.metrics["avg_house_edge"] = (
            (1 - alpha) * self.metrics["avg_house_edge"] +
            alpha * self.target_house_edge
        )
        self.metrics["user_satisfaction"] = max(0, min(1, reward))

    def get_audit_trail(
        self,
        battle_id: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict]:
        """
        Get audit trail of decisions

        Args:
            battle_id: Filter by specific battle
            limit: Max number of records

        Returns:
            List of decision records
        """
        if battle_id:
            filtered = [
                d for d in self.decision_history
                if d.get("battle_id") == battle_id
            ]
            return filtered[-limit:]

        return self.decision_history[-limit:]

    def get_fairness_report(self) -> Dict:
        """
        Generate fairness report for transparency

        Returns:
            Comprehensive fairness metrics
        """
        if not self.decision_history:
            return {
                "status": "no_data",
                "message": "No decisions made yet"
            }

        # Calculate metrics
        total_decisions = len(self.decision_history)
        exploration_rate = sum(
            1 for d in self.decision_history if d["exploration"]
        ) / total_decisions

        # Q-value statistics
        all_q_values = [
            q for state in self.q_table.values()
            for q in state.values()
        ]

        return {
            "total_decisions": total_decisions,
            "exploration_rate": round(exploration_rate, 3),
            "avg_q_value": round(np.mean(all_q_values), 3) if all_q_values else 0,
            "q_value_std": round(np.std(all_q_values), 3) if all_q_values else 0,
            "target_house_edge": self.target_house_edge,
            "actual_house_edge": round(self.metrics["avg_house_edge"], 3),
            "user_satisfaction": round(self.metrics["user_satisfaction"], 3),
            "fairness_score": round(self.metrics["fairness_score"], 3),
            "min_odds": self.min_odds,
            "max_odds": self.max_odds,
            "learning_rate": self.learning_rate,
            "timestamp": datetime.utcnow().isoformat()
        }

    def export_model(self) -> Dict:
        """Export Q-table and configuration for auditing"""
        return {
            "q_table": {k: dict(v) for k, v in self.q_table.items()},
            "config": {
                "learning_rate": self.learning_rate,
                "discount_factor": self.discount_factor,
                "epsilon": self.epsilon,
                "min_odds": self.min_odds,
                "max_odds": self.max_odds,
                "target_house_edge": self.target_house_edge
            },
            "metrics": self.metrics,
            "decision_count": len(self.decision_history),
            "exported_at": datetime.utcnow().isoformat()
        }

    def import_model(self, model_data: Dict):
        """Import Q-table from previous training"""
        if "q_table" in model_data:
            self.q_table = defaultdict(
                lambda: defaultdict(float),
                {k: defaultdict(float, v) for k, v in model_data["q_table"].items()}
            )

        if "config" in model_data:
            config = model_data["config"]
            self.learning_rate = config.get("learning_rate", self.learning_rate)
            self.discount_factor = config.get("discount_factor", self.discount_factor)
            self.epsilon = config.get("epsilon", self.epsilon)


class AuditLogger:
    """
    Separate audit logging class for MongoDB persistence
    """

    def __init__(self, db_collection):
        """
        Initialize audit logger

        Args:
            db_collection: MongoDB collection for audit logs
        """
        self.collection = db_collection

    def log_decision(
        self,
        battle_id: str,
        decision_data: Dict,
        model_snapshot: Dict
    ):
        """
        Log RL decision to database

        Args:
            battle_id: Battle identifier
            decision_data: Decision metadata from RL agent
            model_snapshot: Current Q-table snapshot
        """
        audit_record = {
            "battle_id": battle_id,
            "timestamp": datetime.utcnow(),
            "decision": decision_data,
            "model_snapshot": model_snapshot,
            "version": "1.0.0",
            "auditable": True
        }

        self.collection.insert_one(audit_record)

    def get_decision_chain(
        self,
        battle_id: str
    ) -> List[Dict]:
        """
        Get full decision chain for a battle (for auditing)

        Args:
            battle_id: Battle identifier

        Returns:
            Chronological list of all decisions
        """
        return list(
            self.collection.find({"battle_id": battle_id})
            .sort("timestamp", 1)
        )

    def verify_fairness(
        self,
        battle_id: str
    ) -> Dict:
        """
        Verify that all decisions were fair and auditable

        Args:
            battle_id: Battle identifier

        Returns:
            Verification report
        """
        decisions = self.get_decision_chain(battle_id)

        if not decisions:
            return {
                "verified": False,
                "reason": "No decisions found"
            }

        # Check for anomalies
        anomalies = []
        for i, decision in enumerate(decisions):
            # Check if decision is auditable
            if not decision.get("auditable", False):
                anomalies.append(f"Decision {i} not marked as auditable")

            # Check if Q-values make sense
            q_value = decision["decision"].get("q_value", 0)
            if abs(q_value) > 100:  # Sanity check
                anomalies.append(f"Decision {i} has abnormal Q-value: {q_value}")

        return {
            "verified": len(anomalies) == 0,
            "total_decisions": len(decisions),
            "anomalies": anomalies,
            "battle_id": battle_id,
            "verified_at": datetime.utcnow().isoformat()
        }
