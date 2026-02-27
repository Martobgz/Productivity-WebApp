from fastapi import FastAPI
from database import engine
import models
from routers import auth, workspaces
from middleware.cors import setup_cors

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

setup_cors(app)

app.include_router(auth.router)
app.include_router(workspaces.router)