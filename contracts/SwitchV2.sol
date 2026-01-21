// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SwitchV2 is ReentrancyGuard {
    address public owner;
    address public treasury;
    bool public isEmergencyMode;
    uint256 public lockIdCounter;
    
    uint256 public constant PENALTY_PERCENTAGE = 10; 

    struct Lock {
        uint256 id;
        address user;
        uint256 amount;
        uint256 unlockTimestamp;
        uint256 createdAt;
        string goalName;
        bool withdrawn;
    }

    mapping(uint256 => Lock) public locks;
    mapping(address => uint256[]) public userLocks;

    event LockCreated(uint256 indexed lockId, address indexed user, uint256 amount, uint256 unlockTimestamp, string goalName);
    event Withdrawal(uint256 indexed lockId, address indexed user, uint256 amount);
    event EmergencyWithdrawal(uint256 indexed lockId, address indexed user, uint256 amount, uint256 penalty);
    event EmergencyModeToggled(bool newStatus);

    constructor(address _treasury) {
        owner = msg.sender;
        treasury = _treasury;
        isEmergencyMode = true;
        lockIdCounter = 1;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    function createLock(uint256 _timeInSeconds, string memory _goalName) external payable {
        require(msg.value > 0, "Must send ETH to lock");
        require(_timeInSeconds > 0 && _timeInSeconds <= 3650 days, "Time must be between 1 second and 10 years");

        uint256 newId = lockIdCounter;
        lockIdCounter++;

        locks[newId] = Lock({
            id: newId,
            user: msg.sender,
            amount: msg.value,
            unlockTimestamp: block.timestamp + _timeInSeconds,
            createdAt: block.timestamp,
            goalName: _goalName,
            withdrawn: false
        });

        userLocks[msg.sender].push(newId);

        emit LockCreated(newId, msg.sender, msg.value, block.timestamp + _timeInSeconds, _goalName);
    }

    function withdraw(uint256 _lockId) external nonReentrant {
        Lock storage userLock = locks[_lockId];

        require(userLock.user == msg.sender, "Not your lock");
        require(!userLock.withdrawn, "Already withdrawn");
        require(block.timestamp >= userLock.unlockTimestamp, "Lock is still active");

        userLock.withdrawn = true;

        // // Interaction
        // payable(msg.sender).transfer(userLock.amount);
        (bool success, ) = msg.sender.call{value: userLock.amount}("");
        require(success, "Transfer failed");

        emit Withdrawal(_lockId, msg.sender, userLock.amount);
    }

    function emergencyWithdraw(uint256 _lockId) external nonReentrant {
        Lock storage userLock = locks[_lockId];

        require(isEmergencyMode, "Emergency mode not active");
        require(userLock.user == msg.sender, "Not your lock");
        require(!userLock.withdrawn, "Already withdrawn");

        uint256 penalty = (userLock.amount * PENALTY_PERCENTAGE) / 100;
        uint256 refund = userLock.amount - penalty;

        userLock.withdrawn = true;

        (bool successUser, ) = msg.sender.call{value: refund}("");
        require(successUser, "User refund failed");

        (bool successTreasury, ) = treasury.call{value: penalty}("");
        require(successTreasury, "Treasury transfer failed");

        emit EmergencyWithdrawal(_lockId, msg.sender, refund, penalty);
    }

    function toggleEmergency(bool _status) external onlyOwner {
        isEmergencyMode = _status;
        emit EmergencyModeToggled(_status);
    }

    function getUserLocks(address _user) external view returns (uint256[] memory) {
        return userLocks[_user];
    }
}