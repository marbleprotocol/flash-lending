pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ReentrancyGuard.sol";
import "./interface/Arbitrage.sol";
import "../Bank.sol";
import "../Transfer.sol";


contract Lend is Transfer, ReentrancyGuard {
    using SafeMath for *;

    address public bank;
    uint256 public owed;
    uint256 public fee = 0;

    /**
    * @dev Verifies that the borrowed tokens are returned by the end of execution.
    */
    modifier isArbitrage(address token, uint256 amount) {
        owed = amount.add(fee);
        // Execute borrow method
        _;
        // Repay the bank
        if (token == ETH) {
            require(msg.value == owed);
            Bank(bank).repay.value(owed)(token, owed);
        } else {
            ERC20(token).approve(bank, owed);
            Bank(bank).repay(token, owed);
        }
        owed = 0;
    }

    constructor(address _bank) public {
        bank = _bank;
    }

    // TODO: isArbitrage(token, amount)
    function borrow(address token, uint256 amount) external nonReentrant returns (bool) {
        // Borrow from the bank and send to the arbitrageur
        Bank(bank).borrowFor(token, msg.sender, amount);
        // Call the arbitrageur's execute arbitrage method.
        return true;
        // TODO:
        // return Arbitrage(msg.sender).executeArbitrage(token, amount);
    }

    // Arbitrageur must call this method and return the amount owed before returning from executeArbitrage
    function repay(address token, uint256 amount) external payable {
        // Remember to call approve first
        transferFrom(token, msg.sender, this, amount);
    }

}