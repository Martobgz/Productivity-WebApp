from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

env_path = os.path.join(os.getcwd(), ".env")
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:133313@localhost:5432/productivity_db"
)

engine = create_engine(DATABASE_URL)

def run_migration():
    with engine.connect() as conn:
        print("Checking for bio column in users table...")
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN bio TEXT;"))
            conn.commit()
            print("Added bio column to users.")
        except Exception as e:
            print(f"Note: Could not add bio column (it might already exist): {e}")

        print("Checking for is_favorite column in workspace_members table...")
        try:
            conn.execute(text("ALTER TABLE workspace_members ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;"))
            conn.commit()
            print("Added is_favorite column to workspace_members.")
        except Exception as e:
            print(f"Note: Could not add is_favorite column (it might already exist): {e}")

if __name__ == "__main__":
    run_migration()
