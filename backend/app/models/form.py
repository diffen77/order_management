from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, Dict, Any, List


class Form(BaseModel):
    id: UUID
    producer_id: UUID
    name: str
    description: Optional[str] = None
    form_structure: Dict[str, Any]
    is_active: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class FormProduct(BaseModel):
    id: UUID
    form_id: UUID
    product_id: UUID
    sort_order: int = 0
    created_at: datetime

    class Config:
        orm_mode = True 