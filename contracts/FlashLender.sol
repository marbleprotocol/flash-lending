pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./interface/BankInterface.sol";
import "./interface/Arbitrage.sol";


contract FlashLender is ReentrancyGuard, Ownable {
    using SafeMath for uint256;

    address public bank;
    uint256 public fee;
    
    /**
    * @dev Verify that the borrowed tokens are returned to the bank plus a fee by the end of transaction execution.
    */
    modifier isArbitrage(address token, uint256 amount) {
        uint256 balance = BankInterface(bank).totalSupplyOf(token);
        _;
        uint256 feePayment = amount.mul(fee).div(10 ** 18); 
        require(BankInterface(bank).totalSupplyOf(token) >= (balance.add(feePayment)));
    }

    constructor(address _bank, uint256 _fee) public {
        bank = _bank;
        fee = _fee;
    }

    /**
    * @dev Borrow from the bank on behalf of an aribtrage contract and execute the arbitrage contract's callback function.
    */
    function borrow(address token, address dest, uint256 amount, bytes data) external nonReentrant isArbitrage(token, amount) returns (bool) {
        // Borrow from the bank and send to the arbitrageur.
        BankInterface(bank).borrowFor(token, msg.sender, amount);
        // Call the arbitrageur's execute arbitrage method.
        return Arbitrage(msg.sender).executeArbitrage(token, dest, amount, data);
    }

    /**
    * @dev Allow the owner to set the bank address.
    */
    function setBank(address _bank) external onlyOwner {
        bank = _bank;
    }

    /**
    * @dev Allow the owner to set the fee.
    */
    function setFee(uint256 _fee) external onlyOwner {
        fee = _fee;
    }

}