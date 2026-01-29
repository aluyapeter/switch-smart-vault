from brownie import SwitchV2, accounts, network

def main():
    # 1. Connect to the local Ganache (Terminal 1)
    if not network.is_connected():
        network.connect('development')
    
    dev = accounts[0] # Owner
    user = accounts[1] # The User
    treasury = accounts[9] # The Treasury

    print(f"Deploying with account: {dev}")

    # 2. Deploy Contract
    switch = SwitchV2.deploy(treasury, {'from': dev})
    print(f"✅ Contract Deployed at: {switch.address}")

    # 3. Create a Lock (The Data)
    print("Creating a test lock...")
    tx = switch.createLock(3600, "My First Database Lock", {'from': user, 'value': "1 ether"})
    tx.wait(1)
    print("✅ Lock Created!")

    # 4. IMPORTANT: Print the address so you can copy it
    print("\n" + "="*50)
    print(f"PASTE THIS ADDRESS INTO INDEXER.PY:  {switch.address}")
    print("="*50 + "\n")