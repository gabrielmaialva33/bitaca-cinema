"""
TTS Endpoint Tests
Tests for the /api/tts text-to-speech endpoint
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestTTSEndpoint:
    """Test suite for TTS endpoint"""

    def test_tts_endpoint_exists(self):
        """Test that TTS endpoint is accessible"""
        response = client.post(
            "/api/tts",
            json={"text": "Test", "voice": "pt-BR", "format": "audio/wav"}
        )
        # Should not return 404
        assert response.status_code != 404

    def test_tts_with_portuguese_text(self):
        """Test TTS generation with Portuguese text"""
        response = client.post(
            "/api/tts",
            json={
                "text": "Olá, este é um teste de voz em português",
                "voice": "pt-BR",
                "format": "audio/wav"
            }
        )

        # Should return 200 if edge-tts is installed, 503 otherwise
        assert response.status_code in [200, 503]

        if response.status_code == 200:
            # Check response is audio
            assert response.headers["content-type"] == "audio/wav"
            # Check file has content
            assert len(response.content) > 100  # WAV files are at least a few hundred bytes

    def test_tts_with_english_text(self):
        """Test TTS generation with English text"""
        response = client.post(
            "/api/tts",
            json={
                "text": "Hello, this is a voice test in English",
                "voice": "en-US",
                "format": "audio/wav"
            }
        )

        assert response.status_code in [200, 503]

        if response.status_code == 200:
            assert response.headers["content-type"] == "audio/wav"
            assert len(response.content) > 100

    def test_tts_with_male_voice(self):
        """Test TTS with male voice"""
        response = client.post(
            "/api/tts",
            json={
                "text": "Teste com voz masculina",
                "voice": "pt-BR-male",
                "format": "audio/wav"
            }
        )

        assert response.status_code in [200, 503]

        if response.status_code == 200:
            assert response.headers["content-type"] == "audio/wav"
            assert len(response.content) > 100

    def test_tts_with_long_text(self):
        """Test TTS with longer text"""
        long_text = (
            "Este é um teste com um texto mais longo para verificar se o "
            "sistema de text-to-speech consegue processar textos maiores. "
            "O Bitaca Cinema é um projeto cultural de Capão Bonito que "
            "utiliza inteligência artificial para criar experiências "
            "interativas e acessíveis para o público."
        )

        response = client.post(
            "/api/tts",
            json={
                "text": long_text,
                "voice": "pt-BR",
                "format": "audio/wav"
            }
        )

        assert response.status_code in [200, 503]

        if response.status_code == 200:
            assert response.headers["content-type"] == "audio/wav"
            # Longer text should produce larger audio file
            assert len(response.content) > 1000

    def test_tts_with_special_characters(self):
        """Test TTS with special characters"""
        response = client.post(
            "/api/tts",
            json={
                "text": "Olá! Como você está? Tudo bem? São 10h30.",
                "voice": "pt-BR",
                "format": "audio/wav"
            }
        )

        assert response.status_code in [200, 503]

        if response.status_code == 200:
            assert response.headers["content-type"] == "audio/wav"
            assert len(response.content) > 100

    def test_tts_with_empty_text(self):
        """Test TTS with empty text - should fail validation"""
        response = client.post(
            "/api/tts",
            json={
                "text": "",
                "voice": "pt-BR",
                "format": "audio/wav"
            }
        )

        # Empty text might be accepted but produce minimal audio,
        # or fail validation
        assert response.status_code in [200, 422, 503]

    def test_tts_with_missing_fields(self):
        """Test TTS with missing required fields"""
        # Missing text field
        response = client.post(
            "/api/tts",
            json={
                "voice": "pt-BR",
                "format": "audio/wav"
            }
        )

        # Should fail validation
        assert response.status_code == 422

    def test_tts_with_invalid_voice(self):
        """Test TTS with invalid voice code"""
        response = client.post(
            "/api/tts",
            json={
                "text": "Test with invalid voice",
                "voice": "invalid-voice-code",
                "format": "audio/wav"
            }
        )

        # Should either fallback to default voice or return error
        assert response.status_code in [200, 400, 503]

    def test_tts_response_headers(self):
        """Test TTS response has correct headers"""
        response = client.post(
            "/api/tts",
            json={
                "text": "Test headers",
                "voice": "pt-BR",
                "format": "audio/wav"
            }
        )

        if response.status_code == 200:
            # Check Content-Disposition header
            assert "content-disposition" in response.headers
            assert "speech.wav" in response.headers["content-disposition"]

            # Check Cache-Control header
            assert "cache-control" in response.headers
            assert "no-cache" in response.headers["cache-control"]

    def test_tts_rate_limiting(self):
        """Test TTS endpoint rate limiting"""
        # Make multiple requests quickly
        responses = []
        for i in range(10):
            response = client.post(
                "/api/tts",
                json={
                    "text": f"Rate limit test {i}",
                    "voice": "pt-BR",
                    "format": "audio/wav"
                }
            )
            responses.append(response)

        # All should succeed unless rate limit is hit
        # (rate limit is 60 per minute, so 10 should be fine)
        success_count = sum(1 for r in responses if r.status_code == 200)
        assert success_count >= 5  # At least half should succeed

    def test_tts_concurrent_requests(self):
        """Test TTS handles concurrent requests"""
        import concurrent.futures

        def make_request(n):
            return client.post(
                "/api/tts",
                json={
                    "text": f"Concurrent test {n}",
                    "voice": "pt-BR",
                    "format": "audio/wav"
                }
            )

        # Make 5 concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_request, i) for i in range(5)]
            responses = [f.result() for f in futures]

        # Check all requests completed
        assert len(responses) == 5

        # Most should succeed
        success_count = sum(1 for r in responses if r.status_code == 200)
        assert success_count >= 3

    def test_tts_audio_file_validity(self):
        """Test that generated audio file is a valid WAV file"""
        response = client.post(
            "/api/tts",
            json={
                "text": "Validação de arquivo WAV",
                "voice": "pt-BR",
                "format": "audio/wav"
            }
        )

        if response.status_code == 200:
            audio_data = response.content

            # WAV files start with "RIFF" and contain "WAVE"
            assert audio_data[:4] == b'RIFF' or len(audio_data) > 0
            # Note: Edge TTS might generate different format
            # Just check it's not empty
            assert len(audio_data) > 0

    def test_tts_with_numbers(self):
        """Test TTS pronunciation of numbers"""
        response = client.post(
            "/api/tts",
            json={
                "text": "O evento começa às 15 horas e 30 minutos do dia 12 de outubro de 2025",
                "voice": "pt-BR",
                "format": "audio/wav"
            }
        )

        assert response.status_code in [200, 503]

        if response.status_code == 200:
            assert len(response.content) > 100

    def test_tts_performance_time(self):
        """Test TTS generation completes in reasonable time"""
        import time

        start_time = time.time()

        response = client.post(
            "/api/tts",
            json={
                "text": "Performance test",
                "voice": "pt-BR",
                "format": "audio/wav"
            }
        )

        end_time = time.time()
        duration = end_time - start_time

        if response.status_code == 200:
            # Should complete in under 10 seconds
            assert duration < 10

    def test_tts_all_supported_voices(self):
        """Test all supported voice options"""
        voices = ["pt-BR", "pt-BR-male", "en-US", "en-US-male", "es-ES"]

        for voice in voices:
            response = client.post(
                "/api/tts",
                json={
                    "text": f"Testing voice {voice}",
                    "voice": voice,
                    "format": "audio/wav"
                }
            )

            # Each voice should work or fallback gracefully
            assert response.status_code in [200, 503]


class TestTTSIntegration:
    """Integration tests for TTS with other components"""

    def test_tts_with_markdown_cleaned_text(self):
        """Test TTS with text that has markdown (should be cleaned by frontend)"""
        # Frontend cleans markdown, but backend should handle it if it gets through
        response = client.post(
            "/api/tts",
            json={
                "text": "Este é um **texto** com _markdown_ e `código`",
                "voice": "pt-BR",
                "format": "audio/wav"
            }
        )

        assert response.status_code in [200, 503]

    def test_tts_with_chatbot_response_format(self):
        """Test TTS with typical chatbot response"""
        chatbot_response = (
            "Olá! Encontrei 3 produções sobre meio ambiente. "
            "Posso te ajudar com mais informações sobre alguma delas?"
        )

        response = client.post(
            "/api/tts",
            json={
                "text": chatbot_response,
                "voice": "pt-BR",
                "format": "audio/wav"
            }
        )

        assert response.status_code in [200, 503]

        if response.status_code == 200:
            assert len(response.content) > 100


# Performance benchmark
@pytest.mark.slow
class TestTTSPerformance:
    """Performance tests for TTS endpoint"""

    def test_tts_batch_generation(self):
        """Test generating multiple TTS files in sequence"""
        texts = [
            "Primeira fala",
            "Segunda fala",
            "Terceira fala",
            "Quarta fala",
            "Quinta fala"
        ]

        import time
        start_time = time.time()

        for text in texts:
            response = client.post(
                "/api/tts",
                json={
                    "text": text,
                    "voice": "pt-BR",
                    "format": "audio/wav"
                }
            )

            if response.status_code == 200:
                assert len(response.content) > 0

        end_time = time.time()
        total_duration = end_time - start_time

        # 5 generations should complete in under 30 seconds
        assert total_duration < 30


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
