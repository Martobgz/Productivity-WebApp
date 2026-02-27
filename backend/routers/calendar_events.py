from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from deps import get_db, get_current_user
from models import CalendarEvent, User
from schemas import EventCreate, EventUpdate, EventResponse

router = APIRouter(
    prefix="/api/calendar",
    tags=["calendar"]
)

@router.get("/", response_model=List[EventResponse])
def get_events(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    events = db.query(CalendarEvent).filter(CalendarEvent.user_id == current_user.id).all()
    # Convert datetime objects to ISO strings for the response schema
    for event in events:
        event.start_time = event.start_time.isoformat()
        event.end_time = event.end_time.isoformat()
        event.created_at = event.created_at.isoformat()
    return events

@router.post("/", response_model=EventResponse)
def create_event(
    event_in: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        start_dt = datetime.fromisoformat(event_in.start_time.replace('Z', '+00:00'))
        end_dt = datetime.fromisoformat(event_in.end_time.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ISO date format")

    event = CalendarEvent(
        user_id=current_user.id,
        title=event_in.title,
        description=event_in.description,
        start_time=start_dt,
        end_time=end_dt,
        all_day=event_in.all_day,
        color=event_in.color
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    
    # Prepare response
    event.start_time = event.start_time.isoformat()
    event.end_time = event.end_time.isoformat()
    event.created_at = event.created_at.isoformat()
    return event

@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: int,
    event_in: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id, CalendarEvent.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    update_data = event_in.dict(exclude_unset=True)
    
    if "start_time" in update_data:
        try:
            update_data["start_time"] = datetime.fromisoformat(update_data["start_time"].replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid ISO date format for start_time")
            
    if "end_time" in update_data:
        try:
            update_data["end_time"] = datetime.fromisoformat(update_data["end_time"].replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid ISO date format for end_time")

    for field, value in update_data.items():
        setattr(event, field, value)
    
    db.commit()
    db.refresh(event)
    
    # Prepare response
    event.start_time = event.start_time.isoformat()
    event.end_time = event.end_time.isoformat()
    event.created_at = event.created_at.isoformat()
    return event

@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id, CalendarEvent.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(event)
    db.commit()
    return {"detail": "Event deleted successfully"}
