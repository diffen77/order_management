"""
Logging utilities for the application.
"""
import logging
import os
from typing import Optional

def setup_logger(name: str, level: Optional[str] = None) -> logging.Logger:
    """
    Set up a logger with consistent formatting.
    
    Args:
        name: Name of the logger
        level: Logging level (defaults to value from environment or INFO)
        
    Returns:
        Configured logger instance
    """
    # Determine the log level from environment or use default
    log_level_str = level or os.getenv("LOG_LEVEL", "INFO")
    log_level = getattr(logging, log_level_str.upper(), logging.INFO)
    
    logger = logging.getLogger(name)
    logger.setLevel(log_level)
    
    # Avoid adding handlers if they already exist
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    
    return logger 