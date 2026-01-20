import json
from web3 import Web3

w3 = Web3(Web3.EthereumTesterProvider())

print(f"Connected to blockchain: {w3.is_connected()}")

deployer_account = w3.eth.accounts[0]
print(f"Deploying from: {deployer_account}")

with open("./backend/SwitchSmartVault_Build.json", "r") as file:
    build_data = json.load(file)
    abi = build_data["abi"]
    bytecode = build_data["bytecode"]

SmartVault = w3.eth.contract(abi=abi, bytecode=bytecode)

print("Deploying contract...")
tx_hash = SmartVault.constructor().transact({
    "from": deployer_account
})

tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

contract_address = tx_receipt["contractAddress"]
print(f"Contract Deployed At: {contract_address}")

deployed_vault = w3.eth.contract(address=contract_address, abi=abi)

my_lock = deployed_vault.functions.locks(deployer_account).call()
print(f"Current Lock Status: {my_lock}")

print("Locking 1 ETH...")
tx_hash_lock = deployed_vault.functions.lockFunds("My First Savings", 60).transact({
    "from": deployer_account,
    "value": w3.to_wei(1, "ether")
})
w3.eth.wait_for_transaction_receipt(tx_hash_lock)

updated_lock = deployed_vault.functions.locks(deployer_account).call()
print(f"Updated Lock Status: {updated_lock}")