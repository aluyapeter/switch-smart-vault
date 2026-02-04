import os
import secrets
import jwt
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from typing import List
import threading
from indexer import start_indexer

from fastapi import FastAPI, Depends, HTTPException, Body, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from web3 import Web3
from eth_account.messages import encode_defunct
from dotenv import load_dotenv

from database import get_db, init_db
from models import User, Lock
import schemas

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET")
ALGORITHM = os.getenv("ALGORITHM")
RPC_URL = os.getenv("RPC_URL", "http://127.0.0.1:8545")

if not JWT_SECRET:
    raise ValueError("Fatal Error: JWT_SECRET_KEY is missing in .env")
if not ALGORITHM:
    raise ValueError("Fatal Error: ALGORITHM is missing in .env")

blockchain_state = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting Switch API...")

    print("🛠️ Checking database tables...")
    await init_db()
    print("✅ Database tables checked/created.")

    indexer_thread = threading.Thread(target=start_indexer, daemon=True)
    indexer_thread.start()
    
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    if w3.is_connected():
        print(f"Connected to Blockchain at {RPC_URL}")
        blockchain_state["w3"] = w3
    else:
        print(f"Warning: Could not connect to Blockchain at {RPC_URL}")
    
    yield
    print("Shutting down...")
    blockchain_state.clear()

app = FastAPI(lifespan=lifespan, title="Switch V2 API")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://switch-smart-vault.*\.vercel\.app",
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://switch-api-erex.onrender.com",
        "https://switch-smart-vault.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


security = HTTPBearer()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncSession = Depends(get_db)):
    token = credentials.credentials 
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM or "HS256"])
        address: str = payload.get("sub")
        if address is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
        
    result = await db.execute(select(User).where(User.address == address))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user

# --- AUTHENTICATION ENDPOINTS ---

@app.post("/auth/nonce", response_model=dict)
async def generate_nonce(request: schemas.NonceRequest, db: AsyncSession = Depends(get_db)):
    """User asks for a challenge (nonce)"""
    nonce = secrets.token_hex(16)
    checksum_addr = Web3.to_checksum_address(request.address)
    
    result = await db.execute(select(User).where(User.address == checksum_addr))
    user = result.scalars().first()
    
    if not user:
        user = User(address=checksum_addr)
        db.add(user)
    
    user.nonce = nonce # type: ignore
    await db.commit()
    
    return {"nonce": nonce}

@app.post("/auth/verify", response_model=dict)
async def verify_signature(
    request: schemas.VerifyRequest, 
    db: AsyncSession = Depends(get_db)
):
    """User submits the signed challenge"""
    checksum_addr = Web3.to_checksum_address(request.address)
    
    result = await db.execute(select(User).where(User.address == checksum_addr))
    user = result.scalars().first()
    
    if not user or not user.nonce: # type: ignore
        raise HTTPException(status_code=400, detail="Nonce not generated for this address")
    
    message_text = f"Sign this nonce to login: {user.nonce}"
    encoded_message = encode_defunct(text=message_text)
    
    w3 = blockchain_state.get("w3")
    if not w3:
        raise HTTPException(status_code=503, detail="Blockchain connection unavailable")

    try:
        recovered_address = w3.eth.account.recover_message(encoded_message, signature=request.signature)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid signature format")
        
    if recovered_address != checksum_addr:
        raise HTTPException(status_code=401, detail="Signature invalid")
        
    user.nonce = None # type: ignore
    await db.commit()
    
    token = create_access_token({"sub": checksum_addr})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/users/me", response_model=schemas.UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Returns the logged-in user's profile - Auto formatted by Schema"""
    return current_user

# --- UPDATED LOCK ENDPOINTS ---

@app.get("/users/{address}/locks", response_model=List[schemas.LockResponse])
async def get_user_locks(address: str, db: AsyncSession = Depends(get_db)):
    """
    Returns a clean list of locks. 
    The 'amount' will be auto-converted to string by the schema.
    """
    checksum_addr = Web3.to_checksum_address(address)
    result = await db.execute(select(Lock).where(Lock.owner_address == checksum_addr))
    locks = result.scalars().all()
    return locks

@app.get("/locks", response_model=List[schemas.LockResponse])
async def get_my_locks(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Returns all locks belonging to the logged-in user.
    """
    result = await db.execute(select(Lock).where(Lock.owner_address == current_user.address))
    locks = result.scalars().all()
    
    return locks

@app.get("/stats")
async def get_platform_stats(db: AsyncSession = Depends(get_db)):
    """
    Returns public platform statistics for the Landing Page.
    """
    result_count = await db.execute(select(func.count(Lock.id)))
    total_locks = result_count.scalar() or 0

    result_tvl = await db.execute(select(func.sum(Lock.amount)).where(Lock.withdrawn == False))
    
    tvl_wei = int(result_tvl.scalar() or 0)
    
    tvl_eth = Web3.from_wei(tvl_wei, 'ether')

    result_users = await db.execute(select(func.count(User.id)))
    total_users = result_users.scalar() or 0

    return {
        "total_locks": total_locks,
        "tvl_eth": float(tvl_eth),
        "total_users": total_users
    }

@app.get("/")
def read_root():
    return {"status": "Switch API is Online"}