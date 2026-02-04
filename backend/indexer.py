import asyncio
import os
import json
import time
from web3 import Web3
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from models import User, Lock
from dotenv import load_dotenv

load_dotenv()

# --- CONFIGURATION ---
RPC_URL = os.getenv("RPC_URL")
DATABASE_URL = os.getenv("DATABASE_URL")

# Auto-fix DB URL for asyncpg (Render/Supabase compatibility)
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

if not RPC_URL:
    print("❌ CRITICAL: RPC_URL is missing from .env")
    
if not DATABASE_URL:
    print("❌ CRITICAL: DATABASE_URL is missing from .env")

# Tell Pylance "We promise this is a string"
assert DATABASE_URL is not None, "DATABASE_URL must be set"

# --- LOCAL DB SETUP (THREAD SAFE) ---
indexer_engine = create_async_engine(DATABASE_URL, echo=False)
IndexerSession = async_sessionmaker(
    bind=indexer_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

# Load Contract Config
CONTRACT_ADDRESS = ""
START_BLOCK = 10179178
try:
    with open("deployment_config.json", "r") as f:
        config = json.load(f)
        CONTRACT_ADDRESS = config["contract_address"].strip()
        START_BLOCK = config.get("deployed_at_block", 10179178) 
except FileNotFoundError:
    print("⚠️ Config not found. Using defaults.")

# --- HELPER FUNCTIONS ---

def safe_get_logs(event_source, start, end):
    """
    Tries to fetch logs using snake_case (Web3 v6+ / Render). 
    If that fails, falls back to camelCase (Web3 v5 / Local / Brownie).
    """
    try:
        # Try Render/New Web3 style
        return event_source.get_logs(from_block=start, to_block=end)
    except TypeError:
        # Fallback to Local/Old Web3 style
        return event_source.get_logs(fromBlock=start, toBlock=end)

def get_contract(w3):
    possible_paths = [
        "abis/SwitchV2.json",                # Render Path
        "../build/contracts/SwitchV2.json",  # Local Dev Path
        "build/contracts/SwitchV2.json"
    ]
    abi = None
    
    for path in possible_paths:
        try:
            with open(path, "r") as f:
                data = json.load(f)
                abi = data["abi"]
                break
        except FileNotFoundError:
            continue
            
    if not abi:
        print("❌ ERROR: Could not find ABI file.")
        return None

    safe_address = w3.to_checksum_address(CONTRACT_ADDRESS)
    return w3.eth.contract(address=safe_address, abi=abi)

async def process_lock_created(session, event, w3):
    try:
        args = event['args']
        user_address = args['user']
        lock_id = args['lockId']
        
        result = await session.execute(select(User).where(User.address == user_address))
        user = result.scalars().first()
        
        if not user:
            print(f"👤 New User detected: {user_address}")
            user = User(address=user_address)
            session.add(user)
            await session.flush()

        result = await session.execute(select(Lock).where(Lock.id == lock_id))
        existing_lock = result.scalars().first()

        if not existing_lock:
            block_data = w3.eth.get_block(event['blockNumber'])
            timestamp = block_data['timestamp']

            new_lock = Lock(
                id=lock_id,
                owner_address=user_address,
                amount=str(args['amount']), 
                unlock_timestamp=args['unlockTimestamp'],
                created_at=timestamp,
                goal_name=args['goalName'],
                withdrawn=False,
                tx_hash=event['transactionHash'].hex()
            )
            session.add(new_lock)
            print(f"🔐 Indexed Lock #{lock_id}")
            
    except Exception as e:
        print(f"⚠️ Error processing lock: {e}")

# --- MAIN WORKER LOOP ---

async def _indexer_logic():
    """The async logic that runs inside the thread"""
    print("🚀 Indexer Thread Started...")
    
    # Added timeout to prevent hanging
    w3 = Web3(Web3.HTTPProvider(RPC_URL, request_kwargs={'timeout': 10}))
    
    if not w3.is_connected():
        print("❌ Indexer could not connect to RPC.")
        return

    contract = get_contract(w3)
    if not contract:
        print("❌ Indexer halted: No contract.")
        return

    current_sync_block = START_BLOCK
    chain_tip = w3.eth.block_number
    
    # --- FAST FORWARD LOGIC ---
    if current_sync_block > chain_tip:
         current_sync_block = chain_tip - 10
         
    print(f"⏩ Fast-forwarding: Skipping from {current_sync_block} to {chain_tip}...")
    current_sync_block = chain_tip - 5
    # --------------------------

    print(f"📥 Indexing from block {current_sync_block}...")

    while True:
        try:
            latest_block = w3.eth.block_number
            
            if current_sync_block > latest_block:
                await asyncio.sleep(10) 
                continue

            end_block = min(current_sync_block + 5, latest_block)

            async with IndexerSession() as session:
                # FIX: Now actually using safe_get_logs!
                lock_logs = safe_get_logs(contract.events.LockCreated, current_sync_block, end_block)
                for event in lock_logs:
                    await process_lock_created(session, event, w3)

                # FIX: Using safe_get_logs
                withdraw_logs = safe_get_logs(contract.events.Withdrawal, current_sync_block, end_block)
                for event in withdraw_logs:
                    await session.execute(
                        update(Lock).where(Lock.id == event['args']['lockId']).values(withdrawn=True)
                    )
                    print(f"🔓 Processed Withdrawal for Lock #{event['args']['lockId']}")
                
                # FIX: Using safe_get_logs
                emergency_logs = safe_get_logs(contract.events.EmergencyWithdrawal, current_sync_block, end_block)
                for event in emergency_logs:
                    await session.execute(
                        update(Lock).where(Lock.id == event['args']['lockId']).values(withdrawn=True)
                    )
                    print(f"🚨 Processed Emergency Withdrawal for Lock #{event['args']['lockId']}")

                await session.commit()
            
            current_sync_block = end_block + 1
            await asyncio.sleep(0.5) 
            
        except Exception as e:
            print(f"❌ Indexer Error: {e}")
            await asyncio.sleep(5)

# --- ENTRY POINT FOR MAIN.PY ---

def start_indexer():
    """Wrapper to run the async loop in a separate thread"""
    asyncio.run(_indexer_logic())

if __name__ == "__main__":
    start_indexer()