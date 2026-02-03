import json
import time
import os
from brownie import SwitchV2, accounts, config, network

def main():
    dev = accounts.add(config["wallet"]["from_key"])
    
    print(f"🚀 Deploying SwitchV2 to {network.show_active()}...")
    
    contract = SwitchV2.deploy(
        dev, 
        {"from": dev},
        publish_source=True 
    )
    
    print(f"✅ SwitchV2 deployed to: {contract.address}")

    deployment_data = {
        "contract_address": contract.address,
        "network": network.show_active(),
        "deployed_at": time.time(),
        "owner": dev.address
    }

    file_path = "./backend/deployment_config.json"
    
    with open(file_path, "w") as f:
        json.dump(deployment_data, f, indent=4)
        
    print(f"💾 Config saved to {file_path}")