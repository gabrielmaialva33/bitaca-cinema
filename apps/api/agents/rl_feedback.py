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
    """
    Q-Learning agent with deterministic rewards and constant feedback.
    Provides immediate, concise feedback for every interaction.
    """

    def __init__(self,
                 alpha: float = 0.1,
                 gamma: float = 0.9,
                 q_table_path: str = "data/q_table.json"):
        """
        Initialize RL agent with fixed hyperparameters.

        Args:
            alpha: Learning rate (fixed at 0.1 for stable learning)
            gamma: Discount factor (fixed at 0.9 for long-term value)
            q_table_path: Path to persist Q-table
        """
        self.alpha = alpha  # Learning rate
        self.gamma = gamma  # Discount factor
        self.q_table: Dict[str, float] = {}
        self.q_table_path = q_table_path
        self.interaction_count = 0
        self.scores_history = []  # Keep last 100 scores

        # Load existing Q-table if available
        self.load_q_table()

    def encode_state(self, query_intent: str, agent_type: str,
                     query_length: int) -> str:
        """
        Encode state into a string key for Q-table.

        Args:
            query_intent: SEARCH, RECOMMEND, INFO, or GENERAL
            agent_type: Cinema, Cultural, or Discovery
            query_length: Length category (short/medium/long)

        Returns:
            State key string
        """
        length_cat = "short" if query_length < 50 else "medium" if query_length < 150 else "long"
        return f"{query_intent}:{agent_type}:{length_cat}"

    def calculate_reward(self,
                        intent_matched: bool,
                        agent_correct: bool,
                        response_length: int,
                        factual_accuracy: bool,
                        response_time_ms: float) -> float:
        """
        Calculate deterministic reward based on fixed rules.

        Args:
            intent_matched: Query intent correctly identified
            agent_correct: Correct agent selected for task
            response_length: Characters in response
            factual_accuracy: Response is factually correct
            response_time_ms: Response generation time

        Returns:
            Reward score between 0 and 1
        """
        reward = 0.0

        # Fixed reward components
        if intent_matched:
            reward += 0.25  # Intent detection reward

        if agent_correct:
            reward += 0.30  # Agent selection reward

        # Conciseness reward (prefer shorter responses)
        if response_length < 500:
            reward += 0.20
        elif response_length < 1000:
            reward += 0.10

        if factual_accuracy:
            reward += 0.20  # Accuracy reward

        # Performance bonus for fast responses
        if response_time_ms < 500:
            reward += 0.05

        return min(1.0, reward)  # Cap at 1.0

    def update_q_value(self, state: str, action: str, reward: float,
                      next_state: Optional[str] = None) -> float:
        """
        Update Q-value using deterministic Q-learning update rule.

        Args:
            state: Current state
            action: Action taken
            reward: Immediate reward received
            next_state: Next state (optional for terminal states)

        Returns:
            Updated Q-value (for immediate feedback)
        """
        key = f"{state}:{action}"

        # Get current Q-value
        current_q = self.q_table.get(key, 0.0)

        # Calculate max Q-value of next state
        max_next_q = 0.0
        if next_state:
            # Find max Q-value for all actions in next state
            next_actions = [k for k in self.q_table.keys() if k.startswith(f"{next_state}:")]
            if next_actions:
                max_next_q = max(self.q_table.get(a, 0.0) for a in next_actions)

        # Q-learning update rule (deterministic)
        new_q = (1 - self.alpha) * current_q + self.alpha * (reward + self.gamma * max_next_q)

        # Update Q-table
        self.q_table[key] = new_q

        # Track interaction
        self.interaction_count += 1

        # Add to history (keep last 100)
        self.scores_history.append(new_q)
        if len(self.scores_history) > 100:
            self.scores_history.pop(0)

        # Auto-save every 100 interactions
        if self.interaction_count % 100 == 0:
            self.save_q_table()

        return new_q

    def get_best_action(self, state: str, available_actions: list) -> Tuple[str, float]:
        """
        Get best action for state (100% greedy, no exploration).

        Args:
            state: Current state
            available_actions: List of possible actions

        Returns:
            Tuple of (best_action, q_value)
        """
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
        """
        Format feedback in concise, non-verbose format.

        Args:
            score: Q-value or reward score
            agent: Agent name that handled request
            result: Brief result description

        Returns:
            Formatted feedback string
        """
        return f"[{score:.2f}] {agent} → {result}"

    def get_stats(self) -> Dict[str, Any]:
        """
        Get concise statistics about RL performance.

        Returns:
            Dictionary with minimal statistics
        """
        avg_score = sum(self.scores_history) / len(self.scores_history) if self.scores_history else 0

        # Find best performing agent
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

        # Calculate improvement rate (last 20 vs first 20)
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
        """Save Q-table to JSON file."""
        try:
            # Create directory if it doesn't exist
            Path(self.q_table_path).parent.mkdir(parents=True, exist_ok=True)

            # Save Q-table with metadata
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

        except Exception as e:
            # Silently fail (non-critical operation)
            pass

    def load_q_table(self):
        """Load Q-table from JSON file if exists."""
        try:
            if os.path.exists(self.q_table_path):
                with open(self.q_table_path, 'r') as f:
                    data = json.load(f)
                    self.q_table = data.get("q_table", {})
                    metadata = data.get("metadata", {})
                    self.interaction_count = metadata.get("interactions", 0)
        except Exception:
            # Start with empty Q-table if load fails
            pass

    def process_interaction(self,
                           query: str,
                           query_intent: str,
                           selected_agent: str,
                           response: str,
                           response_time_ms: float,
                           intent_matched: bool = True,
                           agent_correct: bool = True,
                           factual_accuracy: bool = True) -> Dict[str, Any]:
        """
        Process a complete interaction and return feedback.

        Args:
            query: User query
            query_intent: Detected intent
            selected_agent: Agent that handled query
            response: Generated response
            response_time_ms: Response time in milliseconds
            intent_matched: Whether intent was correctly identified
            agent_correct: Whether correct agent was selected
            factual_accuracy: Whether response is accurate

        Returns:
            Dictionary with feedback and score
        """
        # Encode state
        state = self.encode_state(query_intent, selected_agent, len(query))

        # Calculate reward
        reward = self.calculate_reward(
            intent_matched=intent_matched,
            agent_correct=agent_correct,
            response_length=len(response),
            factual_accuracy=factual_accuracy,
            response_time_ms=response_time_ms
        )

        # Update Q-value
        action = "respond"  # In this simple case, action is always "respond"
        q_value = self.update_q_value(state, action, reward)

        # Format result
        result_desc = f"{len(response)} chars in {response_time_ms:.0f}ms"

        return {
            "score": round(q_value, 2),
            "reward": round(reward, 2),
            "feedback": self.format_feedback(q_value, selected_agent, result_desc),
            "state": state,
            "interaction_id": self.interaction_count
        }


class RLFeedbackIntegration:
    """
    Integration layer for RL feedback with existing agent system.
    """

    def __init__(self, enabled: bool = True):
        """
        Initialize RL integration.

        Args:
            enabled: Whether RL feedback is enabled
        """
        self.enabled = enabled
        if self.enabled:
            self.rl_agent = DeterministicRLAgent()
        else:
            self.rl_agent = None

    def track_response(self,
                       query: str,
                       intent: str,
                       agent_name: str,
                       response: str,
                       elapsed_time_ms: float) -> Optional[Dict[str, Any]]:
        """
        Track agent response and provide feedback.

        Args:
            query: User query
            intent: Detected intent
            agent_name: Name of agent that responded
            response: Generated response
            elapsed_time_ms: Time taken to generate response

        Returns:
            Feedback dictionary or None if disabled
        """
        if not self.enabled or not self.rl_agent:
            return None

        # Map agent names to types
        agent_type = agent_name.replace("Agent", "")

        # Process interaction
        feedback = self.rl_agent.process_interaction(
            query=query,
            query_intent=intent,
            selected_agent=agent_type,
            response=response,
            response_time_ms=elapsed_time_ms
        )

        # Print concise feedback (single line)
        print(feedback["feedback"])

        return feedback

    def get_agent_recommendation(self, query_intent: str, query: str) -> Optional[str]:
        """
        Get RL-recommended agent for query.

        Args:
            query_intent: Detected intent
            query: User query

        Returns:
            Recommended agent name or None
        """
        if not self.enabled or not self.rl_agent:
            return None

        available_agents = ["Cinema", "Cultural", "Discovery"]
        best_scores = {}

        for agent in available_agents:
            state = self.rl_agent.encode_state(query_intent, agent, len(query))
            key = f"{state}:respond"
            score = self.rl_agent.q_table.get(key, 0.0)
            best_scores[agent] = score

        # Return agent with highest Q-value
        if best_scores:
            return max(best_scores, key=best_scores.get)

        return None

    def get_stats(self) -> Dict[str, Any]:
        """Get RL statistics."""
        if not self.enabled or not self.rl_agent:
            return {"enabled": False}

        stats = self.rl_agent.get_stats()
        stats["enabled"] = True
        return stats