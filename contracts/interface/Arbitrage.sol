pragma solidity 0.4.24;
 

interface Arbitrage {
    function executeArbitrage(address token, uint256 amount, bytes data) external payable returns (bool);
}