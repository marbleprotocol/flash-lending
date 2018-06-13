pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./interface/Arbitrage.sol";
import "./Lend.sol";
import "./Bank.sol";
import "./ExternalCall.sol";

contract ArbitrageImpl is Arbitrage, ExternalCall {
    using SafeMath for *;

    address public lend;
    address public bank;
    address public tradeExecutor;
    uint256 public fee; 
    address constant public ETH = 0x0;


    modifier fromLender () {
        require(msg.sender == lend);
        _;
    }

    constructor(address _lend, address _tradeExecutor) public {
        lend = _lend;
        tradeExecutor = _tradeExecutor; 
        bank = Lend(lend).bank();
        fee = Lend(lend).fee();
    }

    // Receive eth from bank
    function () payable public {}

    /*
     * @dev Borrow for atomic arbitrage. Entry point for Lend. 
     * @param token - Token address to borrow from bank
     * @param amount - Amount to borrow from bank
     * @param data - Order call data for external_call to execute
    */
    function borrow(address token, address dest, uint256 amount, bytes data) external {
        Lend(lend).borrow(token, dest, amount, data);
    }

    /* 
    * @dev Called by Lend after it borrows money to this account from the Bank. 
    * Executes the two trades passed in, then repays bank. This contract keeps the profit. 
    * @param token - Token address to borrow from bank
    * @param amount - Amount to borrow from bank
    * @param data - Order call data for external_call to execute
    */
    function executeArbitrage(address token, address dest, uint256 amount, bytes data) external payable fromLender() returns (bool) {
        // Calls the trade executor
        external_call(tradeExecutor, amount, data.length, data);

        uint256 repayAmount = amount.add(amount.mul(fee).div(10**18));

        if (token == ETH) {
            Bank(bank).repay.value(repayAmount)(token, repayAmount);
        } else {
            Bank(bank).repay(token, repayAmount); 
        }
        dest.transfer(this.balance);
    }

}