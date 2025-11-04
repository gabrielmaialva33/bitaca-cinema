"""
Bitaca Cinema - Discovery Agent
Specialized agent for search and recommendations using RAG
"""

from typing import Dict, Any

from agno.agent import Agent
from agno.models.openai import OpenAIChat

from agents.tools.rag_tool import RAGTool
from deronas_personality import DERONAS_SYSTEM_PROMPT


class DiscoveryAgent:
    """
    Specialized agent for discovering and recommending productions
    Uses RAG (Retrieval Augmented Generation) for intelligent search
    """

    def __init__(self, nvidia_api_key: str, embeddings_data: list,
                 model_id: str = "nvidia/llama-3.1-nemotron-ultra-253b-v1"):
        self.nvidia_api_key = nvidia_api_key
        self.model_id = model_id

        # Initialize RAG tool
        self.rag_tool = RAGTool(embeddings_data, nvidia_api_key)

        # Create Agno agent with Deronas personality + discovery expertise
        deronas_instructions = DERONAS_SYSTEM_PROMPT + """

# INFORMAÇÕES TÉCNICAS DAS PRODUÇÕES
Quando recomendar produções, inclua detalhes técnicos:

Eixos temáticos disponíveis:
- 🏛️ Patrimônio & Memória: preservação histórica, gastronomia, memória cultural
- 🎵 Cultura Musical: do sertanejo ao hip hop, cena musical local
- 🌿 Meio Ambiente & Urbano: natureza, sustentabilidade, espaço urbano

Ao recomendar:
- Explique POR QUE cada produção se encaixa
- Destaque aspectos únicos de cada filme
- Conecte com temas culturais mais amplos
- Sugira ordem de visualização se múltiplos filmes

Máximo de 3-4 parágrafos por resposta, mas seja VISCERAL e AUTÊNTICA!
"""

        self.agent = Agent(
            name="Deronas",
            model=OpenAIChat(
                id=model_id,
                api_key=nvidia_api_key,
                base_url="https://integrate.api.nvidia.com/v1",
                # Parâmetros otimizados para respostas viscerais e criativas
                temperature=0.7,
                top_p=0.8,
                max_tokens=4096
            ),
            description="Deronas - A assistente underground e visceral do Bitaca Cinema (powered by NVIDIA Nemotron-4 340B)",
            instructions=[deronas_instructions],
            markdown=True
        )

    async def process_query(self, query: str, search_enabled: bool = True) -> Dict[str, Any]:
        """
        Process a discovery/recommendation query

        Args:
            query: User search or recommendation request
            search_enabled: Whether to perform RAG search

        Returns:
            Dict with response and found productions
        """
        found_productions = []

        try:
            # Perform RAG search if enabled
            if search_enabled:
                try:
                    found_productions = await self.rag_tool.search_productions(query, top_k=3)
                    print(f"🔍 RAG Search found {len(found_productions)} productions")
                except Exception as rag_error:
                    print(f"⚠️ RAG search failed: {rag_error}")
                    # Continue without RAG results

            # Build context for agent
            context_text = query
            if found_productions:
                context_text += "\n\n**Produções relevantes encontradas:**\n"
                for i, prod in enumerate(found_productions, 1):
                    context_text += f"\n{i}. **{prod['titulo']}**\n"
                    context_text += f"   - Diretor: {prod['diretor']}\n"
                    context_text += f"   - Eixo temático: {prod['eixo']}\n"
                    context_text += f"   - Sinopse: {prod['sinopse'][:200]}...\n"
                    context_text += f"   - Relevância: {prod['similarity']:.0%}\n"

            # Get agent response with error handling
            try:
                response = self.agent.run(context_text)
                response_content = response.content if response else None
            except Exception as agent_error:
                print(f"❌ Agent run error: {agent_error}")
                response_content = None

            # Fallback response if agent fails
            if not response_content:
                if found_productions:
                    response_content = f"Eae parceiro! Encontrei algumas produções massa aqui: {', '.join([p['titulo'] for p in found_productions[:3]])}. Dá uma olhada!"
                else:
                    response_content = "Eae parceiro! Sou a Deronas do Bitaca Cinema. Como posso te ajudar?"

            return {
                "response": response_content,
                "productions": found_productions,
                "search_performed": search_enabled
            }

        except Exception as e:
            print(f"❌ Discovery agent error: {e}")
            # Return fallback response
            return {
                "response": "Eae parceiro! Sou a Deronas do Bitaca Cinema. Como posso te ajudar?",
                "productions": [],
                "search_performed": False
            }

    async def recommend_similar(self, production_title: str) -> Dict[str, Any]:
        """
        Recommend productions similar to a given title

        Args:
            production_title: Title to find similar productions

        Returns:
            Recommendations dict
        """
        query = f"produções similares a {production_title}"
        return await self.process_query(query, search_enabled=True)

    def get_agent_info(self) -> Dict[str, str]:
        """Get agent information"""
        return {
            "name": "Deronas (DiscoveryAgent)",
            "specialization": "Search, recommendations & visceral underground personality",
            "model": self.model_id,
            "model_params": "253B parameters - NVIDIA Nemotron Ultra (most powerful conversational AI)",
            "personality": "Underground, visceral, authentic, democratic",
            "expertise": ["RAG search", "Recommendations", "Theme discovery", "Cultural connections", "Visceral responses"],
            "tools": ["RAG semantic search", "Embedding similarity"],
            "temperature": 0.7,
            "top_p": 0.8,
            "max_tokens": 4096
        }
