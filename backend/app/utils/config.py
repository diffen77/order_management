"""
Configuration module for centralized environment variable access.
"""
import os
from pydantic import BaseSettings, Field
from dotenv import load_dotenv
from .logging import setup_logger

logger = setup_logger(__name__)

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    """
    Application settings loaded from environment variables with defaults.
    """
    # Environment
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    
    # API Settings
    API_HOST: str = Field(default="0.0.0.0", env="API_HOST")
    API_PORT: int = Field(default=8000, env="PORT")
    
    # CORS Settings
    FRONTEND_URL: str = Field(default="http://localhost:5173", env="FRONTEND_URL")
    
    # Supabase Settings
    SUPABASE_URL: str = Field(..., env="SUPABASE_URL")
    SUPABASE_SERVICE_KEY: str = Field(..., env="SUPABASE_SERVICE_KEY")
    
    # JWT Settings
    JWT_SECRET: str = Field(..., env="JWT_SECRET")
    JWT_ALGORITHM: str = Field(default="HS256", env="JWT_ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    
    class Config:
        """
        Configuration for BaseSettings.
        """
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


def get_settings() -> Settings:
    """
    Get application settings singleton.
    
    Returns:
        Settings instance
    """
    try:
        settings = Settings()
        logger.debug(f"Loaded application settings for environment: {settings.ENVIRONMENT}")
        return settings
    except Exception as e:
        logger.error(f"Failed to load application settings: {str(e)}")
        # Re-raise the error with a more descriptive message
        error_msg = "Environment configuration error. Check your .env file."
        raise ValueError(error_msg) from e

# Create a global settings instance
settings = get_settings() 