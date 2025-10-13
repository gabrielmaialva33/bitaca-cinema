# Reinforcement Learning Feedback System

## Overview

The RL Feedback System is a deterministic, constant-feedback reinforcement learning module that improves agent selection and response quality in the Bitaca Cinema chatbot. It provides immediate, concise feedback after each interaction and learns which agent performs best for different query types.

## Features

### 🎯 Deterministic Rewards
- Fixed reward calculation based on clear rules
- No randomness or stochastic behavior
- Predictable and debuggable

### ⚡ Constant Feedback
- Immediate score after every interaction
- Real-time Q-value updates
- No batching or delays

### 📊 Concise Output
- Minimal logging format: `[score] agent → result`
- Example: `[0.85] Cinema → 3 films found`
- No verbose explanations

## Architecture

```
User Query → AgentManager → RL Recommendation → Selected Agent → Response
                ↓                                      ↓
            Q-Table Update ← RL Feedback ← Performance Metrics
```

## Reward Structure

The system uses a deterministic reward function (0-1 scale):

| Component | Reward | Condition |
|-----------|--------|-----------|
| Intent Match | +0.25 | Query intent correctly identified |
| Agent Correct | +0.30 | Correct agent selected for task |
| Conciseness | +0.20 | Response < 500 characters |
| Conciseness | +0.10 | Response < 1000 characters |
| Accuracy | +0.20 | Factually correct response |
| Speed Bonus | +0.05 | Response time < 500ms |

Maximum possible reward: 1.0

## Configuration

### Enable RL System

Set environment variable:
```bash
export RL_ENABLED=true
```

Or in `.env` file:
```env
RL_ENABLED=true
```

### Q-Table Persistence

Q-table is automatically saved to `data/q_table.json` every 100 interactions.

## API Endpoints

### 1. Submit Feedback
```http
POST /api/feedback
Content-Type: application/json

{
  "query": "O que é a Lei Paulo Gustavo?",
  "intent": "INFO",
  "agent_name": "CulturalAgent",
  "response": "A Lei Paulo Gustavo é...",
  "user_signal": 0.8  // Optional: manual feedback (0-1)
}
```

### 2. Get Statistics
```http
GET /api/rl/stats

Response:
{
  "avg_score": 0.82,
  "best_agent": "Discovery",
  "total_interactions": 1543,
  "improvement_rate": "+12%",
  "q_table_size": 45
}
```

### 3. Get Score History
```http
GET /api/rl/scores?limit=50

Response:
{
  "enabled": true,
  "scores": [0.71, 0.85, 0.92, ...],
  "count": 50,
  "average": 0.79
}
```

## Usage Example

### Python Integration

```python
from agents.rl_feedback import RLFeedbackIntegration

# Initialize
rl_feedback = RLFeedbackIntegration(enabled=True)

# Track response
feedback = rl_feedback.track_response(
    query="Buscar filmes sobre meio ambiente",
    intent="SEARCH",
    agent_name="DiscoveryAgent",
    response="Encontrei 3 produções...",
    elapsed_time_ms=450
)

# Output: [0.85] Discovery → 483 chars in 450ms

# Get recommendation
recommended_agent = rl_feedback.get_agent_recommendation(
    query_intent="INFO",
    query="Sobre leis culturais"
)
# Returns: "Cultural"

# Get statistics
stats = rl_feedback.get_stats()
```

### Testing

Run the test script:
```bash
python test_rl_system.py
```

## Q-Learning Parameters

- **Learning Rate (α)**: 0.1 (fixed)
- **Discount Factor (γ)**: 0.9 (fixed)
- **Exploration Rate (ε)**: 0 (100% deterministic)

## State Representation

States are encoded as: `{intent}:{agent}:{length_category}`

Example: `INFO:Cultural:medium`

Length categories:
- `short`: < 50 characters
- `medium`: 50-150 characters
- `long`: > 150 characters

## Performance Metrics

The system tracks:
- Average Q-value score
- Best performing agent
- Total interactions
- Improvement rate (% change between first and last 20 interactions)
- Q-table size (number of state-action pairs)

## Benefits

1. **Predictable Behavior**: Deterministic rewards ensure consistent learning
2. **Fast Adaptation**: Higher learning rate for quick improvement
3. **Low Overhead**: Minimal computation and storage requirements
4. **Easy Debugging**: Concise output makes issues obvious
5. **Gradual Improvement**: Learns optimal agent selection over time

## Monitoring

Check system performance:
```bash
# View RL stats
curl http://localhost:3000/api/rl/stats

# Monitor concise logs
tail -f logs/app.log | grep "\["

# Example output:
[0.85] Cinema → 3 films found
[0.92] Cultural → Lei Paulo Gustavo info
[0.71] Discovery → Similar productions
```

## Troubleshooting

### RL Not Working
1. Check `RL_ENABLED=true` is set
2. Verify Q-table file permissions in `data/` directory
3. Check agent_manager initialization logs

### Low Scores
1. Review reward components in feedback
2. Check if agents are responding correctly
3. Verify intent classification accuracy

### Q-Table Not Persisting
1. Create `data/` directory if missing
2. Check write permissions
3. Verify auto-save triggers every 100 interactions

## Future Improvements

- [ ] Add decay for old Q-values
- [ ] Implement multi-armed bandit for exploration
- [ ] Add context-aware state encoding
- [ ] Support for composite agent actions
- [ ] Real-time dashboard for metrics

## License

Part of Bitaca Cinema project - MIT License