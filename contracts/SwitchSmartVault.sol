// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SwitchSmartVault {
    error NoFundsSent();
    error WithdrawFailed();
    error LockNotExpired(uint256 unlockTime);
    error NoActiveLock();

    struct Lock {
        string title;
        uint256 amount;
        uint256 unlockTime;
    }

    mapping(address => Lock) public locks;

    event VaultDeposit(address indexed user, string title, uint256 totalAmount, uint256 unlockTime);
    event Withdrawal(address indexed user, uint256 amount, uint256 timestamp);

    modifier hasFunds() {
        if (locks[msg.sender].amount == 0) {
            revert NoActiveLock();
        }
        _;
    }

    function lockFunds(string calldata _title, uint256 _timeInSeconds) external payable {
        if (msg.value == 0) {
            revert NoFundsSent();
        }

        uint256 newUnlockTime = block.timestamp + _timeInSeconds;

        Lock storage userLock = locks[msg.sender];

        if (userLock.amount > 0) {
            if (newUnlockTime > userLock.unlockTime) {
                userLock.unlockTime = newUnlockTime;
            }
        } else {
            userLock.unlockTime = newUnlockTime;
        }
        
        userLock.amount += msg.value;
        userLock.unlockTime = newUnlockTime;
        userLock.title = _title;

        emit VaultDeposit(msg.sender, _title, userLock.amount, newUnlockTime);
    }

    function withdraw() external hasFunds {
        Lock storage userLock = locks[msg.sender];
        
        if (block.timestamp < userLock.unlockTime) {
            revert LockNotExpired(userLock.unlockTime);
        }

        uint256 amountToSend = userLock.amount;
        
        delete locks[msg.sender];

        (bool sent, ) = payable(msg.sender).call{value: amountToSend}("");
        
        if (!sent) {
            revert WithdrawFailed();
        }

        emit Withdrawal(msg.sender, amountToSend, block.timestamp);
    }
}