from pydantic import BaseModel, field_validator
from datetime import datetime

class UserBase(BaseModel):
    address: str

class LockBase(BaseModel):
    goal_name: str
    unlock_timestamp: int
    amount: str

class NonceRequest(UserBase):
    pass

class VerifyRequest(UserBase):
    signature: str

class CreateLockRequest(LockBase):
    pass


class LockResponse(LockBase):
    id: int
    created_at: int
    withdrawn: bool
    owner_address: str
    tx_hash: str

    class Config:
        from_attributes = True

    @field_validator('amount', mode='before')
    def parse_amount(cls, v):
        return str(int(v))

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True