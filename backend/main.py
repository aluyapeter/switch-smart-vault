from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from web3 import Web3
from dotenv import load_dotenv
import json
import os

load_dotenv()

blockchain_state = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting up Switch API (Sepolia Mode)...")

    rpc_url = os.getenv("RPC_URL")
    if not rpc_url:
        print("Error: RPC_URL not found in .env")
    
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    
    if w3.is_connected():
        print(f"Connected to Sepolia. Block: {w3.eth.block_number}")
    else:
        print("failed to connect to Sepolia")

    try:
        with open("deployment_config.json", "r") as f:
            config = json.load(f)
            contract_address = config["contract_address"]
    except FileNotFoundError:
        print("deployment_config.json not found. Did you run deploy_sepolia.py?")
        contract_address = None

    try:
        with open("SwitchSmartVault_Build.json", "r") as f:
            build_data = json.load(f)
            abi = build_data["abi"]
    except FileNotFoundError:
        with open("backend/SwitchSmartVault_Build.json", "r") as f:
            build_data = json.load(f)
            abi = build_data["abi"]

    if contract_address:
        contract = w3.eth.contract(address=contract_address, abi=abi)
        blockchain_state["contract"] = contract
        print(f"Linked to Contract: {contract_address}")
    
    blockchain_state["w3"] = w3
    
    yield
    
    print("Shutting down...")
    blockchain_state.clear()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status":"Switch API is running",
        "contract": blockchain_state["contract"].address
    }

@app.get("/lock/{user_address}")
def get_user_lock(user_address: str):
    w3 = blockchain_state.get("w3")
    contract = blockchain_state.get("contract")

    if not w3 or not contract:
        raise HTTPException(status_code=503, detail="Blockchain not connected")

    if not w3.is_address(user_address):
        raise HTTPException(status_code=400, detail="Invalid Address")
    
    checksum_address = w3.to_checksum_address(user_address)

    lock_data = contract.functions.locks(checksum_address).call()

    return {
        "user": checksum_address,
        "title": lock_data[0],
        "amount_wei": lock_data[1],
        "amount_eth": float(w3.from_wei(lock_data[1], 'ether')), # Helper for frontend
        "unlock_time": lock_data[2],
        "is_locked": lock_data[1] > 0
    }

@app.post("/debug/create-lock")
def debug_create_lock(amount_ether: float, time_seconds: int):
    """
    Cheat endpoint to create a lock for the 'deployer' account
    so we have data to look at.
    """
    w3 = blockchain_state["w3"]
    contract = blockchain_state["contract"]
    deployer = blockchain_state["deployer"]

    tx_hash = contract.functions.lockFunds("Debug Savings", time_seconds).transact({
        "from": deployer,
        "value": w3.to_wei(amount_ether, "ether")
    })
    w3.eth.wait_for_transaction_receipt(tx_hash)
    
    return {"status": "Lock Created", "user": deployer}

@app.get("/activity/{user_address}")
def get_recent_activity(user_address: str):
    w3 = blockchain_state["w3"]
    contract = blockchain_state["contract"]

    events = contract.events.VaultDeposit.get_logs(from_block=0)
    
    user_activity = []
    
    for event in events:
        if event["args"]["user"] == w3.to_checksum_address(user_address):
            user_activity.append({
                "title": event["args"]["title"],
                "amount": event["args"]["totalAmount"],
                "unlock_time": event["args"]["unlockTime"],
                "tx_hash": event["transactionHash"].hex()
            })

    return {"activity": user_activity}