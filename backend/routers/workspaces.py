from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from models import Workspace, User
from schemas import WorkspaceCreate, WorkspaceUpdate, WorkspaceResponse
from deps import get_db, get_current_user

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])

@router.get("/", response_model=List[WorkspaceResponse])
def get_workspaces(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    workspaces = db.query(Workspace).filter(Workspace.user_id == current_user.id).all()
    return workspaces

@router.post("/", response_model=WorkspaceResponse)
def create_workspace(workspace: WorkspaceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing_ws = db.query(Workspace).filter(Workspace.id == workspace.id).first()
    if existing_ws:
        raise HTTPException(status_code=400, detail="Workspace already exists")
    
    new_ws = Workspace(
        id=workspace.id,
        user_id=current_user.id,
        name=workspace.name,
        type=workspace.type,
        content=workspace.content,
        todos=workspace.todos,
        createdAt=workspace.createdAt,
        deleted=workspace.deleted
    )
    db.add(new_ws)
    db.commit()
    db.refresh(new_ws)
    return new_ws

@router.patch("/{id}", response_model=WorkspaceResponse)
def update_workspace(id: str, workspace: WorkspaceUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_ws = db.query(Workspace).filter(Workspace.id == id, Workspace.user_id == current_user.id).first()
    if not db_ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    update_data = workspace.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_ws, key, value)
        
    db.commit()
    db.refresh(db_ws)
    return db_ws

@router.delete("/{id}")
def delete_workspace(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_ws = db.query(Workspace).filter(Workspace.id == id, Workspace.user_id == current_user.id).first()
    if not db_ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    db.delete(db_ws)
    db.commit()
    return {"message": "Workspace deleted successfully"}