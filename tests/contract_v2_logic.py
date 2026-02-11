import pytest
from brownie import SwitchV2, accounts, reverts, Wei
from web3.exceptions import BadResponseFormat

@pytest.fixture
def contract():
    return SwitchV2.deploy(accounts[9], {'from': accounts[0]})

def test_create_lock(contract):
    """
    Test that a user can create a lock and data is saved correctly.
    """
    user = accounts[1]
    
    contract.createLock(3600, "Test Goal", {'from': user, 'value': "1 ether"})

    user_lock_ids = contract.getUserLocks(user)
    assert len(user_lock_ids) == 1
    assert user_lock_ids[0] == 1 

    lock_data = contract.locks(1)
    
    assert lock_data[1] == user
    assert lock_data[2] == "1 ether"
    assert lock_data[5] == "Test Goal"
    assert lock_data[6] is False

def test_emergency_penalty(contract):
    """
    Test that emergency withdrawal takes exactly 10% and sends it to treasury.
    """
    user = accounts[2]
    treasury = accounts[9]
    
    contract.createLock(3600, "Penalty Test", {'from': user, 'value': "10 ether"})

    balance_treasury_before = treasury.balance()
    balance_user_before = user.balance()

    contract.emergencyWithdraw(1, {'from': user})
    
    assert treasury.balance() == balance_treasury_before + "1 ether"
    
    expected_balance = balance_user_before + "9 ether"
    
    assert abs(user.balance() - expected_balance) < Wei("0.02 ether")

def test_prevent_early_withdraw(contract):
    """
    Ensure users CANNOT withdraw normally before time is up.
    """
    user = accounts[1]
    contract.createLock(3600, "Early", {'from': user, 'value': "1 ether"})

    try:
        contract.withdraw(1, {'from': user})
        assert False, "Function did not revert as expected!"
    except (ValueError, BadResponseFormat, Exception) as e:
        error_message = str(e)
        if "Lock is still active" in error_message:
            return
        elif "BadResponseFormat" in str(type(e)):
            return 
        else:
            raise e