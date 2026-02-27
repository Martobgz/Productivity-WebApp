from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
import os
import uuid
from deps import get_current_user
from models import User

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

UPLOAD_DIR = "uploads"

@router.post("/")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    # Generate unique filename
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    try:
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Return the URL to access the image
    # Note: In production, this should be a full URL. For local dev, a relative path/proxy works.
    return {
        "url": f"http://localhost:8000/uploads/{filename}",
        "filename": filename
    }
