pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../interface/Arbitrage.sol";
import "../Lend.sol";

contract MockArbitrage is Arbitrage, Ownable {

    address public lend;
    address constant public ETH = 0x0;

    constructor(address _lend) public {
        lend = _lend;
    }

    // Implement fallback function to borrow Ether
    function () payable public {}

    function borrow(address token, uint256 amount) external onlyOwner {
        Lend(lend).borrow(token, amount);
    }

    function executeArbitrage(address token, uint256 amount) external payable returns (bool) {
        require(msg.sender == lend);

        if (token == ETH) {
            Lend(lend).repay.value(amount)(token, amount);
        } else {
            Lend(lend).repay(token, amount);
        }
    }

}