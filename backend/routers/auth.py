from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import User
from schemas import UserCreate, UserLogin
from auth import hash_password, verify_password, create_access_token
from deps import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=user.email,
        password=hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": new_user.email})

    return {
        "data": {
            "session": {
                "access_token": token
            }
        }
    }

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({"sub": db_user.email})

    return {
        "data": {
            "session": {
                "access_token": token
            }
        }
    }