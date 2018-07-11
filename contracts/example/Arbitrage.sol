pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../interface/IArbitrage.sol";
import "../interface/IBank.sol";
import "../FlashLender.sol";
import "./ExternalCall.sol";

contract Arbitrage is IArbitrage, ExternalCall {
    using SafeMath for uint256;

    address public lender;
    address public tradeExecutor;
    address constant public ETH = 0x0;
    uint256 constant public MAX_UINT = 2 ** 256 - 1;

    modifier onlyLender() {
        require(msg.sender == lender);
        _;
    }

    constructor(address _lender, address _tradeExecutor) public {
        lender = _lender;
        tradeExecutor = _tradeExecutor; 
    }

    // Receive ETH from bank.
    function () payable public {}

    /**
    * @dev Borrow from flash lender to execute arbitrage trade. 
    * @param token Address of the token to borrow. 0x0 for Ether.
    * @param amount Amount to borrow.
    * @param dest Address of the account to receive arbitrage profits.
    * @param data The data to execute the arbitrage trade.
    */
    function submitTrade(address token, uint256 amount, address dest, bytes data) external {
        FlashLender(lender).borrow(token, amount, dest, data);
    }

    /**
    * @dev Callback from flash lender. Executes arbitrage trade.
    * @param token Address of the borrowed token. 0x0 for Ether.
    * @param amount Amount borrowed.
    * @param dest Address of the account to receive arbitrage profits.
    * @param data The data to execute the arbitrage trade.
    */
    function executeArbitrage(
        address token,
        uint256 amount,
        address dest,
        bytes data
    )
        external
        onlyLender 
        returns (bool)
    {
        uint256 value = 0;
        if (token == ETH) {
            value = amount;
        }

        // Execute the trades.
        external_call(tradeExecutor, value, data.length, data);

        // Determine the amount to repay.
        uint256 repayAmount = getRepayAmount(amount);

        address bank = FlashLender(lender).bank();

        // Repay the bank and collect remaining profits.
        if (token == ETH) {
            IBank(bank).repay.value(repayAmount)(token, repayAmount);
            dest.transfer(address(this).balance);
        } else {
            if (ERC20(token).allowance(this, bank) < repayAmount) {
                ERC20(token).approve(bank, MAX_UINT);
            }
            IBank(bank).repay(token, repayAmount);
            uint256 balance = ERC20(token).balanceOf(this);
            require(ERC20(token).transfer(dest, balance));
        }

        return true;
    }

    /** 
    * @dev Calculate the amount owed after borrowing.
    * @param amount Amount used to calculate repayment amount.
    */ 
    function getRepayAmount(uint256 amount) public view returns (uint256) {
        uint256 fee = FlashLender(lender).fee();
        uint256 feeAmount = amount.mul(fee).div(10 ** 18);
        return amount.add(feeAmount);
    }

}