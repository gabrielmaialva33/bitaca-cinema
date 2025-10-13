#!/usr/bin/env python3
"""
Test Gemini integration
"""

import asyncio
import os
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Set API key
os.environ['GEMINI_API_KEY'] = 'AIzaSyDxCL4l8w5WRL-pAzfFTRGCemU14FEZmOs'

# Import Gemini integration
from gemini_integration import GeminiIntegration


async def main():
    """Test Gemini API"""
    print("🧪 Testing Gemini API Integration")
    print("=" * 60)

    try:
        # Initialize Gemini
        gemini = GeminiIntegration()

        # Test 1: Basic generation
        print("\n1. Testing basic generation (Flash model)...")
        response = await gemini.generate_content(
            prompt="O que é o Bitaca Cinema em uma frase?",
            model="flash",
            temperature=0.7
        )
        print(f"✅ Response: {response['response']}")
        print(f"   Model: {response['model']}")

        # Test 2: With thinking (Pro model)
        print("\n2. Testing thinking mode (Pro model)...")
        response = await gemini.generate_with_thinking(
            prompt="Por que a Lei Paulo Gustavo é importante para o cinema brasileiro? Pense profundamente sobre o impacto cultural.",
            search=False
        )
        print(f"✅ Response: {response['response'][:300]}...")
        if response.get('thinking'):
            print(f"   💭 Thinking detected: {len(response['thinking'])} characters")

        # Test 3: With search
        print("\n3. Testing with Google Search...")
        response = await gemini.generate_content(
            prompt="Quais são as últimas notícias sobre cinema em Capão Bonito?",
            model="flash",
            search_enabled=True
        )
        print(f"✅ Response: {response['response'][:300]}...")

        print("\n" + "=" * 60)
        print("✅ All tests passed!")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        print(f"   Type: {type(e).__name__}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())