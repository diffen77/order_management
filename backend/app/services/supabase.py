"""
Supabase service module for handling database operations.
This is a wrapper around the Supabase client to provide specific functionality.
"""
from app.utils.db import get_supabase_client
from app.utils.logging import setup_logger
from supabase import Client
from typing import Dict, Any, List, Optional

logger = setup_logger(__name__)

def get_data_from_table(table_name: str, query_params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Get data from a specific table with optional query parameters.
    
    Args:
        table_name: The name of the table to query
        query_params: Dictionary of query parameters (e.g., {"column": "value"})
        
    Returns:
        List of records matching the query
    """
    supabase: Client = get_supabase_client()
    query = supabase.table(table_name).select("*")
    
    # Apply query parameters if provided
    if query_params:
        for key, value in query_params.items():
            query = query.eq(key, value)
    
    try:
        response = query.execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching data from table {table_name}: {str(e)}")
        raise

def insert_into_table(table_name: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Insert data into a specific table.
    
    Args:
        table_name: The name of the table to insert into
        data: Dictionary of data to insert
        
    Returns:
        The inserted record
    """
    supabase: Client = get_supabase_client()
    try:
        response = supabase.table(table_name).insert(data).execute()
        return response.data[0] if response.data else {}
    except Exception as e:
        logger.error(f"Error inserting data into table {table_name}: {str(e)}")
        raise 