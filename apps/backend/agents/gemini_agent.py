"""
Bitaca Cinema - Gemini Agent
Specialized agent using Google Gemini for complex reasoning and search
"""

from typing import Dict, Any, Optional
import asyncio

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from gemini_integration import get_gemini_client, GeminiIntegration


class GeminiAgent:
    """
    Specialized agent powered by Google Gemini
    Features deep thinking mode and Google Search integration
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Gemini agent

        Args:
            api_key: Google AI API key (optional, uses env if not provided)
        """
        try:
            self.gemini = get_gemini_client() if not api_key else GeminiIntegration(api_key)
            self.enabled = True
            print("✅ GeminiAgent initialized successfully")
        except Exception as e:
            print(f"⚠️ GeminiAgent initialization failed: {e}")
            self.gemini = None
            self.enabled = False

    async def process_query(
        self,
        query: str,
        context: Optional[Dict[str, Any]] = None,
        use_thinking: bool = False,
        use_search: bool = False
    ) -> str:
        """
        Process query with Gemini

        Args:
            query: User query
            context: Additional context
            use_thinking: Enable deep thinking mode
            use_search: Enable Google Search

        Returns:
            Generated response
        """
        if not self.enabled or not self.gemini:
            return "Gemini agent não está disponível no momento."

        try:
            # Build context prompt
            context_text = ""
            if context:
                if context.get('productions'):
                    context_text += "\n\nProduções relevantes:\n"
                    for prod in context['productions'][:3]:
                        context_text += f"- {prod.get('titulo', 'Unknown')}: {prod.get('sinopse', '')[:100]}...\n"

                if context.get('history'):
                    context_text += "\n\nHistórico da conversa:\n"
                    for msg in context['history'][-3:]:
                        context_text += f"{msg['role']}: {msg['content'][:100]}...\n"

            # Enhance prompt with Bitaca context
            enhanced_prompt = f"""
            Você é um assistente do Bitaca Cinema em Capão Bonito/SP.

            Contexto do projeto:
            - Espaço cultural underground e democrático
            - 23 produções audiovisuais financiadas pela Lei Paulo Gustavo
            - Eixos temáticos: Patrimônio & Memória, Cultura Musical, Meio Ambiente
            - Localização: Galeria Bitaca Café Bar

            {context_text}

            Query do usuário: {query}

            Responda em português brasileiro, sendo acolhedor e informativo.
            """

            # Decide which model and features to use
            if use_thinking or "complex" in query.lower() or "analise" in query.lower():
                # Use Pro model with thinking for complex queries
                response = await self.gemini.generate_with_thinking(
                    prompt=enhanced_prompt,
                    search=use_search
                )
            else:
                # Use Flash for simple queries
                response = await self.gemini.generate_content(
                    prompt=enhanced_prompt,
                    model="flash",
                    thinking_enabled=False,
                    search_enabled=use_search,
                    temperature=0.7
                )

            return response.get("response", "Não consegui gerar uma resposta.")

        except Exception as e:
            print(f"❌ GeminiAgent error: {e}")
            return f"Erro ao processar com Gemini: {str(e)}"

    async def analyze_cultural_impact(
        self,
        production_data: Dict[str, Any]
    ) -> str:
        """
        Analyze cultural impact of a production using Gemini's reasoning

        Args:
            production_data: Production information

        Returns:
            Cultural analysis
        """
        if not self.enabled or not self.gemini:
            return "Análise não disponível."

        prompt = f"""
        Analise o impacto cultural desta produção de Capão Bonito:

        Título: {production_data.get('titulo')}
        Diretor: {production_data.get('diretor')}
        Eixo Temático: {production_data.get('eixo')}
        Sinopse: {production_data.get('sinopse')}

        Considere:
        1. Relevância para a identidade local
        2. Preservação da memória cultural
        3. Contribuição para o audiovisual paulista
        4. Alinhamento com as políticas culturais (Lei Paulo Gustavo)
        5. Potencial educativo e social

        Use raciocínio profundo para conectar a obra ao contexto cultural brasileiro.
        """

        response = await self.gemini.generate_with_thinking(
            prompt=prompt,
            search=True  # Enable search for cultural context
        )

        return response.get("response", "Análise não disponível.")

    async def search_and_recommend(
        self,
        query: str,
        productions: list
    ) -> Dict[str, Any]:
        """
        Search for information and recommend productions

        Args:
            query: Search query
            productions: Available productions

        Returns:
            Recommendations with reasoning
        """
        if not self.enabled or not self.gemini:
            return {
                "recommendations": [],
                "reasoning": "Serviço não disponível"
            }

        # Build productions context
        prod_context = "\n".join([
            f"- {p.get('titulo')}: {p.get('sinopse', '')[:100]}..."
            for p in productions[:10]
        ])

        prompt = f"""
        Com base na busca do usuário e nas produções disponíveis do Bitaca Cinema,
        faça recomendações personalizadas.

        Busca do usuário: {query}

        Produções disponíveis:
        {prod_context}

        Use o Google Search se necessário para entender melhor o contexto da busca.
        Recomende 3-5 produções explicando o porquê de cada escolha.
        Considere temas, estilos e relevância cultural.
        """

        response = await self.gemini.generate_content(
            prompt=prompt,
            model="pro",
            thinking_enabled=True,
            search_enabled=True,
            temperature=0.6
        )

        # Parse response to extract recommendations
        text = response.get("response", "")

        return {
            "recommendations": text,
            "reasoning": response.get("thinking", ""),
            "search_used": True
        }

    async def compare_with_nvidia(
        self,
        query: str,
        nvidia_response: str
    ) -> str:
        """
        Compare/enhance NVIDIA response using Gemini

        Args:
            query: Original query
            nvidia_response: Response from NVIDIA model

        Returns:
            Enhanced or validated response
        """
        if not self.enabled or not self.gemini:
            return nvidia_response  # Fallback to original

        prompt = f"""
        Revise e melhore esta resposta sobre o Bitaca Cinema:

        Query original: {query}

        Resposta atual: {nvidia_response}

        Se necessário:
        - Corrija informações incorretas
        - Adicione contexto relevante sobre Capão Bonito
        - Torne mais acolhedor e cultural
        - Mantenha conciso (2-3 parágrafos)

        Use seu conhecimento e busca se necessário.
        """

        response = await self.gemini.generate_content(
            prompt=prompt,
            model="flash",
            search_enabled=True,
            temperature=0.5
        )

        return response.get("response", nvidia_response)

    def get_agent_info(self) -> Dict[str, Any]:
        """Get agent information"""
        return {
            "name": "GeminiAgent",
            "provider": "Google AI",
            "enabled": self.enabled,
            "models": [
                "gemini-2.0-flash-exp",
                "gemini-2.0-pro-exp",
                "gemini-2.0-flash-thinking-exp"
            ],
            "capabilities": [
                "Deep thinking mode",
                "Google Search integration",
                "Complex reasoning",
                "Real-time information",
                "Cultural analysis"
            ],
            "specialization": "Complex reasoning and web search"
        }

    async def stream_response(
        self,
        query: str,
        model: str = "flash",
        thinking: bool = False
    ):
        """
        Stream response for real-time output

        Args:
            query: User query
            model: Gemini model to use
            thinking: Enable thinking mode

        Yields:
            Response chunks
        """
        if not self.enabled or not self.gemini:
            yield "Gemini streaming não disponível."
            return

        try:
            async for chunk in self.gemini._stream_response(
                model_name=self.gemini.models[model],
                contents=[{
                    "role": "user",
                    "parts": [{"text": query}]
                }],
                config={
                    "temperature": 0.7,
                    "max_output_tokens": 1000,
                    "thinking_enabled": thinking
                }
            ):
                yield chunk

        except Exception as e:
            yield f"Erro no streaming: {str(e)}"


# Test function
async def test_gemini_agent():
    """Test Gemini agent"""
    print("\n🧪 Testing GeminiAgent...")

    agent = GeminiAgent()

    if not agent.enabled:
        print("❌ GeminiAgent not available (no API key)")
        return

    # Test basic query
    print("\n1. Testing basic query...")
    response = await agent.process_query(
        query="O que é o Bitaca Cinema?",
        use_thinking=False
    )
    print(f"Response: {response[:200]}...")

    # Test with thinking
    print("\n2. Testing with thinking mode...")
    response = await agent.process_query(
        query="Analise a importância cultural das produções de Capão Bonito",
        use_thinking=True
    )
    print(f"Response: {response[:200]}...")

    # Test cultural analysis
    print("\n3. Testing cultural impact analysis...")
    production = {
        "titulo": "Ponteia Viola",
        "diretor": "Margarida Chaves",
        "eixo": "Patrimônio & Memória",
        "sinopse": "Documentário sobre a tradição da viola caipira"
    }
    analysis = await agent.analyze_cultural_impact(production)
    print(f"Analysis: {analysis[:200]}...")

    print("\n✅ GeminiAgent test complete!")


if __name__ == "__main__":
    asyncio.run(test_gemini_agent())