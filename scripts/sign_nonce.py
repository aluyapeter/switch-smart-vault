import os
from web3 import Web3
from dotenv import load_dotenv
from eth_account.messages import encode_defunct

load_dotenv()

PRIVATE_KEY = os.getenv("G_PRIVATE_KEY")
if not PRIVATE_KEY:
    raise ValueError("Error: PRIVATE_KEY not found in .env file")

NONCE = "c76147ba8c239b19de0c1dc1e6e00e1e"
# ---------------------

def main():
    w3 = Web3()

    account = w3.eth.account.from_key(PRIVATE_KEY)
    print(f"Signing as: {account.address}")

    msg_text = f"Sign this nonce to login: {NONCE}"
    
    message = encode_defunct(text=msg_text)

    signed_message = w3.eth.account.sign_message(message, private_key=PRIVATE_KEY)
    
    print("\nSIGNATURE GENERATED:")
    print(signed_message.signature.hex())
    print("\nCopy the signature above for the next step.")

if __name__ == "__main__":
    main()