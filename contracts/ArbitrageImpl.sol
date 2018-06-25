pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./interface/Arbitrage.sol";
import "./interface/BankInterface.sol";
import "./FlashLender.sol";
import "./ExternalCall.sol";

contract ArbitrageImpl is Arbitrage, ExternalCall {
    using SafeMath for *;

    address public lender;
    address public bank;
    address public tradeExecutor;
    address constant public ETH = 0x0;
    uint256 constant public MAX_UINT = uint(-1);

    modifier onlyLender() {
        require(msg.sender == lender);
        _;
    }

    constructor(address _lender, address _bank, address _tradeExecutor) public {
        lender = _lender;
        bank = _bank;
        tradeExecutor = _tradeExecutor; 
    }

    // Receive ETH from bank.
    function () payable public {}

    /**
    * @dev Borrow from flash lender to execute atomic arbitrage trade. 
    * @param token Address of the token to borrow.
    * @param amount Amount to borrow.
    * @param data Calldata of the trades to execute on trade executor.
    */
    function submitTrade(address token, address dest, uint256 amount, bytes data) external {
        FlashLender(lender).borrow(token, dest, amount, data);
    }

    /**
    * @dev Callback from flash lender. Executes arbitrage trade.
    * @param token Address of the borrowed token.
    * @param amount Amount of borrowed tokens.
    * @param data Calldata of the trades to execute on trade executor.
    */
    function executeArbitrage(address token, address dest, uint256 amount, bytes data) external payable onlyLender returns (bool) {
        uint256 value = 0;
        if (token == ETH) {
            value = amount;
        }

        // Execute the trades.
        external_call(tradeExecutor, value, data.length, data);

        // Determine the amount to repay.
        uint256 repayAmount = getRepayAmount(amount);

        // Repay the bank and collect remaining profits.
        if (token == ETH) {
            BankInterface(bank).repay.value(repayAmount)(token, repayAmount);
            dest.transfer(address(this).balance);
        } else {
            if (ERC20(token).allowance(this, bank) < repayAmount) {
                ERC20(token).approve(bank, MAX_UINT);
            }
            BankInterface(bank).repay(token, repayAmount);
            uint256 balance = ERC20(token).balanceOf(this);
            ERC20(token).transfer(dest, balance);
        }

        return true;
    }

    /** 
    * @dev Calculate the amount owed after borrowing.
    */ 
    function getRepayAmount(uint256 amount) public view returns (uint256) {
        uint256 fee = FlashLender(lender).fee();
        uint256 feeAmount = amount.mul(fee).div(10 ** 18);
        return amount.add(feeAmount);
    }

}