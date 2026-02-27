from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from models import Workspace, User, WorkspaceMember
from schemas import WorkspaceCreate, WorkspaceUpdate, WorkspaceResponse, InviteUser, UserResponse
from deps import get_db, get_current_user
from sqlalchemy import or_

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])

@router.get("/", response_model=List[WorkspaceResponse])
def get_workspaces(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Get workspaces where the user is an owner OR a member (not deleted)
    workspaces = db.query(Workspace).join(
        WorkspaceMember, Workspace.id == WorkspaceMember.workspace_id, isouter=True
    ).filter(
        or_(
            Workspace.user_id == current_user.id,
            WorkspaceMember.user_id == current_user.id
        ),
        Workspace.deleted == False
    ).distinct().all()
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
    
    # Also add as owner in workspace_members
    owner_member = WorkspaceMember(workspace_id=new_ws.id, user_id=current_user.id, role="owner")
    db.add(owner_member)
    
    db.commit()
    db.refresh(new_ws)
    return new_ws

@router.post("/{id}/invite", response_model=UserResponse)
def invite_user(id: str, invite: InviteUser, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify workspace ownership
    ws = db.query(Workspace).filter(Workspace.id == id, Workspace.user_id == current_user.id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found or unauthorized")
    
    # Find user to invite
    user_to_invite = db.query(User).filter(User.email == invite.email).first()
    if not user_to_invite:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already a member
    existing_member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == id,
        WorkspaceMember.user_id == user_to_invite.id
    ).first()
    
    if existing_member:
        return user_to_invite
        
    # Add as member
    new_member = WorkspaceMember(workspace_id=id, user_id=user_to_invite.id, role="member")
    db.add(new_member)
    db.commit()
    
    return user_to_invite

@router.patch("/{id}", response_model=WorkspaceResponse)
def update_workspace(id: str, workspace: WorkspaceUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Allow both owner and members to update
    db_ws = db.query(Workspace).filter(Workspace.id == id).first()
    if not db_ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    # Check if user is owner or member
    is_owner = db_ws.user_id == current_user.id
    is_member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == id,
        WorkspaceMember.user_id == current_user.id
    ).first() is not None
    
    if not is_owner and not is_member:
        raise HTTPException(status_code=403, detail="Not authorized to edit this workspace")
    
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