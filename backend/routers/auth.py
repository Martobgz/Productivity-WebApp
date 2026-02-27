from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import User
from schemas import UserCreate, UserLogin, UserUpdate, UserResponse
from auth import hash_password, verify_password, create_access_token
from deps import get_db, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    try:
        print(f"DEBUG: Received signup request for {user.email}")
        print(f"DEBUG: Password type: {type(user.password)}")
        print(f"DEBUG: Password length: {len(user.password)}")
        print(f"DEBUG: Password content start: {user.password[:3]}...")
        
        normalized_email = user.email.strip().lower()
        existing_user = db.query(User).filter(User.email == normalized_email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        new_user = User(
            email=normalized_email,
            hashed_password=hash_password(user.password),
            display_name=user.full_name or normalized_email.split("@")[0],
            bio=""
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        token = create_access_token({"sub": new_user.email})

        return {
            "data": {
                "session": {
                    "access_token": token,
                    "email": new_user.email,
                    "display_name": new_user.display_name,
                    "bio": new_user.bio
                }
            }
        }
    except Exception as e:
        print(f"ERROR in signup: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    normalized_email = user.email.strip().lower()
    db_user = db.query(User).filter(User.email == normalized_email).first()

    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({"sub": db_user.email})

    return {
        "data": {
            "session": {
                "access_token": token,
                "email": db_user.email,
                "display_name": db_user.display_name,
                "bio": db_user.bio
            }
        }
    }

@router.patch("/profile", response_model=UserResponse)
def update_profile(user_update: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    update_data = user_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user