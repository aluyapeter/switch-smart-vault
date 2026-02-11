import pytest
from backend.models import Lock, User

@pytest.mark.asyncio
async def test_stats_endpoint(client, test_db):
    user = User(address="0x1111111111111111111111111111111111111111")
    test_db.add(user)
    
    lock1 = Lock(
        id=1, amount=10**18, unlock_timestamp=2000000000, 
        created_at=1000, goal_name="Savings", withdrawn=False,
        owner_address=user.address, tx_hash="0x123"
    )
    test_db.add(lock1)
    await test_db.commit()

    response = await client.get("/stats")
    assert response.status_code == 200
    data = response.json()

    assert data["total_locks"] == 1
    assert data["total_users"] == 1
    assert data["tvl_eth"] == 1.0

@pytest.mark.asyncio
async def test_get_user_locks(client, test_db):
    addr = "0x2222222222222222222222222222222222222222"
    user = User(address=addr)
    test_db.add(user)
    lock = Lock(
        id=2, amount=500, unlock_timestamp=123, created_at=123,
        goal_name="Test", withdrawn=False, owner_address=addr, tx_hash="0xabc"
    )
    test_db.add(lock)
    await test_db.commit()

    response = await client.get(f"/users/{addr}/locks")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["goal_name"] == "Test"