from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID


class FormBase(BaseModel):
    name: str
    description: Optional[str] = None
    form_structure: Dict[str, Any]
    is_active: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class FormCreate(FormBase):
    pass


class FormUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    form_structure: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class FormResponse(FormBase):
    id: UUID
    producer_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class FormProductBase(BaseModel):
    form_id: UUID
    product_id: UUID
    sort_order: int = 0


class FormProductCreate(FormProductBase):
    pass


class FormProductResponse(FormProductBase):
    id: UUID
    created_at: datetime

    class Config:
        orm_mode = True


class FormWithProducts(FormResponse):
    products: List[FormProductResponse] = [] 