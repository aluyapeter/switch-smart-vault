import json
import os
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()

rpc_url = os.getenv("RPC_URL")
private_key = os.getenv("PRIVATE_KEY")

if not rpc_url or not private_key:
    raise ValueError("Missing RPC_URL or PRIVATE_KEY in .env file")

w3 = Web3(Web3.HTTPProvider(rpc_url))

if not w3.is_connected():
    raise ConnectionError("Failed to connect to Sepolia RPC")

print(f"Connected to Sepolia. Current Block: {w3.eth.block_number}")

account = w3.eth.account.from_key(private_key)
print(f"Deploying from address: {account.address}")

with open("./backend/SwitchSmartVault_Build.json", "r") as f:
    build_data = json.load(f)
    abi = build_data["abi"]
    bytecode = build_data["bytecode"]

Contract = w3.eth.contract(abi=abi, bytecode=bytecode)

gas_price = w3.eth.gas_price

print("Building transaction...")
construct_txn = Contract.constructor().build_transaction({
    "from": account.address,
    "nonce": w3.eth.get_transaction_count(account.address),
    "gas": 2000000,
    "gasPrice": gas_price,
})

print("Signing transaction...")
signed_txn = w3.eth.account.sign_transaction(construct_txn, private_key=private_key)

print("Broadcasting...")
tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
print(f"Transaction sent! Hash: {tx_hash.hex()}")

print("Waiting for confirmation (this takes 15-30 seconds on Sepolia)...")
tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

print(f"Contract Deployed at: {tx_receipt["contractAddress"]}")

config = {
    "contract_address": tx_receipt["contractAddress"],
    "network": "sepolia"
}
with open("./backend/deployment_config.json", "w") as f:
    json.dump(config, f)