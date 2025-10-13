"""
Bitaca Cinema - Google Gemini API Integration
Alternative LLM provider with thinking capabilities and Google Search
"""

import os
import json
import asyncio
from typing import Dict, Any, Optional, List, AsyncIterator
from datetime import datetime

from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()


class GeminiIntegration:
    """
    Google Gemini API integration for Bitaca Cinema
    Provides access to Gemini models with special capabilities
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Gemini client

        Args:
            api_key: Google AI API key (or from environment)
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment")

        self.client = genai.Client(api_key=self.api_key)

        # Available models
        self.models = {
            "flash": "gemini-2.0-flash-exp",  # Fast, general purpose
            "pro": "gemini-2.0-pro-exp",  # Advanced reasoning with thinking
            "flash-thinking": "gemini-2.0-flash-thinking-exp",  # Flash with thinking
        }

        print(f"✅ Gemini API initialized with models: {list(self.models.keys())}")

    async def generate_content(
        self,
        prompt: str,
        model: str = "flash",
        thinking_enabled: bool = False,
        search_enabled: bool = False,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        stream: bool = False
    ) -> Dict[str, Any]:
        """
        Generate content using Gemini models

        Args:
            prompt: User prompt
            model: Model to use (flash, pro, flash-thinking)
            thinking_enabled: Enable thinking mode (pro/flash-thinking only)
            search_enabled: Enable Google Search tool
            temperature: Temperature for generation
            max_tokens: Maximum tokens to generate
            stream: Enable streaming response

        Returns:
            Dict with response and metadata
        """
        try:
            # Select model
            model_name = self.models.get(model, self.models["flash"])

            # Build contents
            contents = [
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=prompt)]
                )
            ]

            # Configure generation
            config_params = {
                "temperature": temperature,
                "max_output_tokens": max_tokens,
            }

            # Add thinking config if enabled and supported
            if thinking_enabled and model in ["pro", "flash-thinking"]:
                config_params["thinking_config"] = types.ThinkingConfig(
                    thinking_budget=-1  # Unlimited thinking
                )

            # Add tools if needed
            tools = []
            if search_enabled:
                tools.append(types.Tool(googleSearch=types.GoogleSearch()))

            generate_config = types.GenerateContentConfig(
                **config_params,
                tools=tools if tools else None
            )

            # Generate response
            if stream:
                return await self._stream_response(
                    model_name, contents, generate_config
                )
            else:
                response = await asyncio.to_thread(
                    self.client.models.generate_content,
                    model=model_name,
                    contents=contents,
                    config=generate_config
                )

                # Extract thinking if present
                thinking_text = None
                if hasattr(response, 'thoughts') and response.thoughts:
                    thinking_text = ' '.join([t.text for t in response.thoughts])

                return {
                    "response": response.text if response else "",
                    "model": model_name,
                    "thinking": thinking_text,
                    "metadata": {
                        "thinking_enabled": thinking_enabled,
                        "search_enabled": search_enabled,
                        "model_type": model
                    }
                }

        except Exception as e:
            print(f"❌ Gemini generation error: {e}")
            raise

    async def _stream_response(
        self,
        model_name: str,
        contents: List[types.Content],
        config: types.GenerateContentConfig
    ) -> AsyncIterator[str]:
        """
        Stream response from Gemini

        Yields:
            Chunks of generated text
        """
        try:
            # Run in thread pool for async compatibility
            def generate():
                return self.client.models.generate_content_stream(
                    model=model_name,
                    contents=contents,
                    config=config
                )

            stream = await asyncio.to_thread(generate)

            for chunk in stream:
                if chunk and chunk.text:
                    yield chunk.text

        except Exception as e:
            print(f"❌ Gemini streaming error: {e}")
            yield f"Error: {str(e)}"

    async def generate_with_thinking(
        self,
        prompt: str,
        context: Optional[str] = None,
        search: bool = False
    ) -> Dict[str, Any]:
        """
        Generate response with deep thinking mode

        Args:
            prompt: User query
            context: Additional context
            search: Enable Google Search

        Returns:
            Response with thinking process
        """
        # Build enhanced prompt with context
        full_prompt = prompt
        if context:
            full_prompt = f"Context: {context}\n\nQuery: {prompt}"

        # Use Pro model with thinking
        return await self.generate_content(
            prompt=full_prompt,
            model="pro",
            thinking_enabled=True,
            search_enabled=search,
            temperature=0.5,  # Lower for reasoning
            max_tokens=2000
        )

    async def analyze_production(
        self,
        production_title: str,
        production_data: Dict[str, Any]
    ) -> str:
        """
        Analyze a film production using Gemini

        Args:
            production_title: Title of the production
            production_data: Production metadata

        Returns:
            Analysis text
        """
        prompt = f"""
        Analyze the following film production from Capão Bonito:

        Title: {production_title}
        Director: {production_data.get('diretor', 'Unknown')}
        Theme: {production_data.get('tema', 'Unknown')}
        Synopsis: {production_data.get('sinopse', 'No synopsis available')}
        Score: LPG {production_data.get('lpg_score', 0)} / PNAB {production_data.get('pnab_score', 0)}

        Provide insights about:
        1. Cultural significance
        2. Thematic relevance to the community
        3. Artistic merit based on the synopsis
        4. Connection to Brazilian cultural laws (Lei Paulo Gustavo/PNAB)

        Answer in Brazilian Portuguese, 2-3 paragraphs.
        """

        response = await self.generate_content(
            prompt=prompt,
            model="flash",
            temperature=0.7
        )

        return response["response"]

    async def chat_with_history(
        self,
        messages: List[Dict[str, str]],
        model: str = "flash",
        thinking: bool = False
    ) -> str:
        """
        Chat with conversation history

        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Model to use
            thinking: Enable thinking mode

        Returns:
            Generated response
        """
        # Convert messages to Gemini format
        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg["content"])]
                )
            )

        # Generate response
        result = await self.generate_content(
            prompt="",  # Prompt is in contents
            model=model,
            thinking_enabled=thinking
        )

        return result["response"]

    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about available models

        Returns:
            Dict with model capabilities
        """
        return {
            "provider": "Google AI",
            "models": {
                "gemini-2.0-flash-exp": {
                    "name": "Flash",
                    "description": "Fast general-purpose model",
                    "features": ["fast", "efficient", "general"],
                    "thinking": False,
                    "search": True
                },
                "gemini-2.0-pro-exp": {
                    "name": "Pro",
                    "description": "Advanced reasoning with deep thinking",
                    "features": ["reasoning", "analysis", "complex_tasks"],
                    "thinking": True,
                    "search": True
                },
                "gemini-2.0-flash-thinking-exp": {
                    "name": "Flash Thinking",
                    "description": "Flash model with thinking capabilities",
                    "features": ["fast", "thinking", "balanced"],
                    "thinking": True,
                    "search": True
                }
            },
            "capabilities": [
                "Deep thinking mode",
                "Google Search integration",
                "Multi-turn conversations",
                "Complex reasoning",
                "Real-time information"
            ]
        }


class GeminiStreamHandler:
    """
    Handler for streaming responses from Gemini
    Compatible with FastAPI StreamingResponse
    """

    def __init__(self, gemini: GeminiIntegration):
        self.gemini = gemini

    async def stream_sse(
        self,
        prompt: str,
        model: str = "flash",
        thinking: bool = False,
        search: bool = False
    ):
        """
        Stream Server-Sent Events format

        Yields:
            SSE formatted chunks
        """
        try:
            # Start streaming
            async for chunk in self.gemini._stream_response(
                model_name=self.gemini.models[model],
                contents=[
                    types.Content(
                        role="user",
                        parts=[types.Part.from_text(text=prompt)]
                    )
                ],
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=1000,
                    thinking_config=types.ThinkingConfig(thinking_budget=-1) if thinking else None,
                    tools=[types.Tool(googleSearch=types.GoogleSearch())] if search else None
                )
            ):
                # Format as SSE
                data = {
                    "choices": [{
                        "delta": {"content": chunk},
                        "index": 0
                    }]
                }
                yield f"data: {json.dumps(data)}\n\n"

            # Send completion signal
            yield "data: [DONE]\n\n"

        except Exception as e:
            error_data = {"error": str(e)}
            yield f"data: {json.dumps(error_data)}\n\n"


# Singleton instance
_gemini_instance: Optional[GeminiIntegration] = None


def get_gemini_client() -> GeminiIntegration:
    """
    Get or create Gemini client singleton

    Returns:
        GeminiIntegration instance
    """
    global _gemini_instance

    if _gemini_instance is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not configured")

        _gemini_instance = GeminiIntegration(api_key)

    return _gemini_instance


# Test function
async def test_gemini():
    """Test Gemini integration"""
    try:
        gemini = get_gemini_client()

        # Test basic generation
        print("\n🧪 Testing basic generation...")
        response = await gemini.generate_content(
            prompt="O que é o Bitaca Cinema em uma frase?",
            model="flash"
        )
        print(f"Response: {response['response']}")

        # Test with thinking
        print("\n🧪 Testing thinking mode...")
        thinking_response = await gemini.generate_with_thinking(
            prompt="Por que a Lei Paulo Gustavo é importante para o cinema brasileiro?",
            search=False
        )
        print(f"Response: {thinking_response['response']}")
        if thinking_response.get('thinking'):
            print(f"Thinking: {thinking_response['thinking'][:200]}...")

        print("\n✅ Gemini integration test complete!")

    except Exception as e:
        print(f"❌ Test failed: {e}")


if __name__ == "__main__":
    # Run test
    asyncio.run(test_gemini())