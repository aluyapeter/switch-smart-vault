import json
import os
from brownie import SwitchV2, accounts, network

def main():
    if not network.is_connected():
        network.connect('development')
    
    dev = accounts[0]      # Owner
    user = accounts[1]     # The User
    treasury = accounts[9] # The Treasury

    print(f"Deploying with account: {dev}")

    switch = SwitchV2.deploy(treasury, {'from': dev})
    print(f"✅ Contract Deployed at: {switch.address}")

    print("Creating a test lock...")
    tx = switch.createLock(3600, "My First Database Lock", {'from': user, 'value': "1 ether"})
    tx.wait(1)
    print("✅ Lock Created!")

    print("\n" + "="*30)
    print("SAVING CONFIGURATION...")
    
    frontend_path = "frontend/src/abis/contract-address.json"
    backend_path = "backend/deployment_config.json"

    config_data = {
        "contract_address": switch.address,
        "network": "ganache"
    }

    if not os.path.exists(os.path.dirname(frontend_path)):
        os.makedirs(os.path.dirname(frontend_path))
        
    with open(frontend_path, "w") as f:
        json.dump({"address": switch.address}, f)
    print(f"   -> Saved to: {frontend_path}")

    with open(backend_path, "w") as f:
        json.dump(config_data, f)
    print(f"   -> Saved to: {backend_path}")
    
    print("="*30 + "\n")