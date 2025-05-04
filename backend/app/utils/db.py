"""
Database utility module for Supabase connection.
"""
from typing import Optional
from supabase import create_client, Client
from .logging import setup_logger

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