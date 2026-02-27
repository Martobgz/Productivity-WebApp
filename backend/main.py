from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from database import engine
import models
import os
from routers import auth, workspaces, calendar_events, uploads
from middleware.cors import setup_cors

# Ensure uploads directory exists
if not os.path.exists("uploads"):
    os.makedirs("uploads")

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

setup_cors(app)

# Serve static files from the uploads directory
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(workspaces.router)
app.include_router(calendar_events.router)
app.include_router(uploads.router)