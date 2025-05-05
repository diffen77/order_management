"""
Database utility module for Supabase connection.
"""
from typing import Optional, List, Dict, Any, Union
from supabase import create_client, Client
from .logging import setup_logger
import asyncio

# Importing after logging setup to avoid circular imports
from .config import settings

# Set up logger
logger = setup_logger(__name__)

# Create Supabase client
_supabase_client: Optional[Client] = None

def get_supabase_client() -> Client:
    """
    Returns the Supabase client instance. Initializes the client if needed.
    
    Returns:
        The Supabase client instance.
        
    Raises:
        ValueError: If Supabase credentials are missing.
    """
    global _supabase_client
    
    if _supabase_client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
            error_msg = "Missing Supabase credentials. Please check your .env file."
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        try:
            logger.info(f"Initializing Supabase client with URL: {settings.SUPABASE_URL}")
            _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            error_msg = f"Failed to initialize Supabase client: {str(e)}"
            logger.error(error_msg)
            raise ConnectionError(error_msg) from e
    
    return _supabase_client

def reset_connection() -> None:
    """
    Reset the Supabase connection.
    Useful for testing or when needing to refresh the connection.
    """
    global _supabase_client
    _supabase_client = None
    logger.info("Supabase connection reset")

async def execute_query(query: str, params: List[Any] = None) -> None:
    """
    Execute a SQL query that doesn't return results (INSERT, UPDATE, DELETE).
    
    Args:
        query: SQL query string with placeholders
        params: List of parameters to substitute placeholders
        
    Raises:
        Exception: If query execution fails
    """
    client = get_supabase_client()
    try:
        logger.debug(f"Executing query: {query} with params: {params}")
        # Use Supabase's rpc function to execute raw SQL
        # This wraps the query into a function call
        function_name = "execute_sql"
        result = client.rpc(
            function_name,
            { 
                "query_text": query,
                "params": params or []
            }
        ).execute()
        
        if hasattr(result, 'error') and result.error:
            raise Exception(f"Query execution error: {result.error}")
        
        logger.debug("Query executed successfully")
    except Exception as e:
        logger.error(f"Failed to execute query: {e}")
        raise

async def fetch_one(query: str, params: List[Any] = None) -> Optional[Dict[str, Any]]:
    """
    Execute a SQL query and return the first row.
    
    Args:
        query: SQL query string with placeholders
        params: List of parameters to substitute placeholders
        
    Returns:
        Dictionary representing the first row or None if no rows returned
        
    Raises:
        Exception: If query execution fails
    """
    client = get_supabase_client()
    try:
        logger.debug(f"Fetching one row with query: {query} with params: {params}")
        # Use Supabase's rpc function to execute raw SQL
        function_name = "execute_sql_fetch"
        result = client.rpc(
            function_name,
            { 
                "query_text": query,
                "params": params or []
            }
        ).execute()
        
        if hasattr(result, 'error') and result.error:
            raise Exception(f"Query execution error: {result.error}")
        
        data = result.data
        if data and len(data) > 0:
            logger.debug(f"Fetched one row: {data[0]}")
            return data[0]
        else:
            logger.debug("No rows returned")
            return None
    except Exception as e:
        logger.error(f"Failed to fetch row: {e}")
        raise

async def fetch_all(query: str, params: List[Any] = None) -> List[Dict[str, Any]]:
    """
    Execute a SQL query and return all rows.
    
    Args:
        query: SQL query string with placeholders
        params: List of parameters to substitute placeholders
        
    Returns:
        List of dictionaries representing all rows returned by the query
        
    Raises:
        Exception: If query execution fails
    """
    client = get_supabase_client()
    try:
        logger.debug(f"Fetching all rows with query: {query} with params: {params}")
        # Use Supabase's rpc function to execute raw SQL
        function_name = "execute_sql_fetch"
        result = client.rpc(
            function_name,
            { 
                "query_text": query,
                "params": params or []
            }
        ).execute()
        
        if hasattr(result, 'error') and result.error:
            raise Exception(f"Query execution error: {result.error}")
        
        data = result.data
        logger.debug(f"Fetched {len(data)} rows")
        return data
    except Exception as e:
        logger.error(f"Failed to fetch rows: {e}")
        raise 