#!/usr/bin/env python3
"""
Test script for Reinforcement Learning Feedback System
Demonstrates deterministic constant feedback with concise output
"""

import asyncio
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

# Set RL_ENABLED environment variable before imports
os.environ['RL_ENABLED'] = 'true'
os.environ['NVIDIA_API_KEY'] = os.getenv('NVIDIA_API_KEY', 'test-key')

from agents.agent_manager import AgentManager
from agents.rl_feedback import DeterministicRLAgent


async def test_rl_system():
    """
    Test the complete RL system with sample queries
    """
    print("=" * 60)
    print("🧪 TESTING REINFORCEMENT LEARNING FEEDBACK SYSTEM")
    print("=" * 60)

    # Initialize with empty embeddings for testing
    embeddings_data = []
    manager = AgentManager(
        nvidia_api_key=os.environ['NVIDIA_API_KEY'],
        embeddings_data=embeddings_data
    )

    # Test queries with different intents
    test_cases = [
        {
            "query": "O que é a Lei Paulo Gustavo?",
            "intent": "INFO",
            "expected_agent": "Cultural"
        },
        {
            "query": "Buscar filmes sobre meio ambiente",
            "intent": "SEARCH",
            "expected_agent": "Discovery"
        },
        {
            "query": "Quem dirigiu o filme Ponteia Viola?",
            "intent": "INFO",
            "expected_agent": "Cinema"
        },
        {
            "query": "Recomendar produções similares a Reconstruction",
            "intent": "RECOMMEND",
            "expected_agent": "Discovery"
        },
        {
            "query": "Quanto foi investido pela PNAB em 2024?",
            "intent": "INFO",
            "expected_agent": "Cultural"
        }
    ]

    print("\n📊 Running test queries...\n")

    for i, test in enumerate(test_cases, 1):
        print(f"Test {i}: {test['query'][:50]}...")
        print(f"Expected: {test['expected_agent']}Agent")

        # Simulate agent response
        result = await manager.process_query(
            query=test['query'],
            intent=test['intent']
        )

        # Display concise RL feedback
        if 'rl_feedback' in result:
            print(f"Result: {result['rl_feedback']}")
        else:
            print(f"Result: {result['agent']} → No RL feedback")

        print("-" * 40)

    # Get RL statistics
    stats = manager.get_rl_stats()

    print("\n📈 RL System Statistics:")
    print(f"  Enabled: {stats.get('enabled', False)}")
    print(f"  Average Score: {stats.get('avg_score', 0)}")
    print(f"  Best Agent: {stats.get('best_agent', 'N/A')}")
    print(f"  Total Interactions: {stats.get('total_interactions', 0)}")
    print(f"  Improvement Rate: {stats.get('improvement_rate', '0%')}")
    print(f"  Q-Table Size: {stats.get('q_table_size', 0)}")

    print("\n✅ RL System Test Complete!")
    print("=" * 60)


def test_deterministic_rewards():
    """
    Test deterministic reward calculation
    """
    print("\n🎯 Testing Deterministic Rewards:")
    print("-" * 40)

    rl_agent = DeterministicRLAgent()

    # Test cases with expected rewards
    test_scenarios = [
        {
            "name": "Perfect response",
            "params": {
                "intent_matched": True,
                "agent_correct": True,
                "response_length": 400,
                "factual_accuracy": True,
                "response_time_ms": 300
            },
            "expected": 1.0  # 0.25 + 0.30 + 0.20 + 0.20 + 0.05 = 1.0
        },
        {
            "name": "Slow but accurate",
            "params": {
                "intent_matched": True,
                "agent_correct": True,
                "response_length": 600,
                "factual_accuracy": True,
                "response_time_ms": 800
            },
            "expected": 0.85  # 0.25 + 0.30 + 0.10 + 0.20 + 0 = 0.85
        },
        {
            "name": "Wrong agent",
            "params": {
                "intent_matched": True,
                "agent_correct": False,
                "response_length": 400,
                "factual_accuracy": True,
                "response_time_ms": 400
            },
            "expected": 0.70  # 0.25 + 0 + 0.20 + 0.20 + 0.05 = 0.70
        },
        {
            "name": "Verbose response",
            "params": {
                "intent_matched": True,
                "agent_correct": True,
                "response_length": 1500,
                "factual_accuracy": True,
                "response_time_ms": 600
            },
            "expected": 0.75  # 0.25 + 0.30 + 0 + 0.20 + 0 = 0.75
        }
    ]

    for scenario in test_scenarios:
        reward = rl_agent.calculate_reward(**scenario["params"])
        status = "✅" if abs(reward - scenario["expected"]) < 0.01 else "❌"
        print(f"{status} {scenario['name']}: {reward:.2f} (expected {scenario['expected']})")

    print("-" * 40)


def test_concise_output():
    """
    Test concise output formatting
    """
    print("\n📝 Testing Concise Output Format:")
    print("-" * 40)

    rl_agent = DeterministicRLAgent()

    # Test output formats
    test_outputs = [
        (0.85, "Cinema", "Found 3 films"),
        (0.92, "Cultural", "Lei Paulo Gustavo info"),
        (0.71, "Discovery", "Similar productions"),
        (0.45, "Cinema", "No results found"),
        (0.99, "Discovery", "5 recommendations")
    ]

    for score, agent, result in test_outputs:
        output = rl_agent.format_feedback(score, agent, result)
        print(output)

    print("-" * 40)


if __name__ == "__main__":
    print("\n🚀 Starting RL System Tests\n")

    # Test deterministic rewards
    test_deterministic_rewards()

    # Test concise output
    test_concise_output()

    # Test full system (requires async)
    try:
        asyncio.run(test_rl_system())
    except Exception as e:
        print(f"❌ Async test failed: {e}")
        print("Note: Full system test requires valid NVIDIA_API_KEY")

    print("\n🎉 All tests completed!")