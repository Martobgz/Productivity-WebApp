from pydantic import BaseModel, EmailStr
from typing import List

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    display_name: str | None = None

    class Config:
        from_attributes = True

class WorkspaceBase(BaseModel):
    id: str
    name: str
    type: str
    content: str | None = ""
    todos: list | None = []
    createdAt: str
    deleted: bool | None = False

class WorkspaceCreate(WorkspaceBase):
    pass

class WorkspaceUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    content: str | None = None
    todos: list | None = None
    deleted: bool | None = None

class WorkspaceResponse(WorkspaceBase):
    user_id: int

    class Config:
        from_attributes = True

class InviteUser(BaseModel):
    email: str
