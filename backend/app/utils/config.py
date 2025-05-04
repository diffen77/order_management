"""
Application configuration module.
"""
import os
from pydantic import BaseSettings, AnyHttpUrl, validator
from typing import Optional, List, Union, Any
from pydantic import Field
from dotenv import load_dotenv
from .logging import setup_logger

logger = setup_logger(__name__)

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    """Application settings."""
    
    # Environment
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = ENVIRONMENT == "development"
    
    # API Configuration
    API_HOST: str = Field(default="0.0.0.0", env="API_HOST")
    API_PORT: int = Field(default=8000, env="PORT")
    
    # Frontend URLs
    FRONTEND_URL: str = Field(default="http://localhost:5173", env="FRONTEND_URL")
    
    # Rate Limiting
    RATE_LIMIT_MAX_REQUESTS: int = Field(default=100, env="RATE_LIMIT_MAX_REQUESTS")
    RATE_LIMIT_WINDOW_SECONDS: int = Field(default=60, env="RATE_LIMIT_WINDOW_SECONDS")
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",  # Vite default
        "http://localhost:5174",
        "http://localhost:5175"
    ]
    
    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """
        Parse CORS_ORIGINS from string or list.
        
        Args:
            v: Value to validate
            
        Returns:
            List of allowed origins
        """
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Database Configuration
    SUPABASE_URL: str = Field(..., env="SUPABASE_URL")
    SUPABASE_KEY: str = Field(..., env="SUPABASE_KEY")
    
    # API Version
    API_VERSION: str = "v1"
    
    # Security
    JWT_SECRET: str = Field(..., env="JWT_SECRET")
    JWT_ALGORITHM: str = Field(default="HS256", env="JWT_ALGORITHM")
    JWT_EXPIRATION_MINUTES: int = Field(default=60, env="JWT_EXPIRATION_MINUTES")
    
    # Email Settings
    SMTP_HOST: Optional[str] = Field(..., env="SMTP_HOST")
    SMTP_PORT: int = Field(default=587, env="SMTP_PORT")
    SMTP_USER: Optional[str] = Field(..., env="SMTP_USER")
    SMTP_PASSWORD: Optional[str] = Field(..., env="SMTP_PASSWORD")
    EMAILS_FROM_EMAIL: Optional[str] = Field(..., env="EMAILS_FROM_EMAIL")
    EMAILS_FROM_NAME: Optional[str] = Field(..., env="EMAILS_FROM_NAME")
    
    class Config:
        """Pydantic configuration."""
        
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = "utf-8"


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