"""
Bitaca Cinema - Cultural Agent
Specialized agent for cultural laws and public policies
"""

from typing import Dict, Any

from agno.agent import Agent
from agno.models.openai import OpenAIChat


class CulturalAgent:
    """
    Specialized agent for cultural laws and policies
    Expert in Lei Paulo Gustavo, PNAB, and cultural funding
    """

    def __init__(self, nvidia_api_key: str, model_id: str = "meta/llama-3.3-70b-instruct"):
        self.nvidia_api_key = nvidia_api_key
        self.model_id = model_id

        # Create Agno agent with cultural policy expertise
        self.agent = Agent(
            name="CulturalAgent",
            model=OpenAIChat(
                id=model_id,
                api_key=nvidia_api_key,
                base_url="https://integrate.api.nvidia.com/v1"
            ),
            description="Expert in Brazilian cultural laws and public policies",
            instructions=[
                "You are an expert in Brazilian cultural laws and funding policies.",
                "You specialize in:",
                "- Lei Paulo Gustavo (LC nº 195/2022)",
                "- PNAB - Política Nacional Aldir Blanc (Lei nº 14.399/2022)",
                "- Cultural funding mechanisms",
                "- Impact on local communities",
                "",
                "Key facts you must know:",
                "- Lei Paulo Gustavo: R$ 64.000 (Edital 03 Audiovisual) + R$ 75.000 (Edital 04)",
                "- PNAB: Continuous funding 2023-2027",
                "- Both laws support cultural democratization",
                "- Paulo Gustavo was created in response to pandemic impacts",
                "- Aldir Blanc ensures structural investment",
                "",
                "Answer in Brazilian Portuguese with educational tone.",
                "Explain complex legal concepts in simple terms.",
                "Provide context about cultural impact.",
                "Be informative but accessible (2-3 paragraphs)."
            ],
            markdown=True
        )

    async def process_query(self, query: str, context: Dict[str, Any] = None) -> str:
        """
        Process a cultural policy query

        Args:
            query: User question about cultural laws
            context: Optional additional context

        Returns:
            Agent response
        """
        try:
            # Add specific context if available
            enhanced_query = query

            if context:
                if context.get('law_type') == 'paulo_gustavo':
                    enhanced_query += "\n\nContexto: Lei Paulo Gustavo em Capão Bonito - Editais 03 e 04/2024"
                elif context.get('law_type') == 'pnab':
                    enhanced_query += "\n\nContexto: PNAB - Edital 005/2024 em análise"

            # Get agent response with error handling
            try:
                response = self.agent.run(enhanced_query)
                response_content = response.content if response else None
            except Exception as agent_error:
                print(f"❌ Cultural agent run error: {agent_error}")
                response_content = None

            # Fallback response
            if not response_content:
                return "Eae! Te ajudo com informações sobre as leis de fomento cultural, Lei Paulo Gustavo e PNAB!"

            return response_content

        except Exception as e:
            print(f"❌ Cultural agent error: {e}")
            return "Eae! Te ajudo com informações sobre as leis de fomento cultural, Lei Paulo Gustavo e PNAB!"

    def get_agent_info(self) -> Dict[str, str]:
        """Get agent information"""
        return {
            "name": "CulturalAgent",
            "specialization": "Cultural laws and policies",
            "model": self.model_id,
            "expertise": ["Lei Paulo Gustavo", "PNAB", "Cultural funding", "Public policies"]
        }
