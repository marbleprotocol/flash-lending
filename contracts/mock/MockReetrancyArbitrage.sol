pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../interface/IArbitrage.sol";
import "../interface/IBank.sol";
import "../FlashLender.sol";

contract MockReentrancyArbitrage is IArbitrage {
    using SafeMath for uint256;

    address public lender;
    address constant public ETH = 0x0;
    uint256 constant public MAX_UINT = 2 ** 256 - 1;

    modifier onlyLender() {
        require(msg.sender == lender);
        _;
    }

    constructor(address _lender) public {
        lender = _lender;
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
        FlashLender(lender).borrow(token, amount, dest, data);
        return true;
    }
}