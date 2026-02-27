from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import or_, exists

from models import Workspace, User, WorkspaceMember
from schemas import WorkspaceCreate, WorkspaceUpdate, WorkspaceResponse, InviteUser, UserResponse, WorkspaceFavoriteUpdate
from deps import get_db, get_current_user

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])

@router.get("/", response_model=List[WorkspaceResponse])
def get_workspaces(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Get all memberships for the current user (accepted ones)
    memberships = db.query(WorkspaceMember).filter(
        WorkspaceMember.user_id == current_user.id,
        WorkspaceMember.status == "accepted"
    ).all()
    
    workspace_ids = [m.workspace_id for m in memberships]
    role_map = {m.workspace_id: m.role for m in memberships}
    favorite_map = {m.workspace_id: m.is_favorite for m in memberships}
    
    # Query workspaces based on these IDs
    workspaces = db.query(Workspace).filter(
        Workspace.id.in_(workspace_ids),
        Workspace.deleted == False
    ).all()
    
    # Attach role to each workspace object for the response
    for ws in workspaces:
        ws.role = role_map.get(ws.id, "participant")
        ws.is_favorite = favorite_map.get(ws.id, False)
        
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
    owner_member = WorkspaceMember(workspace_id=new_ws.id, user_id=current_user.id, role="owner", status="accepted")
    db.add(owner_member)
    
    db.commit()
    db.refresh(new_ws)
    new_ws.role = "owner"
    new_ws.is_favorite = False
    return new_ws

@router.post("/{id}/invite", response_model=UserResponse)
def invite_user(id: str, invite: InviteUser, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify current user is an OWNER of this workspace
    membership = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == id,
        WorkspaceMember.user_id == current_user.id,
        WorkspaceMember.role == "owner"
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Only owners can invite collaborators")
    
    # Find user to invite
    target_email = invite.email.strip().lower()
    user_to_invite = db.query(User).filter(User.email == target_email).first()
    if not user_to_invite:
        raise HTTPException(status_code=404, detail=f"User with email '{target_email}' not found")
    
    # Check if already a member
    existing_member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == id,
        WorkspaceMember.user_id == user_to_invite.id
    ).first()
    
    if existing_member:
        return user_to_invite
        
    # Add as pending member (default role is 'participant' or 'member', user requested participant)
    new_member = WorkspaceMember(workspace_id=id, user_id=user_to_invite.id, role="participant", status="pending")
    db.add(new_member)
    db.commit()
    
    return user_to_invite

@router.get("/invitations", response_model=list)
def get_invitations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all pending invitations for the current user."""
    invites = db.query(WorkspaceMember).filter(
        WorkspaceMember.user_id == current_user.id,
        WorkspaceMember.status == "pending"
    ).all()
    result = []
    for inv in invites:
        ws = db.query(Workspace).filter(Workspace.id == inv.workspace_id).first()
        owner = db.query(User).filter(User.id == ws.user_id).first() if ws else None
        result.append({
            "id": inv.id,
            "workspace_id": inv.workspace_id,
            "workspace_name": ws.name if ws else "Unknown",
            "invited_by": owner.email if owner else "Unknown",
            "created_at": inv.created_at.isoformat() if inv.created_at else None,
            "status": inv.status,
            "role": inv.role
        })
    return result

@router.post("/invitations/{invite_id}/accept")
def accept_invitation(invite_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    inv = db.query(WorkspaceMember).filter(
        WorkspaceMember.id == invite_id,
        WorkspaceMember.user_id == current_user.id,
        WorkspaceMember.status == "pending"
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")
    inv.status = "accepted"
    db.commit()
    return {"detail": "Invitation accepted"}

@router.post("/invitations/{invite_id}/decline")
def decline_invitation(invite_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    inv = db.query(WorkspaceMember).filter(
        WorkspaceMember.id == invite_id,
        WorkspaceMember.user_id == current_user.id,
        WorkspaceMember.status == "pending"
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")
    inv.status = "declined"
    db.commit()
    return {"detail": "Invitation declined"}

@router.patch("/{id}", response_model=WorkspaceResponse)
def update_workspace(id: str, workspace: WorkspaceUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Any member (owner or participant) can update content
    membership = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == id,
        WorkspaceMember.user_id == current_user.id,
        WorkspaceMember.status == "accepted"
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized to edit this workspace")
    
    db_ws = db.query(Workspace).filter(Workspace.id == id).first()
    if not db_ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    update_data = workspace.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_ws, key, value)
        
    db.commit()
    db.refresh(db_ws)
    db_ws.role = membership.role
    db_ws.is_favorite = membership.is_favorite
    return db_ws

@router.patch("/{id}/favorite", response_model=WorkspaceResponse)
def toggle_favorite(id: str, fav: WorkspaceFavoriteUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    membership = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == id,
        WorkspaceMember.user_id == current_user.id,
        WorkspaceMember.status == "accepted"
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    membership.is_favorite = fav.is_favorite
    db.commit()
    
    db_ws = db.query(Workspace).filter(Workspace.id == id).first()
    db_ws.role = membership.role
    db_ws.is_favorite = membership.is_favorite
    return db_ws

@router.delete("/{id}")
def delete_workspace(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Only OWNERS can delete
    membership = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == id,
        WorkspaceMember.user_id == current_user.id,
        WorkspaceMember.role == "owner"
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Only owners can delete workspaces")
        
    db_ws = db.query(Workspace).filter(Workspace.id == id).first()
    if not db_ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    db.delete(db_ws)
    db.commit()
    return {"message": "Workspace deleted successfully"}
