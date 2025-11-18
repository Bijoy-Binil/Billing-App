import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def normal_user(db):
    return User.objects.create_user(
        username="normal", password="pass123"
    )

@pytest.fixture
def manager_user(db):
    # adjust this depending on your permission logic
    return User.objects.create_user(
        username="manager",
        password="pass123",
        is_staff=True  # used by IsManagerOrReadOnly
    )
