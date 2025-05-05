"""
Tests for the Order Status service functions.
"""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
import uuid
from app.services.order_status_service import (
    transition_order_status, get_valid_status_transitions,
    get_status_timeline
)


# Test data
TEST_UUID = str(uuid.uuid4())
TEST_USER_ID = str(uuid.uuid4())
TEST_ORDER = {
    "id": TEST_UUID,
    "customer_id": str(uuid.uuid4()),
    "status": "pending",
    "total": 59.98,
    "created_at": "2023-01-01T00:00:00",
    "updated_at": "2023-01-01T00:00:00",
    "items": [
        {
            "product_id": str(uuid.uuid4()),
            "quantity": 2,
            "price": 29.99
        }
    ]
}

TEST_STATUS_HISTORY = [
    {
        "id": str(uuid.uuid4()),
        "order_id": TEST_UUID,
        "status": "pending",
        "previous_status": None,
        "timestamp": "2023-01-01T00:00:00",
        "user_id": TEST_USER_ID,
        "notes": "Order created"
    }
]


# Mock Supabase client
@pytest.fixture
def mock_supabase():
    """Mock the Supabase client for database operations."""
    with patch("app.services.order_status_service.supabase") as mock_client:
        # Configure the mock to return appropriate values
        mock_select = AsyncMock()
        mock_select.execute = AsyncMock(return_value={"data": TEST_STATUS_HISTORY})
        
        mock_insert = AsyncMock()
        mock_insert.execute = AsyncMock(return_value={"data": [TEST_STATUS_HISTORY[0]]})
        
        mock_update = AsyncMock()
        mock_update.eq = AsyncMock(return_value=mock_update)
        mock_update.execute = AsyncMock(return_value={"data": [TEST_ORDER]})
        
        # Configure the table method
        mock_client.table.return_value.select = AsyncMock(return_value=mock_select)
        mock_client.table.return_value.insert = AsyncMock(return_value=mock_insert)
        mock_client.table.return_value.update = AsyncMock(return_value=mock_update)
        
        yield mock_client


# Mock order service
@pytest.fixture
def mock_order_service():
    """Mock the order service functions."""
    with patch("app.services.order_status_service.order_service") as mock_service:
        mock_service.get_order_by_id = AsyncMock(return_value=TEST_ORDER)
        mock_service.update_order = AsyncMock(return_value=dict(TEST_ORDER, status="processing"))
        
        yield mock_service


class TestOrderStatusService:
    """Tests for the Order Status service functions."""
    
    @pytest.mark.asyncio
    async def test_get_valid_status_transitions(self):
        """Test getting valid status transitions."""
        # Test transitions from pending
        transitions = await get_valid_status_transitions("pending")
        assert "processing" in transitions
        assert "cancelled" in transitions
        
        # Test transitions from processing
        transitions = await get_valid_status_transitions("processing")
        assert "shipped" in transitions
        assert "cancelled" in transitions
        
        # Test transitions from an invalid status
        transitions = await get_valid_status_transitions("invalid_status")
        assert transitions == []
    
    @pytest.mark.asyncio
    async def test_get_status_timeline(self, mock_supabase):
        """Test getting the status timeline for an order."""
        result = await get_status_timeline(TEST_UUID)
        
        # Verify the Supabase client was called correctly
        mock_supabase.table.assert_called_with("order_status_history")
        mock_supabase.table().select.assert_called()
        
        # Verify the result
        assert result == TEST_STATUS_HISTORY
    
    @pytest.mark.asyncio
    async def test_transition_order_status(self, mock_supabase, mock_order_service):
        """Test transitioning an order's status."""
        # Test a valid transition with admin role
        result = await transition_order_status(
            order_id=TEST_UUID,
            new_status="processing",
            user_id=TEST_USER_ID,
            user_role="admin",
            notes="Order is being processed"
        )
        
        # Verify the order service was called correctly
        mock_order_service.get_order_by_id.assert_called_with(TEST_UUID)
        mock_order_service.update_order.assert_called()
        
        # Verify the status history was recorded
        mock_supabase.table.assert_called_with("order_status_history")
        mock_supabase.table().insert.assert_called()
        
        # Verify the result
        assert result["status"] == "processing"
        
        # Test an invalid transition
        with pytest.raises(Exception):
            await transition_order_status(
                order_id=TEST_UUID,
                new_status="delivered",  # Can't go directly from pending to delivered
                user_id=TEST_USER_ID,
                user_role="admin"
            )
        
        # Test a transition with customer role (should be more restricted)
        # Reset mocks
        mock_order_service.get_order_by_id.reset_mock()
        mock_order_service.update_order.reset_mock()
        
        # This should pass for a customer cancelling their own order
        result = await transition_order_status(
            order_id=TEST_UUID,
            new_status="cancelled",
            user_id=TEST_UUID,
            user_role="customer",
            notes="Customer changed their mind"
        )
        
        # Verify the order service was called correctly
        mock_order_service.get_order_by_id.assert_called_with(TEST_UUID)
        
        # Verify the result
        assert result["status"] == "processing"  # Status from the mock 