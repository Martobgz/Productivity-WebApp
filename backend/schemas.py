from pydantic import BaseModel, EmailStr
from typing import List

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    display_name: str | None = None
    bio: str | None = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    display_name: str | None = None
    bio: str | None = None

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

class WorkspaceFavoriteUpdate(BaseModel):
    is_favorite: bool

class WorkspaceResponse(WorkspaceBase):
    user_id: int
    role: str | None = "owner"
    is_favorite: bool | None = False

    class Config:
        from_attributes = True

class InviteUser(BaseModel):
    email: str

class EventBase(BaseModel):
    title: str
    description: str | None = None
    start_time: str # ISO string
    end_time: str   # ISO string
    all_day: bool | None = False
    color: str | None = None

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    start_time: str | None = None
    end_time: str | None = None
    all_day: bool | None = None
    color: str | None = None

class EventResponse(EventBase):
    id: int
    user_id: int
    created_at: str

    class Config:
        from_attributes = True
