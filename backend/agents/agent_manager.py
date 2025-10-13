"""
Bitaca Cinema - Agent Manager
Orchestrates multi-agent system using Agno framework
"""

import os
import time
from typing import Dict, Any

from agents.cinema_agent import CinemaAgent
from agents.cultural_agent import CulturalAgent
from agents.discovery_agent import DiscoveryAgent
from agents.rl_feedback import RLFeedbackIntegration


class AgentManager:
    """
    Central orchestrator for Bitaca Cinema AGI system
    Coordinates CinemaAgent, CulturalAgent, and DiscoveryAgent
    """

    def __init__(self, nvidia_api_key: str, embeddings_data: list):
        self.nvidia_api_key = nvidia_api_key

        # Initialize specialized agents
        self.cinema_agent = CinemaAgent(nvidia_api_key)
        self.cultural_agent = CulturalAgent(nvidia_api_key)
        self.discovery_agent = DiscoveryAgent(nvidia_api_key, embeddings_data)

        # Agent capabilities mapping
        self.agents = {
            'cinema': self.cinema_agent,
            'cultural': self.cultural_agent,
            'discovery': self.discovery_agent
        }

        # Initialize RL feedback system (enabled via environment variable)
        rl_enabled = os.getenv('RL_ENABLED', 'false').lower() == 'true'
        self.rl_feedback = RLFeedbackIntegration(enabled=rl_enabled)
        if rl_enabled:
            print("✅ RL Feedback System enabled")

    async def process_query(self, query: str, intent: str = None, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Main orchestration method - routes query to appropriate agent(s)

        Args:
            query: User query text
            intent: Detected intent (CHAT, SEARCH, RECOMMEND, INFO)
            context: Additional context (conversation history, etc.)

        Returns:
            Dict with agent response and metadata
        """
        # Start timing
        start_time = time.time()

        print(f"\n🧠 AgentManager processing query: '{query[:50]}...'")
        print(f"📊 Intent: {intent}")

        # Classify which agent(s) should handle this
        agent_classification = self._classify_query(query, intent)
        print(f"🎯 Agent classification: {agent_classification}")

        # Route to appropriate agent
        result = None
        agent_name = None

        if agent_classification['primary'] == 'discovery':
            # Discovery agent handles search and recommendations
            result = await self.discovery_agent.process_query(
                query=query,
                search_enabled=agent_classification.get('use_rag', True)
            )
            agent_name = 'DiscoveryAgent'
            result = {
                'response': result['response'],
                'agent': agent_name,
                'productions': result.get('productions', []),
                'metadata': {
                    'search_performed': result.get('search_performed', False),
                    'intent': intent
                }
            }

        elif agent_classification['primary'] == 'cultural':
            # Cultural agent handles laws and policies
            response = await self.cultural_agent.process_query(
                query=query,
                context=context
            )
            return {
                'response': response,
                'agent': 'CulturalAgent',
                'metadata': {
                    'intent': intent,
                    'topic': 'cultural_laws'
                }
            }

        elif agent_classification['primary'] == 'cinema':
            # Cinema agent handles production details
            # Check if we need discovery context first
            cinema_context = context or {}

            if agent_classification.get('needs_search', False):
                # First get relevant productions via discovery
                search_result = await self.discovery_agent.process_query(
                    query=query,
                    search_enabled=True
                )
                cinema_context['productions'] = search_result.get('productions', [])

            response = await self.cinema_agent.process_query(
                query=query,
                context=cinema_context
            )
            return {
                'response': response,
                'agent': 'CinemaAgent',
                'metadata': {
                    'intent': intent,
                    'used_discovery': agent_classification.get('needs_search', False)
                }
            }

        else:
            # Default to discovery for general queries
            result = await self.discovery_agent.process_query(query=query)
            return {
                'response': result['response'],
                'agent': 'DiscoveryAgent (default)',
                'metadata': {'intent': intent}
            }

    def _classify_query(self, query: str, intent: str = None) -> Dict[str, Any]:
        """
        Classify which agent should handle the query

        Returns:
            Dict with 'primary' agent and additional routing info
        """
        query_lower = query.lower()

        # Check RL recommendation first if enabled
        if self.rl_feedback.enabled:
            recommended_agent = self.rl_feedback.get_agent_recommendation(
                query_intent=intent or 'GENERAL',
                query=query
            )
            if recommended_agent:
                print(f"[RL] Recommended agent: {recommended_agent}")
                return {
                    'primary': recommended_agent.lower(),
                    'use_rag': recommended_agent == 'Discovery',
                    'confidence': 'rl_recommendation'
                }

        # Cultural law keywords
        cultural_keywords = [
            'lei paulo gustavo', 'paulo gustavo', 'lpg',
            'pnab', 'aldir blanc', 'política nacional',
            'edital', 'financiamento', 'verba', 'recurso',
            'lei de incentivo', 'lei cultural', 'política cultural',
            'secretaria', 'ministério da cultura'
        ]

        # Cinema/production keywords
        cinema_keywords = [
            'diretor', 'dirigido por', 'quem dirigiu',
            'sinopse', 'sobre o que', 'enredo', 'história',
            'tema', 'eixo temático', 'produção',
            'filme', 'documentário', 'curta'
        ]

        # Search/discovery keywords
        search_keywords = [
            'buscar', 'procurar', 'encontrar', 'pesquisar',
            'recomendar', 'recomende', 'sugira', 'sugestão',
            'similar', 'parecido', 'semelhante',
            'sobre', 'fala de', 'mostra', 'trata'
        ]

        # Count matches
        cultural_score = sum(1 for kw in cultural_keywords if kw in query_lower)
        cinema_score = sum(1 for kw in cinema_keywords if kw in query_lower)
        search_score = sum(1 for kw in search_keywords if kw in query_lower)

        # Intent-based routing
        if intent == 'SEARCH' or intent == 'RECOMMEND':
            return {
                'primary': 'discovery',
                'use_rag': True,
                'confidence': 'high'
            }

        # Keyword-based routing
        if cultural_score > 0:
            return {
                'primary': 'cultural',
                'confidence': 'high' if cultural_score >= 2 else 'medium'
            }

        if cinema_score > search_score and cinema_score > 0:
            return {
                'primary': 'cinema',
                'needs_search': True,  # Cinema agent may need production context
                'confidence': 'medium'
            }

        if search_score > 0 or intent in ['SEARCH', 'RECOMMEND']:
            return {
                'primary': 'discovery',
                'use_rag': True,
                'confidence': 'high'
            }

        # Default: discovery agent with RAG
        return {
            'primary': 'discovery',
            'use_rag': True,
            'confidence': 'low'
        }

    async def recommend_similar(self, production_title: str) -> Dict[str, Any]:
        """
        Delegate to discovery agent for similarity recommendations
        """
        result = await self.discovery_agent.recommend_similar(production_title)
        return {
            'response': result['response'],
            'agent': 'DiscoveryAgent',
            'productions': result.get('productions', []),
            'metadata': {'function': 'recommend_similar'}
        }

    def get_system_info(self) -> Dict[str, Any]:
        """
        Get information about the multi-agent system
        """
        return {
            'system': 'Bitaca Cinema AGI',
            'architecture': 'Multi-Agent System (Agno)',
            'agents': {
                'cinema': self.cinema_agent.get_agent_info(),
                'cultural': self.cultural_agent.get_agent_info(),
                'discovery': self.discovery_agent.get_agent_info()
            },
            'capabilities': [
                'Semantic search with RAG',
                'Personalized recommendations',
                'Cultural law expertise',
                'Cinema production knowledge',
                'Multi-agent orchestration'
            ],
            'models_used': [
                'meta/llama-3.3-70b-instruct (Cinema & Discovery)',
                'qwen/qwen3-next-80b-a3b-thinking (Cultural reasoning)',
                'nvidia/nv-embedqa-e5-v5 (RAG embeddings)'
            ]
        }

    async def health_check(self) -> Dict[str, bool]:
        """
        Check health of all agents
        """
        return {
            'cinema_agent': self.cinema_agent is not None,
            'cultural_agent': self.cultural_agent is not None,
            'discovery_agent': self.discovery_agent is not None,
            'embeddings_loaded': len(self.discovery_agent.rag_tool.embeddings) > 0,
            'system_ready': True
        }
