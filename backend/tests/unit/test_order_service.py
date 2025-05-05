"""
Tests for the Order service functions.
"""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
import uuid
from app.services.order_service import (
    get_orders, get_order_by_id, create_order, update_order,
    delete_order, add_order_note
)


# Test data for orders
TEST_UUID = str(uuid.uuid4())
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


# Mock Supabase client
@pytest.fixture
def mock_supabase():
    """Mock the Supabase client for database operations."""
    with patch("app.services.order_service.supabase") as mock_client:
        # Configure the mock to return appropriate values
        mock_select = AsyncMock()
        mock_select.execute = AsyncMock(return_value={"data": [TEST_ORDER]})
        
        mock_insert = AsyncMock()
        mock_insert.execute = AsyncMock(return_value={"data": [TEST_ORDER]})
        
        mock_update = AsyncMock()
        mock_update.eq = AsyncMock(return_value=mock_update)
        mock_update.execute = AsyncMock(return_value={"data": [TEST_ORDER]})
        
        mock_delete = AsyncMock()
        mock_delete.eq = AsyncMock(return_value=mock_delete)
        mock_delete.execute = AsyncMock(return_value={"data": None})
        
        # Configure the table method
        mock_client.table.return_value.select = AsyncMock(return_value=mock_select)
        mock_client.table.return_value.insert = AsyncMock(return_value=mock_insert)
        mock_client.table.return_value.update = AsyncMock(return_value=mock_update)
        mock_client.table.return_value.delete = AsyncMock(return_value=mock_delete)
        
        yield mock_client


class TestOrderService:
    """Tests for the Order service functions."""
    
    @pytest.mark.asyncio
    async def test_get_orders(self, mock_supabase):
        """Test getting a list of orders."""
        # Test with default parameters
        result = await get_orders()
        
        # Verify the Supabase client was called correctly
        mock_supabase.table.assert_called_with("orders")
        mock_supabase.table().select.assert_called()
        
        # Verify the result
        assert result == [TEST_ORDER]
        
        # Test with filtering parameters
        result = await get_orders(
            skip=10,
            limit=20,
            customer_id=TEST_ORDER["customer_id"],
            status="pending"
        )
        
        # Results should still be the same due to our mock
        assert result == [TEST_ORDER]
    
    @pytest.mark.asyncio
    async def test_get_order_by_id(self, mock_supabase):
        """Test getting a specific order by ID."""
        result = await get_order_by_id(TEST_UUID)
        
        # Verify the Supabase client was called correctly
        mock_supabase.table.assert_called_with("orders")
        
        # The select method should be called with a filter on the ID
        select_call = mock_supabase.table().select.call_args
        
        # Verify the result
        assert result == TEST_ORDER
    
    @pytest.mark.asyncio
    async def test_create_order(self, mock_supabase):
        """Test creating a new order."""
        # Create a mock order data object
        order_data = MagicMock()
        order_data.dict.return_value = {
            "customer_id": TEST_ORDER["customer_id"],
            "items": TEST_ORDER["items"],
            "shipping_address": TEST_ORDER["shipping_address"],
            "billing_address": TEST_ORDER["billing_address"],
            "payment_method": TEST_ORDER["payment_method"],
            "notes": TEST_ORDER["notes"]
        }
        
        user_id = str(uuid.uuid4())
        
        result = await create_order(order_data, user_id)
        
        # Verify the Supabase client was called correctly
        mock_supabase.table.assert_called_with("orders")
        mock_supabase.table().insert.assert_called()
        
        # Verify the result
        assert result == TEST_ORDER
    
    @pytest.mark.asyncio
    async def test_update_order(self, mock_supabase):
        """Test updating an existing order."""
        # Create a mock order update data object
        order_data = MagicMock()
        order_data.dict.return_value = {
            "notes": "Updated test notes"
        }
        order_data.exclude_unset.return_value = order_data
        order_data.exclude_none.return_value = order_data
        order_data.notes = "Updated test notes"
        
        user_id = str(uuid.uuid4())
        
        result = await update_order(TEST_UUID, order_data, user_id)
        
        # Verify the Supabase client was called correctly
        mock_supabase.table.assert_called_with("orders")
        mock_supabase.table().update.assert_called()
        mock_supabase.table().update().eq.assert_called_with("id", TEST_UUID)
        
        # Verify the result
        assert result == TEST_ORDER
    
    @pytest.mark.asyncio
    async def test_delete_order(self, mock_supabase):
        """Test deleting an order."""
        await delete_order(TEST_UUID)
        
        # Verify the Supabase client was called correctly
        mock_supabase.table.assert_called_with("orders")
        mock_supabase.table().delete.assert_called()
        mock_supabase.table().delete().eq.assert_called_with("id", TEST_UUID)
    
    @pytest.mark.asyncio
    async def test_add_order_note(self, mock_supabase):
        """Test adding a note to an order."""
        note_data = MagicMock()
        note_data.dict.return_value = {
            "content": "Test note content",
            "is_internal": False
        }
        
        user_id = str(uuid.uuid4())
        
        result = await add_order_note(TEST_UUID, note_data, user_id)
        
        # Verify the Supabase client was called correctly
        mock_supabase.table.assert_called_with("order_notes")
        mock_supabase.table().insert.assert_called()
        
        # Verify the result
        assert result == TEST_ORDER 