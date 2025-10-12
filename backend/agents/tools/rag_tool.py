"""
Bitaca Cinema - RAG Tool for Agno Agents
Integrates with existing embeddings system
"""

from typing import Optional
import httpx
import numpy as np


class RAGTool:
    """Tool for semantic search over Bitaca Cinema productions using RAG"""

    def __init__(self, embeddings_data: list, nvidia_api_key: str):
        self.embeddings = embeddings_data
        self.nvidia_api_key = nvidia_api_key
        self.embed_url = "https://integrate.api.nvidia.com/v1/embeddings"

    async def search_productions(self, query: str, top_k: int = 3) -> list:
        """
        Search for relevant productions using semantic similarity

        Args:
            query: User query string
            top_k: Number of results to return

        Returns:
            List of relevant productions with metadata
        """
        # Generate query embedding
        query_embedding = await self._generate_embedding(query)

        if not query_embedding:
            return []

        # Calculate similarities
        similarities = []
        for item in self.embeddings:
            prod_embedding = item.get('embedding')
            if prod_embedding:
                similarity = self._cosine_similarity(query_embedding, prod_embedding)
                similarities.append({
                    'titulo': item.get('titulo'),
                    'diretor': item.get('metadata', {}).get('diretor'),
                    'tema': item.get('metadata', {}).get('tema'),
                    'sinopse': item.get('metadata', {}).get('sinopse'),
                    'eixo': item.get('metadata', {}).get('eixo'),
                    'similarity': similarity
                })

        # Sort by similarity and return top_k
        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        return similarities[:top_k]

    async def _generate_embedding(self, text: str) -> Optional[list]:
        """Generate embedding for text using NVIDIA API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.embed_url,
                    headers={
                        "Authorization": f"Bearer {self.nvidia_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "nvidia/nv-embedqa-e5-v5",
                        "input": text,
                        "input_type": "query",
                        "encoding_format": "float"
                    },
                    timeout=30.0
                )

                if response.status_code == 200:
                    data = response.json()
                    return data['data'][0]['embedding']
                return None
        except Exception as e:
            print(f"Error generating embedding: {e}")
            return None

    def _cosine_similarity(self, vec1: list, vec2: list) -> float:
        """Calculate cosine similarity between two vectors"""
        try:
            a = np.array(vec1)
            b = np.array(vec2)
            return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))
        except:
            return 0.0
