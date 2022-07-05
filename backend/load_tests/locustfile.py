from locust import HttpUser
from locust import between
from locust import task


class QuickstartUser(HttpUser):
    wait_time = between(1, 5)

    def on_start(self):
        self.client.post(
            "/api/auth/login",
            json={"username": "admin@admin.admin", "password": "admin@admin.admin"},
        )

    @task
    def read_status(self):
        self.client.get("/api/users/1/workspaces/1/contents/read_status")
