pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./interface/IBank.sol";
import "./interface/IArbitrage.sol";


contract FlashLender is ReentrancyGuard, Ownable {
    using SafeMath for uint256;

    address public bank;
    uint256 public fee;
    
    /**
    * @dev Verify that the borrowed tokens are returned to the bank plus a fee by the end of transaction execution.
    * @param token Address of the token to for arbitrage. 0x0 for Ether.
    * @param amount Amount borrowed.
    */
    modifier isArbitrage(address token, uint256 amount) {
        uint256 balance = IBank(bank).totalSupplyOf(token);
        _;
        uint256 feePayment = amount.mul(fee).div(10 ** 18); 
        require(IBank(bank).totalSupplyOf(token) >= (balance.add(feePayment)));
    }

    constructor(address _bank, uint256 _fee) public {
        bank = _bank;
        fee = _fee;
    }

    /**
    * @dev Borrow from the bank on behalf of an arbitrage contract and execute the arbitrage contract's callback function.
    * @param token Address of the token to borrow. 0x0 for Ether.
    * @param amount Amount to borrow.
    * @param dest Address of the account to receive arbitrage profits.
    * @param data The data to execute the arbitrage trade.
    */
    function borrow(
        address token,
        uint256 amount,
        address dest,
        bytes data
    )
        external
        nonReentrant
        isArbitrage(token, amount)
        returns (bool)
    {
        // Borrow from the bank and send to the arbitrageur.
        IBank(bank).borrowFor(token, msg.sender, amount);
        // Call the arbitrageur's execute arbitrage method.
        return IArbitrage(msg.sender).executeArbitrage(token, amount, dest, data);
    }

    /**
    * @dev Allow the owner to set the bank address.
    * @param _bank Address of the bank.
    */
    function setBank(address _bank) external onlyOwner {
        bank = _bank;
    }

    /**
    * @dev Allow the owner to set the fee.
    * @param _fee Fee to borrow, as a percentage of principal borrowed. 18 decimals of precision (e.g., 10^18 = 100% fee).
    */
    function setFee(uint256 _fee) external onlyOwner {
        fee = _fee;
    }

}