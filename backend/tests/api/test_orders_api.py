"""
Tests for the Orders API endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from uuid import uuid4, UUID
import json
from app.main import app

client = TestClient(app)

# Test data
TEST_USER = {
    "id": str(uuid4()),
    "email": "test@example.com",
    "role": "admin"
}

TEST_ORDER_DATA = {
    "customer_id": str(uuid4()),
    "items": [
        {
            "product_id": str(uuid4()),
            "quantity": 2,
            "price": 29.99
        }
    ],
    "shipping_address": {
        "street": "123 Test St",
        "city": "Testville",
        "state": "TS",
        "postal_code": "12345",
        "country": "Testland"
    },
    "billing_address": {
        "street": "123 Test St",
        "city": "Testville",
        "state": "TS",
        "postal_code": "12345",
        "country": "Testland"
    },
    "payment_method": "credit_card",
    "notes": "Test order"
}


# Fixtures for authentication
@pytest.fixture
def auth_header():
    """Mock authentication header for test user."""
    return {"Authorization": f"Bearer test_token_for_{TEST_USER['id']}"}


# Mock the auth dependency
@pytest.fixture(autouse=True)
def mock_get_current_user(monkeypatch):
    """Mock the authentication dependency to return a test user."""
    def mock_user():
        return TEST_USER
    
    def mock_require_permission(permission):
        def inner():
            return TEST_USER
        return inner
    
    monkeypatch.setattr("app.routes.orders.get_current_user", mock_user)
    monkeypatch.setattr("app.routes.orders.require_permission", mock_require_permission)


# Mock database service calls
@pytest.fixture(autouse=True)
def mock_order_services(monkeypatch):
    """Mock the order service functions."""
    
    async def mock_get_orders(**kwargs):
        return [
            {
                "id": str(uuid4()),
                "customer_id": TEST_ORDER_DATA["customer_id"],
                "status": "pending",
                "total": 59.98,
                "created_at": "2023-01-01T00:00:00",
                "updated_at": "2023-01-01T00:00:00",
                "items": TEST_ORDER_DATA["items"]
            }
        ]
    
    async def mock_get_order_by_id(order_id):
        return {
            "id": str(order_id),
            "customer_id": TEST_ORDER_DATA["customer_id"],
            "status": "pending",
            "total": 59.98,
            "created_at": "2023-01-01T00:00:00",
            "updated_at": "2023-01-01T00:00:00",
            "items": TEST_ORDER_DATA["items"],
            "shipping_address": TEST_ORDER_DATA["shipping_address"],
            "billing_address": TEST_ORDER_DATA["billing_address"],
            "payment_method": TEST_ORDER_DATA["payment_method"],
            "notes": TEST_ORDER_DATA["notes"]
        }
    
    async def mock_create_order(order_data, user_id):
        return {
            "id": str(uuid4()),
            "customer_id": order_data.customer_id,
            "status": "pending",
            "total": 59.98,
            "created_at": "2023-01-01T00:00:00",
            "updated_at": "2023-01-01T00:00:00",
            "items": order_data.items,
            "shipping_address": order_data.shipping_address.dict(),
            "billing_address": order_data.billing_address.dict(),
            "payment_method": order_data.payment_method,
            "notes": order_data.notes
        }
    
    async def mock_update_order(order_id, order_data, user_id):
        return {
            "id": str(order_id),
            "customer_id": TEST_ORDER_DATA["customer_id"],
            "status": "pending",
            "total": 59.98,
            "created_at": "2023-01-01T00:00:00",
            "updated_at": "2023-01-01T00:00:00",
            "items": TEST_ORDER_DATA["items"],
            "shipping_address": TEST_ORDER_DATA["shipping_address"],
            "billing_address": TEST_ORDER_DATA["billing_address"],
            "payment_method": TEST_ORDER_DATA["payment_method"],
            "notes": order_data.notes or TEST_ORDER_DATA["notes"]
        }
    
    async def mock_delete_order(order_id):
        return None
    
    async def mock_get_status_timeline(order_id):
        return [
            {
                "id": str(uuid4()),
                "order_id": str(order_id),
                "status": "pending",
                "timestamp": "2023-01-01T00:00:00",
                "user": TEST_USER["id"]
            }
        ]
    
    async def mock_valid_status_transitions(current_status):
        transitions = {
            "pending": ["processing", "cancelled"],
            "processing": ["shipped", "cancelled"],
            "shipped": ["delivered", "returned"],
            "delivered": ["returned"],
            "cancelled": [],
            "returned": []
        }
        return transitions.get(current_status, [])
    
    async def mock_transition_status(order_id, new_status, user_id, user_role, notes=None):
        return {
            "id": str(order_id),
            "customer_id": TEST_ORDER_DATA["customer_id"],
            "status": new_status,
            "total": 59.98,
            "created_at": "2023-01-01T00:00:00",
            "updated_at": "2023-01-01T00:00:00",
            "items": TEST_ORDER_DATA["items"],
            "shipping_address": TEST_ORDER_DATA["shipping_address"],
            "billing_address": TEST_ORDER_DATA["billing_address"],
            "payment_method": TEST_ORDER_DATA["payment_method"],
            "notes": notes or TEST_ORDER_DATA["notes"]
        }
    
    async def mock_add_order_note(order_id, note_data, user_id):
        return {
            "id": str(uuid4()),
            "order_id": str(order_id),
            "content": note_data.content,
            "is_internal": note_data.is_internal,
            "timestamp": "2023-01-01T00:00:00",
            "user_id": str(user_id)
        }
    
    # Patch the order service functions
    monkeypatch.setattr("app.routes.orders.get_orders", mock_get_orders)
    monkeypatch.setattr("app.routes.orders.get_order_by_id", mock_get_order_by_id)
    monkeypatch.setattr("app.routes.orders.create_order", mock_create_order)
    monkeypatch.setattr("app.routes.orders.update_order", mock_update_order)
    monkeypatch.setattr("app.routes.orders.delete_order", mock_delete_order)
    monkeypatch.setattr("app.routes.orders.get_status_timeline", mock_get_status_timeline)
    monkeypatch.setattr("app.routes.orders.get_valid_status_transitions", mock_valid_status_transitions)
    monkeypatch.setattr("app.routes.orders.transition_order_status", mock_transition_status)
    monkeypatch.setattr("app.routes.orders.add_order_note", mock_add_order_note)


class TestOrdersAPI:
    """Tests for the Orders API endpoints."""
    
    def test_list_orders(self, auth_header):
        """Test listing orders."""
        response = client.get("/api/orders/", headers=auth_header)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if data:
            assert "id" in data[0]
            assert "status" in data[0]
            assert "items" in data[0]
    
    def test_create_order(self, auth_header):
        """Test creating a new order."""
        response = client.post(
            "/api/orders/",
            json=TEST_ORDER_DATA,
            headers=auth_header
        )
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert "status" in data
        assert data["status"] == "pending"
        assert "items" in data
    
    def test_get_order_by_id(self, auth_header):
        """Test getting a specific order by ID."""
        order_id = str(uuid4())
        response = client.get(f"/api/orders/{order_id}", headers=auth_header)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == order_id
        assert "status" in data
        assert "items" in data
        assert "shipping_address" in data
        assert "billing_address" in data
    
    def test_update_order(self, auth_header):
        """Test updating an order."""
        order_id = str(uuid4())
        update_data = {
            "notes": "Updated test notes"
        }
        response = client.put(
            f"/api/orders/{order_id}",
            json=update_data,
            headers=auth_header
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == order_id
        assert data["notes"] == update_data["notes"]
    
    def test_update_order_status(self, auth_header):
        """Test updating an order's status."""
        order_id = str(uuid4())
        status_data = {
            "status": "processing",
            "notes": "Order is being processed"
        }
        response = client.patch(
            f"/api/orders/{order_id}/status",
            json=status_data,
            headers=auth_header
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == order_id
        assert data["status"] == status_data["status"]
    
    def test_get_order_timeline(self, auth_header):
        """Test getting an order's timeline."""
        order_id = str(uuid4())
        response = client.get(f"/api/orders/{order_id}/timeline", headers=auth_header)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if data:
            assert "order_id" in data[0]
            assert "status" in data[0]
            assert "timestamp" in data[0]
    
    def test_get_available_status_transitions(self, auth_header):
        """Test getting available status transitions for an order."""
        order_id = str(uuid4())
        response = client.get(f"/api/orders/{order_id}/status/transitions", headers=auth_header)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_add_note_to_order(self, auth_header):
        """Test adding a note to an order."""
        order_id = str(uuid4())
        note_data = {
            "content": "Test note content",
            "is_internal": False
        }
        response = client.post(
            f"/api/orders/{order_id}/notes",
            json=note_data,
            headers=auth_header
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["content"] == note_data["content"]
        assert data["is_internal"] == note_data["is_internal"]
    
    def test_delete_order(self, auth_header):
        """Test deleting an order."""
        order_id = str(uuid4())
        response = client.delete(f"/api/orders/{order_id}", headers=auth_header)
        assert response.status_code == 204
    
    def test_cancel_order(self, auth_header):
        """Test cancelling an order."""
        order_id = str(uuid4())
        cancel_data = {
            "reason": "Test cancellation"
        }
        response = client.patch(
            f"/api/orders/{order_id}/cancel",
            json=cancel_data,
            headers=auth_header
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == order_id
        assert data["status"] == "cancelled" 