from pydantic import BaseModel, EmailStr


# Request while creating a user
class UserCreate(BaseModel):
    employee_id: str
    full_name: str
    email: EmailStr
    password: str
    role: str
    department: str


# Request while updating a user
class UserUpdate(BaseModel):
    full_name: str
    email: EmailStr
    role: str
    department: str


# Response returned by API
class UserResponse(BaseModel):
    id: int
    employee_id: str
    full_name: str
    email: EmailStr
    role: str
    department: str
    is_active: bool

    class Config:
        from_attributes = True