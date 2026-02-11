import pytest
from eth_account import Account
from eth_account.messages import encode_defunct
from backend.models import User
from sqlalchemy import select

TEST_PRIVATE_KEY = "0x0000000000000000000000000000000000000000000000000000000000000001"
TEST_WALLET = Account.from_key(TEST_PRIVATE_KEY)

@pytest.mark.asyncio
async def test_auth_flow(client, test_db):
    response = await client.post("/auth/nonce", json={"address": TEST_WALLET.address})
    assert response.status_code == 200
    nonce = response.json()["nonce"]
    assert len(nonce) > 10

    result = await test_db.execute(select(User).where(User.address == TEST_WALLET.address))
    user = result.scalars().first()
    assert user is not None
    assert user.nonce == nonce

    message = encode_defunct(text=f"Sign this nonce to login: {nonce}")
    signed_message = Account.sign_message(message, private_key=TEST_PRIVATE_KEY)
    signature = signed_message.signature.hex()

    login_response = await client.post("/auth/verify", json={
        "address": TEST_WALLET.address,
        "signature": signature
    })
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    assert token is not None

    me_response = await client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert me_response.json()["address"] == TEST_WALLET.address

@pytest.mark.asyncio
async def test_auth_failures(client, test_db):
    random_address = "0x" + "1" * 40
    response = await client.post("/auth/verify", json={
        "address": random_address,
        "signature": "0x123"
    })
    assert response.status_code == 400

    await client.post("/auth/nonce", json={"address": TEST_WALLET.address})
    
    response = await client.post("/auth/verify", json={
        "address": TEST_WALLET.address,
        "signature": "0xbadsignature"
    })
    assert response.status_code == 400

    other_wallet = Account.create()
    msg = encode_defunct(text="Sign this nonce to login: whatever")
    sig = Account.sign_message(msg, other_wallet.key).signature.hex()

    response = await client.post("/auth/verify", json={
        "address": TEST_WALLET.address,
        "signature": sig
    })
    assert response.status_code == 401