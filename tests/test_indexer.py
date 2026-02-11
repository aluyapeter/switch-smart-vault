import pytest
from unittest.mock import MagicMock
from backend.indexer import process_lock_created
from backend.models import Lock, User
from sqlalchemy import select

@pytest.mark.asyncio
async def test_process_lock_created(test_db):
    mock_event = {
        'args': {
            'user': '0x1234567890123456789012345678901234567890',
            'lockId': 1,
            'amount': 1000000000000000000,
            'unlockTimestamp': 1799999999,
            'goalName': 'Test Goal'
        },
        'blockNumber': 100,
        'transactionHash': b'\x00' * 32
    }

    mock_w3 = MagicMock()
    mock_w3.eth.get_block.return_value = {'timestamp': 1600000000}

    await process_lock_created(test_db, mock_event, mock_w3)

    result_user = await test_db.execute(select(User).where(User.address == mock_event['args']['user']))
    user = result_user.scalars().first()
    assert user is not None

    result_lock = await test_db.execute(select(Lock).where(Lock.id == 1))
    lock = result_lock.scalars().first()
    assert lock is not None
    assert lock.goal_name == 'Test Goal'
    assert lock.amount == 1000000000000000000

    await process_lock_created(test_db, mock_event, mock_w3)
    
    locks = (await test_db.execute(select(Lock))).scalars().all()
    assert len(locks) == 1