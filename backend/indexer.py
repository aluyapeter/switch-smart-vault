import asyncio
import os
import json
from web3 import Web3
from sqlalchemy import select, update
from database import async_session, engine
from models import User, Lock

RPC_URL = os.getenv("RPC_URL", "http://127.0.0.1:8545")
try:
    with open("deployment_config.json", "r") as f:
        config = json.load(f)
        CONTRACT_ADDRESS = config["contract_address"]
        print(f"Loaded Contract: {CONTRACT_ADDRESS}")
except FileNotFoundError:
    print("ERROR: deployment_config.json not found. Run 'brownie run scripts/seed_data.py' first.")
    exit(1)

async def get_contract(w3):
    path = "../build/contracts/SwitchV2.json"

    try:
        with open(path, "r") as f:
            data = json.load(f)
            abi = data["abi"]
        return w3.eth.contract(address=CONTRACT_ADDRESS, abi=abi)
    except FileNotFoundError:
        print(f" Error: Could not find file at {path}")
        print("   Make sure you are running this from the 'backend' folder!")
        return None

async def process_lock_created(session, event, w3):
    args = event['args']
    user_address = args['user']
    lock_id = args['lockId']
    
    print(f"   found lock {lock_id} for {user_address}")

    result = await session.execute(select(User).where(User.address == user_address))
    user = result.scalars().first()
    
    if not user:
        print(f"   New User detected: {user_address}")
        user = User(address=user_address)
        session.add(user)
        await session.flush()

    result = await session.execute(select(Lock).where(Lock.id == lock_id))
    existing_lock = result.scalars().first()

    if not existing_lock:
        new_lock = Lock(
            id=lock_id,
            owner_address=user_address,
            amount=args['amount'],
            unlock_timestamp=args['unlockTimestamp'],
            created_at=w3.eth.get_block(event['blockNumber'])['timestamp'],
            goal_name=args['goalName'],
            withdrawn=False,
            tx_hash=event['transactionHash'].hex()
        )
        session.add(new_lock)
        print(f"    Indexed Lock #{lock_id}")

async def process_withdrawal(session, event):
    args = event['args']
    lock_id = args['lockId']
    print(f"   found withdrawal for #{lock_id}")
    
    await session.execute(
        update(Lock).where(Lock.id == lock_id).values(withdrawn=True)
    )

async def sync_events():
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    print(f" Connected to Blockchain: {w3.is_connected()}")
    
    contract = await get_contract(w3)
    if not contract:
        return

    print(" Starting Indexer Loop... (Press Ctrl+C to stop)")
    
    START_BLOCK = 0 

    while True:
        try:
            async with async_session() as session:
                lock_logs = contract.events.LockCreated.get_logs(fromBlock=START_BLOCK)
                
                for event in lock_logs:
                    await process_lock_created(session, event, w3)

                withdraw_logs = contract.events.Withdrawal.get_logs(fromBlock=START_BLOCK)
                
                for event in withdraw_logs:
                    await session.execute(
                        update(Lock).where(Lock.id == event['args']['lockId']).values(withdrawn=True)
                    )
                
                emergency_logs = contract.events.EmergencyWithdrawal.get_logs(fromBlock=START_BLOCK)
                for event in emergency_logs:
                    await session.execute(
                        update(Lock).where(Lock.id == event['args']['lockId']).values(withdrawn=True)
                    )

                await session.commit()
            print("Sleeping 10s...")
            await asyncio.sleep(10)
            
        except Exception as e:
            print(f"Error in Indexer: {e}")
            await asyncio.sleep(5)

if __name__ == "__main__":
    try:
        asyncio.run(sync_events())
    except KeyboardInterrupt:
        print("Indexer Stopped")