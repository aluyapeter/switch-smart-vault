import asyncio
from database import init_db

if __name__ == "__main__":
    print("Creating tables...")
    asyncio.run(init_db())
    print("Tables created successfully!")