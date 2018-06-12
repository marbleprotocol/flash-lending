pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./interface/Arbitrage.sol";
import "./Bank.sol";


contract Lend is ReentrancyGuard, Ownable {
    using SafeMath for *;

    address public bank;
    uint256 public fee;
    
    /**
    * @dev Verifies that the borrowed tokens are returned by the end of execution.
    */
    modifier isArbitrage(address token, uint256 amount) {
        uint256 balanceBefore = Bank(bank).totalSupplyOf(token);
        _;
        uint256 feePayment = amount.mul(fee).div(10**18); 
        require(Bank(bank).totalSupplyOf(token) >= (balanceBefore.add(feePayment)));
    }

    constructor(address _bank, uint256 _fee) public {
        bank = _bank;
        fee = _fee;
    } 


    /**
    * @dev Borrows from bank on behalf of an arbitrageur, calls 'executeArbitrage' callback to return money. 
    */
    function borrow(address token, uint256 amount, bytes data) external nonReentrant isArbitrage(token, amount) returns (bool) {
        // Borrow from the bank and send to the arbitrageur
        Bank(bank).borrowFor(token, msg.sender, amount);
        // Call the arbitrageur's execute arbitrage method.
        return Arbitrage(msg.sender).executeArbitrage(token, amount, data);
    }

}