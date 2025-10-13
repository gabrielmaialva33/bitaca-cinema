"""
Load Testing for Bitaca Play 3D Streaming Bridge

Usage:
    pip install locust
    locust -f locustfile.py --host=http://localhost:8001

Open browser: http://localhost:8089
"""

from locust import HttpUser, task, between
import random


class BitacaStreamingBridgeUser(HttpUser):
    """Simulated user for load testing"""

    # Wait 1-3 seconds between tasks
    wait_time = between(1, 3)

    def on_start(self):
        """Called when a simulated user starts"""
        self.production_ids = list(range(1, 25))  # 24 productions

    @task(10)
    def list_productions(self):
        """List all productions (most common operation)"""
        self.client.get("/api/productions")

    @task(5)
    def list_with_filters(self):
        """List productions with filters"""
        params = random.choice([
            {"genre": "Documentário"},
            {"search": "Capão"},
            {"limit": 10},
            {"genre": "Videoclipe", "limit": 5}
        ])
        self.client.get("/api/productions", params=params)

    @task(8)
    def get_single_production(self):
        """Get single production details"""
        prod_id = random.choice(self.production_ids)
        self.client.get(f"/api/productions/{prod_id}")

    @task(3)
    def get_thumbnail(self):
        """Get production thumbnail"""
        prod_id = random.choice(self.production_ids)
        self.client.get(f"/api/productions/{prod_id}/thumbnail")

    @task(2)
    def track_view(self):
        """Track video view analytics"""
        prod_id = random.choice(self.production_ids)
        self.client.post(
            "/api/analytics/view",
            json={
                "production_id": prod_id,
                "viewer_id": f"test-user-{random.randint(1, 1000)}",
                "duration_seconds": random.randint(30, 300)
            }
        )

    @task(1)
    def health_check(self):
        """Health check endpoint"""
        self.client.get("/health")

    @task(1)
    def root_endpoint(self):
        """Root endpoint"""
        self.client.get("/")

    # Streaming is commented out to avoid overwhelming test environment
    # Uncomment for streaming load tests
    # @task(1)
    # def stream_video(self):
    #     """Stream video (partial request)"""
    #     prod_id = random.choice(self.production_ids)
    #     headers = {"Range": "bytes=0-1048576"}  # First 1MB
    #     self.client.get(
    #         f"/api/productions/{prod_id}/stream",
    #         headers=headers,
    #         name="/api/productions/[id]/stream"
    #     )


class AdminUser(HttpUser):
    """Simulated admin user with different behavior"""

    wait_time = between(5, 10)

    @task(1)
    def check_health(self):
        """Regular health checks"""
        self.client.get("/health")

    @task(1)
    def review_analytics(self):
        """Review production details for analytics"""
        for prod_id in range(1, 6):  # Top 5 productions
            self.client.get(f"/api/productions/{prod_id}")
