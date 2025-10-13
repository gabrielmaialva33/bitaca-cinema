"""
Bitaca Cinema - Cinema Agent
Specialized agent for audiovisual productions knowledge
"""

from typing import Dict, Any

from agno.agent import Agent
from agno.models.openai import OpenAIChat


class CinemaAgent:
    """
    Specialized agent for cinema and audiovisual productions
    Expert in directors, themes, synopses, and production details
    """

    def __init__(self, nvidia_api_key: str, model_id: str = "meta/llama-3.3-70b-instruct"):
        self.nvidia_api_key = nvidia_api_key
        self.model_id = model_id

        # Create Agno agent with cinema expertise
        self.agent = Agent(
            name="CinemaAgent",
            model=OpenAIChat(
                id=model_id,
                api_key=nvidia_api_key,
                base_url="https://integrate.api.nvidia.com/v1"
            ),
            description="Expert in Bitaca Cinema audiovisual productions",
            instructions=[
                "You are a cinema expert specializing in Bitaca Cinema productions.",
                "You have deep knowledge about directors, themes, synopses, and production details.",
                "When discussing productions, always mention:",
                "- Director name",
                "- Theme/axis (Patrimônio, Música, Ambiente)",
                "- Brief synopsis",
                "- Cultural relevance",
                "Answer in Brazilian Portuguese with enthusiasm about cinema.",
                "Be concise but informative (2-3 paragraphs maximum).",
                "Use cultural references when appropriate."
            ],
            markdown=True
        )

    async def process_query(self, query: str, context: Dict[str, Any] = None) -> str:
        """
        Process a cinema-related query

        Args:
            query: User question about cinema
            context: Optional context (relevant productions, etc.)

        Returns:
            Agent response
        """
        try:
            # Build enhanced prompt with context
            enhanced_query = query

            if context and context.get('productions'):
                prods = context['productions']
                context_text = "\n\nProduções relevantes encontradas:\n"
                for i, prod in enumerate(prods[:3], 1):
                    context_text += f"\n{i}. **{prod.get('titulo')}**\n"
                    context_text += f"   - Diretor: {prod.get('diretor')}\n"
                    context_text += f"   - Tema: {prod.get('tema')}\n"
                    context_text += f"   - Sinopse: {prod.get('sinopse', '')[:150]}...\n"

                enhanced_query = query + context_text

            # Get agent response with error handling
            try:
                response = self.agent.run(enhanced_query)
                response_content = response.content if response else None
            except Exception as agent_error:
                print(f"❌ Cinema agent run error: {agent_error}")
                response_content = None

            # Fallback response
            if not response_content:
                return "Eae parceiro! Sou do Bitaca Cinema. Te ajudo com informações sobre nossas produções!"

            return response_content

        except Exception as e:
            print(f"❌ Cinema agent error: {e}")
            return "Eae parceiro! Sou do Bitaca Cinema. Te ajudo com informações sobre nossas produções!"

    def get_agent_info(self) -> Dict[str, str]:
        """Get agent information"""
        return {
            "name": "CinemaAgent",
            "specialization": "Audiovisual productions",
            "model": self.model_id,
            "expertise": ["Directors", "Themes", "Synopses", "Cultural context"]
        }
